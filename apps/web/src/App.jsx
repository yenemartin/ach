import { useEffect, useState } from "react";
import {
  careHighlights,
  defaultTheme,
  experienceSteps,
  faqs,
  galleryImages,
  homeProfile,
  livingFeatures,
  testimonials
} from "./mockData";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  const asHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${asHex(r)}${asHex(g)}${asHex(b)}`;
}

function adjustColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

function toRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const convert = (value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
}

function isNearWhite(hex) {
  const { r, g, b } = hexToRgb(hex);
  return r > 230 && g > 230 && b > 230;
}

function isNearBlack(hex) {
  const { r, g, b } = hexToRgb(hex);
  return r < 35 && g < 35 && b < 35;
}

function buildThemeFromAccent(accentHex) {
  const deep = adjustColor(accentHex, -34);
  const olive = rgbToHex(
    Math.round((hexToRgb(accentHex).r + 70) / 2),
    Math.round((hexToRgb(accentHex).g + 103) / 2),
    Math.round((hexToRgb(accentHex).b + 75) / 2)
  );
  const sand = adjustColor(accentHex, 72);

  return {
    bg: adjustColor(accentHex, 195),
    bgDeep: adjustColor(accentHex, 145),
    surface: toRgba(adjustColor(accentHex, 220), 0.86),
    surfaceStrong: adjustColor(accentHex, 232),
    text: luminance(accentHex) > 0.42 ? "#1f1b16" : "#211b17",
    muted: luminance(accentHex) > 0.42 ? "#5f584f" : "#655d55",
    line: toRgba(deep, 0.12),
    accent: accentHex,
    accentStrong: deep,
    olive,
    sand
  };
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--bg-deep", theme.bgDeep);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-strong", theme.surfaceStrong);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--line", theme.line);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-strong", theme.accentStrong);
  root.style.setProperty("--olive", theme.olive);
  root.style.setProperty("--sand", theme.sand);
}

async function extractThemeFromLogo(file) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Unable to read logo image."));
      nextImage.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Canvas is not available in this browser.");
    }

    const maxSize = 80;
    const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const swatches = new Map();

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];

      if (alpha < 180) {
        continue;
      }

      const r = Math.round(data[index] / 24) * 24;
      const g = Math.round(data[index + 1] / 24) * 24;
      const b = Math.round(data[index + 2] / 24) * 24;
      const hex = rgbToHex(r, g, b);

      if (isNearWhite(hex) || isNearBlack(hex)) {
        continue;
      }

      const scoreBoost = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      swatches.set(hex, (swatches.get(hex) || 0) + 1 + scoreBoost / 200);
    }

    const dominant = [...swatches.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([hex]) => hex)[0];

    if (!dominant) {
      return {
        logoUrl: imageUrl,
        theme: defaultTheme
      };
    }

    return {
      logoUrl: imageUrl,
      theme: buildThemeFromAccent(dominant)
    };
  } finally {
    if (!imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
  }
}

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

function BrandStudio() {
  const [logoUrl, setLogoUrl] = useState(homeProfile.logo || "");
  const [themeNote, setThemeNote] = useState(
    "Upload a logo and the page will pull a color theme from it."
  );

  const handleLogoChange = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    try {
      const result = await extractThemeFromLogo(file);
      setLogoUrl((current) => {
        if (current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }

        return result.logoUrl;
      });
      applyTheme(result.theme);
      setThemeNote(`Theme updated from ${file.name}.`);
    } catch (error) {
      setThemeNote(error instanceof Error ? error.message : "Could not detect colors from logo.");
    }
  };

  const handleReset = () => {
    if (logoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoUrl);
    }

    setLogoUrl(homeProfile.logo || "");
    applyTheme(defaultTheme);
    setThemeNote("Theme reset to the default palette.");
  };

  return (
    <section className="content-section brand-studio">
      <div>
        <p className="eyebrow">Brand studio</p>
        <h2>Make the page inherit its look from the home’s logo.</h2>
        <p className="section-copy">
          This lets us quickly tune the site for each client without manually rewriting all the
          colors. Use it with the final logo before the meeting.
        </p>
      </div>
      <div className="brand-controls">
        <div className="logo-badge">
          {logoUrl ? (
            <img alt={`${homeProfile.brandName} logo preview`} src={logoUrl} />
          ) : (
            <span>{homeProfile.brandInitials}</span>
          )}
        </div>
        <label className="upload-button">
          <input accept="image/*" onChange={handleLogoChange} type="file" />
          Upload logo
        </label>
        <button className="button button-secondary" onClick={handleReset} type="button">
          Reset colors
        </button>
        <p className="brand-note">{themeNote}</p>
      </div>
    </section>
  );
}

export default function App() {
  useEffect(() => {
    document.title = homeProfile.seoTitle;

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", homeProfile.seoDescription);
    }

    applyTheme(defaultTheme);
  }, []);

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="brand-lockup">
          {homeProfile.logo ? (
            <img className="brand-logo" alt={`${homeProfile.brandName} logo`} src={homeProfile.logo} />
          ) : (
            <div className="brand-monogram">{homeProfile.brandInitials}</div>
          )}
          <div>
            <strong>{homeProfile.brandName}</strong>
            <p>{homeProfile.neighborhoodNote}</p>
          </div>
        </div>
        <nav className="topnav" aria-label="Primary">
          <a href="#story">About</a>
          <a href="#gallery">Photos</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

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
          <div className="signature-note">
            <span className="signature-line" />
            <p>{homeProfile.signatureNote}</p>
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
          <article className="hero-stat-card">
            <p className="hero-stat-label">Family-first focus</p>
            <strong>24/7 support</strong>
            <span>Clear communication, calm routines, and a home that feels personal.</span>
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

      <BrandStudio />

      <section className="content-section two-column" id="story">
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

      <section className="content-section editorial-panel">
        <div className="editorial-copy">
          <p className="eyebrow">Our approach</p>
          <h2>Warmth, safety, and dignity should be visible before a family ever calls.</h2>
          <p className="section-copy">
            The strongest adult family home websites do more than list features. They reduce
            anxiety. They help a visitor imagine their loved one in a clean, calm, and respectful
            setting, and they make the next step feel easy.
          </p>
        </div>
        <div className="editorial-aside">
          <p>
            Small details matter here: the tone of the copy, the softness of the colors, the
            amount of breathing room, and the way contact actions stay visible without feeling
            aggressive.
          </p>
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

      <section className="content-section journey-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">What families experience</p>
            <h2>A calmer, more guided path from first visit to real conversation.</h2>
          </div>
        </div>
        <div className="journey-grid">
          {experienceSteps.map((item) => (
            <article key={item.step} className="journey-card">
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section gallery-section" id="gallery">
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
        <div className="pull-quote">
          <p>
            “The best version of this site should feel less like a facility search result and more
            like being welcomed into a well-kept home.”
          </p>
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
