import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getCartItems } from "../store/storage.js";
import { removeFromCart, updateCartQty } from "../store/actions.js";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  const reload = () => setItems(getCartItems());

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener("store:changed", onChange);
    return () => window.removeEventListener("store:changed", onChange);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * (it.qty || 1), 0),
    [items],
  );

  const fee = subtotal > 0 ? 1.99 : 0;
  const total = subtotal + fee;

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Cart</h1>
        <p className="mt-3 text-black/60">Your cart is empty.</p>
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
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-sm text-black/60">Review your items</p>
        </div>
        <Link to="/catalog" className="text-sm underline">
          Continue shopping
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Items */}
        <section className="rounded-2xl border bg-white overflow-hidden">
          {items.map((it) => (
            <div
              key={it.id}
              className="p-4 border-b last:border-b-0 flex gap-4"
            >
              <img
                src={it.image}
                alt={it.name}
                className="w-24 h-24 rounded-xl object-cover border"
              />

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${it.id}`}
                  className="font-semibold hover:underline"
                >
                  {it.name}
                </Link>
                <div className="mt-1 text-xs text-black/60">
                  {it.genre} • {it.platform}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        updateCartQty(it.id, (it.qty || 1) - 1);
                        reload();
                      }}
                      className="w-9 h-9 rounded-xl border hover:bg-black hover:text-white transition"
                    >
                      −
                    </button>
                    <input
                      value={it.qty || 1}
                      onChange={(e) => {
                        updateCartQty(it.id, Number(e.target.value || 1));
                        reload();
                      }}
                      className="w-14 h-9 rounded-xl border text-center outline-none"
                    />
                    <button
                      onClick={() => {
                        updateCartQty(it.id, (it.qty || 1) + 1);
                        reload();
                      }}
                      className="w-9 h-9 rounded-xl border hover:bg-black hover:text-white transition"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      removeFromCart(it.id);
                      reload();
                    }}
                    className="text-sm underline text-black/70 hover:text-black"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold">${it.price.toFixed(2)}</div>
                <div className="text-xs text-black/60 mt-1">
                  Line: ${(it.price * (it.qty || 1)).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Summary */}
        <aside className="rounded-2xl border bg-white p-5 h-fit">
          <div className="font-semibold">Order summary</div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-black/70">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Service fee</span>
              <span>${fee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="mt-5 w-full px-4 py-3 rounded-xl bg-black text-white hover:opacity-90 transition"
          >
            Go to checkout
          </button>

          <p className="mt-3 text-xs text-black/60">
            Demo checkout. No payment is processed.
          </p>
        </aside>
      </div>
    </div>
  );
}
