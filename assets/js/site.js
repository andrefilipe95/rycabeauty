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

  const revealItems = document.querySelectorAll(
    ".section-heading, .service-card, .concern-card, .comparison-card, .gallery-item, .about-grid > *, .location-grid > *, .contact-grid > *, .faq details, .testimonial-card, .empty-state"
  );
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-enabled");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px" });

    revealItems.forEach((item, index) => {
      item.classList.add("reveal-on-scroll", `reveal-delay-${index % 4}`);
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

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

  const lightbox = document.querySelector("[data-gallery-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-gallery-lightbox-image]");
  const lightboxPrevious = lightbox?.querySelector("[data-gallery-previous]");
  const lightboxNext = lightbox?.querySelector("[data-gallery-next]");
  const lightboxStage = lightbox?.querySelector(".gallery-lightbox-stage");
  const galleryItems = [...document.querySelectorAll("[data-gallery-image]")];
  let galleryTrigger = null;
  let currentGalleryIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const showGalleryImage = (index) => {
    if (!lightboxImage || galleryItems.length === 0) return;
    currentGalleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentGalleryIndex];
    lightboxImage.src = item.dataset.galleryImage;
    lightboxImage.alt = item.dataset.galleryAlt || "Imagem da galeria Ryca Beauty";
  };

  const moveGallery = (direction) => {
    showGalleryImage(currentGalleryIndex + direction);
  };

  const closeGallery = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    lightboxImage.alt = "";
    document.body.classList.remove("modal-open");
    galleryTrigger?.focus();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      if (!lightbox || !lightboxImage) return;
      galleryTrigger = item;
      showGalleryImage(index);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      lightbox.querySelector(".gallery-lightbox-dialog")?.focus();
    });
  });

  if (galleryItems.length < 2) {
    if (lightboxPrevious) lightboxPrevious.hidden = true;
    if (lightboxNext) lightboxNext.hidden = true;
  }
  lightboxPrevious?.addEventListener("click", () => moveGallery(-1));
  lightboxNext?.addEventListener("click", () => moveGallery(1));

  lightboxStage?.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  lightboxStage?.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const movementX = touch.clientX - touchStartX;
    const movementY = touch.clientY - touchStartY;
    if (Math.abs(movementX) < 45 || Math.abs(movementX) <= Math.abs(movementY)) return;
    moveGallery(movementX < 0 ? 1 : -1);
  }, { passive: true });
  lightboxStage?.addEventListener("click", (event) => {
    if (event.target === lightboxStage) closeGallery();
  });

  lightbox?.querySelectorAll("[data-gallery-close]").forEach((button) => {
    button.addEventListener("click", closeGallery);
  });
  document.addEventListener("keydown", (event) => {
    if (!lightbox?.classList.contains("open")) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") moveGallery(-1);
    if (event.key === "ArrowRight") moveGallery(1);
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
