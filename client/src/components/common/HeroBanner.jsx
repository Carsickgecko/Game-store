import { toImageUrl } from "../../utils/image.js";
import { Link } from "react-router-dom";

export default function HeroBanner({ highlightGame }) {
  const bg = toImageUrl(highlightGame?.image);

  return (
    <section className="relative">
      {/* phần bên trái “Buy games cheaper...” giữ nguyên của bạn */}

      {/* Card Today’s highlight */}
      <div
        className="relative rounded-3xl overflow-hidden border border-white/10"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* overlay để chữ rõ */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 p-6">
          <div className="text-white/80 text-sm">Today&apos;s highlight</div>

          <div className="mt-2 text-white text-xl font-semibold">
            {highlightGame?.name || "—"}
          </div>

          <div className="mt-2 text-white/90">
            <span className="text-3xl font-bold">
              ${Number(highlightGame?.price || 0).toFixed(2)}
            </span>

            {highlightGame?.oldPrice ? (
              <span className="ml-3 line-through text-white/60">
                ${Number(highlightGame.oldPrice).toFixed(2)}
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            {highlightGame?.id ? (
              <Link
                to={`/product/${highlightGame.id}`}
                className="inline-flex px-5 py-2 rounded-2xl bg-white text-black"
              >
                View game
              </Link>
            ) : (
              <button
                className="px-5 py-2 rounded-2xl bg-white text-black"
                disabled
              >
                View game
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
