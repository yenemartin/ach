import {
  careHighlights,
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
    homeProfile,
    defaultTheme,
    careHighlights,
    livingFeatures,
    experienceSteps,
    galleryImages,
    faqs
  }
};

export function getSelectedHome() {
  const params = new URLSearchParams(window.location.search);
  const requestedHome = params.get("home");

  if (requestedHome && homes[requestedHome]) {
    return homes[requestedHome];
  }

  return homes["harbor-hearth"];
}
