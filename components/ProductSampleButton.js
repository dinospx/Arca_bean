"use client";

import { useSampleBox } from "./SampleBoxContext";
import { Check, Plus, Package } from "lucide-react";

export default function ProductSampleButton({ product }) {
  const { addSample, removeSample, isInBox } = useSampleBox();
  const inBox = isInBox(product.slug);

  const toggle = () => {
    if (inBox) {
      removeSample(product.slug);
    } else {
      addSample(product, "250g Green");
    }
  };

  return (
    <button
      type="button"
      className={`btn ${inBox ? "btn--in-box" : "btn--primary"}`}
      onClick={toggle}
      aria-pressed={inBox}
    >
      {inBox ? (
        <>
          <Check size={18} style={{ marginRight: "0.5rem" }} />
          Sample in Box (250g)
        </>
      ) : (
        <>
          <Plus size={18} style={{ marginRight: "0.5rem" }} />
          Request 250g Sample
        </>
      )}
    </button>
  );
}
