document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".main-nav");

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const setMenuState = (open) => {
    menu?.classList.toggle("open", open);
    menuButton?.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
  };

  menuButton?.addEventListener("click", () => {
    setMenuState(!menu?.classList.contains("open"));
  });
  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    setMenuState(false);
  }));
  document.addEventListener("click", (event) => {
    if (menu?.classList.contains("open") && header && !header.contains(event.target)) setMenuState(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("open")) {
      setMenuState(false);
      menuButton?.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && menu?.classList.contains("open")) setMenuState(false);
  });

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const revealItems = [...document.querySelectorAll(
    ".section-heading, .service-card, .concern-card, .comparison-card, .instagram-reel, .about-grid > *, .contact-heading, .contact-location, .contact-form, .faq details, .google-rating-card, .testimonial-card, .testimonial-note, .pricing-trigger, .custom-protocols, .empty-state"
  )];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progressBar = document.querySelector("[data-scroll-progress]");
  const backToTop = document.querySelector("[data-back-to-top]");
  const heroMedia = document.querySelector(".hero-media img");
  const homeNavLinks = [...document.querySelectorAll(".main-nav a")];
  const homeSections = window.location.pathname === "/"
    ? [...document.querySelectorAll("main > section[id]")]
    : [];
  const sectionNavMap = {
    tratamentos: "/tratamentos/",
    problemas: "/problemas/",
    localizacao: "#contactos",
    contactos: "#contactos"
  };

  const findNavLink = (target) => homeNavLinks.find((link) => {
    const href = link.getAttribute("href");
    if (target === "/") return new URL(link.href, window.location.href).pathname === "/" && href !== "#contactos";
    return href === target || new URL(link.href, window.location.href).pathname === target;
  });

  const updateActiveSection = () => {
    if (homeSections.length === 0) return;
    const marker = window.scrollY + window.innerHeight * 0.38;
    let activeSection = homeSections[0];
    homeSections.forEach((section) => {
      if (section.offsetTop <= marker) activeSection = section;
    });
    const target = sectionNavMap[activeSection?.id] || "/";
    const activeLink = findNavLink(target);
    homeNavLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle("is-section-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  let scrollEffectsRequested = false;
  const updateScrollEffects = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0
      ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
      : 0;
    progressBar?.style.setProperty("--scroll-progress", String(progress));

    const showBackToTop = window.scrollY > Math.max(520, window.innerHeight * 0.75);
    backToTop?.classList.toggle("is-visible", showBackToTop);
    backToTop?.setAttribute("aria-hidden", String(!showBackToTop));
    if (backToTop) backToTop.tabIndex = showBackToTop ? 0 : -1;

    if (heroMedia && !reduceMotion) {
      const maximumOffset = window.innerWidth <= 680 ? 18 : 32;
      const offset = Math.min(maximumOffset, window.scrollY * 0.045);
      heroMedia.style.setProperty("--hero-parallax", `${offset}px`);
    }

    updateActiveSection();
    scrollEffectsRequested = false;
  };

  const requestScrollEffects = () => {
    if (scrollEffectsRequested) return;
    scrollEffectsRequested = true;
    window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener("scroll", requestScrollEffects, { passive: true });
  window.addEventListener("resize", requestScrollEffects);
  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  updateScrollEffects();

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-enabled");
    const setRevealOrder = () => {
      const groups = new Map();

      revealItems.forEach((item) => {
        const group = item.closest("section") || item.parentElement;
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(item);
      });

      groups.forEach((items) => {
        items
          .map((item) => ({ item, rect: item.getBoundingClientRect() }))
          .sort((first, second) => {
            const verticalDistance = first.rect.top - second.rect.top;
            if (Math.abs(verticalDistance) > 12) return verticalDistance;
            return first.rect.left - second.rect.left;
          })
          .forEach(({ item }, index) => {
            const delay = Math.min(index * 70, 420);
            item.style.setProperty("--reveal-delay", `${delay}ms`);
          });
      });
    };

    setRevealOrder();
    window.addEventListener("load", setRevealOrder, { once: true });
    window.addEventListener("resize", setRevealOrder);

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px" });

    revealItems.forEach((item) => {
      item.classList.add("reveal-on-scroll");
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const imageLightbox = document.querySelector("[data-image-lightbox]");
  const lightboxImage = imageLightbox?.querySelector("[data-image-lightbox-image]");
  const lightboxCloseButton = imageLightbox?.querySelector(
    ".image-lightbox__close",
  );
  let lightboxTrigger = null;

  const closeImageLightbox = () => {
    if (!imageLightbox || imageLightbox.hidden) return;
    imageLightbox.hidden = true;
    document.body.classList.remove("image-lightbox-open");
    lightboxImage?.removeAttribute("src");
    lightboxImage?.setAttribute("alt", "");
    lightboxTrigger?.focus();
    lightboxTrigger = null;
  };

  document.querySelectorAll("[data-lightbox-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!imageLightbox || !lightboxImage || !trigger.dataset.lightboxSrc) return;
      lightboxTrigger = trigger;
      lightboxImage.src = trigger.dataset.lightboxSrc;
      lightboxImage.alt = trigger.dataset.lightboxAlt || "Imagem ampliada";
      imageLightbox.hidden = false;
      document.body.classList.add("image-lightbox-open");
      lightboxCloseButton?.focus();
    });
  });

  imageLightbox
    ?.querySelectorAll("[data-image-lightbox-close]")
    .forEach((control) => control.addEventListener("click", closeImageLightbox));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeImageLightbox();
  });

  const pricingDialog = document.querySelector("[data-pricing-dialog]");
  const pricingCloseButton = pricingDialog?.querySelector("[data-pricing-close]");
  let pricingTrigger = null;

  const closePricingDialog = () => {
    if (!pricingDialog?.open) return;
    pricingDialog.close();
  };

  document.querySelectorAll("[data-pricing-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!pricingDialog || typeof pricingDialog.showModal !== "function") return;
      pricingTrigger = trigger;
      pricingDialog.showModal();
      document.body.classList.add("pricing-dialog-open");
      pricingCloseButton?.focus();
    });
  });

  pricingCloseButton?.addEventListener("click", closePricingDialog);
  pricingDialog?.addEventListener("click", (event) => {
    if (event.target === pricingDialog) closePricingDialog();
  });
  pricingDialog?.addEventListener("close", () => {
    document.body.classList.remove("pricing-dialog-open");
    pricingTrigger?.focus();
    pricingTrigger = null;
  });

  const updateInstagramFrameHeights = () => {
    document
      .querySelectorAll("[data-instagram-reel].is-loaded")
      .forEach((reel) => {
        const reelWidth = reel.getBoundingClientRect().width;
        const reelHeight = reelWidth * (16 / 9);
        const visibleInstagramContent = reelWidth * 1.19 + 110;
        const controlsCover = Math.max(
          0,
          Math.ceil(reelHeight - visibleInstagramContent),
        );
        reel.style.removeProperty("height");
        reel.style.setProperty(
          "--instagram-controls-cover",
          `${controlsCover}px`,
        );
      });
  };

  document.querySelectorAll("[data-instagram-reel]").forEach((reel) => {
    const loadButton = reel.querySelector("[data-instagram-load]");
    loadButton?.addEventListener("click", () => {
      const embedUrl = reel.dataset.instagramEmbed;
      if (!embedUrl) return;

      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.title =
        reel.dataset.instagramTitle ||
        "Vídeo publicado no Instagram da Ryca Beauty";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.setAttribute("scrolling", "no");
      reel.replaceChildren(iframe);
      reel.classList.add("is-loaded");
      updateInstagramFrameHeights();
    });
  });

  window.addEventListener("resize", updateInstagramFrameHeights);

  document.querySelectorAll("[data-before-after]").forEach((comparison) => {
    const range = comparison.querySelector("[data-before-after-range]");
    const updateComparison = () => {
      const position = `${range.value}%`;
      comparison.setAttribute("data-position", position);
      comparison.style.setProperty("--comparison-position", position);
    };
    range?.addEventListener("input", updateComparison);
    if (range) updateComparison();
  });

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const statusMessage = status?.querySelector("[data-form-status-message]");
  const statusClose = status?.querySelector(".form-toast-close");
  const submitButton = form?.querySelector('button[type="submit"]');
  let statusTimer;
  const hideStatus = () => {
    if (!status) return;
    window.clearTimeout(statusTimer);
    status.hidden = true;
    status.classList.remove("form-toast--success", "form-toast--error");
  };
  const showStatus = (message, type = "error") => {
    if (!status || !statusMessage) return;
    window.clearTimeout(statusTimer);
    statusMessage.textContent = message;
    status.classList.remove("form-toast--success", "form-toast--error");
    status.classList.add(`form-toast--${type}`);
    status.hidden = false;
    statusTimer = window.setTimeout(hideStatus, type === "success" ? 7000 : 9000);
  };
  statusClose?.addEventListener("click", hideStatus);
  const updateSubmitLabel = () => {
    if (!form || !submitButton) return;
    const method = form.querySelector('input[name="contact_method"]:checked')?.value;
    submitButton.textContent = method === "Email" ? "Enviar mensagem" : "Continuar no WhatsApp";
  };
  form?.querySelectorAll('input[name="contact_method"]').forEach((radio) => {
    radio.addEventListener("change", updateSubmitLabel);
  });
  updateSubmitLabel();

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideStatus();
    if (!form.checkValidity()) {
      form.reportValidity();
      showStatus("Verifique os campos obrigatórios antes de continuar.");
      return;
    }

    const data = new FormData(form);
    const method = String(data.get("contact_method"));
    const name = String(data.get("name")).trim();
    const phone = String(data.get("phone")).trim();
    const email = String(data.get("email")).trim();
    const subject = String(data.get("subject")).trim();
    const message = String(data.get("message")).trim();
    const body = [
      "Olá, gostaria de pedir informações ou marcar uma avaliação na Ryca Beauty.",
      "",
      `Nome: ${name}`,
      `Tratamento ou preocupação: ${subject}`,
      `Forma de contacto: ${method}`,
      `WhatsApp ou telefone: ${phone}`,
      `Email: ${email}`,
      `Mensagem: ${message}`
    ].join("\n");

    if (method === "WhatsApp") {
      window.open(`https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
    } else {
      submitButton.disabled = true;
      submitButton.textContent = "A enviar…";
      try {
        const response = await fetch(form.dataset.emailEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            Nome: name,
            email,
            Telefone: phone,
            "Forma de contacto": method,
            "Tratamento ou preocupação": subject,
            Mensagem: message,
            _replyto: email,
            _subject: `Pedido de informação — ${subject}`,
            _template: "table",
            _honey: String(data.get("_honey") || "")
          })
        });
        const result = await response.json();
        if (!response.ok || result.success === false) throw new Error("Não foi possível concluir o envio.");
        form.reset();
        showStatus("Mensagem enviada com sucesso. Entraremos em contacto consigo.", "success");
      } catch {
        showStatus("Não foi possível enviar a mensagem. Tente novamente ou contacte-nos por WhatsApp.");
      } finally {
        submitButton.disabled = false;
        updateSubmitLabel();
      }
    }
  });
});
