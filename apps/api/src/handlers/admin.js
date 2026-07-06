import {
  createAdminHome,
  listAdminDashboard,
  listAdminHomes,
  updateAdminHome
} from "../data.js";
import {
  badRequest,
  created,
  methodNotAllowed,
  notFound,
  ok,
  parseJsonBody
} from "../http.js";

export async function getDashboardHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "GET") !== "GET") {
    return methodNotAllowed();
  }

  return ok(listAdminDashboard());
}

export async function listHomesAdminHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "GET") !== "GET") {
    return methodNotAllowed();
  }

  return ok({ items: listAdminHomes() });
}

export async function createHomeAdminHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "POST") !== "POST") {
    return methodNotAllowed();
  }

  let payload;
  try {
    payload = parseJsonBody(event);
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!payload.name?.trim() || !payload.city?.trim()) {
    return badRequest("Name and city are required.");
  }

  return created(createAdminHome(payload));
}

export async function updateHomeAdminHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "PUT") !== "PUT") {
    return methodNotAllowed();
  }

  let payload;
  try {
    payload = parseJsonBody(event);
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const home = updateAdminHome(event.pathParameters?.id, payload);
  return home ? ok(home) : notFound("Home not found.");
}
