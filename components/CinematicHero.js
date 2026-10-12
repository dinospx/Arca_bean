"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false, loading: () => null });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function CinematicHero() {
  const sectionRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const [capable, setCapable] = useState(false);
  const [checked, setChecked] = useState(false);
  const [particleCount, setParticleCount] = useState(60);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNarrow = window.innerWidth < 768;
    setReducedMotion(reduce);
    setNarrow(isNarrow);
    setParticleCount(isNarrow ? 50 : window.innerWidth < 1024 ? 110 : 180);
    setCapable(supportsWebGL());
    setChecked(true);
  }, []);

  // Stop the WebGL render loop once the hero is off screen; it otherwise keeps
  // costing a full frame of GPU work while every later section scrolls.
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!capable) return;
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.9)));
      scrollProgressRef.current = progress;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [capable]);

  return (
    <section ref={sectionRef} className="hero3d" aria-labelledby="hero3d-title">
      <div className="hero3d__canvas" aria-hidden="true">
        {checked && capable && (
          <Hero3D
            reducedMotion={reducedMotion}
            particleCount={particleCount}
            scrollProgressRef={scrollProgressRef}
            narrow={narrow}
            active={heroVisible}
          />
        )}
      </div>
      <div className="hero3d__layout">
        <div className="hero3d__content">
          <p className="eyebrow eyebrow--light">Arka Bean Company</p>
          <h1 id="hero3d-title" className="hero3d__title">
            From India&rsquo;s Soil
            <br />
            To The World&rsquo;s Cup.
          </h1>
          <p className="hero3d__lead">
            Carefully sourced coffee beans, shaped by Indian soil, climate and craft — prepared for exceptional
            cups around the world.
          </p>
          <div className="actions">
            <Link href="#coffee" className="btn btn--primary">Explore Our Coffee</Link>
            <Link href="#journey" className="btn btn--ghost">Our Journey</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
