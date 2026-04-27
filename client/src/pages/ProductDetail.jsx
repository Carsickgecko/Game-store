import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { fetchSimilarGames } from "../api/ai.js";
import ProductCard from "../components/product/ProductCard.jsx";
import RatingStars from "../components/common/RatingStars.jsx";
import ReviewsPanel from "../components/product/ReviewsPanel.jsx";
import {
  addToCart,
  isWishlisted,
  loadWishlist,
  toggleWishlist,
} from "../store/actions.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { fetchGameById, fetchGames } from "../api/games.js";
import { fetchGameReviews } from "../api/reviews.js";
import { toImageUrl } from "../utils/image.js";
import {
  localizeGenre,
  localizePlatform,
} from "../utils/localizeStoreValue.js";

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-medium text-white/85">{value}</span>
    </div>
  );
}

export default function ProductDetail() {
  const { t } = useLanguage();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [all, setAll] = useState([]);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reviewSummary, setReviewSummary] = useState({
    count: 0,
    average: null,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const [nextProduct, list] = await Promise.all([
          fetchGameById(id),
          fetchGames(),
        ]);
        let nextSimilarGames = [];

        try {
          nextSimilarGames = await fetchSimilarGames(id, 6);
        } catch {
          nextSimilarGames = [];
        }

        if (!alive) return;

        setProduct(nextProduct || null);
        setAll(Array.isArray(list) ? list : []);
        setSimilarGames(Array.isArray(nextSimilarGames) ? nextSimilarGames : []);
      } catch {
        if (!alive) return;
        setProduct(null);
        setAll([]);
        setSimilarGames([]);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product?.id) {
      setWished(false);
      return undefined;
    }

    let active = true;

    const syncWishlistState = () => {
      if (active) {
        setWished(isWishlisted(product.id));
      }
    };

    syncWishlistState();

    (async () => {
      try {
        await loadWishlist();
      } finally {
        syncWishlistState();
      }
    })();

    window.addEventListener("store:changed", syncWishlistState);
    window.addEventListener("auth:changed", syncWishlistState);

    return () => {
      active = false;
      window.removeEventListener("store:changed", syncWishlistState);
      window.removeEventListener("auth:changed", syncWishlistState);
    };
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) {
      setReviewSummary({ count: 0, average: null });
      return undefined;
    }

    let active = true;

    const syncReviews = async () => {
      try {
        const data = await fetchGameReviews(product.id);
        if (!active) return;

        setReviewSummary({
          count: Number(data?.summary?.count || 0),
          average:
            data?.summary?.average === null ||
            data?.summary?.average === undefined
              ? null
              : Number(data.summary.average),
        });
      } catch {
        if (!active) return;
        setReviewSummary({ count: 0, average: null });
      }
    };

    syncReviews();

    const onReviewsChanged = (event) => {
      const changedProductId = Number(event?.detail?.productId);
      if (!changedProductId || changedProductId !== Number(product.id)) {
        return;
      }

      const summary = event?.detail?.summary || {};
      setReviewSummary({
        count: Number(summary.count || 0),
        average:
          summary.average === null || summary.average === undefined
            ? null
            : Number(summary.average),
      });
    };

    window.addEventListener("reviews:changed", onReviewsChanged);
    return () => {
      active = false;
      window.removeEventListener("reviews:changed", onReviewsChanged);
    };
  }, [product?.id]);

  const related = useMemo(() => {
    if (!product) return [];

    return all
      .filter((item) => item.id !== product.id)
      .filter(
        (item) =>
          item.genre === product.genre || item.platform === product.platform,
      )
      .slice(0, 6);
  }, [product, all]);

  const displaySimilarGames = useMemo(() => {
    const seen = new Set();

    return [...similarGames, ...related]
      .filter((item) => item?.id && item.id !== product?.id)
      .filter((item) => {
        const key = Number(item.id);

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [product?.id, related, similarGames]);

  const price = Number(product?.price || 0);
  const oldPrice = Number(product?.oldPrice || 0);
  const discount =
    oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const effectiveRating = Number(
    (reviewSummary.average ?? product?.rating) || 0,
  );
  const fullDescription =
    product?.longDescription || product?.description || "";
  const screenshots = Array.isArray(product?.screenshots)
    ? product.screenshots.filter(Boolean)
    : [];
  const detailRows = useMemo(
    () => [
      {
        label: t("common.genre"),
        value: localizeGenre(product?.genre, t) || "N/A",
      },
      {
        label: t("common.platform"),
        value: localizePlatform(product?.platform || "PC", t),
      },
      {
        label: t("reviews.averageRating"),
        value: `${effectiveRating.toFixed(1)} / 5.0`,
      },
      {
        label: t("reviews.title"),
        value: t("reviews.reviewCount", { count: reviewSummary.count }),
      },
    ],
    [effectiveRating, product?.genre, product?.platform, reviewSummary.count, t],
  );

  const handleToggleWishlist = async () => {
    if (wishlistBusy) return;

    setActionError("");
    setWishlistBusy(true);

    try {
      const next = await toggleWishlist(product);
      setWished(next.some((item) => item.id === product.id));
    } catch (error) {
      setActionError(
        error?.response?.data?.message || t("productDetail.failedWishlist"),
      );
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleAddToCart = async () => {
    if (cartBusy) return;

    setActionError("");
    setCartBusy(true);

    try {
      await addToCart(product, qty);
    } catch (error) {
      setActionError(
        error?.response?.data?.message || t("productDetail.failedCart"),
      );
    } finally {
      setCartBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-white">
        <div className="rounded-[30px] border border-white/8 bg-[#262626] px-6 py-10">
          <p className="text-white/60">{t("productDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-white">
        <div className="rounded-[30px] border border-white/8 bg-[#262626] px-6 py-10">
          <p className="text-lg text-white">{t("productDetail.notFound")}</p>
          <Link
            to="/catalog"
            className="mt-3 inline-block text-sm text-white/70 underline"
          >
            {t("productDetail.backToCatalog")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-white">
      <section className="relative overflow-hidden rounded-[34px] border border-white/8 bg-[#1f1f1f] shadow-[0_34px_70px_-42px_rgba(0,0,0,0.95)]">
        <div className="absolute inset-0">
          <img
            src={toImageUrl(product.image)}
            alt={product.name}
            className="h-full w-full scale-110 object-cover opacity-20 blur-2xl"
            onError={(event) => {
              event.currentTarget.src = "/images/hero-bg.jpg";
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,10,10,0.94),rgba(20,20,20,0.72),rgba(20,20,20,0.94))]" />
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="text-sm text-white/50">
            <Link to="/" className="hover:text-white">
              {t("common.home")}
            </Link>{" "}
            /{" "}
            <Link to="/catalog" className="hover:text-white">
              {t("common.catalog")}
            </Link>{" "}
            / <span className="text-white/78">{product.name}</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/25 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={toImageUrl(product.image)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                  onError={(event) => {
                    event.currentTarget.src = "/images/hero-bg.jpg";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                {discount > 0 ? (
                  <div className="absolute left-5 top-5 rounded-full bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(220,38,38,0.95)]">
                    -{discount}%
                  </div>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-3 px-5 pb-5">
                  <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/88 backdrop-blur-sm">
                    {localizeGenre(product.genre, t)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/88 backdrop-blur-sm">
                    {localizePlatform(product.platform || "PC", t)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/88 backdrop-blur-sm">
                    {effectiveRating.toFixed(1)} / 5.0
                  </div>
                </div>
              </div>
            </div>

            <div className="self-start rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/72">
                <div className="flex items-center gap-2">
                  <RatingStars value={effectiveRating} />
                  <span className="font-semibold text-white">
                    {effectiveRating.toFixed(1)}
                  </span>
                  <span className="text-white/40">/ 5.0</span>
                </div>
                <span className="text-white/32">|</span>
                <span>{t("reviews.reviewCount", { count: reviewSummary.count })}</span>
              </div>

              <div className="mt-7 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-4xl font-extrabold leading-none text-white">
                      ${price.toFixed(2)}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      {oldPrice > price ? (
                        <span className="text-lg text-white/36 line-through">
                          ${oldPrice.toFixed(2)}
                        </span>
                      ) : null}
                      {discount > 0 ? (
                        <span className="rounded-full border border-[#dc2626]/30 bg-[#dc2626]/10 px-3 py-1 text-sm font-semibold text-[#fca5a5]">
                          -{discount}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty((value) => Math.max(1, value - 1))}
                    className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 text-xl text-white transition hover:border-white/20 hover:bg-white/10"
                  >
                    -
                  </button>

                  <input
                    value={qty}
                    onChange={(event) =>
                      setQty(
                        Math.max(
                          1,
                          Number(String(event.target.value).replace(/\D/g, "") || 1),
                        ),
                      )
                    }
                    className="h-12 w-20 rounded-2xl border border-white/10 bg-white/5 text-center text-lg font-semibold text-white outline-none"
                    inputMode="numeric"
                  />

                  <button
                    type="button"
                    onClick={() => setQty((value) => value + 1)}
                    className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 text-xl text-white transition hover:border-white/20 hover:bg-white/10"
                  >
                    +
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    disabled={wishlistBusy}
                    className={`inline-flex h-14 items-center justify-center gap-3 rounded-2xl border px-5 text-sm font-semibold transition sm:w-16 sm:px-0 ${
                      wished
                        ? "border-[#dc2626] bg-[#dc2626] text-white"
                        : "border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                    }`}
                    aria-label={t("productDetail.addToWishlist")}
                    title={t("productDetail.addToWishlist")}
                  >
                    {wished ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                    <span className="sm:hidden">
                      {wished
                        ? t("productDetail.savedToWishlist")
                        : t("productDetail.addToWishlist")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={cartBusy}
                    className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#dc2626,#ef4444)] px-6 text-base font-semibold text-white shadow-[0_22px_40px_-24px_rgba(220,38,38,0.95)] transition hover:brightness-110"
                  >
                    <FiShoppingCart className="size-5" />
                    {cartBusy ? t("productDetail.adding") : t("productDetail.addToCart")}
                  </button>
                </div>

                {actionError ? (
                  <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {actionError}
                  </div>
                ) : null}

              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[30px] border border-white/8 bg-[#1d1d1d] p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/42">
          {product.name}
        </div>
        <h2 className="mt-4 text-3xl font-bold text-white">
          {t("productDetail.description")}
        </h2>
        <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/72">
          {fullDescription}
        </p>

        {screenshots.length > 0 ? (
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {screenshots.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="overflow-hidden rounded-[22px] border border-white/8 bg-black/20"
                >
                  <img
                    src={toImageUrl(imageUrl)}
                    alt={`${product.name} screenshot ${index + 1}`}
                    className="aspect-[16/9] h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = toImageUrl(product.image);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8 rounded-[30px] border border-white/8 bg-[#1d1d1d] p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/42">
          {t("common.genre")} · {t("common.platform")} · {t("reviews.title")}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-x-10">
          {detailRows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </section>

      {displaySimilarGames.length > 0 ? (
        <section className="mt-8 rounded-[30px] border border-white/8 bg-[#1d1d1d] p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t("productDetail.similarGames")}
              </h2>
              <p className="mt-2 text-sm text-white/58">
                {t("productDetail.similarGamesLead")}
              </p>
            </div>

            <Link to="/catalog" className="text-sm text-white/70 underline hover:text-white">
              {t("productDetail.viewAll")}
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {displaySimilarGames.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <ReviewsPanel productId={product.id} />
      </div>
    </div>
  );
}
