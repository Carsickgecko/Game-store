import { useEffect, useMemo, useState } from "react";
import RatingStars from "../common/RatingStars.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { createGameReview, fetchGameReviews } from "../../api/reviews.js";
import { getUser } from "../../store/auth.js";

export default function ReviewsPanel({ productId }) {
  const { language, t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });

  const loadReviews = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchGameReviews(productId);
      setItems(Array.isArray(data.items) ? data.items : []);

      window.dispatchEvent(
        new CustomEvent("reviews:changed", {
          detail: {
            productId: Number(productId),
            summary: data.summary || { count: 0, average: null },
          },
        }),
      );
    } catch (error) {
      setErr(error?.response?.data?.message || t("reviews.failedLoad"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    setForm((current) => ({
      ...current,
      name:
        current.name ||
        user?.fullName ||
        user?.name ||
        user?.username ||
        "",
    }));
  }, []);

  useEffect(() => {
    if (!productId) return undefined;

    loadReviews();

    const onChange = (event) => {
      const changedProductId = Number(event?.detail?.productId);

      if (!changedProductId || changedProductId === Number(productId)) {
        loadReviews();
      }
    };

    window.addEventListener("reviews:changed", onChange);
    return () => window.removeEventListener("reviews:changed", onChange);
  }, [productId]);

  const avg = useMemo(() => {
    if (items.length === 0) return null;
    const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return Math.round((total / items.length) * 10) / 10;
  }, [items]);

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setErr("");
      const data = await createGameReview(productId, {
        name: form.name.trim(),
        rating: Number(form.rating),
        comment: form.comment.trim(),
      });

      setItems(Array.isArray(data.items) ? data.items : []);
      setForm((current) => ({ ...current, comment: "", rating: 5 }));

      window.dispatchEvent(
        new CustomEvent("reviews:changed", {
          detail: {
            productId: Number(productId),
            summary: data.summary || { count: 0, average: null },
          },
        }),
      );
    } catch (error) {
      setErr(error?.response?.data?.message || t("reviews.failedSubmit"));
    }
  };

  return (
    <div className="rounded-[30px] border border-white/8 bg-[#1d1d1d] p-6 text-white shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-white">{t("reviews.title")}</div>
          <div className="text-sm text-white/58">
            {t("reviews.reviewCount", { count: items.length })}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-white/58">{t("reviews.averageRating")}</div>
          <div className="flex items-center justify-end gap-2">
            <RatingStars value={avg || 0} />
            <span className="font-semibold text-white">{avg ?? "-"}</span>
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28"
          placeholder={t("reviews.yourName")}
        />

        <select
          value={form.rating}
          onChange={(event) => setForm({ ...form, rating: event.target.value })}
          className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} {value > 1 ? t("reviews.stars") : t("reviews.star")}
            </option>
          ))}
        </select>

        <input
          required
          value={form.comment}
          onChange={(event) =>
            setForm({ ...form, comment: event.target.value })
          }
          className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28 md:col-span-3"
          placeholder={t("reviews.writeReview")}
        />

        <button className="rounded-2xl bg-[#dc2626] px-4 py-3 font-semibold text-white shadow-[0_18px_34px_-22px_rgba(220,38,38,0.95)] transition hover:bg-[#ef4444] md:col-span-3">
          {t("reviews.submitReview")}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-white/58">{t("reviews.loading")}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-white/58">{t("reviews.noReviews")}</div>
        ) : (
          items
            .slice()
            .reverse()
            .map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-white/8 bg-black/18 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{review.name}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <RatingStars value={review.rating} />
                    <span className="text-white/58">{review.rating}/5</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/72">{review.comment}</div>
                <div className="mt-2 text-xs text-white/42">
                  {new Date(review.createdAt).toLocaleString(
                    language === "vi" ? "vi-VN" : "en-US",
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
