(() => {
  "use strict";

  const hero = document.querySelector(".hero");
  const canvas = hero?.querySelector(".hero-particles");
  const context = canvas?.getContext("2d");

  if (!hero || !canvas || !context) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: -1000, y: -1000 };
  let particles = [];
  let width = 0;
  let height = 0;
  let frameId = 0;
  let isVisible = true;

  function createParticles() {
    const count = Math.min(76, Math.max(24, Math.round((width * height) / 14500)));

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      radius: Math.random() * 1.4 + 0.7
    }));
  }

  function resizeCanvas() {
    const bounds = hero.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createParticles();
    drawFrame();
  }

  function drawFrame() {
    context.clearRect(0, 0, width, height);
    const connectionDistance = Math.min(150, Math.max(95, width * 0.12));

    for (let firstIndex = 0; firstIndex < particles.length; firstIndex += 1) {
      const first = particles[firstIndex];

      for (let secondIndex = firstIndex + 1; secondIndex < particles.length; secondIndex += 1) {
        const second = particles[secondIndex];
        const deltaX = first.x - second.x;
        const deltaY = first.y - second.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance >= connectionDistance) continue;

        const opacity = (1 - distance / connectionDistance) * 0.23;
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.strokeStyle = `rgba(255, 239, 0, ${opacity})`;
        context.lineWidth = 0.7;
        context.stroke();
      }

      const pointerX = first.x - pointer.x;
      const pointerY = first.y - pointer.y;
      const pointerDistance = Math.hypot(pointerX, pointerY);
      const pointerForceX =
        pointerDistance > 0 && pointerDistance < 150
          ? (pointerX / pointerDistance) * 0.24
          : 0;
      const pointerForceY =
        pointerDistance > 0 && pointerDistance < 150
          ? (pointerY / pointerDistance) * 0.24
          : 0;

      if (pointerDistance < 150 && pointerDistance > 0) {
        const force = ((150 - pointerDistance) / 150) * 0.018;
        first.x += (pointerX / pointerDistance) * force;
        first.y += (pointerY / pointerDistance) * force;
      }

      context.beginPath();
      context.arc(first.x, first.y, first.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(255, 239, 0, 0.72)";
      context.fill();

      if (pointerDistance < 150) {
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(pointer.x, pointer.y);
        context.strokeStyle = `rgba(255, 239, 0, ${(1 - pointerDistance / 150) * 0.5})`;
        context.lineWidth = 0.8;
        context.stroke();
      }

      if (motionQuery.matches || !isVisible) continue;

      first.x += first.vx + pointerForceX;
      first.y += first.vy + pointerForceY;
      if (first.x < 0 || first.x > width) first.vx *= -1;
      if (first.y < 0 || first.y > height) first.vy *= -1;
    }
  }

  function animate() {
    frameId = 0;
    drawFrame();

    if (isVisible && !motionQuery.matches && !document.hidden) {
      frameId = window.requestAnimationFrame(animate);
    }
  }

  function startAnimation() {
    if (!frameId && isVisible && !motionQuery.matches && !document.hidden) {
      frameId = window.requestAnimationFrame(animate);
    } else {
      drawFrame();
    }
  }

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
  });

  hero.addEventListener("pointerleave", () => {
    pointer.x = -1000;
    pointer.y = -1000;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      startAnimation();
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        startAnimation();
      } else {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });
    observer.observe(hero);
  }

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", startAnimation);
  }

  new ResizeObserver(resizeCanvas).observe(hero);
  resizeCanvas();
  startAnimation();
})();
