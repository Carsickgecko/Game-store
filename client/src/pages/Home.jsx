// client/src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/product/ProductCard.jsx";
import HeroSlider from "../components/common/HeroSlider.jsx";
import { fetchHomeSlider, fetchTopDeals } from "../api/home.js";

const SERVER_ORIGIN = "http://localhost:5001";
const FALLBACK_IMG = "/images/hero-bg.jpg";

function toImageUrl(src) {
  if (!src) return FALLBACK_IMG;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${SERVER_ORIGIN}${src}`; // /uploads/...
  return src;
}

export default function Home() {
  const [sliderGames, setSliderGames] = useState([]);
  const [topDeals, setTopDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [s, d] = await Promise.all([fetchHomeSlider(), fetchTopDeals(6)]);

        if (!alive) return;
        setSliderGames(Array.isArray(s) ? s : []);
        setTopDeals(Array.isArray(d) ? d : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load home data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Today’s highlight lấy từ topDeals[0] (giảm mạnh nhất)
  const highlight = useMemo(() => topDeals[0] || null, [topDeals]);

  // Build slider items từ DB (IsFeatured = 1)
  const sliderItems = useMemo(() => {
    const itemsFromDb = sliderGames.map((g) => ({
      title: g.name,
      subtitle: g.featuredSubtitle || "Find discounts and instant delivery.",
      image: toImageUrl(g.image),
      badge: g.featuredBadge || "Hot",
      to: g.id ? `/product/${g.id}` : "/catalog",
      secondaryTo: "/catalog",
      sectionTitle: "New Releases",
    }));

    // fallback nếu DB chưa set featured
    if (itemsFromDb.length > 0) return itemsFromDb;

    // fallback slide demo
    return [
      {
        title: "Top deals this week",
        subtitle: "Find discounts and instant delivery.",
        image: FALLBACK_IMG,
        badge: "Hot",
        to: "/catalog",
        secondaryTo: "/catalog",
        sectionTitle: "New Releases",
      },
      {
        title: highlight?.name || "Featured game",
        subtitle: "Best discount right now (demo).",
        image: toImageUrl(highlight?.image),
        badge: "-%",
        to: highlight?.id ? `/product/${highlight.id} ` : "/catalog",
        secondaryTo: "/catalog",
        sectionTitle: "New Releases",
      },
    ];
  }, [sliderGames, highlight]);

  const categories = [
    "RPG",
    "Action",
    "Indie",
    "Sports",
    "Racing",
    "Adventure",
  ];

  return (
    <div>
      {/* HERO */}
      <section
        className="relative text-white border-b border-white/10 bg-cover bg-center"
        style={{ backgroundImage: `url(${FALLBACK_IMG})` }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs bg-white/10 border border-white/10 px-3 py-1 rounded-full">
              🔥 Hot Deals • Instant delivery
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Buy games cheaper.{" "}
              <span className="text-white/70">Play instantly.</span>
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/catalog"
                className="px-6 py-3 rounded-2xl bg-white text-black font-semibold"
              >
                Browse catalog
              </Link>
              <Link
                to="/catalog"
                className="px-6 py-3 rounded-2xl border border-white/30 text-white hover:bg-white/10 transition"
              >
                View top deals
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c}
                  to={`/catalog?genre=${encodeURIComponent(c)}`}
                  className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/20"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          {/* Today's highlight */}
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md overflow-hidden">
            <div className="p-6">
              <div className="text-sm text-white/70">Today’s highlight</div>

              {loading ? (
                <div className="mt-4 text-white/70">Loading...</div>
              ) : !highlight ? (
                <div className="mt-4 text-white/70">
                  No deals yet. Add games to DB.
                </div>
              ) : (
                <>
                  <div className="mt-2 text-2xl font-bold">
                    {highlight.name}
                  </div>
                  <div className="mt-2 text-white/70">
                    {highlight.featuredSubtitle ||
                      "Save big with our best discount."}
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="text-3xl font-bold">
                      ${Number(highlight.price).toFixed(2)}
                    </div>
                    {highlight.oldPrice ? (
                      <div className="text-white/60 line-through">
                        ${Number(highlight.oldPrice).toFixed(2)}
                      </div>
                    ) : null}
                  </div>

                  <Link
                    to={`/product/${highlight.id}`}
                    className="inline-block mt-6 px-5 py-3 rounded-2xl bg-white text-black font-semibold"
                  >
                    View game
                  </Link>
                </>
              )}

              {err && <div className="mt-4 text-sm text-red-200">{err}</div>}
            </div>
          </div>
        </div>
      </section>

      {/* SLIDER */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 pb-10">
        <HeroSlider items={sliderItems} autoMs={4500} />
      </section>

      {/* TOP DEALS */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Top deals</h2>
            <p className="text-sm text-black/60">Best discounts right now</p>
          </div>
          <Link to="/catalog" className="text-sm underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 text-black/60">Loading games...</div>
        ) : topDeals.length === 0 ? (
          <div className="mt-5 text-black/60">No deals yet.</div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {topDeals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
