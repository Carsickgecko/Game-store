import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toImageUrl } from "../../utils/image.js";

export default function HeroSlider({ items = [], autoMs = 4500 }) {
  const slides = useMemo(() => (items || []).filter(Boolean), [items]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, autoMs);
    return () => clearInterval(t);
  }, [slides.length, autoMs]);

  // nếu slides đổi mà index vượt quá thì reset
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (slides.length === 0) return null;

  const current = slides[index];
  const imageUrl = toImageUrl(current?.image);

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % slides.length);
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-black/10 bg-white">
      <div className="relative">
        <img
          src={imageUrl}
          alt={current.title || "Slide"}
          className="w-full h-[320px] md:h-[380px] object-cover"
          loading="eager"
          onError={(e) => (e.currentTarget.src = "/images/hero-bg.jpg")}
        />

        {current.badge && (
          <div className="absolute left-4 bottom-4 z-30 text-xs font-semibold bg-white/90 text-black px-3 py-1 rounded-full border border-black/10">
            {current.badge}
          </div>
        )}

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute left-6 right-6 bottom-14 z-20 text-white">
          <div className="text-2xl md:text-3xl font-bold">
            {current.title || ""}
          </div>

          {current.subtitle && (
            <div className="mt-1 text-sm text-white/80 line-clamp-2">
              {current.subtitle}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {current.to && (
              <Link
                to={current.to}
                className="px-4 py-2 rounded-2xl bg-white text-black font-semibold"
              >
                View
              </Link>
            )}
            {current.secondaryTo && (
              <Link
                to={current.secondaryTo}
                className="px-4 py-2 rounded-2xl border border-white/30 text-white hover:bg-white/10 transition"
              >
                More
              </Link>
            )}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition flex items-center justify-center"
              aria-label="Previous"
              type="button"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition flex items-center justify-center"
              aria-label="Next"
              type="button"
            >
              ›
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/40"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 flex items-center justify-between">
        <div className="font-semibold text-sm">
          ⭐ {current.sectionTitle || "NEW GAMES"}
        </div>
        <Link to="/catalog" className="text-sm underline">
          More
        </Link>
      </div>
    </div>
  );
}
