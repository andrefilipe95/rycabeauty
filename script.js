/* ============================================================
   RYCA BEAUTY — SCRIPT.JS
   Funcionalidades:
   1. Navbar sólida ao dar scroll
   2. Menu mobile (burger)
   3. Accordion de tratamentos
   4. Slider interativo Antes & Depois
   5. Animações fade-in/slide-up ao scroll (Intersection Observer)
   6. Formulário de contacto -> envio via WhatsApp
   7. Ano automático no footer
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Navbar sólida ao scroll ---------- */
  const navbar = document.getElementById('navbar');
  const toggleNavbarBg = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  toggleNavbarBg();
  window.addEventListener('scroll', toggleNavbarBg);

  /* ---------- 2. Menu mobile (burger) ---------- */
  const burgerBtn = document.getElementById('burgerBtn');
  const navMenu = document.getElementById('navMenu');

  burgerBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    burgerBtn.classList.toggle('active', isOpen);
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });

  // Fecha o menu ao clicar num link (mobile)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      burgerBtn.classList.remove('active');
      burgerBtn.setAttribute('aria-expanded', false);
    });
  });

  /* ---------- 3. Accordion de tratamentos ---------- */
  document.querySelectorAll('.tratamento-item__head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.tratamento-item');
      const isActive = item.classList.contains('active');

      // Fecha todos os outros itens (comportamento tipo accordion)
      document.querySelectorAll('.tratamento-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.tratamento-item__head').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- 4. Slider interativo Antes & Depois ---------- */
  const baRange = document.getElementById('baRange');
  const baBeforeClip = document.getElementById('baBeforeClip');
  const baHandle = document.getElementById('baHandle');

  if (baRange && baBeforeClip && baHandle) {
    const updateSlider = (value) => {
      baBeforeClip.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
      baHandle.style.left = `${value}%`;
    };

    updateSlider(baRange.value);

    baRange.addEventListener('input', (e) => {
      updateSlider(e.target.value);
    });
  }

  /* ---------- 5. Animações ao scroll (Intersection Observer) ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealEls.forEach(el => observer.observe(el));

  /* ---------- 6. Formulário de contacto -> WhatsApp ---------- */
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  const WHATSAPP_NUMBER = '351936982198';

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = document.getElementById('nome').value.trim();
      const contacto = document.getElementById('contacto').value.trim();
      const tratamento = document.getElementById('tratamento').value;
      const mensagem = document.getElementById('mensagem').value.trim();

      if (!nome || !contacto || !tratamento) {
        formNote.textContent = 'Por favor, preenche os campos obrigatórios.';
        formNote.style.color = '#B04747';
        return;
      }

      // Monta a mensagem para o WhatsApp
      let texto = `Olá! Gostaria de agendar uma avaliação.%0A%0A`;
      texto += `*Nome:* ${nome}%0A`;
      texto += `*Contacto:* ${contacto}%0A`;
      texto += `*Tratamento:* ${tratamento}%0A`;
      if (mensagem) texto += `*Mensagem:* ${mensagem}`;

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Olá! Gostaria de agendar uma avaliação.\n\nNome: ${nome}\nContacto: ${contacto}\nTratamento: ${tratamento}${mensagem ? `\nMensagem: ${mensagem}` : ''}`
      )}`;

      formNote.textContent = 'A abrir o WhatsApp...';
      formNote.style.color = '#B08D57';

      window.open(url, '_blank');
      contactForm.reset();
    });
  }

  /* ---------- 7. Ano automático no footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
