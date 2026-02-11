import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWishlistItems } from "../store/storage.js";
import { addToCart, toggleWishlist } from "../store/actions.js";

export default function Wishlist() {
  const [items, setItems] = useState([]);

  const reload = () => setItems(getWishlistItems());

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener("store:changed", onChange);
    return () => window.removeEventListener("store:changed", onChange);
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <p className="mt-3 text-black/60">No games saved yet.</p>
        <Link
          to="/catalog"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-black text-white"
        >
          Browse deals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
            <Link to={`/product/${p.id}`} className="block">
              <img
                src={p.image}
                alt={p.name}
                className="h-44 w-full object-cover"
              />
            </Link>

            <div className="p-4">
              <Link
                to={`/product/${p.id}`}
                className="font-semibold hover:underline"
              >
                {p.name}
              </Link>
              <div className="mt-1 text-xs text-black/60">
                {p.genre} • {p.platform} • ⭐ {p.rating}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="font-bold">${p.price.toFixed(2)}</div>

                <button
                  onClick={() => {
                    toggleWishlist(p);
                    reload();
                  }}
                  className="text-sm underline text-black/70 hover:text-black"
                >
                  Remove
                </button>
              </div>

              <button
                onClick={() => addToCart(p, 1)}
                className="mt-4 w-full px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition"
              >
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
