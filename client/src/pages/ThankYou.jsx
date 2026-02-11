import { Link } from "react-router-dom";

export default function ThankYou() {
  return (
    <div className="min-h-[70vh] bg-neutral-950 text-white flex items-center">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        {/* Logo / Brand */}
        <div className="inline-flex items-center justify-center">
          <div className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5">
            <span className="font-bold text-lg tracking-wide">
              Neon<span className="text-green-400">Play</span>
            </span>
          </div>
        </div>

        <h1 className="mt-10 text-5xl md:text-6xl font-extrabold text-cyan-300">
          Thank You!
        </h1>

        <p className="mt-6 text-lg text-white/80">
          Your order has been successfully placed.
        </p>

        <p className="mt-3 text-sm text-white/50 leading-relaxed">
          Our team will review your submission and get back to you shortly. In
          the meantime, feel free to explore our store or contact us if you have
          any further questions.
        </p>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition"
          >
            ← Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
