import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const homeSeeds = [
  {
    id: "sunrise-garden",
    name: "Sunrise Garden AFH",
    status: "published",
    city: "Kent, WA",
    availability: "Open rooms",
    featured: true,
    teaser:
      "Warm, garden-backed home with family-style meals and quiet private rooms.",
    promotion: "Free consultation week",
    careTags: ["Memory support", "Mobility support"],
    roomTypes: ["Private room", "Companion room"],
    languages: ["English", "Amharic"],
    subdomain: "sunrise-garden.afhcares.com",
    phone: "(206) 555-0148",
    about:
      "Sunrise Garden is a welcoming adult family home built around quiet routines, nourishing meals, and respectful care. Families get a polished public website while operators can update rooms, amenities, and inquiry flow from one admin workspace.",
    highlights: [
      "Private and companion room options",
      "Memory-friendly daily rhythm",
      "Ethiopian and American meal options",
      "Garden patio and family visiting space"
    ],
    promotions: [
      "Free consultation for July move-ins",
      "Weekend tour slots available",
      "Amharic-speaking household support"
    ],
    gallery: ["Front exterior", "Shared living room", "Private bedroom"],
    inquirySteps: [
      "Prospect submits contact or tour request",
      "Platform admin gets notified by email",
      "Home can be contacted directly from the admin queue"
    ]
  },
  {
    id: "cedar-house",
    name: "Cedar House Living",
    status: "published",
    city: "Federal Way, WA",
    availability: "Limited availability",
    featured: false,
    teaser:
      "Small licensed home focused on calm routines, mobility help, and local family access.",
    promotion: "Move-in support package",
    careTags: ["Behavioral support", "Diabetic meals"],
    roomTypes: ["Private room"],
    languages: ["English", "Spanish"],
    subdomain: "cedar-house.afhcares.com",
    phone: "(253) 555-0117",
    about:
      "Cedar House Living is designed for families who want a calm, approachable introduction to a home's environment before reaching out. The public site emphasizes trust, clarity, and easy next steps.",
    highlights: [
      "Licensed small-home environment",
      "Private rooms with natural light",
      "Spanish-speaking support",
      "Family-friendly tour scheduling"
    ],
    promotions: [
      "Move-in support package",
      "Same-week tour availability"
    ],
    gallery: ["Front porch", "Dining area", "Private room"],
    inquirySteps: [
      "Family submits a contact request",
      "Operator reviews the lead in admin",
      "Home follow-up is coordinated directly"
    ]
  },
  {
    id: "haven-view",
    name: "Haven View Home",
    status: "draft",
    city: "Renton, WA",
    availability: "Waitlist",
    featured: false,
    teaser:
      "Scenic residential setting with multilingual staff and regular family update calls.",
    promotion: "Tour week now booking",
    careTags: ["Cultural meals", "High-acuity experience"],
    roomTypes: ["Private suite", "Shared room"],
    languages: ["English", "Tigrinya"],
    subdomain: "haven-view.afhcares.com",
    phone: "(425) 555-0184",
    about:
      "Haven View Home uses a strong public-facing site to communicate cultural fit, room options, and contact pathways without exposing pricing or sensitive care workflow details.",
    highlights: [
      "Scenic residential location",
      "Shared and suite room options",
      "Tigrinya-speaking support",
      "High-touch family communication"
    ],
    promotions: [
      "Tour week now booking",
      "Waitlist families can request early contact"
    ],
    gallery: ["Neighborhood exterior", "Shared lounge", "Suite room"],
    inquirySteps: [
      "Families request a tour or contact",
      "Operator receives email notification",
      "Waitlist follow-up is tracked in the admin queue"
    ]
  }
];

const inquirySeeds = [
  {
    id: "REQ-1042",
    home: "Sunrise Garden AFH",
    type: "Tour",
    person: "Mimi T.",
    timeline: "Within 30 days",
    contact: "Phone",
    status: "New"
  },
  {
    id: "REQ-1041",
    home: "Cedar House Living",
    type: "Contact",
    person: "Daniel R.",
    timeline: "Researching options",
    contact: "Email",
    status: "Contacted"
  },
  {
    id: "REQ-1038",
    home: "Haven View Home",
    type: "Tour",
    person: "Sara G.",
    timeline: "Urgent move",
    contact: "Phone",
    status: "Scheduled"
  }
];

