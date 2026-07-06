import {
  adminMetrics,
  adminSteps,
  directoryStats,
  homes,
  homesById,
  inquiries as inquirySeed
} from "./mockData";

let nextInquiryNumber = 1049;
let inquiryStore = [...inquirySeed];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  if (!value) {
    return true;
  }

  return /^[0-9+()\-\s]{7,}$/.test(value);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

async function withFallback(primary, fallback) {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}

async function getMockDirectoryData() {
  await wait(120);
  return {
    items: homes,
    stats: directoryStats
  };
}

async function getMockHomeData(homeId) {
  await wait(120);
  return homesById[homeId] ?? null;
}

async function getMockAdminDashboard() {
  await wait(120);
  return {
    metrics: adminMetrics,
    workflow: adminSteps,
    inquiries: inquiryStore
  };
}

async function createMockInquiry(payload) {
  await wait(180);

  if (!payload.homeId) {
    throw new Error("Home id is required.");
  }

  if (!payload.requestType || !["tour", "contact"].includes(payload.requestType)) {
    throw new Error("Request type must be contact or tour.");
  }

  if (!payload.name?.trim()) {
    throw new Error("Name is required.");
  }

  if (!payload.email?.trim() || !isEmail(payload.email)) {
    throw new Error("A valid email is required.");
  }

  if (!payload.preferredContactMethod?.trim()) {
    throw new Error("Preferred contact method is required.");
  }

  if (!isPhone(payload.phone)) {
    throw new Error("Phone number format looks invalid.");
  }

  const requestId = `REQ-${nextInquiryNumber}`;
  nextInquiryNumber += 1;

  const created = {
    id: requestId,
    home: homesById[payload.homeId]?.name ?? payload.homeId,
    type: payload.requestType === "tour" ? "Tour" : "Contact",
    person: payload.name,
    timeline: payload.moveInTimeline || "Not provided",
    contact: payload.preferredContactMethod,
    status: "New"
  };

  inquiryStore = [created, ...inquiryStore];

  return {
    requestId,
    status: "new"
  };
}

export async function getDirectoryData() {
  return withFallback(
    () => requestJson("/api/public/homes"),
    () => getMockDirectoryData()
  );
}

export async function getHomeData(homeId) {
  return withFallback(
    () => requestJson(`/api/public/homes/${homeId}`),
    () => getMockHomeData(homeId)
  );
}

export async function getAdminDashboard() {
  return withFallback(
    () => requestJson("/api/admin/dashboard"),
    () => getMockAdminDashboard()
  );
}

export async function getAdminHomes() {
  return withFallback(
    () => requestJson("/api/admin/homes"),
    async () => ({ items: homes.map((home) => ({
      id: home.id,
      name: home.name,
      status: home.status,
      city: home.city,
      availability: home.availability,
      subdomain: home.subdomain,
      featured: home.featured
    })) })
  );
}

export async function createAdminHome(payload) {
  return withFallback(
    () =>
      requestJson("/api/admin/homes", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    async () => ({ id: `demo-${Date.now()}`, ...payload, subdomain: "demo.afhcares.com" })
  );
}

export async function updateAdminHome(homeId, payload) {
  return withFallback(
    () =>
      requestJson(`/api/admin/homes/${homeId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    async () => ({ id: homeId, ...payload })
  );
}

export async function createInquiry(payload) {
  return withFallback(
    () =>
      requestJson("/api/public/inquiries", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    () => createMockInquiry(payload)
  );
}
