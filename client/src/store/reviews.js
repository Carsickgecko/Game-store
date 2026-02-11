const KEY = "demo_reviews";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("reviews:changed"));
}

export function getReviews(productId) {
  const all = loadAll();
  return all[String(productId)] || [];
}

export function addReview(productId, review) {
  const all = loadAll();
  const pid = String(productId);
  const list = all[pid] || [];
  const next = [
    ...list,
    {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      ...review,
    },
  ];
  all[pid] = next;
  saveAll(all);
  return next;
}

export function getAverageRating(productId) {
  const list = getReviews(productId);
  if (list.length === 0) return null;
  const avg = list.reduce((s, r) => s + (r.rating || 0), 0) / list.length;
  return Math.round(avg * 10) / 10;
}
