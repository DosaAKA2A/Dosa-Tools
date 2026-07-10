document.addEventListener("DOMContentLoaded", () => {
  function splitCharsInline(el) {
    const text = el.textContent;
    el.textContent = "";
    const nodes = [];
    [...text].forEach((ch) => {
      const mask = document.createElement("span");
      mask.className = "inline-mask";
      const inner = document.createElement("span");
      inner.className = "inline-char";
      inner.textContent = ch;
      mask.appendChild(inner);
      el.appendChild(mask);
      nodes.push(inner);
    });
    return nodes;
  }

  function splitLinesSimple(el) {
    const html = el.innerHTML.trim();
    const parts = html.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
    el.innerHTML = "";
    const nodes = [];
    parts.forEach((part) => {
      const lineMask = document.createElement("span");
      lineMask.className = "line-mask";
      const line = document.createElement("span");
      line.className = "reveal-line";
      line.innerHTML = part;
      lineMask.appendChild(line);
      el.appendChild(lineMask);
      nodes.push(line);
    });
    return nodes;
  }

  function splitWordsToLines(el) {
    const text = el.textContent.trim();
    el.textContent = "";
    const mask = document.createElement("span");
    mask.className = "line-mask";
    const inner = document.createElement("span");
    inner.className = "reveal-line";
    inner.textContent = text;
    mask.appendChild(inner);
    el.appendChild(mask);
    return [inner];
  }

  const logoChars = splitCharsInline(document.getElementById("js-preloader-logo"));
  const footerLines = splitLinesSimple(document.getElementById("js-preloader-footer"));
  const heroTitleChars = splitCharsInline(document.getElementById("js-hero-title"));
  const subtitleLines = Array.from(document.querySelectorAll("#js-hero-subtitle span")).flatMap(splitWordsToLines);
  const descLines = splitWordsToLines(document.getElementById("js-hero-description"));

  gsap.set(logoChars, { xPercent: 100 });
  gsap.set(footerLines, { yPercent: 100 });
  gsap.set(heroTitleChars, { yPercent: 100 });
  gsap.set([...subtitleLines, ...descLines], { yPercent: 100 });
  gsap.set(".preloader-progress-bar", { scaleX: 0, transformOrigin: "left center" });
  gsap.set(".preloader-progress", { scale: 0.86, opacity: 1 });
  gsap.set(".hero-img", { scale: 1.5 });

  function animateProgress(duration = 3.5) {
    const tl = gsap.timeline();
    const counterSteps = 3;
    let currentProgress = 0;

    for (let i = 0; i < counterSteps; i++) {
      const finalStep = i === counterSteps - 1;
      const targetProgress = finalStep
        ? 1
        : Math.min(currentProgress + Math.random() * 0.3 + 0.1, 0.9);
      currentProgress = targetProgress;

      tl.to(".preloader-progress-bar", {
        scaleX: targetProgress,
        duration: duration / counterSteps,
        ease: "power3.out",
      });
    }
    return tl;
  }

  const tl = gsap.timeline({ delay: 0.35 });

  tl.to(".preloader-progress", {
      scale: 1,
      duration: 0.9,
      ease: "power4.out"
    })
    .to(logoChars, {
      xPercent: 0,
      stagger: 0.05,
      duration: 1,
      ease: "power4.inOut",
    }, "<")
    .to(
      footerLines,
      {
        yPercent: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power4.inOut",
      },
      "0.3"
    )
    .add(animateProgress(), "<")
    .to(
      logoChars,
      {
        xPercent: -100,
        stagger: 0.05,
        duration: 1,
        ease: "power4.inOut",
      },
      "+=0.15"
    )
    .to(
      footerLines,
      {
        yPercent: -100,
        stagger: 0.1,
        duration: 0.5,
        ease: "power4.inOut",
      },
      "-=0.1"
    )
    .to(
      ".preloader-progress",
      {
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      },
      "<"
    )
    .to(
      ".preloader-mask",
      {
        scale: 6,
        duration: 4,
        ease: "power3.out",
      },
      "<"
    )
    .to(
      ".preloader-mask",
      {
        delay: 1,
        opacity: 0,
        display: "none",
      },
      "<"
    )
    .to(
      ".hero-img",
      {
        scale: 1,
        duration: 1.5,
        ease: "power3.out",
      },
      "<"
    )
    .to(heroTitleChars, {
      yPercent: 0,
      stagger: 0.05,
      duration: 1,
      ease: "power4.out",
      delay: -2,
    })
    .to(
      [...subtitleLines, ...descLines],
      {
        yPercent: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power4.out",
      },
      "-=1.5"
    )
    .set(".preloader", { display: "none" });
});
