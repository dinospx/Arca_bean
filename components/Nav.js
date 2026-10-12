"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSampleBox } from "./SampleBoxContext";
import { Package } from "lucide-react";

const links = [
  { href: "/#coffee", label: "Our Coffee" },
  { href: "/#journey", label: "Our Journey" },
  { href: "/#origin", label: "Our Story" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { count, toggleOpen, hydrated } = useSampleBox();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="header">
      <nav className="nav" aria-label="Main navigation">
        <Link href="/" className="nav__logo" onClick={close}>
          <Image src="/arka-logo.png" alt="" width={48} height={48} priority />
          <span className="nav__wordmark">Arka Bean Co.</span>
        </Link>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <ul id="nav-menu" className="nav__menu" data-open={open}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={close}>
                {l.label}
              </Link>
            </li>
          ))}

          {/* Sample Box Nav Indicator */}
          {hydrated && count > 0 && (
            <li>
              <button
                type="button"
                className="nav__sample-btn"
                onClick={() => {
                  toggleOpen();
                  close();
                }}
                aria-label={`Sample Box with ${count} items`}
              >
                <Package size={16} />
                <span>Sample Box</span>
                <span className="nav__sample-count">{count}</span>
              </button>
            </li>
          )}

          <li>
            <Link href="/contact" className="btn btn--primary" onClick={close}>
              Request a Quote
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
