"use client";

import Link from "next/link";
import CuppingRadar from "./CuppingRadar";
import { useSampleBox } from "./SampleBoxContext";
import { Check, Plus, PackageCheck } from "lucide-react";

function handleTilt(e) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width - 0.5;
  const py = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(800px) rotateX(${py * -6}deg) rotateY(${px * 8}deg)`;
}

function resetTilt(e) {
  e.currentTarget.style.transform = "";
}

export default function ProductCard({ product }) {
  const { addSample, removeSample, isInBox } = useSampleBox();
  const inBox = isInBox(product.slug);

  const handleSampleToggle = (e) => {
    // Prevent clicking the sample button from triggering the card link overlay
    e.preventDefault();
    e.stopPropagation();
    if (inBox) {
      removeSample(product.slug);
    } else {
      addSample(product, "250g Green");
    }
  };

  const isSpot = product.status === "spot";

  return (
    <article className="card" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
      {/* Photo with trading status badges overlay */}
      <div className="photo card__photo" role="img" aria-label={product.photo}>
        <div className="card__badges">
          <span
            className={`lot-badge ${isSpot ? "lot-badge--spot" : "lot-badge--afloat"}`}
          >
            <span className="lot-badge__dot" />
            {product.statusLabel || (isSpot ? "Available (Spot)" : "Pre-Book (Afloat)")}
          </span>
          {product.cuppingScore && (
            <span className="lot-badge lot-badge--score">
              {product.cuppingScore} SCA
            </span>
          )}
        </div>
      </div>

      <div className="card__body">
        <div className="card__meta-row">
          <p className="eyebrow">{product.species} &middot; {product.process}</p>
          {product.lotId && <span className="card__lot-id">{product.lotId}</span>}
        </div>

        <h3 className="card__title">
          <Link href={`/products/${product.slug}`} className="card__link">
            {product.name}
          </Link>
        </h3>

        <p className="card__summary">{product.summary}</p>

        {/* Tasting Notes */}
        <p className="card__notes">{product.notes.join(" · ")}</p>

        {/* Sensory Cupping Radar preview */}
        {product.cuppingProfile && (
          <div className="card__sensory-preview">
            <span className="card__sensory-label">Cupping Profile</span>
            <div className="card__radar-wrap">
              <CuppingRadar
                profile={product.cuppingProfile}
                score={product.cuppingScore}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Card Footer: Quick Sample Action & Details Link */}
        <div className="card__footer">
          <button
            type="button"
            className={`btn-sample ${inBox ? "btn-sample--active" : ""}`}
            onClick={handleSampleToggle}
            aria-pressed={inBox}
            aria-label={inBox ? `Remove ${product.name} sample` : `Request 250g sample of ${product.name}`}
          >
            {inBox ? (
              <>
                <Check size={15} />
                <span>In Sample Box</span>
              </>
            ) : (
              <>
                <Plus size={15} />
                <span>Add 250g Sample</span>
              </>
            )}
          </button>

          <span className="card__cta" aria-hidden="true">
            Details &rarr;
          </span>
        </div>
      </div>
    </article>
  );
}
