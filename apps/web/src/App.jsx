import { useEffect, useState } from "react";
import { getSelectedHome } from "./homes";

const selectedHome = getSelectedHome();
const {
  careHighlights,
  contactForm,
  defaultTheme,
  experienceSteps,
  faqs,
  galleryImages,
  homeProfile,
  livingFeatures
} = selectedHome;

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

async function extractThemeFromImageUrl(imageUrl) {
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

  return dominant ? buildThemeFromAccent(dominant) : defaultTheme;
}

function ContactForm() {
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    email: "",
    timeline: "",
    message: ""
  });
  const [submitState, setSubmitState] = useState({
    pending: false,
    success: "",
    error: ""
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const endpoint = contactForm.endpoint?.trim();

    if (!endpoint || endpoint.includes("your-form-id")) {
      setSubmitState({
        pending: false,
        success: "",
        error:
          "The inquiry form is not fully configured yet. Please add a hosted form endpoint for this home."
      });
      return;
    }

    setSubmitState({
      pending: true,
      success: "",
      error: ""
    });

    const payload = {
      homeKey: selectedHome.key,
      homeName: homeProfile.name,
      homeSubdomain: selectedHome.subdomain,
      inquiryType: "tour_request",
      name: formState.name,
      phone: formState.phone,
      email: formState.email,
      moveInTimeline: formState.timeline,
      message: formState.message
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Request failed.");
      }

      setFormState({
        name: "",
        phone: "",
        email: "",
        timeline: "",
        message: ""
      });
      setSubmitState({
        pending: false,
        success: contactForm.successMessage,
        error: ""
      });
    } catch {
      setSubmitState({
        pending: false,
        success: "",
        error: contactForm.failureMessage
      });
    }
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
      <button className="button button-primary" disabled={submitState.pending} type="submit">
        {submitState.pending ? "Sending..." : "Request a tour"}
      </button>
      {submitState.success ? <p className="form-feedback success-text">{submitState.success}</p> : null}
      {submitState.error ? <p className="form-feedback error-text">{submitState.error}</p> : null}
    </form>
  );
}

function GallerySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const activeImage = galleryImages[activeIndex];
  const lightboxImage = lightboxIndex === null ? null : galleryImages[lightboxIndex];

  useEffect(() => {
    if (galleryImages.length <= 1 || lightboxIndex !== null) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % galleryImages.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((current) => ((current ?? 0) + 1) % galleryImages.length);
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => ((current ?? 0) - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex]);

  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxIndex(index);
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % galleryImages.length);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToNextLightbox = () => {
    setLightboxIndex((current) => ((current ?? 0) + 1) % galleryImages.length);
  };

  const goToPreviousLightbox = () => {
    setLightboxIndex((current) => ((current ?? 0) - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <>
      <section className="content-section gallery-section" id="gallery">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gallery</p>
            <h2>Take a look at the rooms and shared spaces that shape daily life.</h2>
          </div>
          <p className="section-note">Families often want to understand the feel of the home before they visit.</p>
        </div>

        <div className="gallery-experience">
          <button
            aria-label="Open gallery image"
            className="gallery-stage"
            onClick={() => openLightbox(activeIndex)}
            type="button"
          >
            <img alt={activeImage.alt} src={activeImage.src} />
            <div className="gallery-stage-overlay">
              <div>
                <p>{activeImage.title}</p>
                <strong>{activeImage.caption}</strong>
              </div>
              <span>Open fullscreen</span>
            </div>
          </button>

          <div className="gallery-sidebar">
            <div className="gallery-sidebar-top">
              <p className="gallery-sidebar-label">Photo tour</p>
              <div className="gallery-controls">
                <button aria-label="Previous image" className="gallery-arrow" onClick={goToPrevious} type="button">
                  ‹
                </button>
                <button aria-label="Next image" className="gallery-arrow" onClick={goToNext} type="button">
                  ›
                </button>
              </div>
            </div>

            <div className="gallery-thumbs" role="tablist" aria-label="Gallery image list">
              {galleryImages.map((image, index) => (
                <button
                  key={image.title}
                  aria-selected={index === activeIndex}
                  className={`gallery-thumb ${index === activeIndex ? "gallery-thumb-active" : ""}`}
                  onClick={() => goToSlide(index)}
                  type="button"
                >
                  <img alt={image.alt} src={image.src} />
                  <div className="gallery-thumb-copy">
                    <strong>{image.title}</strong>
                    {image.caption ? <span>{image.caption}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {lightboxImage ? (
        <div
          aria-label="Image viewer"
          className="lightbox-backdrop"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
        >
          <div className="lightbox-shell" onClick={(event) => event.stopPropagation()} role="document">
            <button
              aria-label="Close image viewer"
              className="lightbox-close"
              onClick={() => setLightboxIndex(null)}
              type="button"
            >
              ×
            </button>
            <button
              aria-label="Previous image"
              className="lightbox-nav lightbox-nav-left"
              onClick={goToPreviousLightbox}
              type="button"
            >
              ‹
            </button>
            <figure className="lightbox-figure">
              <img alt={lightboxImage.alt} src={lightboxImage.src} />
              <figcaption>
                <strong>{lightboxImage.title}</strong>
                {lightboxImage.caption ? <p>{lightboxImage.caption}</p> : null}
              </figcaption>
            </figure>
            <button
              aria-label="Next image"
              className="lightbox-nav lightbox-nav-right"
              onClick={goToNextLightbox}
              type="button"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function App() {
  useEffect(() => {
    document.title = homeProfile.seoTitle;

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", homeProfile.seoDescription);
    }

    if (homeProfile.brandPrimaryColor) {
      applyTheme(buildThemeFromAccent(homeProfile.brandPrimaryColor));
    } else if (homeProfile.logo) {
      extractThemeFromImageUrl(homeProfile.logo)
        .then((theme) => applyTheme(theme))
        .catch(() => applyTheme(defaultTheme));
    } else {
      applyTheme(defaultTheme);
    }
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
              <p>Shared spaces</p>
              <strong>Comfort, dignity, and a calm daily rhythm</strong>
            </div>
          </article>
          <article className="hero-card hero-card-accent">
            <img alt="Peaceful bedroom" src={homeProfile.secondaryImage} />
            <div className="hero-card-copy">
              <p>Private room options</p>
              <strong>Quiet rooms designed for rest and ease</strong>
            </div>
          </article>
          <article className="hero-stat-card">
            <p className="hero-stat-label">Care approach</p>
            <strong>24/7 support</strong>
            <span>Steady routines, clear communication, and a home that feels personal.</span>
          </article>
        </div>
      </section>

      <section className="trust-strip">
        <div>
          <p className="trust-value">{homeProfile.city}</p>
          <span>Residential neighborhood setting</span>
        </div>
        <div>
          <p className="trust-value">{homeProfile.availability}</p>
          <span>Visits available by appointment</span>
        </div>
        <div>
          <p className="trust-value">{homeProfile.languages.join(", ")}</p>
          <span>Language support for family communication</span>
        </div>
      </section>

      <section className="content-section two-column" id="story">
        <div>
          <p className="eyebrow">About {homeProfile.brandName}</p>
          <h2>A smaller home setting with a more personal pace of care.</h2>
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
          <h2>We believe care should feel respectful, steady, and home-like.</h2>
          <p className="section-copy">
            {homeProfile.brandName} is built around the idea that a home can offer both dependable support
            and a genuine sense of warmth. Families should be able to see that in the environment,
            hear it in the conversation, and feel it during a visit.
          </p>
        </div>
        <div className="editorial-aside">
          <p>
            We want residents to feel comfortable, families to feel informed, and daily life to
            feel calm rather than rushed.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Home life</p>
            <h2>Daily life is shaped around comfort, routine, and connection.</h2>
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
            <p className="eyebrow">Getting started</p>
            <h2>We try to make the process clear, personal, and pressure-free.</h2>
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

      <GallerySection />

      <section className="content-section faq-layout">
        <div>
          <p className="eyebrow">Frequently asked</p>
          <h2>Questions families often ask early in the process.</h2>
          <p className="section-copy">
            We want the first conversation to feel clear, comfortable, and helpful.
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
          <h2>Talk with us about your loved one and what kind of support they need.</h2>
          <p className="section-copy">
            We’re happy to answer questions, talk through timing and care needs, and arrange a visit to the home.
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
