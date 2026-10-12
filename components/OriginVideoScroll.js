"use client";

import React from "react";
import Link from "next/link";
import {
  ContainerAnimated,
  ContainerInset,
  ContainerScroll,
  ContainerSticky,
  HeroButton,
  HeroVideo,
} from "@/components/ui/animated-video-on-scroll";
import { MapPin, Trees, ArrowRight, Mountain } from "lucide-react";

export default function OriginVideoScroll() {
  return (
    <section id="origin" className="origin-scroll-section" aria-labelledby="origin-title">
      <ContainerScroll className="h-[260vh] sm:h-[280vh]">
        <ContainerSticky className="origin-sticky-container">
          {/* Ambient Coffee Estate Glow */}
          <div className="origin-sticky-glow" />

          {/* Animated Header */}
          <ContainerAnimated className="origin-scroll-head">
            <div className="origin-scroll-badge">
              <Trees size={14} className="text-[#c9a06a]" />
              <span>Western Ghats &middot; 1,200m Elevation</span>
            </div>
            <h2 id="origin-title" className="origin-scroll-title">
              Where the journey begins.
            </h2>
            <p className="origin-scroll-desc">
              Southern India&rsquo;s mist-shrouded coffee hills combine volcanic soil, southwest monsoon rainfall,
              and dense native shade canopies — conditions coffee has thrived in for over three centuries.
            </p>
          </ContainerAnimated>

          {/* Expanding Inset Video / Media Frame */}
          <ContainerInset
            insetYRange={[30, 0]}
            insetXRange={[28, 0]}
            roundednessRange={[60, 16]}
            className="origin-video-frame"
          >
            <div className="origin-video-wrapper">
              <HeroVideo
                src="/origin-film.mp4"
                poster="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85"
                className="origin-video-element"
              />
              <div className="origin-video-overlay">
                <div className="origin-video-tag">
                  <Mountain size={14} />
                  <span>Baba Budan Giri &middot; Coorg Estates</span>
                </div>
              </div>
            </div>
          </ContainerInset>

          {/* Animated Call To Action Button */}
          <ContainerAnimated
            transition={{ delay: 0.2 }}
            outputRange={[-60, 0]}
            inputRange={[0.2, 0.75]}
            className="origin-cta-wrapper"
          >
            <Link href="#journey" className="inline-block">
              <HeroButton className="origin-hero-button">
                <span>Follow The Coffee Journey</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </HeroButton>
            </Link>
          </ContainerAnimated>
        </ContainerSticky>
      </ContainerScroll>
    </section>
  );
}
