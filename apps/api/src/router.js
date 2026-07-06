import {
  createHomeAdminHandler,
  createInquiryHandler,
  getDashboardHandler,
  getHomeHandler,
  listHomesAdminHandler,
  listHomesHandler,
  updateHomeAdminHandler
} from "./handlers/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { notFound, response } from "./http.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.resolve(moduleDir, "../web-dist");

function contentTypeFor(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "text/plain; charset=utf-8";
}

function matchRoute(method, pathname) {
  if (method === "GET" && pathname === "/api/public/homes") {
    return { handler: listHomesHandler, pathParameters: {} };
  }

  if (method === "POST" && pathname === "/api/public/inquiries") {
    return { handler: createInquiryHandler, pathParameters: {} };
  }

  if (method === "GET" && pathname === "/api/admin/dashboard") {
    return { handler: getDashboardHandler, pathParameters: {} };
  }

  if (method === "GET" && pathname === "/api/admin/homes") {
    return { handler: listHomesAdminHandler, pathParameters: {} };
  }

  if (method === "POST" && pathname === "/api/admin/homes") {
    return { handler: createHomeAdminHandler, pathParameters: {} };
  }

  const publicHomeMatch = pathname.match(/^\/api\/public\/homes\/([^/]+)$/);
  if (method === "GET" && publicHomeMatch) {
    return {
      handler: getHomeHandler,
      pathParameters: { id: decodeURIComponent(publicHomeMatch[1]) }
    };
  }

  const adminHomeMatch = pathname.match(/^\/api\/admin\/homes\/([^/]+)$/);
  if (method === "PUT" && adminHomeMatch) {
    return {
      handler: updateHomeAdminHandler,
      pathParameters: { id: decodeURIComponent(adminHomeMatch[1]) }
    };
  }

  return null;
}

async function serveStatic(pathname) {
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const wantsAsset = normalized.includes(".") && !normalized.endsWith("/");
  const targetPath = wantsAsset
    ? path.resolve(staticRoot, `.${normalized}`)
    : path.resolve(staticRoot, "index.html");

  if (!targetPath.startsWith(staticRoot)) {
    return notFound("Not found.");
  }

  try {
    const body = await fs.readFile(targetPath, "utf8");
    return response(200, body, contentTypeFor(targetPath));
  } catch {
    if (!wantsAsset) {
      const body = await fs.readFile(path.resolve(staticRoot, "index.html"), "utf8");
      return response(200, body, "text/html; charset=utf-8");
    }
    return notFound("Asset not found.");
  }
}

export async function routeRequest(event = {}) {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? "GET";
  const pathname = event.rawPath ?? event.path ?? "/";
  const route = matchRoute(method, pathname);

  if (!route) {
    if (method === "GET" || method === "HEAD") {
      return serveStatic(pathname);
    }
    return notFound("Route not found.");
  }

  return route.handler({
    ...event,
    pathParameters: route.pathParameters
  });
}

export async function handler(event = {}) {
  return routeRequest(event);
}
