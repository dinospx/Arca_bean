"use client";

import { useState } from "react";
import { sendInquiry } from "../app/contact/actions";
import { useSampleBox } from "./SampleBoxContext";
import { Package, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const { items, count, removeSample, clearBox, hydrated } = useSampleBox();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Attach sample data if present
    if (items.length > 0) {
      formData.set("samples", JSON.stringify(items));
    }

    setStatus("sending");
    setError("");
    try {
      const result = await sendInquiry(formData);
      if (result.ok) {
        setStatus("sent");
        clearBox(); // Empty the sample box on successful dispatch
        return;
      }
      setError(result.error);
    } catch {
      setError("We couldn’t send your inquiry. Please check your connection and try again.");
    }
    setStatus("idle");
  };

  return (
    <div aria-live="polite">
      {status === "sent" ? (
        <div className="form form-success">
          <div className="form-success__icon" aria-hidden="true">
            <CheckCircle2 size={40} color="#c9a06a" />
          </div>
          <h2>Thank you, we’ve received your inquiry.</h2>
          <p>
            Our export desk will review your specifications and reply via email within 24 hours with lot availability,
            customs sample paperwork, and freight rates.
          </p>
          <Link href="/#coffee" className="btn btn--primary" style={{ marginTop: "1rem" }}>
            Return to Coffee Catalog
          </Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit}>
          {/* Sample Box Summary Panel (if items selected) */}
          {hydrated && count > 0 && (
            <div className="form-samples-panel">
              <div className="form-samples-panel__header">
                <div className="form-samples-panel__title-wrap">
                  <Package size={18} color="#c9a06a" />
                  <div>
                    <h3 className="form-samples-panel__title">
                      Sample Kit Attached ({count} {count === 1 ? "lot" : "lots"})
                    </h3>
                    <p className="form-samples-panel__desc">
                      250g green coffee sample tins will be dispatched to your address.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="form-samples-panel__clear"
                  onClick={clearBox}
                >
                  Clear Box
                </button>
              </div>

              <ul className="form-samples-panel__list">
                {items.map((item) => (
                  <li key={item.slug} className="form-sample-chip">
                    <span className="form-sample-chip__text">
                      <strong>{item.name}</strong> ({item.weight || "250g Green"}) &middot; {item.grade}
                    </span>
                    <button
                      type="button"
                      className="form-sample-chip__remove"
                      onClick={() => removeSample(item.slug)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hydrated && count === 0 && (
            <div className="form-samples-banner">
              <p>
                <strong>Need green coffee samples?</strong> You can browse{" "}
                <Link href="/#coffee" className="form-samples-banner__link">
                  Our Coffee
                </Link>{" "}
                and add lots directly to your Sample Box.
              </p>
            </div>
          )}

          <p className="form__hint">All starred fields are required for export logistics.</p>

          <div className="form__row">
            <div className="field">
              <label htmlFor="name">Your name *</label>
              <input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="company">Company / Roastery *</label>
              <input id="company" name="company" autoComplete="organization" required />
            </div>
          </div>

          <div className="form__row">
            <div className="field">
              <label htmlFor="email">Work email *</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="country">Country *</label>
              <input id="country" name="country" autoComplete="country-name" required />
            </div>
          </div>

          {/* B2B Logistics Fields */}
          <div className="form__row">
            <div className="field">
              <label htmlFor="port">
                Destination Port or Airport{" "}
                <span className="field__optional">(Optional)</span>
              </label>
              <input
                id="port"
                name="port"
                placeholder="e.g. Rotterdam, Hamburg, Felixstowe, Sydney"
              />
            </div>
            <div className="field">
              <label htmlFor="shippingAddress">
                Sample Delivery Address{" "}
                <span className="field__optional">
                  {count > 0 ? "(For customs dispatch)" : "(Optional)"}
                </span>
              </label>
              <input
                id="shippingAddress"
                name="shippingAddress"
                placeholder="Street address, postal code, city"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="message">Your message *</label>
            <textarea
              id="message"
              name="message"
              placeholder="Volume requirements, roast profile goals, timeline, target delivery month…"
              maxLength={5000}
              required
            />
          </div>

          {/* Hidden honeypot field for bot protection */}
          <input
            type="text"
            name="website"
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {error && <p className="form__error">{error}</p>}

          <div className="form__submit-row">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={status === "sending"}
            >
              {status === "sending"
                ? "Submitting Inquiry…"
                : count > 0
                ? `Submit Sample Request (${count} Lots)`
                : "Send Trade Inquiry"}
            </button>
            <div className="form__compliance-note">
              <ShieldCheck size={16} />
              <span>Certified Phytosanitary & ICO Origin Documentation</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