const adminWorkflow = [
  "Create a new home record",
  "Assign slug and subdomain",
  "Upload hero and gallery images",
  "Publish the listing to the directory",
  "Review inquiry queue"
];

let memoryHomes = [...homeSeeds];
let memoryInquiries = [...inquirySeeds];
let nextInquiryNumber = 1049;

const homesTable = process.env.HOMES_TABLE || "";
const inquiriesTable = process.env.INQUIRIES_TABLE || "";
const useDynamo = Boolean(homesTable && inquiriesTable);

const documentClient = useDynamo
  ? DynamoDBDocumentClient.from(new DynamoDBClient({}))
  : null;

function toDirectoryItem(home) {
  return {
    id: home.id,
    name: home.name,
    city: home.city,
    availability: home.availability,
    featured: home.featured,
    teaser: home.teaser,
    promotion: home.promotion,
    careTags: home.careTags,
    roomTypes: home.roomTypes,
    languages: home.languages,
    subdomain: home.subdomain
  };
}

function toHomeDetail(home) {
  return {
    id: home.id,
    name: home.name,
    subdomain: home.subdomain,
    city: home.city,
    phone: home.phone,
    availability: home.availability,
    about: home.about,
    highlights: home.highlights,
    promotions: home.promotions,
    gallery: home.gallery,
    inquirySteps: home.inquirySteps
  };
}

function toDirectoryStats(allHomes) {
  const publishedHomes = allHomes.filter((home) => home.status === "published");
  return [
    { label: "Homes in directory", value: String(publishedHomes.length) },
    {
      label: "Featured homes",
      value: String(publishedHomes.filter((home) => home.featured).length)
    },
    {
      label: "Cities covered",
      value: String(new Set(publishedHomes.map((home) => home.city)).size)
    }
  ];
}

function toAdminMetrics(allHomes, allInquiries) {
  return [
    {
      label: "Published homes",
      value: String(allHomes.filter((home) => home.status === "published").length)
    },
    {
      label: "Open room listings",
      value: String(allHomes.filter((home) => home.availability === "Open rooms").length)
    },
    {
      label: "New inquiries",
      value: String(allInquiries.filter((inquiry) => inquiry.status === "New").length)
    }
  ];
}

function buildHomesById(homes) {
  return Object.fromEntries(homes.map((home) => [home.id, home]));
}

async function ensureDynamoSeedHomes() {
  const current = await documentClient.send(new ScanCommand({ TableName: homesTable }));
  if ((current.Items || []).length > 0) {
    return current.Items;
  }

  await documentClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [homesTable]: homeSeeds.map((home) => ({
          PutRequest: { Item: home }
        }))
      }
    })
  );

  return homeSeeds;
}

async function listHomesSource() {
  if (!useDynamo) {
    return memoryHomes;
  }

  return ensureDynamoSeedHomes();
}

async function listInquiriesSource() {
  if (!useDynamo) {
    return memoryInquiries;
  }

  const result = await documentClient.send(new ScanCommand({ TableName: inquiriesTable }));
  return (result.Items || []).sort((a, b) => b.id.localeCompare(a.id));
}

export async function listPublicHomes() {
  const homes = await listHomesSource();
  const publishedHomes = homes.filter((home) => home.status === "published");
  return {
    items: publishedHomes.map(toDirectoryItem),
    stats: toDirectoryStats(homes)
  };
}

export async function getPublicHome(homeId) {
  if (!useDynamo) {
    const home = buildHomesById(memoryHomes)[homeId];
    return home && home.status === "published" ? toHomeDetail(home) : null;
  }

  const result = await documentClient.send(
    new GetCommand({
      TableName: homesTable,
      Key: { id: homeId }
    })
  );

  return result.Item && result.Item.status === "published" ? toHomeDetail(result.Item) : null;
}

export async function listAdminDashboard() {
  const [homes, inquiries] = await Promise.all([listHomesSource(), listInquiriesSource()]);
  return {
    metrics: toAdminMetrics(homes, inquiries),
    workflow: adminWorkflow,
    inquiries
  };
}

