import Splide from '@splidejs/splide';
import '@splidejs/splide/css/core';

const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-menu]');
const menuOpen = document.querySelector('[data-menu-open]');
const menuClose = document.querySelector('[data-menu-close]');
const menuBackdrop = document.querySelector('[data-menu-backdrop]');
let lastFocusedElement = null;

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])';

function setMenu(open) {
  if (!menu || !menuOpen || !menuBackdrop) return;
  menu.classList.toggle('is-open', open);
  menuBackdrop.hidden = !open;
  requestAnimationFrame(() => menuBackdrop.classList.toggle('is-open', open));
  menu.setAttribute('aria-hidden', String(!open));
  menuOpen.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);

  if (open) {
    lastFocusedElement = document.activeElement;
    window.setTimeout(() => menuClose?.focus(), 60);
  } else if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

menuOpen?.addEventListener('click', () => setMenu(true));
menuClose?.addEventListener('click', () => setMenu(false));
menuBackdrop?.addEventListener('click', () => setMenu(false));
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false);
  if (event.key !== 'Tab' || !menu?.classList.contains('is-open')) return;
  const focusable = [...menu.querySelectorAll(focusableSelector)];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});

const themeSections = document.querySelectorAll('[data-header-theme]');
const headerObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible && header) header.classList.toggle('is-light', visible.target.dataset.headerTheme === 'light');
}, { rootMargin: '-5% 0px -90% 0px', threshold: [0, .01] });
themeSections.forEach((section) => headerObserver.observe(section));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const projects = [...carousel.querySelectorAll('[data-project]')];
  const controls = carousel.closest('.work-carousel');
  const previous = controls.querySelector('[data-carousel-prev]');
  const next = controls.querySelector('[data-carousel-next]');
  const count = controls.querySelector('[data-carousel-count]');
  const status = carousel.querySelector('[data-carousel-status]');
  const splide = new Splide(carousel, {
    type: 'loop',
    autoWidth: true,
    gap: '18px',
    arrows: false,
    pagination: false,
    drag: true,
    speed: 720,
    easing: 'cubic-bezier(.22, 1, .36, 1)',
    keyboard: 'focused',
    breakpoints: {
      720: { gap: '12px' }
    }
  });

  const updateStatus = (index) => {
    const position = String(index + 1).padStart(2, '0');
    const total = String(projects.length).padStart(2, '0');
    const title = projects[index].querySelector('h3')?.textContent || '';
    count.textContent = `${position} / ${total}`;
    status.textContent = `Project ${index + 1} of ${projects.length}: ${title}`;
  };

  splide.on('mounted moved', () => updateStatus(splide.index));
  previous.addEventListener('click', () => splide.go('<'));
  next.addEventListener('click', () => splide.go('>'));
  splide.mount();
}

const form = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const submitButton = form?.querySelector('[type="submit"]');
const submitLabel = submitButton?.querySelector('[data-submit-label]');
let buttonResetTimer;

if (form && formStatus && submitButton && submitLabel) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const required = [...form.querySelectorAll('[required]')];
    const invalid = required.filter((field) => !field.checkValidity());
    required.forEach((field) => field.setAttribute('aria-invalid', String(!field.checkValidity())));

    if (invalid.length) {
      formStatus.textContent = 'Complete the highlighted fields before continuing.';
      invalid[0].focus();
      return;
    }

    clearTimeout(buttonResetTimer);
    submitButton.disabled = true;
    submitLabel.textContent = 'Sending...';
    form.setAttribute('aria-busy', 'true');
    formStatus.textContent = 'Sending your message...';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Formspree rejected the submission.');

      form.reset();
      required.forEach((field) => field.setAttribute('aria-invalid', 'false'));
      submitLabel.textContent = 'Message sent';
      formStatus.textContent = "Message sent successfully. We'll get back to you soon.";
      buttonResetTimer = setTimeout(() => {
        submitLabel.textContent = 'Send message';
      }, 2000);
    } catch {
      submitLabel.textContent = 'Send message';
      formStatus.textContent = 'Something went wrong. Please try again.';
    } finally {
      submitButton.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}
