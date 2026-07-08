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
  serviceHighlights,
  serviceOfferings,
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
      contactEmail: homeProfile.email,
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
          placeholder="Tell us a little about your loved one, what support they need, and any questions you want to talk through."
          rows="5"
          value={formState.message}
        />
      </label>
      <p className="form-note full-span">
        We only use this information to respond to your inquiry and help you schedule a conversation or visit.
      </p>
      <button className="button button-primary" disabled={submitState.pending} type="submit">
        {submitState.pending ? "Sending..." : "Request a tour"}
      </button>
      {submitState.success ? <p className="form-feedback success-text">{submitState.success}</p> : null}
      {submitState.error ? <p className="form-feedback error-text">{submitState.error}</p> : null}
    </form>
  );
}

function GallerySection({ activeIndex, lightboxIndex, onActiveIndexChange, onLightboxChange }) {
  const activeImage = galleryImages[activeIndex];
  const lightboxImage = lightboxIndex === null ? null : galleryImages[lightboxIndex];

  useEffect(() => {
    if (galleryImages.length <= 1 || lightboxIndex !== null) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      onActiveIndexChange((current) => (current + 1) % galleryImages.length);
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
        onLightboxChange(null);
      }

      if (event.key === "ArrowRight") {
        onLightboxChange((current) => ((current ?? 0) + 1) % galleryImages.length);
      }

      if (event.key === "ArrowLeft") {
        onLightboxChange((current) => ((current ?? 0) - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex]);

  const openLightbox = (index) => {
    onActiveIndexChange(index);
    onLightboxChange(index);
  };

  const goToSlide = (index) => {
    onActiveIndexChange(index);
  };

  const goToNext = () => {
    onActiveIndexChange((current) => (current + 1) % galleryImages.length);
  };

  const goToPrevious = () => {
    onActiveIndexChange((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToNextLightbox = () => {
    onLightboxChange((current) => ((current ?? 0) + 1) % galleryImages.length);
  };

  const goToPreviousLightbox = () => {
    onLightboxChange((current) => ((current ?? 0) - 1 + galleryImages.length) % galleryImages.length);
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
          onClick={() => onLightboxChange(null)}
          role="dialog"
        >
          <div className="lightbox-shell" onClick={(event) => event.stopPropagation()} role="document">
            <button
              aria-label="Close image viewer"
              className="lightbox-close"
              onClick={() => onLightboxChange(null)}
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
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [navPinned, setNavPinned] = useState(false);

  const openPhotoTour = (index = 0) => {
    setActiveGalleryIndex(index);
    setLightboxIndex(index);
  };

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

  useEffect(() => {
    const revealNodes = [...document.querySelectorAll("[data-reveal]")];

    if (!revealNodes.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setNavPinned(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="site-shell">
      <header className={`topbar reveal-up is-visible ${navPinned ? "topbar-pinned" : ""}`} data-reveal>
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
        <a className="topbar-cta" href="#contact">
          Schedule a Tour
        </a>
      </header>

      <section className="hero reveal-up is-visible" data-reveal>
        <div className="hero-copy reveal-up is-visible" data-reveal>
          <p className="eyebrow">Adult Family Home In Shoreline</p>
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
          <article className="hero-card hero-card-main reveal-right is-visible" data-reveal>
            <img alt="Bright adult family home living room" src={homeProfile.heroImage} />
            <div className="hero-card-copy">
              <p>First impression</p>
              <strong>A peaceful residential setting families can picture right away</strong>
            </div>
          </article>
          <button
            className="hero-video-card reveal-up is-visible"
            data-reveal
            onClick={() => openPhotoTour(0)}
            type="button"
          >
            <div className="hero-video-icon">▶</div>
            <div>
              <p className="hero-video-label">See the home</p>
              <strong>Preview the setting before the first call or visit</strong>
            </div>
          </button>
          <article className="hero-card hero-card-accent reveal-up is-visible" data-reveal>
            <img alt="Peaceful bedroom" src={homeProfile.secondaryImage} />
            <div className="hero-card-copy">
              <p>Resident comfort</p>
              <strong>Quiet rooms designed for rest, privacy, and ease</strong>
            </div>
          </article>
          <article className="hero-stat-card reveal-left is-visible" data-reveal>
            <p className="hero-stat-label">Daily support</p>
            <strong>24/7 support</strong>
            <span>Steady routines, clear communication, and care that feels more personal than institutional.</span>
          </article>
        </div>
      </section>

      <section className="care-marquee reveal-up" data-reveal>
        <div className="care-marquee-track">
          {serviceHighlights.concat(serviceHighlights).map((item, index) => (
            <span key={`${item}-${index}`} className="care-marquee-item">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="trust-strip reveal-up" data-reveal>
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

      <section className="content-section two-column reveal-up" data-reveal id="story">
        <div>
          <p className="eyebrow">About {homeProfile.brandName}</p>
          <h2>A smaller care setting where families can feel the difference quickly.</h2>
          <p className="section-copy">{homeProfile.story}</p>
        </div>
        <div className="feature-grid">
          {careHighlights.map((item, index) => (
            <article
              key={item.title}
              className="feature-card reveal-up"
              data-reveal
              style={{ "--reveal-delay": `${index * 90}ms` }}
            >
              <p className="feature-kicker">{item.kicker}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section editorial-panel reveal-up" data-reveal>
        <div className="editorial-copy reveal-left" data-reveal>
          <p className="eyebrow">What Families Notice</p>
          <h2>Families are usually looking for warmth, clarity, and a setting that feels human.</h2>
          <p className="section-copy">
            {homeProfile.brandName} is built around the idea that dependable support and genuine warmth
            should show up in the same place. Families should be able to see that in the environment,
            hear it in the first conversation, and feel it when they visit.
          </p>
        </div>
        <div className="editorial-aside reveal-right" data-reveal>
          <p>
            The goal is simple: residents should feel comfortable, families should feel informed,
            and the home should feel calm rather than rushed.
          </p>
        </div>
      </section>

      <section className="content-section services-layout reveal-up" data-reveal>
        <div className="services-intro reveal-left" data-reveal>
          <p className="eyebrow">Care And Support</p>
          <h2>Clear support details, presented in a way families can understand quickly.</h2>
          <p className="section-copy">
            Families usually want a clear sense of what daily support actually looks like.
            This section gives them that picture without turning the home into a clinical checklist.
          </p>
          <a className="button button-secondary" href="#gallery">
            Explore photo tour
          </a>
        </div>
        <div className="services-grid">
          {serviceOfferings.map((item, index) => (
            <article
              key={item.title}
              className="service-card reveal-up"
              data-reveal
              style={{ "--reveal-delay": `${index * 70}ms` }}
            >
              <span className="service-card-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section reveal-up" data-reveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Everyday Life</p>
            <h2>Daily life is shaped around comfort, routine, and steady connection.</h2>
          </div>
        </div>
        <div className="lifestyle-grid">
          {livingFeatures.map((item, index) => (
            <article
              key={item.title}
              className="lifestyle-card reveal-up"
              data-reveal
              style={{ "--reveal-delay": `${index * 100}ms` }}
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section tour-spotlight reveal-up" data-reveal>
        <div className="tour-spotlight-copy reveal-left" data-reveal>
          <p className="eyebrow">Photo Tour</p>
          <h2>Help families picture the home before they ever step through the door.</h2>
          <p className="section-copy">
            Strong care websites do more than describe services. They help families imagine the environment,
            the atmosphere, and whether their loved one could feel comfortable there.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#gallery">
              View photo gallery
            </a>
            <a className="button button-secondary" href="#contact">
              Ask about a tour
            </a>
          </div>
        </div>
        <button
          className="tour-spotlight-media reveal-right"
          data-reveal
          onClick={() => openPhotoTour(0)}
          type="button"
        >
          <img alt={galleryImages[0]?.alt || homeProfile.name} src={galleryImages[0]?.src || homeProfile.heroImage} />
          <div className="tour-spotlight-chip">
            <span>Photo highlights</span>
            <strong>{galleryImages.length} spaces to explore</strong>
          </div>
        </button>
      </section>

      <section className="content-section atmosphere-split reveal-up" data-reveal>
        <div className="atmosphere-stack reveal-left" data-reveal>
          <article className="atmosphere-card">
            <img alt={galleryImages[1]?.alt || homeProfile.name} src={galleryImages[1]?.src || homeProfile.secondaryImage} />
          </article>
          <article className="atmosphere-note">
            <p className="eyebrow">A closer look</p>
            <h3>Small details often shape whether the home feels reassuring.</h3>
            <p>
              Natural light, clean shared spaces, and a comfortable room setup often matter just
              as much as the written description when families are deciding whether to reach out.
            </p>
          </article>
        </div>
        <div className="atmosphere-copy reveal-right" data-reveal>
          <p className="eyebrow">Why This Matters</p>
          <h2>The environment should feel visible, not just described.</h2>
          <p className="section-copy">
            Families often decide whether to call based on whether they can imagine their loved one
            there. Stronger visual pacing and image-led sections make that decision easier.
          </p>
          <div className="atmosphere-points">
            <div>
              <strong>Calm rooms</strong>
              <span>Spaces that feel settled and lived in</span>
            </div>
            <div>
              <strong>Shared areas</strong>
              <span>Places for conversation, meals, and routine</span>
            </div>
            <div>
              <strong>Residential feel</strong>
              <span>A home that feels personal instead of institutional</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section journey-section reveal-up" data-reveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Getting started</p>
            <h2>We try to make the first step clear, personal, and pressure-free.</h2>
          </div>
        </div>
        <div className="journey-grid">
          {experienceSteps.map((item, index) => (
            <article
              key={item.step}
              className="journey-card reveal-up"
              data-reveal
              style={{ "--reveal-delay": `${index * 110}ms` }}
            >
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <GallerySection
        activeIndex={activeGalleryIndex}
        lightboxIndex={lightboxIndex}
        onActiveIndexChange={setActiveGalleryIndex}
        onLightboxChange={setLightboxIndex}
      />

      <section className="content-section faq-layout reveal-up" data-reveal>
        <div>
          <p className="eyebrow">Frequently asked</p>
          <h2>Questions families often ask before they schedule a visit.</h2>
          <p className="section-copy">
            We want the first conversation to feel clear, comfortable, and helpful.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((item, index) => (
            <article
              key={item.question}
              className="faq-card reveal-up"
              data-reveal
              style={{ "--reveal-delay": `${index * 90}ms` }}
            >
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section contact-layout reveal-up" data-reveal id="contact">
        <div className="contact-copy reveal-left" data-reveal>
          <p className="eyebrow">Contact</p>
          <h2>Talk with us about your loved one, your timeline, and what kind of support they need.</h2>
          <p className="section-copy">
            We’re happy to answer questions, talk through care needs, and help you decide whether a visit to the home would be helpful.
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
        <div className="contact-card reveal-right" data-reveal>
          <ContactForm />
        </div>
      </section>

      <footer className="site-footer">
        <p>
          Developed By <strong>MirtnehM</strong>{" "}
          <a href="mailto:yenemartin@gmail.com">yenemartin@gmail.com</a>
        </p>
      </footer>
    </main>
  );
}
