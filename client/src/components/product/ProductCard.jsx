import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaCartPlus, FaHeart, FaRegHeart } from "react-icons/fa";
import {
  addToCart,
  toggleWishlist,
  isWishlisted,
} from "../../store/actions.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { toImageUrl } from "../../utils/image.js";

export default function ProductCard({ product, mode = "store" }) {
  const { t } = useLanguage();
  const [wished, setWished] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  useEffect(() => {
    if (!product?.id) {
      setWished(false);
      return undefined;
    }

    const syncWishlistState = () => {
      setWished(isWishlisted(product.id));
    };

    syncWishlistState();
    window.addEventListener("store:changed", syncWishlistState);
    window.addEventListener("auth:changed", syncWishlistState);

    return () => {
      window.removeEventListener("store:changed", syncWishlistState);
      window.removeEventListener("auth:changed", syncWishlistState);
    };
  }, [product?.id]);

  const discount = useMemo(() => {
    const price = Number(product?.price);
    const oldPrice = Number(product?.oldPrice);

    if (
      !oldPrice ||
      Number.isNaN(price) ||
      Number.isNaN(oldPrice) ||
      oldPrice <= price
    ) {
      return 0;
    }

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }, [product]);

  if (!product) return null;

  const price = Number(product.price);
  const oldPrice = Number(product.oldPrice);
  const showStoreUI = mode !== "library";

  const handleAddToCart = async () => {
    try {
      await addToCart(product);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  const handleToggleWishlist = async () => {
    if (wishlistBusy) return;

    setWishlistBusy(true);
    try {
      const next = await toggleWishlist(product);
      setWished(next.some((item) => item.id === product.id));
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-[22px] bg-[#171717] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.95)]">
        <Link to={`/product/${product.id}`} className="block relative">
          <div className="aspect-[16/9] overflow-hidden bg-[#111111]">
            <img
              src={toImageUrl(product.image)}
              alt={product.name || t("common.game")}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              onError={(e) => (e.currentTarget.src = "/images/hero-bg.jpg")}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          {showStoreUI && discount > 0 && (
            <div className="absolute bottom-0 left-0 rounded-tr-2xl bg-[#dc2626] px-3 py-1.5 text-sm font-bold text-white shadow-[0_12px_24px_-18px_rgba(220,38,38,0.95)]">
              -{discount}%
            </div>
          )}
        </Link>

        {showStoreUI && (
          <div className="pointer-events-none absolute right-3 top-3">
            <button
              type="button"
              disabled={wishlistBusy}
            className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border transition ${
                wished
                  ? "border-[#dc2626] bg-[#dc2626] text-white"
                  : "border-white/15 bg-black/45 text-white/90 backdrop-blur-sm hover:border-white/25 hover:bg-black/65"
              }`}
              onClick={handleToggleWishlist}
              aria-label={t("productCard.toggleWishlist")}
              title={t("productCard.wishlist")}
            >
              {wished ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
            </button>
          </div>
        )}

        {showStoreUI && (
          <div className="pointer-events-none absolute bottom-3 right-3 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-[0_18px_28px_-18px_rgba(220,38,38,0.95)] transition hover:scale-105 hover:bg-[#ef4444]"
              onClick={handleAddToCart}
              aria-label={t("productCard.addToCart")}
              title={t("productCard.addToCart")}
            >
              <FaCartPlus size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3 text-white">
        <div className="min-w-0 flex-1">
          <Link to={`/product/${product.id}`} className="block">
            <div className="line-clamp-1 text-lg font-semibold leading-tight transition hover:text-white/80">
              {product.name}
            </div>
            <div className="mt-1 text-sm text-white/62">
              {product.rating
                ? `${t("common.rating")} ${product.rating}`
                : t("common.unknown")}
            </div>
          </Link>
        </div>

        {showStoreUI && (
          <div className="shrink-0 text-right">
            <div className="text-[2rem] font-extrabold leading-none tracking-tight">
              {Number.isFinite(price) ? `$${price.toFixed(2)}` : "$0.00"}
            </div>

            {Number.isFinite(oldPrice) && oldPrice > price && (
              <div className="mt-1 text-sm text-white/45 line-through">
                ${oldPrice.toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>

      {!showStoreUI && (
        <div className="mt-2 text-sm text-white/60">{t("productCard.inLibrary")}</div>
      )}
    </div>
  );
}
