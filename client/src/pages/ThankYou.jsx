import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import CheckoutStepper from "../components/common/CheckoutStepper.jsx";
import { confirmCheckoutSession } from "../api/orders.js";
import { loadCart } from "../store/actions.js";

export default function ThankYou() {
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const urlOrderId = searchParams.get("order_id");
  const [orderId, setOrderId] = useState(location.state?.orderId || urlOrderId || null);
  const [confirming, setConfirming] = useState(Boolean(sessionId));
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    let active = true;

    const confirmPayment = async () => {
      try {
        setConfirming(true);
        setConfirmError("");
        const result = await confirmCheckoutSession(sessionId);

        if (!active) return;

        setOrderId(result?.orderId || urlOrderId || null);
        await loadCart();
      } catch (error) {
        if (!active) return;

        setConfirmError(
          error?.response?.data?.message ||
            error?.message ||
            t("thankYou.confirmFailed"),
        );
      } finally {
        if (active) {
          setConfirming(false);
        }
      }
    };

    confirmPayment();

    return () => {
      active = false;
    };
  }, [sessionId, t, urlOrderId]);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <CheckoutStepper
        steps={[
          { label: t("cart.stepCart"), status: "complete" },
          { label: t("cart.stepPayment"), status: "complete" },
          { label: t("cart.stepActivation"), status: "complete" },
        ]}
      />

      <div className="flex min-h-[calc(100vh-72px)] items-center">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3">
              <span className="text-lg font-bold tracking-wide">
                Neon<span className="text-green-400">Play</span>
              </span>
            </div>
          </div>

          <h1 className="mt-10 text-5xl font-extrabold text-cyan-300 md:text-6xl">
            {t("thankYou.title")}
          </h1>

          <p className="mt-6 text-lg text-white/80">{t("thankYou.success")}</p>
          {confirming ? (
            <p className="mt-3 text-sm leading-relaxed text-cyan-100/75">
              {t("thankYou.confirming")}
            </p>
          ) : null}
          {confirmError ? (
            <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {confirmError}
            </div>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {t("thankYou.subtitle")}
          </p>

          {orderId ? (
            <p className="mt-4 text-sm text-white/60">
              {t("orders.orderNumber", { id: orderId })}
            </p>
          ) : null}

          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-full border border-[#dc2626]/20 bg-[#dc2626]/10 px-6 py-3 text-white transition hover:bg-[#dc2626]/20"
              >
                {t("accountShell.myOrders")}
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 transition hover:bg-white/15"
              >
                {"<-"} {t("thankYou.backHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
