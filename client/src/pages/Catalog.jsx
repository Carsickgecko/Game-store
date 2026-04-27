import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageSurface from "../components/common/PageSurface.jsx";
import ProductCard from "../components/product/ProductCard.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { fetchGames } from "../api/games.js";
import {
  localizeGenre,
  localizePlatform,
} from "../utils/localizeStoreValue.js";

const CATALOG_GENRE_OPTIONS = [
  "Action",
  "Action-Adventure",
  "Adventure",
  "Arcade",
  "Board Games",
  "Card",
  "Casual",
  "Educational",
  "Family",
  "Fighting",
  "Horror",
  "Indie",
  "Massively Multiplayer",
  "Platformer",
  "Puzzle",
  "Racing",
  "RPG",
  "Shooter",
  "Simulation",
  "Sports",
  "Strategy",
  "Survival",
];

function splitStoreValues(value) {
  return String(value || "")
    .split(/[|,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function Catalog() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const qFromUrl = searchParams.get("q") || "";
  const genreFromUrl = searchParams.get("genre") || "All";
  const platformFromUrl = searchParams.get("platform") || "All";

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState(qFromUrl);
  const [genre, setGenre] = useState(genreFromUrl);
  const [platform, setPlatform] = useState(platformFromUrl);
  const [maxPrice, setMaxPrice] = useState(70);
  const [sort, setSort] = useState("popular");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const list = await fetchGames();
        if (!alive) return;
        setGames(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || t("catalog.failedLoad"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  const filtered = useMemo(() => {
    let list = [...games];

    if (q.trim()) {
      const key = q.trim().toLowerCase();
      list = list.filter((g) => (g.name || "").toLowerCase().includes(key));
    }

    if (genre !== "All") {
      const selectedGenre = genre.toLowerCase();
      list = list.filter((g) =>
        splitStoreValues(g.genre).some(
          (item) => item.toLowerCase() === selectedGenre,
        ),
      );
    }

    if (platform !== "All") {
      const selectedPlatform = platform.toLowerCase();
      list = list.filter((g) =>
        splitStoreValues(g.platform).some(
          (item) => item.toLowerCase() === selectedPlatform,
        ),
      );
    }

    list = list.filter((g) => Number(g.price || 0) <= Number(maxPrice || 0));

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "discount") {
      list.sort((a, b) => b.oldPrice - b.price - (a.oldPrice - a.price));
    }

    return list;
  }, [games, q, genre, platform, maxPrice, sort]);

  const genres = useMemo(() => {
    const merged = [...CATALOG_GENRE_OPTIONS];
    const seen = new Set(merged.map((item) => item.toLowerCase()));

    [...new Set(games.flatMap((g) => splitStoreValues(g.genre)))]
      .sort((left, right) => left.localeCompare(right))
      .forEach((item) => {
        const key = item.toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      });

    return ["All", ...merged];
  }, [games]);

  const platforms = useMemo(
    () => [
      "All",
      ...[...new Set(games.flatMap((g) => splitStoreValues(g.platform)))].sort(
        (left, right) => left.localeCompare(right),
      ),
    ],
    [games],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-[74rem] px-4 py-10 text-white">
        <PageSurface className="border-white/8 bg-none bg-[#242424] shadow-[0_28px_70px_-42px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {t("catalog.market")}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white">{t("catalog.title")}</h1>
              <p className="text-sm text-white/60">
                {t("catalog.subtitle")}
              </p>
            </div>

            <select
              className="w-full rounded-2xl border border-white/10 bg-[#161616] px-4 py-3 text-sm text-white outline-none sm:w-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">{t("catalog.popular")}</option>
              <option value="discount">{t("catalog.bestDiscount")}</option>
              <option value="price-asc">{t("catalog.priceLowToHigh")}</option>
              <option value="price-desc">{t("catalog.priceHighToLow")}</option>
            </select>
          </div>

          {err && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {err}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            <div className="h-fit rounded-[26px] border border-white/8 bg-[#181818] p-5 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.9)]">
              <div className="font-semibold text-white">{t("catalog.filters")}</div>

              <div className="mt-4">
                <div className="text-sm font-medium text-white/80">{t("catalog.search")}</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("catalog.searchPlaceholder")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-3 py-2.5 text-white placeholder:text-white/30 outline-none"
                />
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-white/80">{t("catalog.genre")}</div>
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-3 py-2.5 text-white outline-none"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {genres.map((x) => (
                    <option key={x} value={x}>
                      {x === "All" ? t("catalog.all") : localizeGenre(x, t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-white/80">{t("catalog.platform")}</div>
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-3 py-2.5 text-white outline-none"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  {platforms.map((x) => (
                    <option key={x} value={x}>
                      {x === "All" ? t("catalog.all") : localizePlatform(x, t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-white/80">
                  {t("catalog.maxPrice", { value: maxPrice })}
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-2 w-full accent-[#dc2626]"
                />
              </div>

              <button
                className="mt-5 w-full rounded-2xl border border-white/12 bg-white/5 px-3 py-2.5 text-white transition hover:bg-white/10"
                onClick={() => {
                  setQ("");
                  setGenre("All");
                  setPlatform("All");
                  setMaxPrice(70);
                  setSort("popular");
                }}
              >
                {t("catalog.resetFilters")}
              </button>
            </div>

            <div className="min-w-0">
              {loading ? (
                <div className="text-white/60">{t("home.loadingGames")}</div>
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between gap-3 text-sm text-white/60">
                    <span>
                      {t("catalog.showingGames", { count: filtered.length })}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                      {t("catalog.popularPicks")}
                    </span>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="text-white/60">
                      {t("catalog.noGames")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                      {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </PageSurface>
      </div>
    </div>
  );
}
