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

/* ---- FASE 4 · capa 3: media & reveals de bloque ----
   Reveal de imágenes de casos (wipe + zoom) y reveal escalonado del resto de
   bloques para subir la densidad de animación. Sin parallax por scroll en las
   tarjetas (desplazaba las imágenes sobre el texto del masonry).
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

/* ---- FASE 4 · capa 4: micro-interacciones — CTA "imán" ----
   Los botones principales siguen sutilmente al cursor y vuelven a su sitio al
   salir. gsap.quickTo da un seguimiento suave. Solo con puntero fino (ratón)
   y sin prefers-reduced-motion; en táctil no aplica. */
if (!prefersReduced && window.matchMedia('(pointer: fine)').matches) {
  const magnets = document.querySelectorAll(
    '.cta-btn, .plan__btn, .contact-form__btn'
  )
  magnets.forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    const strength = 0.35 // fracción del desplazamiento del cursor (sutil)
    const max = 10 // tope en px para que no se despegue del layout
    const clamp = (v) => Math.max(-max, Math.min(max, v))
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      xTo(clamp((e.clientX - (r.left + r.width / 2)) * strength))
      yTo(clamp((e.clientY - (r.top + r.height / 2)) * strength))
    })
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0) })
  })
}

/* ---- FASE 4 · capa 5: contadores animados ----
   Los números (rating, proyectos entregados, contador del nav) cuentan desde 0
   al entrar en pantalla. El HTML ya lleva el valor final como fallback si el JS
   no corre. En prefers-reduced-motion se dejan en su valor final sin animar. */
{
  const counters = [...document.querySelectorAll('[data-count]')]
  const finalText = (el) =>
    parseFloat(el.dataset.count).toFixed(parseInt(el.dataset.decimals || '0', 10))

  if (prefersReduced) {
    counters.forEach((el) => { el.textContent = finalText(el) })
  } else {
    const run = (el) => {
      const target = parseFloat(el.dataset.count)
      const decimals = parseInt(el.dataset.decimals || '0', 10)
      const obj = { v: 0 }
      gsap.to(obj, {
        v: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals) },
      })
    }
    counters.forEach((el) => {
      // el nav es fijo (siempre visible) → cuenta al cargar; el resto al entrar
      if (el.closest('.nav')) run(el)
      else ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => run(el) })
    })
  }
}

/* ---- Reloj en vivo (top bar + footer, detalle firma) ---- */
const clocks = [
  document.getElementById('hzTimeVal'),
  document.getElementById('clock-footer'),
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

/* ---- Formulario de consultas → backoffice de IRIS ----
   POST JSON { nombre, email, asunto, mensaje } al Worker de Cloudflare (el mismo
   backoffice que usa iris.it.com). Honeypot anti-bots + estados de UI. */
const contactForm = document.getElementById('contact-form')
if (contactForm) {
  const ENDPOINT = 'https://iris-backoffice.studio-iris2026.workers.dev/contact'
  const statusEl = document.getElementById('cf-status')
  const btn = contactForm.querySelector('.contact-form__btn')
  const setStatus = (msg, kind) => {
    statusEl.textContent = msg
    statusEl.classList.toggle('is-ok', kind === 'ok')
    statusEl.classList.toggle('is-err', kind === 'err')
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    // Honeypot: si un bot rellena el campo oculto, fingimos éxito y no enviamos.
    if (contactForm.querySelector('.contact-form__hp')?.value) { setStatus('Mensaje enviado ✓', 'ok'); return }
    if (!contactForm.checkValidity()) { contactForm.reportValidity(); return }

    const payload = {
      nombre: document.getElementById('cf-name').value.trim(),
      email: document.getElementById('cf-email').value.trim(),
      asunto: 'Consulta desde la web (IRIS)',
      mensaje: document.getElementById('cf-msg').value.trim(),
    }

    btn.disabled = true
    setStatus('Enviando…', null)
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setStatus('Mensaje enviado ✓ Te respondemos en menos de 24 h.', 'ok')
      contactForm.reset()
    } catch (err) {
      setStatus('No se pudo enviar. Escríbenos a contacto@iris.it.com', 'err')
    } finally {
      btn.disabled = false
    }
  })
}

/* ---- Menú overlay (portado de iris.it.com) ----
   El botón MENU (top bar del hero) llama a toggleHnMenu() vía onclick, por eso
   la función se expone en window. Reveal escalonado de los links con --d. */
{
  const overlay = document.getElementById('hnOverlay')
  const btn = document.getElementById('hnMenuBtn')
  if (overlay && btn) {
    const label = btn.querySelector('.hn-menu-label')
    const links = overlay.querySelectorAll('.hn-ov-links a')
    links.forEach((a, i) => a.style.setProperty('--d', (0.12 + i * 0.055) + 's'))
    const setState = (open) => {
      document.body.classList.toggle('hn-open', open)
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true')
      if (label) label.textContent = open ? label.dataset.close : label.dataset.open
    }
    window.toggleHnMenu = () => setState(!document.body.classList.contains('hn-open'))
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setState(false) })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) setState(false) })
    links.forEach((a) => a.addEventListener('click', () => setState(false)))
  }
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

/* ---- Proyectos: pin + tira de imágenes scrubbed ----
   El marco queda fijo (pin) y la TIRA de imágenes se desliza DENTRO al ritmo
   del scroll (scrub), a la vez que se resalta el proyecto en la lista. */
const swap = document.querySelector('.proyectos .swap')
if (swap) {
  const steps = [...swap.querySelectorAll('.swap__step')]
  const track = swap.querySelector('.swap__track')
  const n = steps.length
  const setStep = (i) =>
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.index) === i))
  setStep(0)

  if (prefersReduced) {
    // Sin animación: la tira salta a la imagen del proyecto que cruza el centro.
    steps.forEach((s) =>
      ScrollTrigger.create({
        trigger: s, start: 'top center', end: 'bottom center',
        onToggle: (self) => {
          if (!self.isActive) return
          const i = Number(s.dataset.index)
          setStep(i)
          gsap.set(track, { yPercent: -i * 100 })
        },
      })
    )
  } else {
    // Pin en todos los tamaños (el pin de ScrollTrigger sí funciona bien con
    // ScrollSmoother; la CSS ajusta el layout 1 col en móvil / 2 col en desktop).
    // La sección se CLAVA y la tira de imágenes se desliza con el scroll (scrub).
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: swap,
        start: 'center center',
        // distancia del pin: ~0.7 viewports por transición (cambia antes)
        end: () => '+=' + (n - 1) * window.innerHeight * 0.7,
        pin: true,
        scrub: 0.25, // seguimiento ágil (menos inercia = se posiciona antes)
        // Snap por PROXIMIDAD: encaja en la imagen que quede mayoritariamente
        // visible en el marco (la más cercana), sin forzar el sentido del scroll.
        snap: {
          snapTo: 1 / (n - 1),
          duration: { min: 0.12, max: 0.28 },
          delay: 0.02,
          ease: 'power1.out',
          directional: false,
        },
        onUpdate: (self) => setStep(Math.round(self.progress * (n - 1))),
        invalidateOnRefresh: true, // recalcula distancia al rotar/redimensionar
      },
    })
    tl.to(track, { yPercent: -(n - 1) * 100, ease: 'none' })
  }
}
