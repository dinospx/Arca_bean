import { afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { sendInquiry } from "./actions.js";

const form = (overrides = {}) => {
  const fd = new FormData();
  const values = {
    name: "Asha Rao",
    company: "Nordic\nRoasters",
    email: "asha@roasters.test",
    country: "Norway",
    message: "Samples of\nMonsooned Malabar",
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
};

const stubFetch = (status = 200) =>
  mock.method(globalThis, "fetch", async () => new Response("{}", { status }));

afterEach(() => mock.restoreAll());

test("sends a valid inquiry with reply-to set to the buyer", async () => {
  process.env.CONTACT_TO_EMAIL = "sales@example.com";
  const fetch = stubFetch();
  assert.deepEqual(await sendInquiry(form()), { ok: true });
  const body = JSON.parse(fetch.mock.calls[0].arguments[1].body);
  assert.equal(body.to, "sales@example.com");
  assert.equal(body.reply_to, "asha@roasters.test");
  assert.equal(body.subject, "New inquiry from Nordic Roasters (Norway)");
  assert.match(body.text, /Samples of\nMonsooned Malabar/);
});

test("formats B2B sample requests and destination port in email body", async () => {
  process.env.CONTACT_TO_EMAIL = "sales@example.com";
  const fetch = stubFetch();
  const sampleData = [
    { name: "Chikmagalur Arabica Plantation AA", weight: "250g Green", grade: "Plantation AA", lotId: "LOT-ARK-2025-01" },
    { name: "Monsooned Malabar AA", weight: "250g Green", grade: "AA", lotId: "LOT-ARK-2025-02" }
  ];
  const fd = form({
    port: "Port of Hamburg",
    shippingAddress: "Speicherstadt 4, 20457 Hamburg",
    samples: JSON.stringify(sampleData)
  });

  assert.deepEqual(await sendInquiry(fd), { ok: true });
  const body = JSON.parse(fetch.mock.calls[0].arguments[1].body);
  assert.equal(body.subject, "[Sample Request] New inquiry from Nordic Roasters (Norway)");
  assert.match(body.text, /Destination Port: Port of Hamburg/);
  assert.match(body.text, /REQUESTED SAMPLE LOTS/);
  assert.match(body.text, /Chikmagalur Arabica Plantation AA \(250g Green\)/);
  assert.match(body.text, /Monsooned Malabar AA \(250g Green\)/);
});

test("rejects blank fields and bad emails without sending", async () => {
  const fetch = stubFetch();
  assert.equal((await sendInquiry(form({ company: "   " }))).ok, false);
  assert.equal((await sendInquiry(form({ email: "not-an-email" }))).ok, false);
  assert.equal(fetch.mock.callCount(), 0);
});

test("silently drops honeypot submissions", async () => {
  const fetch = stubFetch();
  assert.deepEqual(await sendInquiry(form({ website: "spam.example" })), { ok: true });
  assert.equal(fetch.mock.callCount(), 0);
});

test("reports failure when the email API rejects the request", async () => {
  mock.method(console, "error", () => {});
  stubFetch(401);
  assert.equal((await sendInquiry(form())).ok, false);
});
