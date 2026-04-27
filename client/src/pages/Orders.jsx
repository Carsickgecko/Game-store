import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AccountShell from "../components/account/AccountShell.jsx";
import { isAuthenticated } from "../store/auth.js";
import { fetchMyOrders } from "../api/orders.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { toImageUrl } from "../utils/image.js";
import {
  localizeGenre,
  localizePlatform,
} from "../utils/localizeStoreValue.js";

function getPaymentMethodLabel(method, t) {
  const map = {
    applepay: "checkout.applePay",
    revolut: "checkout.revolutPay",
    card: "checkout.cardPayment",
    paypal: "checkout.paypal",
    qrcode: "checkout.qrCode",
    blik: "checkout.blik",
  };

  const key = map[String(method || "").toLowerCase()];
  return key ? t(key) : method || "-";
}

export default function Orders() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const list = await fetchMyOrders();
        if (!alive) return;
        setOrders(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!alive) return;
        setErr(error?.response?.data?.message || t("orders.failedLoad"));
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate, t]);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.orderCount += 1;
        acc.totalSpent += Number(order.total || 0);
        acc.gameCount += Array.isArray(order.items) ? order.items.length : 0;
        return acc;
      },
      { orderCount: 0, totalSpent: 0, gameCount: 0 },
    );
  }, [orders]);

  const locale = language === "vi" ? "vi-VN" : "en-US";

  return (
    <AccountShell
      title={t("orders.title")}
      description={t("orders.description")}
    >
      {loading ? <div className="text-white/60">{t("orders.loading")}</div> : null}

      {err ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {!loading && !err ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-[#1d1d1d] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {t("orders.orderCount")}
              </div>
              <div className="mt-4 text-3xl font-bold text-white">
                {summary.orderCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[#1d1d1d] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {t("orders.gameCount")}
              </div>
              <div className="mt-4 text-3xl font-bold text-white">
                {summary.gameCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[#1d1d1d] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {t("orders.totalSpent")}
              </div>
              <div className="mt-4 text-3xl font-bold text-white">
                ${summary.totalSpent.toFixed(2)}
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-white/8 bg-[#1d1d1d] px-6 py-10 text-white/60">
              <div>{t("orders.empty")}</div>
              <Link
                to="/catalog"
                className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
              >
                {t("orders.browseCatalog")}
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {orders.map((order) => {
                const createdAt = order.createdAt
                  ? new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.createdAt))
                  : "-";

                return (
                  <section
                    key={order.orderId}
                    className="rounded-[28px] border border-white/8 bg-[#1d1d1d] p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                          {t("orders.orderNumber", { id: order.orderId })}
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-white">
                          {t("orders.completed")}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm text-white/65 sm:grid-cols-2 lg:min-w-[26rem]">
                        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                            {t("orders.placedOn")}
                          </div>
                          <div className="mt-2 font-medium text-white">{createdAt}</div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                            {t("orders.paymentMethod")}
                          </div>
                          <div className="mt-2 font-medium text-white">
                            {getPaymentMethodLabel(order.paymentMethod, t)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                            {t("orders.status")}
                          </div>
                          <div className="mt-2 font-medium text-white">
                            {t("orders.completed")}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                            {t("orders.total")}
                          </div>
                          <div className="mt-2 font-medium text-white">
                            ${Number(order.total || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                        {t("orders.items")}
                      </div>

                      <div className="mt-4 space-y-3">
                        {(order.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 sm:flex-row sm:items-center"
                          >
                            <img
                              src={toImageUrl(item.image)}
                              alt={item.name}
                              className="h-20 w-full rounded-2xl object-cover sm:w-32"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "/images/hero-bg.jpg";
                              }}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="text-lg font-semibold text-white">
                                {item.name}
                              </div>
                              <div className="mt-1 text-sm text-white/58">
                                {localizeGenre(item.genre, t)} |{" "}
                                {localizePlatform(item.platform, t)}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm text-white/65 sm:min-w-[16rem]">
                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                                  {t("orders.quantity")}
                                </div>
                                <div className="mt-1 font-medium text-white">
                                  {item.qty}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                                  {t("orders.subtotal")}
                                </div>
                                <div className="mt-1 font-medium text-white">
                                  ${Number(item.price || 0).toFixed(2)}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                                  {t("orders.lineTotal")}
                                </div>
                                <div className="mt-1 font-medium text-white">
                                  ${Number(item.lineTotal || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-white/65 md:grid-cols-4">
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {t("orders.subtotal")}
                        </div>
                        <div className="mt-2 font-medium text-white">
                          ${Number(order.subtotal || 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {t("orders.serviceFee")}
                        </div>
                        <div className="mt-2 font-medium text-white">
                          ${Number(order.serviceFee || 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {t("orders.paymentFee")}
                        </div>
                        <div className="mt-2 font-medium text-white">
                          ${Number(order.paymentFee || 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {t("orders.total")}
                        </div>
                        <div className="mt-2 font-semibold text-white">
                          ${Number(order.total || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </AccountShell>
  );
}
