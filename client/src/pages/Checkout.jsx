// client/src/pages/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCartItems, setCartItems } from "../store/storage.js";
import { isAuthenticated } from "../store/auth.js";
import { addToLibrary } from "../api/library.js";

const METHODS = [
  { id: "applepay", label: "Apple Pay", fee: 0, icon: "🍎" },
  { id: "revolut", label: "Revolut Pay", fee: 0, icon: "Ⓡ" },
  { id: "card", label: "Thẻ (Card payment)", fee: 0, icon: "💳" },
  { id: "paypal", label: "PayPal", fee: 0.2, icon: "🅿️" },
  { id: "qrcode", label: "QR Code", fee: 0.0, icon: "🔳" },
  { id: "blik", label: "BLIK", fee: 0.84, icon: "🔵" },
];

function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}
function formatCardNumber(value) {
  const d = onlyDigits(value).slice(0, 19);
  return d.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(value) {
  const d = onlyDigits(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
function isValidExpiry(mmYY) {
  if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false;
  const mm = Number(mmYY.slice(0, 2));
  const yy = Number(mmYY.slice(3, 5));
  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const curYY = Number(String(now.getFullYear()).slice(2));
  const curMM = now.getMonth() + 1;

  if (yy < curYY) return false;
  if (yy === curYY && mm < curMM) return false;
  return true;
}

export default function Checkout() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [method, setMethod] = useState("card");

  const [form, setForm] = useState({
    email: "",
    name: "",
    country: "Poland",
    city: "Warsaw",
    address: "",
    zip: "",
  });

  const [card, setCard] = useState({
    number: "",
    holder: "",
    expiry: "",
    cvv: "",
  });

  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    setItems(getCartItems());
  }, [navigate]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * (it.qty || 1), 0),
    [items],
  );

  const serviceFee = subtotal > 0 ? 1.99 : 0;

  const methodFee = useMemo(() => {
    const m = METHODS.find((x) => x.id === method);
    return m ? m.fee : 0;
  }, [method]);

  const total = subtotal + serviceFee + methodFee;

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-3 text-black/60">Your cart is empty.</p>
        <Link to="/catalog" className="underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const validateCard = () => {
    const num = onlyDigits(card.number);
    if (num.length < 13 || num.length > 19) return "Card number is invalid.";
    if (!card.holder.trim()) return "Card holder name is required.";
    if (!isValidExpiry(card.expiry)) return "Expiry is invalid (MM/YY).";
    const cvv = onlyDigits(card.cvv);
    if (cvv.length < 3 || cvv.length > 4) return "CVV is invalid.";
    return "";
  };

  const onPay = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.email || !form.name || !form.address || !form.zip) {
      setErr("Please fill in contact and address information.");
      return;
    }

    if (method === "card") {
      const cardErr = validateCard();
      if (cardErr) {
        setErr(cardErr);
        return;
      }
    }

    try {
      // ✅ LƯU VÀO LIBRARY TRƯỚC
      const gameIds = items.map((it) => it.id);
      await addToLibrary(gameIds);

      // ✅ clear cart + go thank you
      setCartItems([]);
      setItems([]);
      navigate("/thank-you");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to save library.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-black/60">Enter your details</p>
        </div>
        <Link to="/cart" className="text-sm underline">
          Back to cart
        </Link>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border px-4 py-3 text-sm bg-black text-white">
          {err}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left */}
        <form onSubmit={onPay} className="rounded-2xl border bg-white p-5">
          <div className="font-semibold">Contact & Address</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-black/70">Email</label>
              <input
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="you@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-black/70">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm text-black/70">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-black/70">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-black/70">Address</label>
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="Street, building..."
              />
            </div>

            <div>
              <label className="text-sm text-black/70">ZIP</label>
              <input
                required
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="00-000"
              />
            </div>
          </div>

          {/* Payment methods */}
          <div className="mt-8">
            <div className="font-semibold">Phương thức thanh toán</div>

            <div className="mt-4 space-y-3">
              {METHODS.map((m) => {
                const selected = m.id === method;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition ${
                      selected
                        ? "border-orange-500 ring-1 ring-orange-500"
                        : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center text-xl">
                      {m.icon}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold">{m.label}</div>
                      {m.fee > 0 && (
                        <div className="text-xs text-black/60">
                          +{m.fee.toFixed(2)} €
                        </div>
                      )}
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selected ? "border-orange-500" : "border-black/30"
                      }`}
                    >
                      {selected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Card payment */}
            {method === "card" && (
              <div className="mt-4 rounded-2xl border p-4 bg-black/5">
                <div className="font-semibold">Card details</div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-black/70">Card number</label>
                    <input
                      value={card.number}
                      onChange={(e) =>
                        setCard({
                          ...card,
                          number: formatCardNumber(e.target.value),
                        })
                      }
                      className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-black/70">Card holder</label>
                    <input
                      value={card.holder}
                      onChange={(e) =>
                        setCard({ ...card, holder: e.target.value })
                      }
                      className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                      placeholder="NAME SURNAME"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-black/70">
                      Expiry (MM/YY)
                    </label>
                    <input
                      value={card.expiry}
                      onChange={(e) =>
                        setCard({
                          ...card,
                          expiry: formatExpiry(e.target.value),
                        })
                      }
                      className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                      placeholder="MM/YY"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-black/70">CVV</label>
                    <input
                      value={card.cvv}
                      onChange={(e) =>
                        setCard({
                          ...card,
                          cvv: onlyDigits(e.target.value).slice(0, 4),
                        })
                      }
                      className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                      placeholder="123"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-black/60">
                  Demo only: payment is not processed.
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-8 w-full px-4 py-3 rounded-xl bg-black text-white hover:opacity-90 transition"
          >
            Place order (demo)
          </button>

          <p className="mt-3 text-xs text-black/60">
            Demo checkout: will save purchased games to UserLibrary.
          </p>
        </form>

        {/* Right */}
        <aside className="rounded-2xl border bg-white p-5 h-fit">
          <div className="font-semibold">Order summary</div>

          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <img
                  src={it.image}
                  alt={it.name}
                  className="w-12 h-12 rounded-xl object-cover border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium line-clamp-1">
                    {it.name}
                  </div>
                  <div className="text-xs text-black/60">
                    Qty: {it.qty || 1}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  ${(it.price * (it.qty || 1)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-black/70">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-black/70">Service fee</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-black/70">Payment fee</span>
              <span>${methodFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
