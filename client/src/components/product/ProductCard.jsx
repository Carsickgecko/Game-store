import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  addToCart,
  toggleWishlist,
  isWishlisted,
} from "../../store/actions.js";
import { toImageUrl } from "../../utils/image.js";

export default function ProductCard({ product, mode = "store" }) {
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (product) setWished(isWishlisted(product.id));
  }, [product]);

  const discount = useMemo(() => {
    const price = Number(product?.price);
    const oldPrice = Number(product?.oldPrice);

    if (
      !oldPrice ||
      Number.isNaN(price) ||
      Number.isNaN(oldPrice) ||
      oldPrice <= price
    )
      return 0;

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }, [product]);

  if (!product) return null;

  const price = Number(product.price);
  const oldPrice = Number(product.oldPrice);
  const showStoreUI = mode !== "library";

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-[16/9] bg-black/5 overflow-hidden">
          <img
            src={toImageUrl(product.image)}
            alt={product.name || "Game"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => (e.currentTarget.src = "/images/hero-bg.jpg")}
          />
        </div>

        {showStoreUI && discount > 0 && (
          <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-black text-white">
            -{discount}%
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`} className="block">
          <div className="font-semibold line-clamp-1">{product.name}</div>
          <div className="mt-1 text-xs text-black/60">
            {product.genre || "Unknown"} • {product.platform || "PC"}{" "}
            {product.rating ? `• ⭐ ${product.rating}` : ""}
          </div>
        </Link>

        {showStoreUI && (
          <div className="mt-3 flex items-end gap-2">
            <div className="text-lg font-bold">
              {Number.isFinite(price) ? `$${price.toFixed(2)}` : "$0.00"}
            </div>

            {Number.isFinite(oldPrice) && oldPrice > price && (
              <div className="text-sm line-through text-black/50">
                ${oldPrice.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {showStoreUI && (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-xl bg-black text-white font-semibold"
              onClick={() => addToCart(product)}
            >
              Add
            </button>

            <button
              type="button"
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
              onClick={() => {
                toggleWishlist(product);
                setWished(isWishlisted(product.id));
              }}
              aria-label="Toggle wishlist"
              title="Wishlist"
            >
              {wished ? "♥" : "♡"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
