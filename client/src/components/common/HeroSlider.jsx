import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { toImageUrl } from "../../utils/image.js";

function getDiscountPercent(price, oldPrice) {
  const currentPrice = Number(price || 0);
  const previousPrice = Number(oldPrice || 0);

  if (previousPrice <= currentPrice || previousPrice <= 0) {
    return 0;
  }

  return Math.round(((previousPrice - currentPrice) / previousPrice) * 100);
}

function formatPrice(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return `$${amount.toFixed(2)}`;
}

export default function HeroSlider({ items = [], autoMs = 4500 }) {
  const { t } = useLanguage();
  const slides = useMemo(() => (items || []).filter(Boolean), [items]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, autoMs);

    return () => clearInterval(timer);
  }, [slides.length, autoMs]);

  useEffect(() => {
    if (index >= slides.length) {
      setIndex(0);
    }
  }, [slides.length, index]);

  if (slides.length === 0) return null;

  const current = slides[index];
  const imageUrl = toImageUrl(current?.image);
  const price = Number(current?.price || 0);
  const oldPrice = Number(current?.oldPrice || 0);
  const hasPrice = Number.isFinite(price) && price > 0;
  const discount = getDiscountPercent(price, oldPrice);
  const savings = hasPrice && discount > 0 ? oldPrice - price : 0;
  const formattedPrice = formatPrice(price);
  const formattedOldPrice = formatPrice(oldPrice);
  const formattedSavings = formatPrice(savings);

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((value) => (value - 1 + slides.length) % slides.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((value) => (value + 1) % slides.length);
  };

  return (
    <div className="mx-auto max-w-[58rem] overflow-hidden rounded-[28px] border border-white/18 bg-white/95">
      <div className="relative min-h-[340px] overflow-hidden sm:min-h-[380px] lg:min-h-[420px]">
        <img
          src={imageUrl}
          alt={current.title || t("slider.slide")}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          onError={(e) => {
            e.currentTarget.src = "/images/hero-bg.jpg";
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.78)_28%,rgba(2,6,23,0.42)_56%,rgba(2,6,23,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.18)_100%)]" />

        <div className="relative z-10 flex min-h-[340px] items-end p-5 sm:min-h-[380px] sm:p-6 lg:min-h-[420px] lg:items-center lg:p-8">
          <div className="w-full max-w-[380px] rounded-[26px] border border-white/12 bg-black/35 p-5 text-white shadow-[0_30px_80px_-48px_rgba(15,23,42,0.95)] backdrop-blur-md sm:p-6">
            <div className="inline-flex flex-wrap items-center gap-2">
              {current.badge && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
                  {current.badge}
                </span>
              )}

              {discount > 0 && (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  {t("common.savePercent", { value: discount })}
                </span>
              )}
            </div>

            {current.meta && (
              <div className="mt-4 text-[11px] uppercase tracking-[0.24em] text-white/55">
                {current.meta}
              </div>
            )}

            <div className="mt-4 text-2xl font-black leading-tight sm:text-[2.15rem]">
              {current.title || ""}
            </div>

            {current.subtitle && (
              <div className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-[15px]">
                {current.subtitle}
              </div>
            )}

            {hasPrice && (
              <div className="mt-6 rounded-[22px] border border-white/12 bg-white/[0.10] px-4 py-4 backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {t("slider.dealPrice")}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="text-3xl font-black tracking-tight sm:text-[2.35rem]">
                    {formattedPrice}
                  </div>

                  {discount > 0 && formattedOldPrice && (
                    <div className="pb-1 text-base text-white/40 line-through">
                      {formattedOldPrice}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {discount > 0 && (
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                      {t("common.savePercent", { value: discount })}
                    </span>
                  )}

                  {discount > 0 && formattedSavings && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/80">
                      -{formattedSavings}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {current.to && (
                <Link
                  to={current.to}
                  className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90"
                >
                  {t("common.view")}
                </Link>
              )}

              {current.secondaryTo && (
                <Link
                  to={current.secondaryTo}
                  className="rounded-2xl border border-white/25 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  {t("common.more")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-sm text-white transition hover:bg-black/75"
              aria-label={t("slider.previous")}
              type="button"
            >
              {"<"}
            </button>

            <button
              onClick={next}
              className="absolute right-3 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-sm text-white transition hover:bg-black/75"
              aria-label={t("slider.next")}
              type="button"
            >
              {">"}
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-black/10 px-5 py-3">
        <div className="font-semibold text-sm text-black/80">
          {current.sectionTitle || t("home.featuredPicks")}
        </div>

        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === index ? "bg-black" : "bg-black/20"
                }`}
                aria-label={t("slider.goToSlide", { value: i + 1 })}
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
