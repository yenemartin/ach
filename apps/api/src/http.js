export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": statusCode === 200 ? "no-store" : "no-cache"
    },
    body: JSON.stringify(body)
  };
}

export function response(statusCode, body, contentType) {
  return {
    statusCode,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store"
    },
    body
  };
}

export function ok(body) {
  return json(200, body);
}

export function created(body) {
  return json(201, body);
}

export function badRequest(message) {
  return json(400, { error: message });
}

export function notFound(message = "Not found.") {
  return json(404, { error: message });
}

export function methodNotAllowed() {
  return json(405, { error: "Method not allowed." });
}

export function parseJsonBody(event) {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  return JSON.parse(raw);
}
