import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/product/ProductCard.jsx";
import { fetchGames } from "../api/games.js";

export default function Catalog() {
  const [searchParams] = useSearchParams();

  const qFromUrl = searchParams.get("q") || "";
  const genreFromUrl = searchParams.get("genre") || "All";
  const platformFromUrl = searchParams.get("platform") || "All";

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState(qFromUrl);
  const [genre, setGenre] = useState(genreFromUrl);
  const [platform, setPlatform] = useState(platformFromUrl);
  const [maxPrice, setMaxPrice] = useState(70);
  const [sort, setSort] = useState("popular");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const list = await fetchGames();
        if (!alive) return;
        setGames(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Request failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...games];

    if (q.trim()) {
      const key = q.trim().toLowerCase();
      list = list.filter((g) => (g.name || "").toLowerCase().includes(key));
    }
    if (genre !== "All") list = list.filter((g) => g.genre === genre);
    if (platform !== "All") list = list.filter((g) => g.platform === platform);
    list = list.filter((g) => Number(g.price || 0) <= Number(maxPrice || 0));

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "discount")
      list.sort((a, b) => b.oldPrice - b.price - (a.oldPrice - a.price));

    return list;
  }, [games, q, genre, platform, maxPrice, sort]);

  const genres = useMemo(
    () => ["All", ...new Set(games.map((g) => g.genre).filter(Boolean))],
    [games],
  );
  const platforms = useMemo(
    () => ["All", ...new Set(games.map((g) => g.platform).filter(Boolean))],
    [games],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catalog</h1>
          <p className="text-sm text-black/60">Find the best deals for games</p>
        </div>

        <select
          className="border rounded-xl px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="popular">Popular</option>
          <option value="discount">Best discount</option>
          <option value="price-asc">Price low → high</option>
          <option value="price-desc">Price high → low</option>
        </select>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border px-4 py-3 text-sm bg-black text-white">
          {err}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="font-semibold">Filters</div>

          <div className="mt-4">
            <div className="text-sm font-medium">Search</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type game name..."
              className="mt-2 w-full border rounded-xl px-3 py-2"
            />
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">Genre</div>
            <select
              className="mt-2 w-full border rounded-xl px-3 py-2"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {genres.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">Platform</div>
            <select
              className="mt-2 w-full border rounded-xl px-3 py-2"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {platforms.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">Max price: ${maxPrice}</div>
            <input
              type="range"
              min="1"
              max="200"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <button
            className="mt-5 w-full border rounded-xl px-3 py-2"
            onClick={() => {
              setQ("");
              setGenre("All");
              setPlatform("All");
              setMaxPrice(70);
              setSort("popular");
            }}
          >
            Reset filters
          </button>
        </div>

        {/* List */}
        <div>
          {loading ? (
            <div className="text-black/60">Loading games...</div>
          ) : (
            <>
              <div className="text-sm text-black/60 mb-4">
                Showing {filtered.length} games
              </div>

              {filtered.length === 0 ? (
                <div className="text-black/60">
                  DB chưa có game / hoặc filter đang quá chặt.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
