function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    ...init
  });
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^[0-9+()\-\s]{7,}$/.test(value);
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validatePayload(payload) {
  const homeKey = trimString(payload.homeKey);
  const homeName = trimString(payload.homeName);
  const homeSubdomain = trimString(payload.homeSubdomain);
  const contactEmail = trimString(payload.contactEmail);
  const name = trimString(payload.name);
  const phone = trimString(payload.phone);
  const email = trimString(payload.email);
  const moveInTimeline = trimString(payload.moveInTimeline);
  const message = trimString(payload.message);
  const inquiryType = trimString(payload.inquiryType) || "tour_request";

  if (!homeKey || !homeName) {
    return { error: "Home information is required." };
  }

  if (!name) {
    return { error: "Name is required." };
  }

  if (!contactEmail || !isEmail(contactEmail)) {
    return { error: "A valid contact email is required." };
  }

  if (!email || !isEmail(email)) {
    return { error: "A valid email is required." };
  }

  if (!phone || !isPhone(phone)) {
    return { error: "A valid phone number is required." };
  }

  return {
    value: {
      homeKey,
      homeName,
      homeSubdomain,
      contactEmail,
      inquiryType,
      name,
      phone,
      email,
      moveInTimeline,
      message,
      submittedAt: new Date().toISOString()
    }
  };
}

async function forwardInquiry(payload, webhookUrl) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }
}

export async function onRequestPost(context) {
  let body;

  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validatePayload(body);

  if (validated.error) {
    return json({ error: validated.error }, { status: 400 });
  }

  const payload = validated.value;
  const webhookUrl = context.env.INQUIRY_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("Inquiry received without webhook configuration", payload);
    return json(
      {
        error:
          "Inquiry webhook is not configured. Set INQUIRY_WEBHOOK_URL in Cloudflare Pages environment variables."
      },
      { status: 503 }
    );
  }

  try {
    await forwardInquiry(payload, webhookUrl);
  } catch (error) {
    console.error("Inquiry forwarding failed", error);
    return json(
      {
        error: "Unable to forward inquiry at this time."
      },
      { status: 502 }
    );
  }

  return json({
    ok: true,
    inquiry: {
      homeKey: payload.homeKey,
      submittedAt: payload.submittedAt
    }
  });
}
