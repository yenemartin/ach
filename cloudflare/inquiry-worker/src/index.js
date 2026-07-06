function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    ...init
  });
}

function unauthorized(message = "Unauthorized.") {
  return json({ error: message }, { status: 401 });
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^[0-9+()\-\s]{7,}$/.test(value);
}

function validateInquiry(payload) {
  const homeKey = trimString(payload.homeKey);
  const homeName = trimString(payload.homeName);
  const homeSubdomain = trimString(payload.homeSubdomain);
  const inquiryType = trimString(payload.inquiryType) || "tour_request";
  const name = trimString(payload.name);
  const phone = trimString(payload.phone);
  const email = trimString(payload.email);
  const moveInTimeline = trimString(payload.moveInTimeline);
  const message = trimString(payload.message);
  const submittedAt = trimString(payload.submittedAt) || new Date().toISOString();

  if (!homeKey || !homeName) {
    return { error: "Home information is required." };
  }

  if (!name) {
    return { error: "Name is required." };
  }

  if (!email || !isEmail(email)) {
    return { error: "A valid email is required." };
  }

  if (!phone || !isPhone(phone)) {
    return { error: "A valid phone number is required." };
  }

  return {
    value: {
      id: crypto.randomUUID(),
      homeKey,
      homeName,
      homeSubdomain,
      inquiryType,
      name,
      phone,
      email,
      moveInTimeline,
      message,
      submittedAt
    }
  };
}

function maskToken(token) {
  if (!token) {
    return "";
  }

  if (token.length <= 8) {
    return "*".repeat(token.length);
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function getTokenFromRequest(request) {
  const url = new URL(request.url);
  return (
    trimString(url.searchParams.get("token")) ||
    trimString(request.headers.get("x-inquiry-token")) ||
    trimString(request.headers.get("authorization")).replace(/^Bearer\s+/i, "")
  );
}

async function storeInquiry(env, inquiry) {
  const submitted = Date.parse(inquiry.submittedAt) || Date.now();
  const key = `inquiry:${String(submitted).padStart(13, "0")}:${inquiry.id}`;
  await env.INQUIRIES.put(key, JSON.stringify(inquiry));
  return key;
}

async function listInquiries(env, limit) {
  const page = await env.INQUIRIES.list({ prefix: "inquiry:", limit });
  const keys = [...page.keys].sort((left, right) => right.name.localeCompare(left.name));
  const items = await Promise.all(
    keys.map(async (entry) => {
      const value = await env.INQUIRIES.get(entry.name, "json");
      return value ? { storageKey: entry.name, ...value } : null;
    })
  );

  return items.filter(Boolean);
}

function getRoute(request) {
  const url = new URL(request.url);
  return `${request.method.toUpperCase()} ${url.pathname.replace(/\/+$/, "") || "/"}`;
}

export default {
  async fetch(request, env) {
    const route = getRoute(request);

    if (route === "GET /health") {
      return json({
        ok: true,
        service: "afhcares-inquiry-worker"
      });
    }

    if (route === "POST /capture") {
      const inboundToken = trimString(env.INBOUND_TOKEN);
      const requestToken = getTokenFromRequest(request);

      if (inboundToken && requestToken !== inboundToken) {
        return unauthorized("Capture token is invalid.");
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body." }, { status: 400 });
      }

      const validated = validateInquiry(body);

      if (validated.error) {
        return json({ error: validated.error }, { status: 400 });
      }

      const inquiry = validated.value;
      const storageKey = await storeInquiry(env, inquiry);

      return json({
        ok: true,
        inquiry: {
          id: inquiry.id,
          homeKey: inquiry.homeKey,
          submittedAt: inquiry.submittedAt
        },
        storageKey
      });
    }

    if (route === "GET /inquiries") {
      const adminToken = trimString(env.ADMIN_TOKEN);
      const requestToken = getTokenFromRequest(request);

      if (!adminToken || requestToken !== adminToken) {
        return unauthorized("Admin token is invalid.");
      }

      const url = new URL(request.url);
      const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "25", 10) || 25, 100);
      const inquiries = await listInquiries(env, limit);

      return json({
        ok: true,
        count: inquiries.length,
        inquiries
      });
    }

    if (route === "GET /setup") {
      return json({
        ok: true,
        captureUrlExample: "https://your-worker.your-subdomain.workers.dev/capture?token=replace-me",
        adminUrlExample: "https://your-worker.your-subdomain.workers.dev/inquiries?token=replace-me",
        kvBinding: "INQUIRIES",
        requiredSecrets: ["INBOUND_TOKEN", "ADMIN_TOKEN"],
        configured: {
          hasInboundToken: Boolean(trimString(env.INBOUND_TOKEN)),
          hasAdminToken: Boolean(trimString(env.ADMIN_TOKEN)),
          inboundTokenPreview: maskToken(trimString(env.INBOUND_TOKEN)),
          adminTokenPreview: maskToken(trimString(env.ADMIN_TOKEN))
        }
      });
    }

    return json(
      {
        error: "Not found.",
        routes: ["GET /health", "GET /setup", "POST /capture", "GET /inquiries"]
      },
      { status: 404 }
    );
  }
};
