import {
  createStoredInquiry,
  getPublicHome,
  listPublicHomes
} from "../data.js";
import {
  badRequest,
  created,
  methodNotAllowed,
  notFound,
  ok,
  parseJsonBody
} from "../http.js";
import { validateInquiry } from "../validation.js";

export async function listHomesHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "GET") !== "GET") {
    return methodNotAllowed();
  }

  return ok(listPublicHomes());
}

export async function getHomeHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "GET") !== "GET") {
    return methodNotAllowed();
  }

  const homeId = event.pathParameters?.id;
  const home = getPublicHome(homeId);
  return home ? ok(home) : notFound("Home not found.");
}

export async function createInquiryHandler(event = {}) {
  if ((event.requestContext?.http?.method ?? event.httpMethod ?? "POST") !== "POST") {
    return methodNotAllowed();
  }

  let payload;

  try {
    payload = parseJsonBody(event);
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const validationError = validateInquiry(payload);
  if (validationError) {
    return badRequest(validationError);
  }

  return created(createStoredInquiry(payload));
}

