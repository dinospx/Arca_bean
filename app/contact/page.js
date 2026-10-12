import ContactForm from "../../components/ContactForm";

export const metadata = {
  title: "Request Samples or a Quote",
  description: "Contact Arka Bean Co.'s export team for Indian coffee samples, volumes, and pricing.",
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container contact">
        <div>
          <p className="eyebrow">Contact</p>
          <h1>Request samples or a quote</h1>
          <p>
            Tell us about your roastery or import business and we’ll come back with lot availability, pricing, and shipping
            options.
          </p>
          <ContactForm />
        </div>
        <aside className="contact__aside" aria-labelledby="include-title">
          <h2 id="include-title" className="h3">Helpful to include</h2>
          <ul>
            <li>Which coffees interest you</li>
            <li>Estimated annual volume</li>
            <li>Destination port or country</li>
            <li>Where to send samples</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
