import { Link, useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { addToCart, toggleWishlist, isWishlisted } from "../store/actions.js";
import RatingStars from "../components/common/RatingStars.jsx";
import ReviewsPanel from "../components/product/ReviewsPanel.jsx";
import { fetchGameById, fetchGames } from "../api/games.js";
import { toImageUrl } from "../utils/image.js"; // ✅ ADD

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [p, list] = await Promise.all([fetchGameById(id), fetchGames()]);
        if (!alive) return;
        setProduct(p || null);
        setAll(Array.isArray(list) ? list : []);
      } catch {
        if (!alive) return;
        setProduct(null);
        setAll([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (product) setWished(isWishlisted(product.id));
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    return all
      .filter((p) => p.id !== product.id)
      .filter(
        (p) => p.genre === product.genre || p.platform === product.platform,
      )
      .slice(0, 6);
  }, [product, all]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-black/60">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-lg">Product not found.</p>
        <Link to="/catalog" className="underline text-sm">
          Back to catalog
        </Link>
      </div>
    );
  }

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100,
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-black/60">
        <Link to="/" className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/catalog" className="hover:underline">
          Catalog
        </Link>{" "}
        / <span className="text-black/80">{product.name}</span>
      </div>

      {/* Main */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden border bg-white">
          <div className="relative">
            <img
              src={toImageUrl(product.image)} // ✅ FIX
              alt={product.name}
              className="w-full h-[420px] object-cover"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = "/images/hero-bg.jpg";
              }}
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 text-xs font-semibold bg-black text-white px-3 py-1 rounded-full">
                -{discount}%
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="text-sm text-black/60">
              Genre: <span className="text-black">{product.genre}</span> •
              Platform: <span className="text-black">{product.platform}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-black/70">
            <RatingStars value={product.rating} />
            <span className="font-semibold text-black">
              {Number(product.rating || 0).toFixed(1)}
            </span>
            <span className="text-black/50">/ 5.0</span>
          </div>

          <p className="mt-4 text-black/80 leading-relaxed">
            {product.description || product.longDescription}
          </p>

          {/* Price box */}
          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-bold">
                  ${Number(product.price).toFixed(2)}
                </div>
                {product.oldPrice && (
                  <div className="text-sm text-black/50 line-through">
                    ${Number(product.oldPrice).toFixed(2)}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  const next = toggleWishlist(product);
                  setWished(next.some((x) => x.id === product.id));
                }}
                className={`px-4 py-2 rounded-xl border transition ${
                  wished
                    ? "bg-black text-white border-black"
                    : "hover:bg-black hover:text-white"
                }`}
              >
                {wished ? "Wishlisted ♥" : "Add to wishlist ♡"}
              </button>
            </div>

            {/* Qty + Add cart */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((x) => Math.max(1, x - 1))}
                  className="w-10 h-10 rounded-xl border hover:bg-black hover:text-white transition"
                >
                  −
                </button>

                <input
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value || 1)))
                  }
                  className="w-16 h-10 text-center rounded-xl border outline-none"
                />

                <button
                  onClick={() => setQty((x) => x + 1)}
                  className="w-10 h-10 rounded-xl border hover:bg-black hover:text-white transition"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => addToCart(product, qty)}
                className="flex-1 px-4 py-3 rounded-xl bg-black text-white hover:opacity-90 transition"
              >
                Add to cart
              </button>
            </div>

            <div className="mt-4 text-xs text-black/60 space-y-1">
              <div>✅ Instant delivery (demo)</div>
              <div>✅ Secure checkout (frontend only)</div>
              <div>✅ Refund policy (demo text)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      <div className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold">Related games</h2>
            <p className="text-sm text-black/60">More deals you may like</p>
          </div>
          <Link to="/catalog" className="text-sm underline">
            View all
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {related.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border bg-white overflow-hidden"
            >
              <Link to={`/product/${p.id}`} className="block">
                <img
                  src={toImageUrl(p.image)} // ✅ FIX
                  alt={p.name}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/images/hero-bg.jpg";
                  }}
                />
                <div className="p-4">
                  <div className="font-semibold line-clamp-1">{p.name}</div>
                  <div className="mt-1 text-xs text-black/60">
                    {p.genre} • {p.platform} • ⭐{" "}
                    {Number(p.rating || 0).toFixed(1)}
                  </div>
                  <div className="mt-2 font-bold">
                    ${Number(p.price).toFixed(2)}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mt-10 rounded-2xl border bg-white p-5">
        <div className="text-lg font-bold">Description</div>
        <p className="mt-3 text-black/80 leading-relaxed whitespace-pre-line">
          {product.longDescription || product.description}
        </p>
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <ReviewsPanel productId={product.id} />
      </div>
    </div>
  );
}
