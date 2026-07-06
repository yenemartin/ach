function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  if (!value) {
    return true;
  }

  return /^[0-9+()\-\s]{7,}$/.test(value);
}

export function validateInquiry(payload) {
  if (!payload.homeId) {
    return "Home id is required.";
  }

  if (!payload.requestType || !["tour", "contact"].includes(payload.requestType)) {
    return "Request type must be contact or tour.";
  }

  if (!payload.name?.trim()) {
    return "Name is required.";
  }

  if (!payload.email?.trim() || !isEmail(payload.email)) {
    return "A valid email is required.";
  }

  if (!payload.preferredContactMethod?.trim()) {
    return "Preferred contact method is required.";
  }

  if (!isPhone(payload.phone)) {
    return "Phone number format looks invalid.";
  }

  const forbiddenFields = [
    "diagnosis",
    "medications",
    "medicalHistory",
    "carePlan",
    "residentNotes"
  ];

  if (forbiddenFields.some((field) => field in payload)) {
    return "Resident-care and medical fields are not allowed in v1.";
  }

  return null;
}

