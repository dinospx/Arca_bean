"use client";

import Link from "next/link";
import { useSampleBox } from "./SampleBoxContext";
import { Package, X, ArrowRight, CheckCircle, Trash2 } from "lucide-react";
import { useEffect } from "react";

export default function SampleBoxDrawer() {
  const { items, count, isOpen, setIsOpen, toggleOpen, removeSample, clearBox, hydrated } =
    useSampleBox();

  // Close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setIsOpen]);

  // Don't render until hydrated to avoid hydration mismatch
  if (!hydrated || count === 0) {
    return null;
  }

  return (
    <aside className="sample-drawer-root" aria-label="Sample Box Drawer">
      {/* Floating Toggle Pill when closed */}
      {!isOpen && (
        <button
          type="button"
          className="sample-trigger-btn"
          onClick={toggleOpen}
          aria-expanded="false"
          aria-controls="sample-box-drawer"
        >
          <div className="sample-trigger-btn__icon">
            <Package size={18} />
            <span className="sample-trigger-btn__badge">{count}</span>
          </div>
          <span className="sample-trigger-btn__text">Sample Box</span>
          <span className="sample-trigger-btn__arrow" aria-hidden="true">
            &uarr;
          </span>
        </button>
      )}

      {/* Expanded Drawer Card */}
      {isOpen && (
        <div
          id="sample-box-drawer"
          className="sample-drawer"
          role="dialog"
          aria-modal="false"
          aria-labelledby="sample-drawer-title"
        >
          {/* Header */}
          <div className="sample-drawer__header">
            <div className="sample-drawer__header-left">
              <div className="sample-drawer__icon-wrap">
                <Package size={18} />
              </div>
              <div>
                <h3 id="sample-drawer-title" className="sample-drawer__title">
                  Sample Box
                </h3>
                <span className="sample-drawer__sub">
                  {count} {count === 1 ? "lot" : "lots"} selected &middot; 250g Green
                </span>
              </div>
            </div>
            <button
              type="button"
              className="sample-drawer__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close sample box drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: List of selected lots */}
          <div className="sample-drawer__body">
            <ul className="sample-drawer__list">
              {items.map((item) => (
                <li key={item.slug} className="sample-item">
                  <div className="sample-item__info">
                    <span className="sample-item__meta">
                      {item.species} &middot; {item.grade}
                    </span>
                    <h4 className="sample-item__name">{item.name}</h4>
                    <div className="sample-item__tags">
                      <span className="sample-item__badge">{item.weight || "250g Green"}</span>
                      {item.lotId && (
                        <span className="sample-item__lot">{item.lotId}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sample-item__remove"
                    onClick={() => removeSample(item.slug)}
                    aria-label={`Remove ${item.name} from sample box`}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer actions */}
          <div className="sample-drawer__footer">
            <div className="sample-drawer__hint">
              <CheckCircle size={14} className="sample-drawer__hint-icon" />
              <span>Complimentary sample tins for licensed roasters & importers.</span>
            </div>
            <div className="sample-drawer__actions">
              <button
                type="button"
                className="sample-drawer__clear"
                onClick={clearBox}
              >
                Clear all
              </button>
              <Link
                href="/contact"
                className="btn btn--primary sample-drawer__submit"
                onClick={() => setIsOpen(false)}
              >
                Request Sample Box
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
