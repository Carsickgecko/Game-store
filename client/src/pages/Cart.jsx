import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getCartItems, setCartItems } from "../store/storage.js";
import { toImageUrl } from "../utils/image.js";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const update = () => setItems(getCartItems());
    update();

    window.addEventListener("store:changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("store:changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const save = (next) => {
    setCartItems(next); // storage.js sẽ emit store:changed
  };

  const inc = (id) => {
    const next = items.map((x) =>
      x.id === id ? { ...x, qty: (x.qty || 1) + 1 } : x,
    );
    save(next);
  };

  const dec = (id) => {
    const next = items.map((x) =>
      x.id === id ? { ...x, qty: Math.max(1, (x.qty || 1) - 1) } : x,
    );
    save(next);
  };

  const remove = (id) => {
    const next = items.filter((x) => x.id !== id);
    save(next);
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, x) => {
      const price = Number(x.price || 0);
      const qty = Number(x.qty || 1);
      return sum + price * qty;
    }, 0);
  }, [items]);

  const serviceFee = subtotal > 0 ? 1.99 : 0;
  const total = subtotal + serviceFee;

  if (!items.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Cart</h1>
        <p className="mt-2 text-black/60">Your cart is empty.</p>
        <Link to="/catalog" className="inline-block mt-4 underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-sm text-black/60">Review your items</p>
        </div>
        <Link to="/catalog" className="text-sm underline">
          Continue shopping
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left */}
        <div className="space-y-3">
          {items.map((x) => (
            <div
              key={x.id}
              className="rounded-2xl border bg-white p-4 flex gap-4"
            >
              <Link to={`/product/${x.id}`} className="shrink-0">
                <div className="w-32 aspect-[16/9] bg-black/5 overflow-hidden rounded-xl">
                  <img
                    src={toImageUrl(x.image)}
                    alt={x.name || "Game"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/images/hero-bg.jpg";
                    }}
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/product/${x.id}`}
                      className="font-semibold line-clamp-1 hover:underline"
                    >
                      {x.name}
                    </Link>
                    <div className="mt-1 text-xs text-black/60">
                      {x.genre || "Unknown"} • {x.platform || "PC"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">
                      ${Number(x.price || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-black/50">
                      Line: $
                      {(Number(x.price || 0) * Number(x.qty || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="w-9 h-9 rounded-xl border hover:bg-black hover:text-white transition"
                      onClick={() => dec(x.id)}
                      type="button"
                    >
                      −
                    </button>

                    <div className="w-10 text-center font-semibold">
                      {x.qty || 1}
                    </div>

                    <button
                      className="w-9 h-9 rounded-xl border hover:bg-black hover:text-white transition"
                      onClick={() => inc(x.id)}
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="text-sm underline text-black/60 hover:text-black"
                    onClick={() => remove(x.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right */}
        <aside className="rounded-2xl border bg-white p-5 h-fit">
          <div className="font-semibold">Order summary</div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-black/60">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Service fee</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="mt-5 w-full px-4 py-3 rounded-xl bg-black text-white"
            onClick={() => navigate("/checkout")}
            type="button"
          >
            Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}
