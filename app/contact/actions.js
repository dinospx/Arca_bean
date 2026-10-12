"use server";

const LIMITS = { name: 200, company: 200, email: 254, country: 100, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendInquiry(formData) {
  if (formData.get("website")) return { ok: true };

  const inquiry = {};
  for (const [field, max] of Object.entries(LIMITS)) {
    let value = String(formData.get(field) ?? "").trim();
    if (field !== "message") value = value.replace(/\s+/g, " ");
    if (!value || value.length > max) return { ok: false, error: "Please fill in every field." };
    inquiry[field] = value;
  }
  if (!EMAIL.test(inquiry.email)) return { ok: false, error: "Please enter a valid email address." };

  const { name, company, email, country, message } = inquiry;

  // Optional B2B Trade & Sample fields
  const port = String(formData.get("port") ?? "").trim().slice(0, 150);
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim().slice(0, 500);
  const rawSamples = formData.get("samples");
  let parsedSamples = [];
  if (rawSamples) {
    try {
      const data = typeof rawSamples === "string" ? JSON.parse(rawSamples) : rawSamples;
      if (Array.isArray(data)) parsedSamples = data;
    } catch {
      // Ignore parse error and proceed with standard inquiry
    }
  }

  const hasSamples = parsedSamples.length > 0;
  const subject = hasSamples
    ? `[Sample Request] New inquiry from ${company} (${country})`
    : `New inquiry from ${company} (${country})`;

  let bodyText = `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nCountry: ${country}`;

  if (port) {
    bodyText += `\nDestination Port: ${port}`;
  }
  if (shippingAddress) {
    bodyText += `\nSample Delivery Address:\n${shippingAddress}`;
  }

  if (hasSamples) {
    bodyText += `\n\n--- REQUESTED SAMPLE LOTS ---`;
    parsedSamples.forEach((s, idx) => {
      bodyText += `\n${idx + 1}. ${s.name} (${s.weight || "250g Green"}) - ${s.grade || ""} [Lot: ${s.lotId || "Spot"}]`;
    });
    bodyText += `\n-----------------------------`;
  }

  bodyText += `\n\n${message}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL,
      to: process.env.CONTACT_TO_EMAIL,
      reply_to: email,
      subject,
      text: bodyText,
    }),
  });

  if (!res.ok) {
    console.error("Contact email failed:", res.status, await res.text());
    return { ok: false, error: "We couldn’t send your inquiry just now. Please try again in a moment." };
  }
  return { ok: true };
}
