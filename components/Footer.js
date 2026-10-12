import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <p className="footer__logo">
              <Image src="/arka-logo.png" alt="" width={40} height={40} />
              <span>Arka Bean Co.</span>
            </p>
            <p>Premium single-origin coffee, sourced and exported from Southern India.</p>
            <p className="placeholder">Company history and years in export to be confirmed.</p>
          </div>
          <nav aria-label="Footer">
            <ul>
              <li><Link href="/#coffee">Our Coffee</Link></li>
              <li><Link href="/#journey">Our Journey</Link></li>
              <li><Link href="/#origin">Our Story</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </div>
        <p className="footer__bottom">© {new Date().getFullYear()} Arka Bean Co. All rights reserved.</p>
      </div>
    </footer>
  );
}
