(() => {
  const audio = document.getElementById("ambientAudioTrack");
  if (!audio) return;

  const TARGET_VOLUME = 0.25;
  const FADE_DURATION_MS = 35000;
  let fadeFrame = 0;

  audio.loop = true;
  audio.volume = 0;
  audio.muted = true;

  const fadeIn = () => {
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / FADE_DURATION_MS);
      // Gentle ease-in: starts almost silent and reaches 25% after 35 seconds.
      audio.volume = TARGET_VOLUME * progress * progress;
      if (progress < 1 && !audio.paused) {
        fadeFrame = requestAnimationFrame(tick);
      } else {
        fadeFrame = 0;
      }
    };
    fadeFrame = requestAnimationFrame(tick);
  };

  let retryBound = false;
  const startAutoplay = async () => {
    if (!audio.paused) return;
    try {
      audio.muted = true;
      audio.volume = 0;
      await audio.play();
      audio.muted = false;
      fadeIn();
    } catch (_) {
      // Browsers that block autoplay can only be retried after user interaction.
      if (!retryBound) {
        retryBound = true;
        const retry = () => {
          retryBound = false;
          startAutoplay();
        };
        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
        window.addEventListener("touchstart", retry, { once: true, passive: true });
      }
    }
  };

  // Try immediately; the browser may require a gesture before allowing sound.
  startAutoplay();
})();
