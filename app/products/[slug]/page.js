import Link from "next/link";
import Reveal from "../../../components/Reveal";
import ProductCard from "../../../components/ProductCard";
import CuppingRadar from "../../../components/CuppingRadar";
import ProductSampleButton from "../../../components/ProductSampleButton";
import { products } from "../../../lib/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

async function findProduct(params) {
  const { slug } = await params;
  return products.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }) {
  const product = await findProduct(params);
  return { title: product.name, description: product.summary };
}

export default async function ProductPage({ params }) {
  const product = await findProduct(params);
  const others = products.filter((p) => p !== product);
  const isSpot = product.status === "spot";

  return (
    <>
      <section className="section">
        <div className="container">
          <Link href="/#coffee" className="back">
            <span aria-hidden="true">&larr;</span> All coffees
          </Link>
          <div className="product">
            <Reveal>
              <div className="product__media-column">
                <div className="photo product__photo" role="img" aria-label={product.photo}>
                  <div className="card__badges">
                    <span
                      className={`lot-badge ${isSpot ? "lot-badge--spot" : "lot-badge--afloat"}`}
                    >
                      <span className="lot-badge__dot" />
                      {product.statusLabel}
                    </span>
                    {product.cuppingScore && (
                      <span className="lot-badge lot-badge--score">
                        {product.cuppingScore} SCA
                      </span>
                    )}
                  </div>
                </div>

                {/* Cupping Radar Visualization Panel */}
                {product.cuppingProfile && (
                  <div className="product__radar-card">
                    <div className="product__radar-header">
                      <div>
                        <h3 className="product__radar-title">SCA Cupping Profile</h3>
                        <p className="product__radar-sub">
                          5-Axis Sensory Fingerprint &middot; Calibrated Lot
                        </p>
                      </div>
                      {product.cuppingScore && (
                        <span className="product__score-callout">
                          <strong>{product.cuppingScore}</strong> / 100
                        </span>
                      )}
                    </div>
                    <CuppingRadar
                      profile={product.cuppingProfile}
                      score={product.cuppingScore}
                      compact={false}
                    />
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="product__details">
                <div className="product__header-badges">
                  <p className="eyebrow">{product.species} &middot; {product.process}</p>
                  {product.lotId && <span className="card__lot-id">{product.lotId}</span>}
                </div>

                <h1>{product.name}</h1>
                <p className="product__lead">{product.summary}</p>

                {/* Trading & Agronomy Specifications */}
                <dl className="specs">
                  <dt>Status</dt>
                  <dd>
                    <span className={`status-pill ${isSpot ? "status-pill--spot" : "status-pill--afloat"}`}>
                      {product.statusLabel}
                    </span>
                  </dd>
                  <dt>Warehouse</dt>
                  <dd>{product.warehouse || "Origin Port"}</dd>
                  <dt>Available Stock</dt>
                  <dd>{product.bagCount || "On request"}</dd>
                  <dt>Species</dt>
                  <dd>{product.species}</dd>
                  <dt>Region</dt>
                  <dd>{product.region}</dd>
                  <dt>Process</dt>
                  <dd>{product.process}</dd>
                  <dt>Grade</dt>
                  <dd>{product.grade}</dd>
                  {product.screenSize && (
                    <>
                      <dt>Screen Size</dt>
                      <dd>{product.screenSize}</dd>
                    </>
                  )}
                  {product.moisture && (
                    <>
                      <dt>Moisture</dt>
                      <dd>{product.moisture}</dd>
                    </>
                  )}
                  {product.harvest && (
                    <>
                      <dt>Crop Season</dt>
                      <dd>{product.harvest}</dd>
                    </>
                  )}
                </dl>

                <h2 className="h3">Tasting notes</h2>
                <ul className="notes">
                  {product.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>

                <p>{product.description}</p>

                {/* Conversion Actions */}
                <div className="actions" style={{ marginTop: "2rem" }}>
                  <ProductSampleButton product={product} />
                  <Link href="/contact" className="text-link">
                    Inquire about container volumes <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="more-title">
        <div className="container">
          <h2 id="more-title">More from Southern India</h2>
          <div className="grid">
            {others.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
