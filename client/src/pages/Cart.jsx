import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiChevronLeft,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi";
import { getCartItems } from "../store/storage.js";
import { loadCart, removeFromCart, updateCartQty } from "../store/actions.js";
import { isAuthenticated } from "../store/auth.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { toImageUrl } from "../utils/image.js";
import CheckoutStepper from "../components/common/CheckoutStepper.jsx";

export default function Cart() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;

    const syncFromStore = () => {
      if (active) {
        setItems(getCartItems());
      }
    };

    const hydrateCart = async () => {
      try {
        setLoading(true);
        setErr("");

        const list = isAuthenticated() ? await loadCart() : getCartItems();
        if (!active) return;

        setItems(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!active) return;

        setItems(getCartItems());
        setErr(error?.response?.data?.message || t("cart.failedLoad"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateCart();

    window.addEventListener("store:changed", syncFromStore);
    window.addEventListener("storage", syncFromStore);
    window.addEventListener("auth:changed", hydrateCart);

    return () => {
      active = false;
      window.removeEventListener("store:changed", syncFromStore);
      window.removeEventListener("storage", syncFromStore);
      window.removeEventListener("auth:changed", hydrateCart);
    };
  }, [t]);

  const runItemAction = async (id, action) => {
    setBusyId(id);
    setErr("");

    try {
      const next = await action();
      setItems(Array.isArray(next) ? next : getCartItems());
    } catch (error) {
      setErr(error?.response?.data?.message || t("cart.failedUpdate"));
    } finally {
      setBusyId(null);
    }
  };

  const inc = (id) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;

    runItemAction(id, () => updateCartQty(id, (current.qty || 1) + 1));
  };

  const dec = (id) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;

    runItemAction(id, () =>
      updateCartQty(id, Math.max(1, (current.qty || 1) - 1)),
    );
  };

  const remove = (id) => {
    runItemAction(id, () => removeFromCart(id));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 1);
      return sum + price * qty;
    }, 0);
  }, [items]);

  const serviceFee = subtotal > 0 ? 1.99 : 0;
  const total = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <CheckoutStepper
        steps={[
          { label: t("cart.stepCart"), status: "current" },
          { label: t("cart.stepPayment"), status: "pending" },
          { label: t("cart.stepActivation"), status: "pending" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_398px]">
          <section>
            <div className="mb-5">
              <h1 className="text-3xl font-bold text-white">{t("cart.title")}</h1>
              {!loading && items.length > 0 ? (
                <p className="mt-2 text-sm text-white/52">{t("cart.reviewItems")}</p>
              ) : null}
            </div>

            {err ? (
              <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {err}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[28px] border border-white/8 bg-[#2f2f2f] px-6 py-8 text-white/60">
                {t("cart.loading")}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-white/8 bg-[#343434] px-6 py-12 text-center shadow-[0_28px_70px_-42px_rgba(0,0,0,0.95)]">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#dc2626]/12 text-[#dc2626]">
                  <FiShoppingCart className="size-10" />
                </div>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">
                  {t("cart.empty")}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/45">
                  {t("cart.emptyLead")}
                </p>
                <Link
                  to="/catalog"
                  className="mt-8 inline-flex items-center justify-center rounded-2xl border border-white/18 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:border-white/28 hover:bg-white/10"
                >
                  {t("cart.discoverGames")}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[28px] border border-white/8 bg-[#343434] p-5 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]"
                  >
                    <div className="flex flex-col gap-5 md:flex-row">
                      <Link to={`/product/${item.id}`} className="shrink-0">
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/20 md:w-64">
                          <img
                            src={toImageUrl(item.image)}
                            alt={item.name || "Game"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = "/images/hero-bg.jpg";
                            }}
                          />
                        </div>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <Link
                              to={`/product/${item.id}`}
                              className="line-clamp-2 text-2xl font-bold text-white transition hover:text-white/80"
                            >
                              {item.name}
                            </Link>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-sm text-white/78">
                                {item.genre || t("common.unknown")}
                              </span>
                              <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-sm text-white/78">
                                {item.platform || "PC"}
                              </span>
                            </div>
                          </div>

                          <div className="text-left md:text-right">
                            <div className="text-3xl font-extrabold text-white">
                              ${Number(item.price || 0).toFixed(2)}
                            </div>
                            <div className="mt-2 text-sm text-white/45">
                              {t("cart.line")}: $
                              {(
                                Number(item.price || 0) * Number(item.qty || 1)
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xl text-white transition hover:border-white/20 hover:bg-white/10"
                              onClick={() => dec(item.id)}
                              type="button"
                              disabled={busyId === item.id}
                            >
                              -
                            </button>

                            <div className="grid h-12 min-w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-lg font-semibold text-white">
                              {item.qty || 1}
                            </div>

                            <button
                              className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xl text-white transition hover:border-white/20 hover:bg-white/10"
                              onClick={() => inc(item.id)}
                              type="button"
                              disabled={busyId === item.id}
                            >
                              +
                            </button>
                          </div>

                          <button
                            className="inline-flex items-center gap-2 text-sm font-medium text-white/52 transition hover:text-white"
                            onClick={() => remove(item.id)}
                            type="button"
                            disabled={busyId === item.id}
                          >
                            <FiTrash2 className="size-4" />
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-[28px] border border-white/8 bg-[#101010] p-6 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.98)]">
            <div className="text-3xl font-bold text-white">{t("cart.summaryTitle")}</div>

            <div className="mt-8 space-y-4 text-base">
              <div className="flex items-center justify-between">
                <span className="text-white/52">{t("cart.subtotal")}</span>
                <span className="text-xl font-semibold text-white">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/52">{t("cart.serviceFee")}</span>
                <span className="text-lg font-medium text-white">
                  ${serviceFee.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-2xl font-semibold text-white">
                  {t("cart.total")}
                </span>
                <span className="text-4xl font-extrabold text-white">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              className={`mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold transition ${
                items.length
                  ? "bg-[linear-gradient(135deg,#6b2c11,#7b241c,#992d16)] text-white hover:brightness-110"
                  : "cursor-not-allowed bg-[#4a2618] text-white/35"
              }`}
              onClick={() => items.length && navigate("/checkout")}
              type="button"
              disabled={!items.length}
            >
              {t("cart.next")}
              <FiArrowRight className="size-5" />
            </button>

            <div className="mt-8 flex items-center gap-4 text-white/28">
              <div className="h-px flex-1 bg-white/12" />
              <span className="text-sm">{t("cart.or")}</span>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            <Link
              to="/catalog"
              className="mt-8 inline-flex items-center justify-center gap-3 text-base font-medium text-white/62 transition hover:text-white"
            >
              <FiChevronLeft className="size-5" />
              {t("cart.continueShopping")}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
