import { useEffect, useState } from "react";
import { fetchMyLibrary } from "../api/library.js";
import ProductCard from "../components/product/ProductCard.jsx";

export default function Library() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const list = await fetchMyLibrary();
        if (!alive) return;
        setGames(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load library.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">My Library</h1>
      <p className="text-sm text-black/60">Games you own</p>

      {loading && <div className="mt-6 text-black/60">Loading...</div>}

      {err && (
        <div className="mt-6 rounded-xl border px-4 py-3 text-sm bg-black text-white">
          {err}
        </div>
      )}

      {!loading && !err && games.length === 0 && (
        <div className="mt-6 text-black/60">
          Library trống. Hãy mua game (checkout) để lưu vào thư viện.
        </div>
      )}

      {!loading && !err && games.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((g) => (
            <ProductCard key={g.id} product={g} mode="library" />
          ))}
        </div>
      )}
    </div>
  );
}
