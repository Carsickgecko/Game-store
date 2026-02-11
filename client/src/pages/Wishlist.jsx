import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getWishlistItems } from "../store/storage.js";
import { addToCart, toggleWishlist } from "../store/actions.js";
import { toImageUrl } from "../utils/image.js";

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const update = () => setItems(getWishlistItems());
    update();

    window.addEventListener("store:changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("store:changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const onRemove = (p) => {
    toggleWishlist(p); // action sẽ tự setWishlistItems + emit
  };

  if (!items.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <p className="mt-2 text-black/60">No games saved yet.</p>
        <Link to="/catalog" className="inline-block mt-4 underline">
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wishlist</h1>
          <p className="text-sm text-black/60">Games you saved</p>
        </div>
        <Link to="/catalog" className="text-sm underline">
          Browse more
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border bg-white overflow-hidden"
          >
            <Link to={`/product/${p.id}`} className="block relative">
              <div className="aspect-[16/9] bg-black/5 overflow-hidden">
                <img
                  src={toImageUrl(p.image)}
                  alt={p.name || "Game"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/images/hero-bg.jpg";
                  }}
                />
              </div>
            </Link>

            <div className="p-4">
              <Link to={`/product/${p.id}`} className="block">
                <div className="font-semibold line-clamp-1">{p.name}</div>
                <div className="mt-1 text-xs text-black/60">
                  {p.genre || "Unknown"} • {p.platform || "PC"}{" "}
                  {p.rating ? `• ⭐ ${Number(p.rating).toFixed(1)}` : ""}
                </div>
              </Link>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="font-bold">
                  ${Number(p.price || 0).toFixed(2)}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 rounded-xl bg-black text-white font-semibold"
                  onClick={() => addToCart(p, 1)}
                >
                  Add to cart
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border text-sm hover:bg-black hover:text-white transition"
                  onClick={() => onRemove(p)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
