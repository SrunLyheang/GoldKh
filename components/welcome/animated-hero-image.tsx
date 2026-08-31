"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Reads the OS "reduce motion" preference. The server snapshot is always
// false so the SSR markup and first client render agree; the client
// snapshot reflects the real setting and re-renders if it changes.
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () =>
      typeof window.matchMedia === "function"
        ? window.matchMedia(REDUCED_MOTION_QUERY).matches
        : false,
    () => false
  );
}

export function AnimatedHeroImage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();

  // ── Mouse Tilt & Parallax Physics ───────────────────────────────────────────
  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // The easing loop only runs while the sphere is still settling toward
    // the pointer target. Once it is within a fraction of a degree we snap
    // and stop scheduling frames, so a stationary pointer costs nothing.
    const SETTLE_EPSILON = 0.01;

    const updateTilt = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      const settled =
        Math.abs(targetX - currentX) < SETTLE_EPSILON &&
        Math.abs(targetY - currentY) < SETTLE_EPSILON;

      if (settled) {
        currentX = targetX;
        currentY = targetY;
        setTilt({ x: currentX, y: currentY });
        rafId = 0;
        return;
      }

      setTilt({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(updateTilt);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = e.clientX / innerWidth;
      const ny = e.clientY / innerHeight;
      setMousePos({ x: nx, y: ny });

      // Target rotation angles (-5deg to +5deg)
      targetX = (ny - 0.5) * -6;
      targetY = (nx - 0.5) * 8;

      // Wake the easing loop only if it has gone idle.
      if (rafId === 0) rafId = requestAnimationFrame(updateTilt);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // ── Golden Dust & Star Ember Particles Canvas ───────────────────────────────
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Generate ~75 floating golden dust particles
    const PARTICLE_COUNT = 75;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.65 + 0.25,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulsePhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.3 ? "#ffd276" : "#ffe8be",
    }));

    let time = 0;
    const renderParticles = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(time + p.pulsePhase) * 0.2;

        // Wrap around
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity =
          p.opacity * (0.6 + Math.sin(time * 2 + p.pulsePhase) * 0.4);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));
        ctx.fillStyle = p.color;
        ctx.shadowColor = "#e8b84b";
        ctx.shadowBlur = p.size * 3;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(renderParticles);
    };

    renderParticles();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  // Pause the looping hero video when the user prefers reduced motion.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
    } else {
      // play() returns a promise in browsers, undefined in some test DOMs.
      const played = video.play();
      if (played && typeof played.catch === "function") {
        played.catch(() => {
          /* autoplay may be blocked; muted/playsInline cover the common case */
        });
      }
    }
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none"
      style={{ perspective: "1000px" }}
    >
      {/* ── 1. 3D Parallax Video Wrapper ──────────────────────────────────────── */}
      <div
        className="absolute inset-[-2%] w-[104%] h-[104%] anim-float-gentle transition-transform duration-75 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* The Looping Video with the glowing liquid sphere in hand */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/videos/hero_bg.mp4"
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
        />

        {/* ── 2. Animated Radiant Orange Light Beam Overlay ─────────────────────── */}
        <div
          className="absolute top-[6%] right-[10%] w-[38%] h-[55%] anim-beam-orange pointer-events-none mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse at 45% 45%, rgba(255, 140, 40, 0.45) 0%, rgba(255, 100, 20, 0.2) 40%, transparent 75%)",
            transform: "rotate(-32deg)",
          }}
        />

        {/* ── 3. Animated Electric Cyan Light Beam Overlay ──────────────────────── */}
        <div
          className="absolute top-[22%] left-[8%] w-[42%] h-[48%] anim-beam-cyan pointer-events-none mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(60, 200, 255, 0.4) 0%, rgba(30, 140, 255, 0.15) 45%, transparent 75%)",
            transform: "rotate(-25deg)",
          }}
        />

        {/* ── 4. Glowing Orb Core Aura ─────────────────────────────────────────── */}
        <div
          className="absolute top-[38%] left-[53%] -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] anim-gold-glow pointer-events-none mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 200, 100, 0.5) 0%, rgba(255, 130, 40, 0.2) 40%, rgba(60, 180, 255, 0.1) 60%, transparent 80%)",
          }}
        />

        {/* ── 5. Cursor-Follow Specular Highlight on Sphere ───────────────────── */}
        <div
          className="absolute w-[220px] h-[220px] rounded-full pointer-events-none mix-blend-color-dodge transition-opacity duration-300"
          style={{
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(255, 240, 200, 0.35) 0%, rgba(245, 180, 80, 0.12) 45%, transparent 70%)",
            opacity:
              mousePos.x > 0.35 && mousePos.x < 0.75 && mousePos.y > 0.15 && mousePos.y < 0.65
                ? 1
                : 0.2,
          }}
        />

        {/* ── 6. Vignettes for Text Contrast ───────────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/15 to-transparent pointer-events-none" />
      </div>

      {/* ── 7. Golden Dust & Star Particles Layer ─────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );
}
