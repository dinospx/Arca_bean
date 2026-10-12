"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowDown, Check, Sparkles, X } from "lucide-react";

const HOTSPOTS = [
  {
    id: "texture",
    num: "01",
    tag: "01 / Surface",
    name: "Texture",
    key: "Silky · Dense · Balanced",
    desc: "Volcanic high-elevation soil and slow cherry maturation yield dense cellular integrity, contributing to smooth crema and a silky, viscous mouthfeel.",
    desktopPos: { left: "8.5%", top: "79%" },
    cardAlign: "bottom-left",
  },
  {
    id: "aroma",
    num: "02",
    tag: "02 / Volatiles",
    name: "Aroma",
    key: "Cocoa · Wild Spice · Caramel",
    desc: "Convection drum roasting caramelizes sugars and volatilizes delicate aldehydes, liberating notes of dark chocolate, wild cardamom, and sweet praline.",
    desktopPos: { left: "71.5%", top: "24.5%" },
    cardAlign: "top-right",
  },
  {
    id: "richness",
    num: "03",
    tag: "03 / Extraction",
    name: "Richness",
    key: "Deep Flavor · Long Finish",
    desc: "High soluble solids and natural lipid retention ensure full flavor clarity and a clean, lingering chocolate finish that anchors filter roasts and espresso blends.",
    desktopPos: { left: "71.5%", top: "76%" },
    cardAlign: "bottom-right",
  },
];

const SCORECARD_DATA = [
  { label: "Acidity", score: 4, bars: [1, 1, 1, 1, 0] },
  { label: "Body", score: 5, bars: [1, 1, 1, 1, 1] },
  { label: "Sweetness", score: 4, bars: [1, 1, 1, 1, 0] },
  { label: "Aroma", score: 5, bars: [1, 1, 1, 1, 1] },
  { label: "Finish", score: 4, bars: [1, 1, 1, 1, 0] },
];

