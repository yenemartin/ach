import { useState } from "react";
import {
  careHighlights,
  faqs,
  galleryImages,
  homeProfile,
  livingFeatures,
  testimonials
} from "./mockData";

function ContactForm() {
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    email: "",
    timeline: "",
    message: ""
  });
  const [feedback, setFeedback] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Tour request for ${homeProfile.name}`);
    const body = encodeURIComponent(
      [
        `Name: ${formState.name}`,
        `Phone: ${formState.phone}`,
        `Email: ${formState.email}`,
        `Preferred timeline: ${formState.timeline}`,
        "",
        "Message:",
        formState.message
      ].join("\n")
    );

    window.location.href = `mailto:${homeProfile.email}?subject=${subject}&body=${body}`;
    setFeedback("Your email app should open with the tour request pre-filled.");
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Full name
        <input
          name="name"
          onChange={handleChange}
          placeholder="Your name"
          required
          value={formState.name}
        />
      </label>
      <label>
        Phone
        <input
          name="phone"
          onChange={handleChange}
          placeholder="(206) 555-0148"
          required
          value={formState.phone}
        />
      </label>
      <label>
        Email
        <input
          name="email"
          onChange={handleChange}
          placeholder="name@example.com"
          required
          type="email"
          value={formState.email}
        />
      </label>
      <label>
        Move-in timeline
        <select name="timeline" onChange={handleChange} value={formState.timeline}>
          <option value="">Select one</option>
          <option value="As soon as possible">As soon as possible</option>
          <option value="Within 30 days">Within 30 days</option>
          <option value="Within 2-3 months">Within 2-3 months</option>
          <option value="Just researching">Just researching</option>
        </select>
      </label>
      <label className="full-span">
        What kind of support are you looking for?
        <textarea
          name="message"
          onChange={handleChange}
          placeholder="Tell us a little about your loved one and what matters most."
          rows="5"
          value={formState.message}
        />
      </label>
      <button className="button button-primary" type="submit">
        Request a tour
      </button>
      {feedback ? <p className="form-feedback">{feedback}</p> : null}
    </form>
  );
}

export default function App() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Adult Family Home</p>
          <h1>{homeProfile.name}</h1>
          <p className="hero-lede">{homeProfile.tagline}</p>
          <p className="hero-body">{homeProfile.description}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#contact">
              Schedule a tour
            </a>
            <a className="button button-secondary" href={`tel:${homeProfile.phoneHref}`}>
              Call {homeProfile.phone}
            </a>
          </div>
          <ul className="hero-points">
            {homeProfile.quickFacts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual">
          <article className="hero-card hero-card-main">
            <img alt="Bright adult family home living room" src={homeProfile.heroImage} />
            <div className="hero-card-copy">
              <p>Warm shared spaces</p>
              <strong>Comfort, dignity, and everyday calm</strong>
            </div>
          </article>
          <article className="hero-card hero-card-accent">
            <img alt="Peaceful bedroom" src={homeProfile.secondaryImage} />
            <div className="hero-card-copy">
              <p>Private room options</p>
              <strong>Thoughtful design for daily ease</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="trust-strip">
        <div>
          <p className="trust-value">{homeProfile.city}</p>
          <span>Quiet residential setting</span>
        </div>
        <div>
          <p className="trust-value">{homeProfile.availability}</p>
          <span>Updated manually for accuracy</span>
        </div>
        <div>
          <p className="trust-value">{homeProfile.languages.join(", ")}</p>
          <span>Family communication support</span>
        </div>
      </section>

      <section className="content-section two-column">
        <div>
          <p className="eyebrow">Why families choose us</p>
          <h2>Care that feels personal, clear, and reassuring from the first call.</h2>
          <p className="section-copy">{homeProfile.story}</p>
        </div>
        <div className="feature-grid">
          {careHighlights.map((item) => (
            <article key={item.title} className="feature-card">
              <p className="feature-kicker">{item.kicker}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Home life</p>
            <h2>A welcoming environment built around routine, connection, and comfort.</h2>
          </div>
        </div>
        <div className="lifestyle-grid">
          {livingFeatures.map((item) => (
            <article key={item.title} className="lifestyle-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section gallery-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gallery</p>
            <h2>Use this section for real home photos once they’re ready.</h2>
          </div>
          <p className="section-note">Prototype images are placeholders for layout and mood.</p>
        </div>
        <div className="gallery-grid">
          {galleryImages.map((image) => (
            <figure key={image.title} className="gallery-card">
              <img alt={image.alt} src={image.src} />
              <figcaption>
                <strong>{image.title}</strong>
                <span>{image.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="content-section testimonial-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Family confidence</p>
            <h2>The site should make families feel safe reaching out.</h2>
          </div>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="testimonial-card">
              <p>"{item.quote}"</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="content-section faq-layout">
        <div>
          <p className="eyebrow">Frequently asked</p>
          <h2>Keep answers simple, warm, and easy to scan.</h2>
          <p className="section-copy">
            This is enough for a first launch. We can swap in real answers, photos, and location
            details before the client meeting.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <article key={item.question} className="faq-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section contact-layout" id="contact">
        <div className="contact-copy">
          <p className="eyebrow">Contact</p>
          <h2>Make the next step feel easy.</h2>
          <p className="section-copy">
            For the no-backend version, this form opens the visitor’s email app with the inquiry
            already filled out. We can replace it with a hosted form later if you want.
          </p>
          <div className="contact-details">
            <p>
              <strong>Call:</strong> <a href={`tel:${homeProfile.phoneHref}`}>{homeProfile.phone}</a>
            </p>
            <p>
              <strong>Email:</strong> <a href={`mailto:${homeProfile.email}`}>{homeProfile.email}</a>
            </p>
            <p>
              <strong>Address:</strong> {homeProfile.address}
            </p>
          </div>
        </div>
        <div className="contact-card">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
