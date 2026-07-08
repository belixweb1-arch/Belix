/* =========================================================
   BELIX — main.js
   Sections: Sticky header, Mobile menu, Smooth scroll,
   Scroll reveal animations, FAQ accordion, Contact form
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header shadow on scroll ---------- */
  const header = document.getElementById('site-header');
  const toggleHeaderShadow = () => {
    if (window.scrollY > 12) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  toggleHeaderShadow();
  window.addEventListener('scroll', toggleHeaderShadow, { passive: true });

  /* ---------- Mobile hamburger menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');

  const closeMenu = () => {
    hamburger.classList.remove('open');
    mainNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu after a nav link is clicked
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  /* ---------- Smooth scroll for in-page links ----------
     (CSS scroll-behavior handles most of this already;
     this JS fallback also covers browsers without CSS smooth-scroll support) */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------- Scroll reveal animations (Intersection Observer) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all other open items for a classic single-open accordion
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- Contact form: validation + Formspree submission ---------- */
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusEl = document.getElementById('form-status');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setError = (fieldId, message) => {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const group = document.getElementById(fieldId)?.closest('.form-group');
    if (errorEl) errorEl.textContent = message;
    if (group) group.classList.toggle('invalid', Boolean(message));
  };

  const validateForm = () => {
    let isValid = true;

    const fullName = document.getElementById('fullName');
    if (!fullName.value.trim()) {
      setError('fullName', 'Please enter your full name.');
      isValid = false;
    } else {
      setError('fullName', '');
    }

    const email = document.getElementById('email');
    if (!email.value.trim()) {
      setError('email', 'Please enter your email address.');
      isValid = false;
    } else if (!emailRegex.test(email.value.trim())) {
      setError('email', 'Please enter a valid email address.');
      isValid = false;
    } else {
      setError('email', '');
    }

    const consent = document.getElementById('consent');
    if (!consent.checked) {
      setError('consent', 'Please confirm you agree to be contacted.');
      isValid = false;
    } else {
      setError('consent', '');
    }

    return isValid;
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        statusEl.textContent = 'Please fix the errors above and try again.';
        statusEl.className = 'form-status error';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      try {
        // Sends to Formspree (see the HTML comment above the <form> for setup steps).
        // Replace the form's action="" URL with your real Formspree endpoint before going live.
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          statusEl.textContent = "Thank you! We'll get back to you within 24 hours.";
          statusEl.className = 'form-status success';
          form.reset();
        } else {
          statusEl.textContent = 'Something went wrong. Please try again or email us directly at belixweb1@gmail.com.';
          statusEl.className = 'form-status error';
        }
      } catch (err) {
        statusEl.textContent = 'Network error. Please check your connection and try again.';
        statusEl.className = 'form-status error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send request';
      }
    });
  }

});
