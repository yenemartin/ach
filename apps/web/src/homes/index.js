import {
  careHighlights,
  contactForm,
  defaultTheme,
  experienceSteps,
  faqs,
  galleryImages,
  homeProfile,
  livingFeatures
} from "./harbor-hearth";

export const homes = {
  "harbor-hearth": {
    key: "harbor-hearth",
    subdomain: "harbor-hearth.afhcares.com",
    aliases: [],
    homeProfile,
    contactForm,
    defaultTheme,
    careHighlights,
    livingFeatures,
    experienceSteps,
    galleryImages,
    faqs
  }
};

const defaultHomeKey = "harbor-hearth";

function normalizeHost(hostname) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function isPreviewHost(hostname) {
  const normalized = normalizeHost(hostname);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".pages.dev") ||
    normalized.endsWith(".workers.dev")
  );
}

function findHomeByHostname(hostname) {
  const normalized = normalizeHost(hostname);

  return Object.values(homes).find((home) => {
    const candidates = [home.subdomain, ...(home.aliases || [])]
      .filter(Boolean)
      .map(normalizeHost);

    return candidates.includes(normalized);
  });
}

export function getSelectedHome(locationLike = window.location) {
  const hostnameMatch = findHomeByHostname(locationLike.hostname);

  if (hostnameMatch) {
    return hostnameMatch;
  }

  if (isPreviewHost(locationLike.hostname)) {
    const params = new URLSearchParams(locationLike.search);
    const requestedHome = params.get("home");

    if (requestedHome && homes[requestedHome]) {
      return homes[requestedHome];
    }
  }

  return homes[defaultHomeKey];
}
