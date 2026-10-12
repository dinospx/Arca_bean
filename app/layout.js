import localFont from "next/font/local";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { SampleBoxProvider } from "../components/SampleBoxContext";
import SampleBoxDrawer from "../components/SampleBoxDrawer";
import "./globals.css";

// Absans by Collletttivo — SIL Open Font License 1.1 (./fonts/Absans-LICENSE.txt).
const absans = localFont({ src: "./fonts/Absans-Regular.woff2", weight: "400", display: "swap" });

export const metadata = {
  title: {
    default: "Arka Bean Co. – Premium Indian Coffee Exporters",
    template: "%s | Arka Bean Co.",
  },
  description:
    "Single-origin Arabica and Robusta from Southern India's estates, exported to roasters, importers, and distributors worldwide.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ "--font-heading": absans.style.fontFamily, "--font-body": absans.style.fontFamily }}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <SampleBoxProvider>
          <Nav />
          <main id="main">{children}</main>
          <SampleBoxDrawer />
          <Footer />
        </SampleBoxProvider>
      </body>
    </html>
  );
}
