import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/product/ProductCard.jsx";
import HeroSlider from "../components/common/HeroSlider.jsx";
import { fetchMyRecommendations } from "../api/ai.js";
import { fetchBestsellers, fetchHomeSlider, fetchTopDeals } from "../api/home.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { isAuthenticated } from "../store/auth.js";
import { toImageUrl } from "../utils/image.js";
import {
  localizeGenre,
  localizePlatform,
} from "../utils/localizeStoreValue.js";

const FALLBACK_IMG = "/images/hero-bg.jpg";

function summarizeText(value, fallback = "", maxLength = 108) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function dedupeSlides(slides) {
  const seen = new Set();

  return slides.filter((slide) => {
    if (!slide) {
      return false;
    }

    const key = slide.id
      ? `game-${slide.id}`
      : `promo-${slide.title}-${slide.image}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildSlide(game, t, fallbackSectionTitle) {
  const price = Number(game?.price || 0);
  const oldPrice = Number(game?.oldPrice || 0);
  const discount =
    oldPrice > price && oldPrice > 0
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

  const meta = [localizeGenre(game?.genre, t), localizePlatform(game?.platform, t)]
    .filter(Boolean)
    .join(" | ");
  const fallbackSubtitle = meta || t("home.trustedCheckout");
  const subtitle = summarizeText(
    game?.featuredSubtitle || game?.longDescription,
    fallbackSubtitle,
  );

  return {
    id: game?.id,
    title: game?.name || t("home.featuredGame"),
    subtitle,
    image: toImageUrl(game?.image),
    badge: discount > 0 ? `-${discount}%` : t("home.hot"),
    meta,
    to: game?.id ? `/product/${game.id}` : "/catalog",
    secondaryTo: "/catalog",
    sectionTitle: discount > 0 ? t("home.weeklyDeals") : fallbackSectionTitle,
    price: price > 0 ? price : null,
    oldPrice: discount > 0 ? oldPrice : null,
  };
}

export default function Home() {
  const { t } = useLanguage();
  const [sliderGames, setSliderGames] = useState([]);
  const [topDeals, setTopDeals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [err, setErr] = useState("");
  const [bestsellersError, setBestsellersError] = useState("");
  const [recommendationsError, setRecommendationsError] = useState("");
  const [canShowRecommendations, setCanShowRecommendations] = useState(
    isAuthenticated(),
  );

  useEffect(() => {
    const syncAuthState = () => {
      setCanShowRecommendations(isAuthenticated());
    };

    window.addEventListener("auth:changed", syncAuthState);
    return () => window.removeEventListener("auth:changed", syncAuthState);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setBestsellersError("");

        const [sliderResult, dealsResult, bestsellersResult] =
          await Promise.allSettled([
            fetchHomeSlider(6),
            fetchTopDeals(6),
            fetchBestsellers(6),
          ]);

        if (!alive) {
          return;
        }

        if (sliderResult.status === "fulfilled") {
          setSliderGames(Array.isArray(sliderResult.value) ? sliderResult.value : []);
        } else {
          setSliderGames([]);
        }

        if (dealsResult.status === "fulfilled") {
          setTopDeals(Array.isArray(dealsResult.value) ? dealsResult.value : []);
        } else {
          setTopDeals([]);
        }

        if (bestsellersResult.status === "fulfilled") {
          setBestsellers(
            Array.isArray(bestsellersResult.value) ? bestsellersResult.value : [],
          );
        } else {
          setBestsellers([]);
          setBestsellersError(
            bestsellersResult.reason?.response?.data?.message ||
              t("home.failedBestsellers"),
          );
        }

        if (
          sliderResult.status === "rejected" ||
          dealsResult.status === "rejected"
        ) {
          setErr(
            sliderResult.reason?.response?.data?.message ||
              dealsResult.reason?.response?.data?.message ||
              t("home.failedLoad"),
          );
        }
      } catch (error) {
        if (!alive) {
          return;
        }
        setErr(error?.response?.data?.message || t("home.failedLoad"));
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  useEffect(() => {
    let alive = true;

    if (!canShowRecommendations) {
      setRecommendedGames([]);
      setRecommendationsError("");
      setRecommendationsLoading(false);
      return undefined;
    }

    (async () => {
      try {
        setRecommendationsLoading(true);
        setRecommendationsError("");

        const items = await fetchMyRecommendations(6);
        if (!alive) return;

        setRecommendedGames(Array.isArray(items) ? items : []);
      } catch (error) {
        if (!alive) return;

        if (error?.response?.status === 401) {
          setRecommendedGames([]);
          setCanShowRecommendations(false);
          return;
        }

        setRecommendationsError(
          error?.response?.data?.message || t("home.failedRecommendations"),
        );
      } finally {
        if (alive) {
          setRecommendationsLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [canShowRecommendations, t]);

  const sliderItems = useMemo(() => {
    const liveSlides = sliderGames.map((game, index) =>
      buildSlide(
        game,
        t,
        index === 0 ? t("home.dailyDeals") : t("home.topDiscounts"),
      ),
    );

    const fallbackDealSlides = topDeals.map((game, index) =>
      buildSlide(
        game,
        t,
        index === 0 ? t("home.dailyDeals") : t("home.topDiscounts"),
      ),
    );

    const mergedSlides = dedupeSlides([...liveSlides, ...fallbackDealSlides]).slice(
      0,
      6,
    );

    if (mergedSlides.length > 0) {
      return mergedSlides;
    }

      return [
      {
        title: t("home.topDealsWeekTitle"),
        subtitle: t("home.topDealsWeekSubtitle"),
        image: FALLBACK_IMG,
        badge: t("home.hot"),
        meta: t("home.dealsMeta"),
        to: "/catalog",
        secondaryTo: "/catalog",
        sectionTitle: t("home.featuredPicks"),
        price: null,
        oldPrice: null,
      },
      {
        title: t("home.neonPlayPicksTitle"),
        subtitle: t("home.neonPlayPicksSubtitle"),
        image: FALLBACK_IMG,
        badge: t("home.new"),
        meta: t("home.actionIndieRpg"),
        to: "/catalog",
        secondaryTo: "/catalog",
        sectionTitle: t("home.freshDeals"),
        price: null,
        oldPrice: null,
      },
      {
        title: t("home.playInstantlyTitle"),
        subtitle: t("home.playInstantlySubtitle"),
        image: FALLBACK_IMG,
        badge: t("home.fast"),
        meta: t("home.checkoutMeta"),
        to: "/catalog",
        secondaryTo: "/catalog",
        sectionTitle: t("home.weeklyDeals"),
        price: null,
        oldPrice: null,
      },
    ];
  }, [sliderGames, t, topDeals]);

  const categories = [
    { value: "RPG", label: t("home.rpg") },
    { value: "Action", label: t("home.action") },
    { value: "Indie", label: t("home.indie") },
    { value: "Sports", label: t("home.sports") },
    { value: "Racing", label: t("home.racing") },
    { value: "Adventure", label: t("home.adventure") },
  ];

  return (
    <div>
      <section className="relative border-b border-white/10 text-white">
        <img
          src={FALLBACK_IMG}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.08] contrast-[1.08] saturate-[1.18]"
        />
        <div className="absolute inset-0 bg-black/8" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.44)_0%,rgba(2,6,23,0.22)_40%,rgba(2,6,23,0.5)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_38%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-14 text-center lg:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">
              {t("home.promoTag")}
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              {t("home.title")}{" "}
              <span className="text-white/70">{t("home.titleAccent")}</span>
            </h1>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/catalog"
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-black"
              >
                {t("home.browseCatalog")}
              </Link>
              <Link
                to="/catalog"
                className="rounded-2xl border border-white/30 px-6 py-3 text-white transition hover:bg-white/10"
              >
                {t("home.viewTopDeals")}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Link
                  key={category.value}
                  to={`/catalog?genre=${encodeURIComponent(category.value)}`}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs hover:bg-white/20"
                >
                  {category.label}
                </Link>
              ))}
            </div>

            {err && <div className="mt-5 text-sm text-red-200">{err}</div>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[58rem] px-4 py-10">
        <HeroSlider items={sliderItems} autoMs={5200} />
      </section>

      <section className="mx-auto max-w-[74rem] px-4 py-12">
        {canShowRecommendations ? (
          <div className="mb-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                  {t("home.recommendationBadge")}
                </div>
                <h2 className="mt-3 text-[2rem] font-bold text-white">
                  {t("home.recommendedForYou")}
                </h2>
              </div>
            </div>

            {recommendationsLoading ? (
              <div className="mt-6 text-sm text-white/70">
                {t("home.loadingRecommendations")}
              </div>
            ) : recommendationsError ? (
              <div className="mt-6 text-sm text-red-200">
                {recommendationsError}
              </div>
            ) : recommendedGames.length === 0 ? (
              <div className="mt-6 text-sm text-white/70">
                {t("home.noRecommendations")}
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {recommendedGames.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
              {t("home.trendingDiscounts")}
            </div>
            <h2 className="mt-3 text-[2rem] font-bold text-white">
              {t("home.topDeals")}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {t("home.bestDiscounts")}
            </p>
          </div>

          <Link
            to="/catalog"
            className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            {t("home.viewAll")}
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-white/70">{t("home.loadingGames")}</div>
        ) : topDeals.length === 0 ? (
          <div className="mt-6 text-sm text-white/70">{t("home.noDeals")}</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {topDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                {t("home.bestsellersBadge")}
              </div>
              <h2 className="mt-3 text-[2rem] font-bold text-white">
                {t("home.bestsellers")}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {t("home.bestsellersLead")}
              </p>
            </div>

            <Link
              to="/catalog"
              className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              {t("home.viewAll")}
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 text-sm text-white/70">
              {t("home.loadingBestsellers")}
            </div>
          ) : bestsellersError ? (
            <div className="mt-6 text-sm text-red-200">{bestsellersError}</div>
          ) : bestsellers.length === 0 ? (
            <div className="mt-6 text-sm text-white/70">
              {t("home.noBestsellers")}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
