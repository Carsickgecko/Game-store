import { useEffect, useMemo, useState } from "react";
import RatingStars from "../common/RatingStars.jsx";
import {
  addReview,
  getAverageRating,
  getReviews,
} from "../../store/reviews.js";

export default function ReviewsPanel({ productId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });

  const reload = () => setItems(getReviews(productId));

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener("reviews:changed", onChange);
    return () => window.removeEventListener("reviews:changed", onChange);
  }, [productId]);

  const avg = useMemo(() => getAverageRating(productId), [items, productId]);

  const onSubmit = (e) => {
    e.preventDefault();
    addReview(productId, {
      name: form.name.trim(),
      rating: Number(form.rating),
      comment: form.comment.trim(),
    });
    setForm({ name: "", rating: 5, comment: "" });
    reload();
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-bold">Reviews</div>
          <div className="text-sm text-black/60">{items.length} review(s)</div>
        </div>

        <div className="text-right">
          <div className="text-sm text-black/60">Average rating</div>
          <div className="flex items-center justify-end gap-2">
            <RatingStars value={avg || 0} />
            <span className="font-semibold">{avg ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Add review */}
      <form
        onSubmit={onSubmit}
        className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 rounded-xl border outline-none"
          placeholder="Your name"
        />

        <select
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
          className="px-3 py-2 rounded-xl border bg-white"
        >
          {[5, 4, 3, 2, 1].map((x) => (
            <option key={x} value={x}>
              {x} star{x > 1 ? "s" : ""}
            </option>
          ))}
        </select>

        <input
          required
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          className="px-3 py-2 rounded-xl border outline-none md:col-span-3"
          placeholder="Write your review..."
        />

        <button className="md:col-span-3 px-4 py-2 rounded-xl bg-black text-white">
          Submit review
        </button>
      </form>

      {/* List */}
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-black/60">No reviews yet.</div>
        ) : (
          items
            .slice()
            .reverse()
            .map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.name}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <RatingStars value={r.rating} />
                    <span className="text-black/60">{r.rating}/5</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-black/70">{r.comment}</div>
                <div className="mt-2 text-xs text-black/50">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
