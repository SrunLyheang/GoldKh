"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Lock,
  Coins,
  Scale,
  RefreshCw,
  Eye,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

import { AnimatedHeroImage } from "./animated-hero-image";
import { useSignedIn } from "./use-signed-in";

// Pinned once when the JS module first evaluates rather than on every
// render, and the copyright year is allowed to differ between the
// build-time server render and a later client load across a New Year
// boundary — suppressHydrationWarning covers that one span.
const CURRENT_YEAR = new Date().getFullYear();

export function LiquidGlassLanding() {
  const signedIn = useSignedIn();
  const [menuOpen, setMenuOpen] = useState(false);
  const [converterQty, setConverterQty] = useState<string>("1");
  const [converterUnit, setConverterUnit] = useState<"damlung" | "chi">(
    "damlung",
  );

  // Indicative gold price for this marketing converter only — NOT a live
  // feed. The signed-in dashboard pulls the real spot from goldapi.io.
  // Bump INDICATIVE_SPOT_PER_OZ when it drifts from the market.
  const GRAMS_PER_TROY_OZ = 31.1034768;
  const GRAMS_PER_DAMLUNG = 37.5;
  const TROY_OZ_PER_DAMLUNG = GRAMS_PER_DAMLUNG / GRAMS_PER_TROY_OZ; // ≈ 1.205658
  const INDICATIVE_SPOT_PER_OZ = 4100;

  const spotPerDamlung = INDICATIVE_SPOT_PER_OZ * TROY_OZ_PER_DAMLUNG;

  // Converter calculations
  const parsedConverterQty = Number.parseFloat(converterQty);
  const sanitizedConverterQty = Number.isFinite(parsedConverterQty)
    ? Math.max(0, parsedConverterQty)
    : 0;

  const totalDamlung =
    converterUnit === "damlung"
      ? sanitizedConverterQty
      : sanitizedConverterQty / 10;
  const totalChi = totalDamlung * 10;
  const totalGrams = totalDamlung * GRAMS_PER_DAMLUNG;
  const totalOz = totalDamlung * TROY_OZ_PER_DAMLUNG;
  const totalValueUsd = totalDamlung * spotPerDamlung;

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Cambodian Units", href: "#units" },
    { label: "About", href: "#about" },
  ];

  return (
    <div className="landing-root liquid-glass-landing-root relative min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* ── 1. Hero Section (Animated Looping Orb Video + Parallax + Particles) ─ */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Animated Hero with Looping Orb Video, 3D Tilt, Light Beams & Particles */}
        <AnimatedHeroImage />

        {/* Top Navbar */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-medium text-base group"
          >
            <Coins className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="tracking-tight font-semibold">GoldKh</span>
          </Link>

          {/* Center Nav Pill (Liquid Glass) */}
          <nav className="hidden md:flex liquid-glass items-center gap-1 rounded-xl px-2 py-1.5 border border-white/10 shadow-2xl">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center px-3.5 py-1.5 rounded-lg text-sm text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="liquid-glass text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/5 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="md:hidden liquid-glass text-white p-2.5 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {/* Mobile Menu Panel */}
        {menuOpen && (
          <div className="absolute top-[72px] left-4 right-4 z-30 md:hidden liquid-glass rounded-2xl p-4 flex flex-col gap-1 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-white/40" />
              </a>
            ))}
            <div className="flex gap-2 mt-2 pt-3 border-t border-white/10">
              {signedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 bg-white text-black text-center text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 liquid-glass text-center text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/5 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 bg-white text-black text-center text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hero Content (Bottom-Left) */}
        <div className="absolute bottom-0 left-0 z-20 px-6 sm:px-12 pb-10 sm:pb-16 max-w-2xl">
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight mb-4">
            See What Your Gold <br />
            Is Actually Worth
          </h1>

          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-7 max-w-md">
            Keep track of the physical gold you own in Cambodia. Log your buys
            and sells, and GoldKh works out what you paid on average and whether
            you&apos;re up or down at today&apos;s price.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className="bg-white text-black text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/90 transition-colors shadow-xl"
            >
              {signedIn ? "Go to Dashboard" : "Get Started"}
            </Link>
            <a
              href="#features"
              className="liquid-glass text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/5 transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Scrollable Body Content ────────────────────────────────────────── */}
      <main className="relative z-10 bg-black">
        {/* ── 2. Features Section (#features) ─────────────────────────────────── */}
        <section
          id="features"
          className="scroll-mt-24 py-28 px-5 sm:px-8 max-w-7xl mx-auto border-t border-white/10"
        >
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3 inline-block">
              ✦ What You Get
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Made for people who own physical gold.
            </h2>
            <p className="text-white/65 text-sm sm:text-base leading-relaxed">
              Everything you need to keep track of your gold, without a
              spreadsheet or doing the math by hand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="liquid-glass rounded-3xl p-7 flex flex-col justify-between border border-white/10 hover:border-amber-400/30 transition-colors group">
              <div>
                <div className="liquid-glass-gold w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Your Real Average Cost
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  Buy at a few different prices and it gets hard to say what
                  your gold actually cost you. GoldKh does the weighted-average
                  math so you always know your break-even.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Know your break-even
              </div>
            </div>

            {/* Feature 2 */}
            <div className="liquid-glass rounded-3xl p-7 flex flex-col justify-between border border-white/10 hover:border-amber-400/30 transition-colors group">
              <div>
                <div className="liquid-glass-gold w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Works in Chi and Damlung
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  Enter your gold in Chi (ជី) and Damlung (ដំឡឹង), the way
                  it&apos;s actually bought and sold here. GoldKh converts to
                  grams and troy ounces in the background (1 damlung = 1.205658
                  oz).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />1 Damlung =
                10 Chi = 37.5g
              </div>
            </div>

            {/* Feature 3 */}
            <div className="liquid-glass rounded-3xl p-7 flex flex-col justify-between border border-white/10 hover:border-amber-400/30 transition-colors group">
              <div>
                <div className="liquid-glass-gold w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Live Spot Price
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  See what your gold is worth at the current world spot price,
                  with a chart of how the price has moved. Every price shows the
                  exact time it was pulled.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Every price is timestamped
              </div>
            </div>

            {/* Feature 4 */}
            <div className="liquid-glass rounded-3xl p-7 flex flex-col justify-between border border-white/10 hover:border-amber-400/30 transition-colors group">
              <div>
                <div className="liquid-glass-gold w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Up or Down, at a Glance
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  See whether your gold is worth more or less than you paid for
                  it, in USD, against the latest spot price. It also shows your
                  gain or loss on gold you&apos;ve already sold.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Gain / loss in USD
              </div>
            </div>

            {/* Feature 5 */}
            <div className="liquid-glass rounded-3xl p-7 flex flex-col justify-between border border-white/10 hover:border-amber-400/30 transition-colors group">
              <div>
                <div className="liquid-glass-gold w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Only You Can See It
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  Your transactions are tied to your account and nobody
                  else&apos;s. No public profiles, no sharing, and your data
                  isn&apos;t sold to anyone.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Private to your account
              </div>
            </div>

            {/* Feature 6 */}
            <div className="liquid-glass rounded-3xl p-7 flex flex-col justify-between border border-white/10 hover:border-amber-400/30 transition-colors group">
              <div>
                <div className="liquid-glass-gold w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Nothing to Lose Here
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  GoldKh isn&apos;t an exchange. There are no deposits, no
                  withdrawals, and nothing to hack. Your gold stays wherever you
                  keep it.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                It&apos;s just a tracker
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. How It Works (#how-it-works) ─────────────────────────────────── */}
        <section
          id="how-it-works"
          className="scroll-mt-24 py-28 px-5 sm:px-8 max-w-7xl mx-auto border-t border-white/10"
        >
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3 inline-block">
              ✦ 3 Simple Steps
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              How it works.
            </h2>
            <p className="text-white/65 text-sm sm:text-base leading-relaxed">
              You can be set up in a couple of minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="liquid-glass rounded-3xl p-8 border border-white/10 relative">
              <div className="text-4xl font-bold font-mono text-amber-400/40 mb-5">
                01
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Create an account
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">
                Sign up with Clerk. No card, no bank details, nothing sensitive.
              </p>
            </div>

            {/* Step 2 */}
            <div className="liquid-glass rounded-3xl p-8 border border-white/10 relative">
              <div className="text-4xl font-bold font-mono text-amber-400/40 mb-5">
                02
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Add your buys and sells
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">
                For each one, enter how much (in Chi or Damlung), the price per
                unit, and the date.
              </p>
            </div>

            {/* Step 3 */}
            <div className="liquid-glass rounded-3xl p-8 border border-white/10 relative">
              <div className="text-4xl font-bold font-mono text-amber-400/40 mb-5">
                03
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Watch your position
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">
                See your average cost, what your gold is worth at today&apos;s
                spot price, and whether you&apos;re up or down.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Cambodian Units & Live Interactive Converter (#units) ────────── */}
        <section
          id="units"
          className="scroll-mt-24 py-28 px-5 sm:px-8 max-w-7xl mx-auto border-t border-white/10"
        >
          <div className="liquid-glass rounded-3xl p-8 sm:p-12 border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left: Unit Rules Explainer */}
              <div className="lg:col-span-6">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3 inline-block">
                  ✦ Cambodian Gold Units
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                  The units you already use.
                </h2>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Gold here is bought and sold in <strong>Chi (ជី)</strong> and{" "}
                  <strong>Damlung (ដំឡឹង)</strong>. GoldKh converts them to
                  grams and troy ounces exactly, with no rounding along the way.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="liquid-glass-gold px-4 py-3 rounded-2xl flex items-center justify-between border border-amber-400/20">
                    <span className="text-amber-300 font-bold">
                      1 Damlung (ដំឡឹង)
                    </span>
                    <span className="text-white font-semibold">
                      10 Chi = 37.5 Grams
                    </span>
                  </div>
                  <div className="liquid-glass px-4 py-3 rounded-2xl flex items-center justify-between border border-white/10">
                    <span className="text-white/80 font-bold">1 Chi (ជី)</span>
                    <span className="text-white font-semibold">
                      3.75 Grams (1/10 Damlung)
                    </span>
                  </div>
                  <div className="liquid-glass px-4 py-3 rounded-2xl flex items-center justify-between border border-white/10">
                    <span className="text-white/80 font-bold">
                      1 Troy Ounce
                    </span>
                    <span className="text-white font-semibold">
                      0.829426 Damlung ≈ 31.1035g
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Live Interactive Converter Widget */}
              <div className="lg:col-span-6">
                <div className="liquid-glass-gold rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-2xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-400/20">
                    <span className="text-xs font-mono uppercase text-amber-300 font-bold flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Unit Value Calculator
                    </span>
                    <span className="text-[11px] font-mono text-white/50">
                      Indicative: $
                      {spotPerDamlung.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                      /damlung
                    </span>
                  </div>

                  {/* Input Controls */}
                  <div className="space-y-4 mb-6">
                    <label className="block text-xs font-mono text-white/70">
                      Enter Quantity &amp; Unit:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={converterQty}
                        onChange={(e) => setConverterQty(e.target.value)}
                        className="col-span-2 bg-black/60 border border-amber-400/30 rounded-2xl px-4 py-3 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-400"
                        placeholder="1.0"
                      />
                      <select
                        value={converterUnit}
                        onChange={(e) =>
                          setConverterUnit(e.target.value as "damlung" | "chi")
                        }
                        className="bg-black/60 border border-amber-400/30 rounded-2xl px-3 py-3 text-amber-300 font-mono text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="damlung">Damlung (ដំឡឹង)</option>
                        <option value="chi">Chi (ជី)</option>
                      </select>
                    </div>
                  </div>

                  {/* Conversion Output Grid */}
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-white/50 text-[10px] block">
                        ESTIMATED VALUE
                      </span>
                      <span className="text-lg font-bold text-amber-300 mt-1 block">
                        $
                        {totalValueUsd.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-white/50 text-[10px] block">
                        TOTAL WEIGHT
                      </span>
                      <span className="text-lg font-bold text-white mt-1 block">
                        {totalGrams.toFixed(2)}g
                      </span>
                    </div>
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-white/50 text-[10px] block">
                        CAMBODIAN CHI
                      </span>
                      <span className="text-base font-semibold text-white mt-1 block">
                        {totalChi.toFixed(2)} Chi
                      </span>
                    </div>
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-white/50 text-[10px] block">
                        TROY OUNCES
                      </span>
                      <span className="text-base font-semibold text-white mt-1 block">
                        {totalOz.toFixed(3)} oz
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 text-[10px] leading-relaxed font-mono text-white/40">
                    Indicative price for illustration only — not a live feed.
                    Sign in to see your holdings valued at the current spot
                    rate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. About & Non-Custodial Section (#about) ───────────────────────── */}
        <section
          id="about"
          className="scroll-mt-24 py-28 px-5 sm:px-8 max-w-7xl mx-auto border-t border-white/10"
        >
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3 inline-block">
              ✦ What GoldKh Is
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
              Not an exchange. No money moves here.
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-10">
              GoldKh is just a tracker for people who own physical gold — bars
              or jewelry — in Cambodia. It doesn&apos;t hold your gold, it
              doesn&apos;t trade, and it never asks for payment details.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="liquid-glass rounded-2xl p-6 border border-white/10">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
                <h4 className="font-semibold text-white text-base mb-2">
                  Your gold stays with you
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  GoldKh never touches your gold. It only does the math.
                </p>
              </div>
              <div className="liquid-glass rounded-2xl p-6 border border-white/10">
                <Lock className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-semibold text-white text-base mb-2">
                  Private to you
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Your transactions are only visible when you&apos;re signed in
                  to your own account.
                </p>
              </div>
              <div className="liquid-glass rounded-2xl p-6 border border-white/10">
                <Eye className="w-6 h-6 text-blue-400 mb-3" />
                <h4 className="font-semibold text-white text-base mb-2">
                  Nothing hidden
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Plain math for cost basis and unit conversion. Free to use, no
                  fees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Final Call to Action ─────────────────────────────────────────── */}
        <section className="py-24 px-5 sm:px-8 max-w-5xl mx-auto text-center border-t border-white/10">
          <div className="liquid-glass-gold rounded-3xl p-10 sm:p-14 border border-amber-400/30 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Start tracking your gold today.
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
              Sign up to see your holdings, your average cost, and whether
              you&apos;re up or down at today&apos;s price. Free to use.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {signedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-white text-black text-sm font-semibold px-8 py-3.5 rounded-full shadow-2xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="bg-white text-black text-sm font-semibold px-8 py-3.5 rounded-full shadow-2xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="liquid-glass text-white text-sm font-medium px-6 py-3.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── 7. Footer ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/10 py-12 px-5 sm:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/50 font-mono">
          <div className="flex items-center gap-3">
            <Coins className="w-4 h-4 text-amber-400" />
            <span suppressHydrationWarning>
              &copy; {CURRENT_YEAR} GoldKh. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a href="#units" className="hover:text-white transition-colors">
              Units
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <Link
              href={signedIn ? "/dashboard" : "/sign-in"}
              className="hover:text-amber-300 transition-colors"
            >
              {signedIn ? "Dashboard" : "Log in"}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
