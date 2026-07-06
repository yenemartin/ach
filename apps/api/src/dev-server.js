import http from "node:http";
import { json, notFound } from "./http.js";
import { routeRequest } from "./router.js";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3001);

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");

  if ((request.method || "GET") === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const body = await readBody(request);
    const result = await routeRequest({
      httpMethod: request.method || "GET",
      path: url.pathname,
      rawPath: url.pathname,
      headers: request.headers,
      body,
      isBase64Encoded: false
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  } catch (error) {
    const result = json(500, {
      error: error instanceof Error ? error.message : "Unexpected server error."
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  }
});

server.listen(port, host, () => {
  // Keep stdout simple for terminal pairing.
  console.log(`AFH Cares API dev server listening on http://${host}:${port}`);
});