export default function BeanAnatomy() {
  const frameRef = useRef(null);
  const [activeSpot, setActiveSpot] = useState(null);
  const [scorecardActive, setScorecardActive] = useState(false);

  const handleMouseMove = (e) => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${py * -3.5}deg) rotateY(${px * 4.5}deg)`;
  };

  const handleMouseLeave = () => {
    if (frameRef.current) {
      frameRef.current.style.transform = "";
    }
  };

  const toggleSpot = (id) => {
    setActiveSpot((prev) => (prev === id ? null : id));
    setScorecardActive(false);
  };

  const toggleScorecard = () => {
    setScorecardActive((prev) => !prev);
    setActiveSpot(null);
  };

  return (
    <section
      id="bean"
      className="bean-anatomy"
      aria-labelledby="bean-anatomy-title"
    >
      {/* Dark Ambient Roasted Espresso Glow */}
      <div className="bean-anatomy__glow" aria-hidden="true" />

      <div className="bean-anatomy__container">
        {/* Screen Reader Semantic Title (Visual text is embedded in the slide) */}
        <div className="sr-only">
          <p>ANATOMY OF FLAVOUR</p>
          <h2 id="bean-anatomy-title">Built inside the bean.</h2>
          <p>A close look at the bean reveals what the cup will offer, long before it is brewed.</p>
          <ul>
            <li>01 / Surface — Texture: Silky · Dense · Balanced</li>
            <li>02 / Volatiles — Aroma: Cocoa · Wild Spice · Caramel</li>
            <li>03 / Extraction — Richness: Deep Flavor · Long Finish</li>
          </ul>
          <div>
            <h3>Cupping Profile Scorecard</h3>
            <p>Acidity: 4/5, Body: 5/5, Sweetness: 4/5, Aroma: 5/5, Finish: 4/5</p>
          </div>
        </div>

        {/* Cinematic Master Slide Frame */}
        <div
          ref={frameRef}
          className="bean-anatomy__slide-frame"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* High-Resolution Clean Slide Visual */}
          <img
            src="/anatomy-of-flavour.jpg"
            alt="Anatomy of Flavour: Built inside the bean. High-resolution macro coffee bean resting in velvet espresso crema, detailing texture, aroma, and richness."
            className="bean-anatomy__img"
            loading="lazy"
          />

          {/* Interactive Hotspots over the 3 Callouts */}
          {HOTSPOTS.map((spot) => {
            const isActive = activeSpot === spot.id;
            return (
              <div
                key={spot.id}
                className="bean-hotspot-wrapper"
                style={spot.desktopPos}
              >
                <button
                  type="button"
                  className={`bean-hotspot ${isActive ? "bean-hotspot--active" : ""}`}
                  onClick={() => toggleSpot(spot.id)}
                  aria-expanded={isActive}
                  aria-label={`Inspect ${spot.name}: ${spot.key}`}
                >
                  <div className="bean-hotspot__pulse">
                    <span className="bean-hotspot__ring" aria-hidden="true" />
                    <span className="bean-hotspot__dot" />
                  </div>
                </button>

                {/* Popover detail on click / hover */}
                {isActive && (
                  <div
                    className={`bean-hotspot__card bean-hotspot__card--${spot.cardAlign}`}
                    role="region"
                    aria-label={`${spot.name} Details`}
                  >
                    <div className="bean-hotspot__card-head">
                      <span className="bean-hotspot__card-pill">{spot.tag}</span>
                      <button
                        type="button"
                        className="bean-hotspot__card-close"
                        onClick={() => setActiveSpot(null)}
                        aria-label="Close detail"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <h3 className="bean-hotspot__card-title">{spot.name}</h3>
                    <p className="bean-hotspot__card-key">{spot.key}</p>
                    <p className="bean-hotspot__card-body">{spot.desc}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Interactive Target for Cupping Scorecard */}
          <div
            className={`bean-hotspot-scorecard ${scorecardActive ? "bean-hotspot-scorecard--active" : ""}`}
            onClick={toggleScorecard}
            role="button"
            tabIndex={0}
            aria-expanded={scorecardActive}
            aria-label="Cupping Scorecard Breakdown: Acidity, Body, Sweetness, Aroma, Finish"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleScorecard();
              }
            }}
          >
            {scorecardActive && (
              <div className="bean-hotspot-scorecard__popover">
                <div className="bean-hotspot__card-head">
                  <span className="bean-hotspot__card-pill">SCA Cupping Calibration</span>
                  <button
                    type="button"
                    className="bean-hotspot__card-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScorecardActive(false);
                    }}
                    aria-label="Close scorecard breakdown"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="bean-hotspot-scorecard__title">Sensory Balance Breakdown</h4>
                <div className="bean-hotspot-scorecard__grid">
                  {SCORECARD_DATA.map((item) => (
                    <div key={item.label} className="bean-hotspot-scorecard__row">
                      <span className="bean-hotspot-scorecard__lbl">{item.label}</span>
                      <div className="bean-hotspot-scorecard__bars">
                        {item.bars.map((filled, idx) => (
                          <span
                            key={idx}
                            className={`score-bar ${filled ? "score-bar--filled" : "score-bar--empty"}`}
                          />
                        ))}
                      </div>
                      <span className="bean-hotspot-scorecard__num">{item.score}/5</span>
                    </div>
                  ))}
                </div>
                <p className="bean-hotspot-scorecard__footer">
                  Precision lot grading calibrated for international specialty roasters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Flavor Summary Cards (< 768px fallback where micro text might be small) */}
        <div className="bean-anatomy__mobile-notes">
          {HOTSPOTS.map((spot) => (
            <div key={spot.id} className="bean-mobile-card">
              <span className="bean-mobile-card__tag">{spot.tag}</span>
              <h3 className="bean-mobile-card__name">{spot.name}</h3>
              <p className="bean-mobile-card__key">{spot.key}</p>
              <p className="bean-mobile-card__desc">{spot.desc}</p>
            </div>
          ))}
        </div>

        {/* Downward link to Slide 6: Graded Coffee Catalog */}
        <Link href="#coffee" className="bean-anatomy__indicator">
          <span>Explore Graded Export Lots Below</span>
          <ArrowDown size={15} className="bean-anatomy__indicator-icon" />
        </Link>
      </div>
    </section>
  );
}
