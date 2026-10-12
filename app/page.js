import Link from "next/link";
import CinematicHero from "../components/CinematicHero";
import OrbitImages from "../components/OrbitImages";
import Reveal from "../components/Reveal";
import ProductCard from "../components/ProductCard";
import { products } from "../lib/products";
import { GlowCard } from "../components/ui/spotlight-card";
import { Sprout, Filter, Droplets, Sun, CheckCircle2, Flame } from "lucide-react";
import BeanAnatomy from "../components/BeanAnatomy";
import OriginVideoScroll from "../components/OriginVideoScroll";

const harvestImages = [
  "https://images.unsplash.com/photo-1524350876685-274059332603?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=300&q=80",
];

const steps = [
  {
    step: "01",
    title: "Harvest",
    tag: "Estate Canopy",
    text: "Ripe cherries are selectively hand-picked from the estate across repeated passes.",
    image: "https://images.unsplash.com/photo-1524350876685-274059332603?auto=format&fit=crop&w=600&q=80",
    icon: Sprout,
  },
  {
    step: "02",
    title: "Sorting",
    tag: "Density & Optical",
    text: "Underripe, damaged, and low-density cherries are eliminated by hand and water channels.",
    image: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80",
    icon: Filter,
  },
  {
    step: "03",
    title: "Processing",
    tag: "Washed / Natural / Monsoon",
    text: "Cherries are washed, naturally sun-cured, or monsooned depending on the custom lot profile.",
    image: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=600&q=80",
    icon: Droplets,
  },
  {
    step: "04",
    title: "Drying",
    tag: "Raised Beds & Patios",
    text: "Beans are evenly turned on raised beds to achieve optimal 10.5–11.5% moisture stability.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    icon: Sun,
  },
  {
    step: "05",
    title: "Quality",
    tag: "SCA Sensory Cupping",
    text: "Every export lot is precision-cupped, screened for bean size, moisture, and zero primary defects.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    icon: CheckCircle2,
  },
  {
    step: "06",
    title: "Roasting",
    tag: "Roasters Worldwide",
    text: "Specialty roasters worldwide unlock each estate lot's nuanced sweetness, aroma, and body.",
    image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=600&q=80",
    icon: Flame,
  },
];

// Five browns the Journey card glow blends through as the cursor crosses the screen.
const journeyGlow = ["#7b3f1d", "#8b5a2b", "#a9784d", "#c08552", "#c9a06a"];

const buyers = [
  { label: "Roasters", angle: -28 },
  { label: "Importers", angle: 0 },
  { label: "Distributors", angle: 28 },
];

export default function Home() {
  return (
    <>
      <CinematicHero />

      {/* Slide 2: Origin Animated Video On Scroll */}
      <OriginVideoScroll />

      <section className="section" aria-labelledby="harvest-title">
        <div className="container split split--harvest">
          <Reveal>
            <p className="eyebrow">Harvest</p>
            <h2 id="harvest-title">Picked at peak ripeness.</h2>
            <p>
              Coffee cherries ripen unevenly on the branch, so quality harvesting means repeated passes through
              the same trees, selecting only the ripe, red cherries each time.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="harvest-orbit-wrapper">
            <OrbitImages
              images={harvestImages}
              shape="ellipse"
              baseWidth={700}
              radiusX={335}
              radiusY={130}
              rotation={-12}
              duration={26}
              itemSize={125}
              responsive={true}
              aspectRatio="16 / 10"
              showPath={true}
              pathColor="rgba(201, 160, 106, 0.35)"
              pathWidth={2}
              centerContent={
                <div className="harvest-orbit-center">
                  <span className="harvest-orbit-center__tag">Harvest</span>
                  <h3 className="harvest-orbit-center__title">Peak Ripeness</h3>
                  <p className="harvest-orbit-center__sub">Hand-picked lots</p>
                </div>
              }
            />
          </Reveal>
        </div>
      </section>

      <section id="journey" className="section journey" aria-labelledby="journey-title">
        <div className="container">
          <Reveal className="section__head">
            <p className="eyebrow eyebrow--light">Our Journey</p>
            <h2 id="journey-title">From cherry to graded lot</h2>
            <p>Every lot follows the same steps before it&rsquo;s ready to export.</p>
          </Reveal>
          <div className="journey-grid">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 0.08} y={0}>
                  <GlowCard
                    customSize={true}
                    palette={journeyGlow}
                    className="journey-card"
                  >
                    <div>
                      <div className="journey-card__header">
                        <span className="journey-card__num-pill">{s.step}</span>
                        <div className="journey-card__icon-badge" aria-hidden="true">
                          <Icon size={18} />
                        </div>
                      </div>
                      <div className="journey-card__image-wrap">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="journey-card__image"
                          loading="lazy"
                        />
                        <span className="journey-card__tag">{s.tag}</span>
                      </div>
                    </div>
                    <div className="journey-card__body">
                      <h3 className="journey-card__title">{s.title}</h3>
                      <p className="journey-card__text">{s.text}</p>
                    </div>
                  </GlowCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive 3D Coffee Bean Anatomy experience */}
      <BeanAnatomy />

      <section id="coffee" className="section" aria-labelledby="coffee-title">
        <div className="container">
          <Reveal className="section__head">
            <p className="eyebrow">Our Coffee</p>
            <h2 id="coffee-title">Single-origin lots, graded for export</h2>
            <p>Arabica and Robusta from India&rsquo;s coffee hills, each lot traceable to the estate it was grown on.</p>
          </Reveal>
          <div className="grid">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="export-title">
        <div className="container">
          <Reveal className="section__head">
            <p className="eyebrow">From India to the World</p>
            <h2 id="export-title">Built for international buyers</h2>
            <p>We work with roasters, importers, and distributors sourcing single-origin Indian coffee.</p>
          </Reveal>
          <Reveal>
            <svg className="export-map" viewBox="0 0 800 320" role="img" aria-label="Diagram showing India as the origin point, connected to roasters, importers, and distributors worldwide">
              <circle className="export-map__origin" cx="120" cy="160" r="10" />
              <text className="export-map__label" x="120" y="195" textAnchor="middle">India</text>
              {buyers.map((b) => {
                const rad = (b.angle * Math.PI) / 180;
                const endX = 120 + Math.cos(rad) * 560;
                const endY = 160 + Math.sin(rad) * 130;
                const midX = 120 + Math.cos(rad) * 320;
                const midY = 160 + Math.sin(rad) * 40;
                return (
                  <g key={b.label}>
                    <path className="export-map__path" d={`M120,160 Q${midX},${midY} ${endX},${endY}`} />
                    <circle className="export-map__node" cx={endX} cy={endY} r="7" />
                    <text className="export-map__label" x={endX} y={endY - 16} textAnchor="middle">{b.label}</text>
                  </g>
                );
              })}
            </svg>
          </Reveal>
        </div>
      </section>

      <section className="section cta-band" aria-labelledby="cta-title">
        <Reveal className="container">
          <h2 id="cta-title">Let&rsquo;s bring great Indian coffee to your market.</h2>
          <p>Request samples, volumes, or a quote. We reply with lot availability and shipping options.</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link href="/contact" className="btn btn--primary">Request a Sample</Link>
            <Link href="/contact" className="text-link">Contact Arka <span aria-hidden="true">→</span></Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
