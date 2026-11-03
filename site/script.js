(() => {
  const audio = document.getElementById("ambientAudioTrack");
  const volume = document.getElementById("ambientAudioVolume");
  if (!audio || !volume) return;

  const MAX_VOLUME = 0.35;
  const FADE_DURATION_MS = 35000;
  let fadeFrame = 0;
  let fadeStartedAt = 0;

  audio.loop = true;
  audio.volume = 0;
  audio.muted = true;

  const targetVolume = () =>
    Math.min(MAX_VOLUME, (Number(volume.value) / 100) * MAX_VOLUME);

  const stopFade = () => {
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
  };

  const fadeIn = () => {
    stopFade();
    fadeStartedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - fadeStartedAt) / FADE_DURATION_MS);
      // Ease-in: the first moments remain almost silent.
      audio.volume = targetVolume() * progress * progress;
      if (progress < 1 && !audio.paused) {
        fadeFrame = requestAnimationFrame(tick);
      } else {
        fadeFrame = 0;
      }
    };
    fadeFrame = requestAnimationFrame(tick);
  };

  const attemptAutoplay = async () => {
    if (!audio.paused) return;
    try {
      audio.muted = true;
      audio.volume = 0;
      await audio.play();
      // Start muted (permitted by most browsers), then fade in to the
      // visitor-selected level. Browsers may still enforce their autoplay policy.
      audio.muted = false;
      fadeIn();
    } catch (_) {
      // Retry silently on the first normal page interaction if autoplay
      // is blocked by the browser. No extra player button or message is shown.
      const retry = () => {
        attemptAutoplay();
      };
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    }
  };

  volume.addEventListener("input", () => {
    if (audio.paused) return;
    stopFade();
    const from = audio.volume;
    const to = targetVolume();
    const started = performance.now();
    const adjust = (now) => {
      const progress = Math.min(1, (now - started) / 450);
      audio.volume = from + (to - from) * (1 - Math.pow(1 - progress, 3));
      if (progress < 1 && !audio.paused) {
        fadeFrame = requestAnimationFrame(adjust);
      } else {
        fadeFrame = 0;
      }
    };
    fadeFrame = requestAnimationFrame(adjust);
  });

  // Attempt muted autoplay as soon as the player is initialized.
  attemptAutoplay();
})();
