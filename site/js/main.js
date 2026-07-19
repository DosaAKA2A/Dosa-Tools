// IRIS — JS de la web
// FASE 4 · capa 1: ScrollSmoother (scroll suave). Las siguientes capas
// (reveals SplitText, media/parallax, hover, contadores) se añaden encima.

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText)

/* ---- Scroll suave (respeta prefers-reduced-motion) ---- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let smoother = null
if (!prefersReduced && document.getElementById('smooth-wrapper')) {
  document.documentElement.classList.add('smooth-on')
  smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2,          // segundos de "recuperación" del scroll (feel Mugen)
    effects: true,        // habilita data-speed / data-lag para las capas siguientes
    normalizeScroll: true // unifica el scroll en móvil/trackpad
  })
}

/* ---- FASE 4 · capa 2: reveals de texto (SplitText) ----
   Titulares que "suben" por líneas al entrar en pantalla; kickers y hero
   con fade/slide. Si prefers-reduced-motion, no se toca nada (todo visible).
   Esperamos a document.fonts.ready para que el corte por líneas sea exacto. */
if (!prefersReduced) {
  document.fonts.ready.then(() => {
    // Titulares de sección: revelado por líneas con máscara
    gsap.utils.toArray('.section__title').forEach((title) => {
      const split = SplitText.create(title, { type: 'lines', mask: 'lines' })
      gsap.from(split.lines, {
        yPercent: 120,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: title, start: 'top 85%', once: true },
      })
    })

    // Kickers / etiquetas de sección: fade + slide corto
    gsap.utils.toArray('.section__label').forEach((el) => {
      gsap.from(el, {
        y: 18,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      })
    })

    // Hero (above the fold): timeline de entrada al cargar, sin scroll
    const eyebrow = document.querySelector('.hero__eyebrow')
    const wordmark = document.querySelector('.hero__wordmark')
    const tagline = document.querySelector('.hero__tagline')
    if (wordmark) {
      const wm = SplitText.create(wordmark, { type: 'chars', mask: 'chars' })
      gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
        .from(eyebrow, { y: 16, autoAlpha: 0, duration: 0.6 })
        .from(wm.chars, { yPercent: 120, duration: 0.9, stagger: 0.06 }, '-=0.2')
        .from(tagline, { y: 20, autoAlpha: 0, duration: 0.7 }, '-=0.5')
    }
  })
}

/* ---- FASE 4 · capa 3: media & profundidad ----
   Reveal de imágenes (wipe + zoom), parallax de las columnas del masonry a
   distinta velocidad, y reveal escalonado de bloques para subir la densidad.
   No depende de fuentes; se salta entero en prefers-reduced-motion. */
if (!prefersReduced) {
  // A) Reveal de imágenes de casos: cortina de abajo a arriba + leve zoom-out.
  //    Funciona ahora con los placeholders y también con tus imágenes reales.
  gsap.utils.toArray('.case').forEach((card) => {
    const media = card.querySelector('.case__media')
    if (!media) return
    gsap.from(media, {
      clipPath: 'inset(100% 0% 0% 0%)',
      scale: 1.12,
      duration: 1.1,
      ease: 'power3.out',
      clearProps: 'transform', // libera el transform al acabar → el hover CSS manda
      scrollTrigger: { trigger: card, start: 'top 85%', once: true },
    })
  })

  // B) Profundidad: las tarjetas del masonry derivan a distinta velocidad al
  //    hacer scroll (data-speed de ScrollSmoother). Sutil, alternando columnas.
  if (smoother) {
    gsap.utils.toArray('.case').forEach((card, i) => {
      smoother.effects(card, { speed: i % 2 === 0 ? 0.94 : 1.06 })
    })
    const ctaCard = document.querySelector('.hero .cta-card')
    if (ctaCard) smoother.effects(ctaCard, { speed: 1.1 })
  }

  // C) Reveal escalonado de bloques (servicios, proceso, planes, testimonios,
  //    FAQ). Batch por rendimiento; entra desde abajo con stagger.
  const batchReveal = (selector, y = 26) => {
    ScrollTrigger.batch(selector, {
      start: 'top 88%',
      once: true,
      onEnter: (els) =>
        gsap.from(els, {
          autoAlpha: 0,
          y,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.09,
          overwrite: true,
        }),
    })
  }
  ;['.svc__item', '.step', '.plan', '.quote', '.faq__item'].forEach((s) => batchReveal(s))
}

/* ---- Reloj en vivo (nav + footer, detalle firma) ---- */
const clocks = [
  document.getElementById('clock'),
  document.getElementById('clock-footer'),
  document.getElementById('clock-menu'),
].filter(Boolean)
if (clocks.length) {
  const fmt = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    // TODO Iris: fija la zona horaria del estudio (ej. 'Europe/Madrid')
    timeZone: 'Europe/Madrid',
  })
  const tick = () => { const t = fmt.format(new Date()); clocks.forEach(el => { el.textContent = t }) }
  tick()
  setInterval(tick, 1000 * 15)
}

/* ---- Año dinámico del footer ---- */
const yearEl = document.getElementById('year')
if (yearEl) yearEl.textContent = new Date().getFullYear()

/* ---- Menú overlay (hamburguesa) ---- */
const menuToggle = document.getElementById('menu-toggle')
const menu = document.getElementById('menu')
if (menuToggle && menu) {
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open)
    menuToggle.classList.toggle('is-active', open)
    menuToggle.setAttribute('aria-expanded', String(open))
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú')
    menu.setAttribute('aria-hidden', String(!open))
    document.body.classList.toggle('menu-open', open)
  }
  menuToggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')))
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)))
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false) })
}

/* ---- Anclas: scroll suave vía ScrollSmoother (si está activo) ---- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    if (id.length < 2) return                 // ignora href="#"
    const target = document.querySelector(id)
    if (!target) return
    if (smoother) {                            // suaviza solo si ScrollSmoother corre
      e.preventDefault()
      smoother.scrollTo(target, true, 'top top') // true = animado
    }
    // sin smoother: se deja el salto nativo (o el smooth de CSS como fallback)
  })
})

/* ---- Proyectos: sticky-swap (la imagen cambia con el scroll) ----
   Versión base con IntersectionObserver. En la FASE 4 se pule con GSAP
   (pin suave, crossfade, parallax). */
const swap = document.querySelector('.proyectos .swap')
if (swap) {
  const steps = [...swap.querySelectorAll('.swap__step')]
  const imgs = [...swap.querySelectorAll('.swap__img')]
  const setActive = (i) => {
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.index) === i))
    imgs.forEach((m) => m.classList.toggle('is-active', Number(m.dataset.index) === i))
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.index)) })
    },
    // Banda de activación estrecha en el centro del viewport
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  )
  steps.forEach((s) => io.observe(s))
}
