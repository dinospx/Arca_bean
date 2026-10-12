"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";

const SampleBoxContext = createContext(null);

const STORAGE_KEY = "arka_sample_box_v1";

export function SampleBoxProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

  // Load from localStorage on mount (SSR safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load sample box from storage:", e);
    }
    setHydrated(true);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not persist sample box to storage:", e);
    }
  }, [items, hydrated]);

  const addSample = (product, weight = "250g Green") => {
    setItems((prev) => {
      const existing = prev.find((item) => item.slug === product.slug);
      if (existing) {
        // Already in box, don't duplicate
        return prev;
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          grade: product.grade,
          species: product.species,
          lotId: product.lotId,
          warehouse: product.warehouse,
          statusLabel: product.statusLabel,
          weight,
        },
      ];
    });
    // Auto open drawer briefly when item is added
    startTransition(() => {
      setIsOpen(true);
    });
  };

  const removeSample = (slug) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  };

  const updateWeight = (slug, weight) => {
    setItems((prev) =>
      prev.map((item) => (item.slug === slug ? { ...item, weight } : item))
    );
  };

  const clearBox = () => {
    setItems([]);
  };

  const isInBox = (slug) => {
    return items.some((item) => item.slug === slug);
  };

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const value = {
    items,
    count: items.length,
    isOpen,
    hydrated,
    setIsOpen,
    toggleOpen,
    addSample,
    removeSample,
    updateWeight,
    clearBox,
    isInBox,
  };

  return (
    <SampleBoxContext.Provider value={value}>
      {children}
    </SampleBoxContext.Provider>
  );
}

export function useSampleBox() {
  const context = useContext(SampleBoxContext);
  if (!context) {
    throw new Error("useSampleBox must be used within a SampleBoxProvider");
  }
  return context;
}
