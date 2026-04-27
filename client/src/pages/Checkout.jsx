import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaApple, FaCreditCard, FaPaypal, FaQrcode } from "react-icons/fa";
import { IoCheckmark } from "react-icons/io5";
import { getCartItems } from "../store/storage.js";
import { isAuthenticated } from "../store/auth.js";
import { createOrder } from "../api/orders.js";
import { loadCart } from "../store/actions.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { toImageUrl } from "../utils/image.js";
import CheckoutStepper from "../components/common/CheckoutStepper.jsx";

const COUNTRY_CODES = [
  "PL",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "CZ",
  "SK",
  "HU",
  "RO",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "PT",
  "GB",
  "US",
  "CA",
  "AU",
  "JP",
  "KR",
  "SG",
  "VN",
];

const PAYMENT_METHODS = [
  { value: "apple_pay", labelKey: "applePay" },
  { value: "revolut_pay", labelKey: "revolutPay" },
  { value: "card", labelKey: "cardPayment" },
  { value: "paypal", labelKey: "paypal" },
  { value: "qr", labelKey: "qrCode" },
  { value: "blik", labelKey: "blik" },
];

const labelClassName = "text-sm text-white/64";
const inputClassName =
  "mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28";

function PaymentMethodMark({ value }) {
  if (value === "apple_pay") {
    return (
      <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-2xl bg-black px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <FaApple className="text-lg" />
        <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
          Pay
        </span>
      </div>
    );
  }

  if (value === "revolut_pay") {
    return (
      <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f8fafc,#dbeafe)] px-4 text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <span className="text-sm font-black tracking-[0.12em]">REVOLUT</span>
      </div>
    );
  }

  if (value === "card") {
    return (
      <div className="inline-flex h-12 min-w-24 items-center justify-between rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="h-4 w-6 rounded bg-[#fbbf24]/90" />
        <FaCreditCard className="text-base text-cyan-300" />
      </div>
    );
  }

  if (value === "paypal") {
    return (
      <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-2xl bg-[#e0f2fe] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
        <FaPaypal className="text-2xl text-[#003087]" />
      </div>
    );
  }

  if (value === "qr") {
    return (
      <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-2xl bg-[#e5e7eb] px-4 text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
        <FaQrcode className="text-2xl" />
      </div>
    );
  }

  return (
    <div className="inline-flex h-12 min-w-24 items-center justify-center rounded-2xl bg-[#1f2937] px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <span className="rounded-md bg-[#ec4899] px-2 py-1 text-xs font-black tracking-[0.14em] text-white">
        BLIK
      </span>
    </div>
  );
}

export default function Checkout() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    email: "",
    name: "",
    country: "PL",
    city: "",
    address: "",
    zip: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const syncFromStore = () => {
      if (active) {
        setItems(getCartItems());
      }
    };

    const hydrateCheckout = async () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setErr("");

        const list = await loadCart();
        if (!active) return;

        setItems(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!active) return;

        setItems(getCartItems());
        setErr(error?.response?.data?.message || t("checkout.failedLoad"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateCheckout();

    window.addEventListener("store:changed", syncFromStore);
    window.addEventListener("storage", syncFromStore);

    return () => {
      active = false;
      window.removeEventListener("store:changed", syncFromStore);
      window.removeEventListener("storage", syncFromStore);
    };
  }, [navigate, t]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
        0,
      ),
    [items],
  );

  const serviceFee = subtotal > 0 ? 1.99 : 0;
  const paymentFee = 0;
  const total = subtotal + serviceFee + paymentFee;

  const countryOptions = useMemo(() => {
    const locale = language === "vi" ? "vi" : "en";

    try {
      const formatter = new Intl.DisplayNames([locale], { type: "region" });
      return COUNTRY_CODES.map((code) => ({
        value: code,
        label: formatter.of(code) || code,
      }));
    } catch {
      return COUNTRY_CODES.map((code) => ({
        value: code,
        label: code,
      }));
    }
  }, [language]);

  const onPay = async (event) => {
    event.preventDefault();
    setErr("");

    if (!form.email || !form.name || !form.city || !form.address || !form.zip) {
      setErr(t("checkout.fillContact"));
      return;
    }

    try {
      setSubmitting(true);

      const result = await createOrder({
        paymentMethod,
        items: items.map((item) => ({
          gameId: Number(item.id),
          qty: Number(item.qty || 1),
        })),
        serviceFee,
        paymentFee,
        email: form.email,
        name: form.name,
        country: form.country,
        city: form.city,
        address: form.address,
        zip: form.zip,
      });

      await loadCart();
      navigate("/thank-you", { state: { orderId: result?.orderId || null } });
    } catch (error) {
      setErr(
        error?.response?.data?.message ||
          error?.message ||
          t("checkout.failedSaveLibrary"),
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <CheckoutStepper
          steps={[
            { label: t("cart.stepCart"), status: "complete" },
            { label: t("cart.stepPayment"), status: "current" },
            { label: t("cart.stepActivation"), status: "pending" },
          ]}
        />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-[28px] border border-white/8 bg-[#343434] px-6 py-8 text-white/60">
            {t("checkout.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <CheckoutStepper
          steps={[
            { label: t("cart.stepCart"), status: "complete" },
            { label: t("cart.stepPayment"), status: "current" },
            { label: t("cart.stepActivation"), status: "pending" },
          ]}
        />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-[28px] border border-white/8 bg-[#343434] px-6 py-8">
            <h1 className="text-3xl font-bold text-white">{t("checkout.title")}</h1>
            <p className="mt-3 text-white/58">{t("checkout.empty")}</p>
            <Link to="/catalog" className="mt-5 inline-block text-white underline">
              {t("checkout.backToCatalog")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <CheckoutStepper
        steps={[
          { label: t("cart.stepCart"), status: "complete" },
          { label: t("cart.stepPayment"), status: "current" },
          { label: t("cart.stepActivation"), status: "pending" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t("checkout.title")}</h1>
            <p className="mt-2 text-sm text-white/52">{t("checkout.enterDetails")}</p>
          </div>
          <Link to="/cart" className="text-sm text-white/62 underline hover:text-white">
            {t("checkout.backToCart")}
          </Link>
        </div>

        {err ? (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_398px]">
          <form
            onSubmit={onPay}
            className="rounded-[28px] border border-white/8 bg-[#343434] p-6 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.95)]"
          >
            <div className="text-xl font-semibold text-white">
              {t("checkout.contactAddress")}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClassName}>{t("checkout.email")}</label>
                <input
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={t("accountSettings.emailPlaceholder")}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClassName}>{t("checkout.fullName")}</label>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={t("accountSettings.namePlaceholder")}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("checkout.country")}</label>
                <select
                  required
                  value={form.country}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  className={`${inputClassName} appearance-none pr-10`}
                >
                  {countryOptions.map((country) => (
                    <option
                      key={country.value}
                      value={country.value}
                      className="bg-[#111111] text-white"
                    >
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>{t("checkout.city")}</label>
                <input
                  required
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={t("checkout.cityPlaceholder")}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClassName}>{t("checkout.address")}</label>
                <input
                  required
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={t("checkout.addressPlaceholder")}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("checkout.zip")}</label>
                <input
                  required
                  value={form.zip}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      zip: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder={t("checkout.zipPlaceholder")}
                />
              </div>
            </div>

            <div className="mt-10">
              <div className="text-xl font-semibold text-white">
                {t("checkout.paymentMethods")}
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const active = paymentMethod === method.value;
                  const showCardDetails = active && method.value === "card";

                  return (
                    <div key={method.value}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex w-full items-center justify-between gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                          active
                            ? "border-red-400/50 bg-red-500/10 text-white shadow-[0_18px_40px_-26px_rgba(239,68,68,0.85)]"
                            : "border-white/10 bg-[#1a1a1a] text-white/78 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <PaymentMethodMark value={method.value} />
                          <div>
                            <div className="text-base font-semibold">
                              {t(`checkout.${method.labelKey}`)}
                            </div>
                            <div className="mt-1 text-xs text-white/45">
                              {active ? t("checkout.demoOnly") : t("common.open")}
                            </div>
                          </div>
                        </div>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          active
                            ? "border-red-300 bg-red-400 text-white"
                            : "border-white/15 text-transparent"
                        }`}
                      >
                        <IoCheckmark className="text-sm" />
                      </div>
                    </button>

                      {showCardDetails ? (
                        <div className="mt-3 rounded-[24px] border border-cyan-300/18 bg-cyan-300/8 p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-xl font-semibold text-white">
                                {t("checkout.cardDetails")}
                              </div>
                              <p className="mt-3 text-sm leading-7 text-white/66">
                                {t("checkout.demoOnly")}
                              </p>
                            </div>
                            <div className="hidden items-center gap-2 sm:flex">
                              <span className="rounded-xl bg-[#1c4ed8] px-3 py-2 text-xs font-black tracking-[0.2em] text-white">
                                VISA
                              </span>
                              <span className="rounded-xl bg-[#111827] px-3 py-2 text-xs font-black tracking-[0.2em] text-white">
                                MC
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/72">
                              {t("checkout.cardNumber")}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/72">
                              {t("checkout.expiry")}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/72">
                              {t("checkout.cvv")}
                            </div>
                          </div>

                          <p className="mt-2 text-xs leading-6 text-white/45">
                            {t("checkout.demoCheckout")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#dc2626,#ef4444)] px-5 py-4 text-base font-semibold text-white shadow-[0_22px_40px_-24px_rgba(220,38,38,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? t("checkout.processing") : t("checkout.placeOrder")}
            </button>
          </form>

          <aside className="h-fit rounded-[28px] border border-white/8 bg-[#101010] p-6 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.98)] xl:sticky xl:top-28">
            <div className="text-3xl font-bold text-white">
              {t("checkout.orderSummary")}
            </div>

            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                >
                  <img
                    src={toImageUrl(item.image)}
                    alt={item.name}
                    className="h-14 w-14 rounded-xl border border-white/10 object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = "/images/hero-bg.jpg";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-semibold text-white">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-white/52">
                      {t("checkout.qty")}: {item.qty || 1}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    $
                    {(
                      Number(item.price || 0) * Number(item.qty || 1)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/52">{t("checkout.subtotal")}</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-white/52">{t("checkout.serviceFee")}</span>
                <span className="text-white">${serviceFee.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-white/52">{t("checkout.paymentFee")}</span>
                <span className="text-white">${paymentFee.toFixed(2)}</span>
              </div>

              <div className="mt-5 flex justify-between border-t border-white/10 pt-5">
                <span className="text-2xl font-semibold text-white">
                  {t("checkout.total")}
                </span>
                <span className="text-4xl font-extrabold text-white">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
