function jsonResponse(data) {
  return ContentService.createTextOutput(
    JSON.stringify(data, null, 2)
  )
    .setMimeType(ContentService.MimeType.JSON);
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function doPost(e) {
  var token = PropertiesService.getScriptProperties().getProperty("EMAIL_NOTIFICATION_TOKEN");
  var requestToken = "";

  if (e && e.postData && e.postData.contents) {
    // continue
  } else {
    return jsonResponse({ error: "Missing request body." });
  }

  try {
    requestToken = trimString((e.parameter && e.parameter.token) || "");
  } catch (error) {
    requestToken = "";
  }

  if (token) {
    if (requestToken !== token) {
      return jsonResponse({ error: "Unauthorized." });
    }
  }

  var body = JSON.parse(e.postData.contents);
  var recipientEmail = trimString(body.recipientEmail);
  var inquiry = body.inquiry || {};

  if (!recipientEmail) {
    return jsonResponse({ error: "Missing recipient email." });
  }

  var subject = "New Harbor Hearth inquiry";
  if (inquiry.homeName) {
    subject = "New inquiry for " + inquiry.homeName;
  }

  var plainBody = [
    "A new inquiry was submitted.",
    "",
    "Home: " + (inquiry.homeName || ""),
    "Subdomain: " + (inquiry.homeSubdomain || ""),
    "Type: " + (inquiry.inquiryType || ""),
    "Name: " + (inquiry.name || ""),
    "Phone: " + (inquiry.phone || ""),
    "Email: " + (inquiry.email || ""),
    "Move-in timeline: " + (inquiry.moveInTimeline || ""),
    "Submitted at: " + (inquiry.submittedAt || ""),
    "",
    "Message:",
    inquiry.message || ""
  ].join("\n");

  var htmlBody = [
    "<p>A new inquiry was submitted.</p>",
    "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse'>",
    "<tr><td><strong>Home</strong></td><td>" + (inquiry.homeName || "") + "</td></tr>",
    "<tr><td><strong>Subdomain</strong></td><td>" + (inquiry.homeSubdomain || "") + "</td></tr>",
    "<tr><td><strong>Type</strong></td><td>" + (inquiry.inquiryType || "") + "</td></tr>",
    "<tr><td><strong>Name</strong></td><td>" + (inquiry.name || "") + "</td></tr>",
    "<tr><td><strong>Phone</strong></td><td>" + (inquiry.phone || "") + "</td></tr>",
    "<tr><td><strong>Email</strong></td><td>" + (inquiry.email || "") + "</td></tr>",
    "<tr><td><strong>Move-in timeline</strong></td><td>" + (inquiry.moveInTimeline || "") + "</td></tr>",
    "<tr><td><strong>Submitted at</strong></td><td>" + (inquiry.submittedAt || "") + "</td></tr>",
    "</table>",
    "<p><strong>Message</strong></p>",
    "<p>" + (inquiry.message || "").replace(/\n/g, "<br>") + "</p>"
  ].join("");

  MailApp.sendEmail({
    to: recipientEmail,
    replyTo: inquiry.email || recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: "AFH Cares Inquiries"
  });

  return jsonResponse({ ok: true });
}