export async function createStoredInquiry(payload) {
  const homes = await listHomesSource();
  const homesById = buildHomesById(homes);
  const requestId = `REQ-${nextInquiryNumber}`;
  nextInquiryNumber += 1;

  const created = {
    id: requestId,
    home: homesById[payload.homeId]?.name ?? payload.homeId,
    type: payload.requestType === "tour" ? "Tour" : "Contact",
    person: payload.name.trim(),
    timeline: payload.moveInTimeline?.trim() || "Not provided",
    contact: payload.preferredContactMethod.trim(),
    status: "New"
  };

  if (!useDynamo) {
    memoryInquiries = [created, ...memoryInquiries];
    return {
      requestId,
      status: "new"
    };
  }

  await documentClient.send(
    new PutCommand({
      TableName: inquiriesTable,
      Item: created
    })
  );

  return {
    requestId,
    status: "new"
  };
}

export async function listAdminHomes() {
  const homes = await listHomesSource();
  return homes.map((home) => ({
    id: home.id,
    name: home.name,
    status: home.status,
    city: home.city,
    availability: home.availability,
    subdomain: home.subdomain,
    featured: home.featured
  }));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createAdminHome(payload) {
  const homes = await listHomesSource();
  const homesById = buildHomesById(homes);
  const id = slugify(payload.name || "new-home");
  const uniqueId = homesById[id] ? `${id}-${homes.length + 1}` : id;
  const home = {
    id: uniqueId,
    name: payload.name.trim(),
    status: payload.status || "draft",
    city: payload.city.trim(),
    availability: payload.availability || "Open rooms",
    featured: Boolean(payload.featured),
    teaser: payload.teaser?.trim() || "New home listing in progress.",
    promotion: payload.promotion?.trim() || "Contact for tour availability",
    careTags: payload.careTags || [],
    roomTypes: payload.roomTypes || [],
    languages: payload.languages || [],
    subdomain: `${uniqueId}.afhcares.com`,
    phone: payload.phone?.trim() || "(000) 000-0000",
    about: payload.about?.trim() || "About section coming soon.",
    highlights: payload.highlights || ["Comfortable home environment"],
    promotions: payload.promotions || ["Now accepting inquiries"],
    gallery: payload.gallery || ["Hero image", "Room photo", "Living area"],
    inquirySteps: [
      "Prospect submits contact or tour request",
      "Platform admin gets notified by email",
      "Home follow-up is coordinated directly"
    ]
  };

  if (!useDynamo) {
    memoryHomes = [home, ...memoryHomes];
    return home;
  }

  await documentClient.send(
    new PutCommand({
      TableName: homesTable,
      Item: home
    })
  );

  return home;
}

export async function updateAdminHome(homeId, payload) {
  if (!useDynamo) {
    const home = buildHomesById(memoryHomes)[homeId];
    if (!home) {
      return null;
    }

    home.status = payload.status || home.status;
    home.availability = payload.availability || home.availability;
    home.featured = payload.featured ?? home.featured;
    home.promotion = payload.promotion?.trim() || home.promotion;
    home.teaser = payload.teaser?.trim() || home.teaser;
    return home;
  }

  const updates = [];
  const values = {};

  if (payload.status) {
    updates.push("#status = :status");
    values[":status"] = payload.status;
  }

  if (payload.availability) {
    updates.push("availability = :availability");
    values[":availability"] = payload.availability;
  }

  if (typeof payload.featured === "boolean") {
    updates.push("featured = :featured");
    values[":featured"] = payload.featured;
  }

  if (payload.promotion?.trim()) {
    updates.push("promotion = :promotion");
    values[":promotion"] = payload.promotion.trim();
  }

  if (payload.teaser?.trim()) {
    updates.push("teaser = :teaser");
    values[":teaser"] = payload.teaser.trim();
  }

  if (updates.length === 0) {
    const result = await documentClient.send(
      new GetCommand({
        TableName: homesTable,
        Key: { id: homeId }
      })
    );
    return result.Item || null;
  }

  const result = await documentClient.send(
    new UpdateCommand({
      TableName: homesTable,
      Key: { id: homeId },
      UpdateExpression: `SET ${updates.join(", ")}`,
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW"
    })
  );

  return result.Attributes || null;
}
