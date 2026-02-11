import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser, logout, isAuthenticated } from "../store/auth.js";

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const onAuthChanged = () => setUser(getUser());
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, [navigate]);

  if (!user) return null;

  const displayName = user.name || user.fullName || user.username || "User";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-sm text-black/60">Manage your profile & library</p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="px-4 py-2 rounded-xl bg-black text-white"
        >
          Logout
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left */}
        <section className="rounded-2xl border bg-white p-6">
          <div className="font-semibold text-lg">Profile</div>

          <div className="mt-4 space-y-2 text-sm">
            <div>
              <span className="text-black/60">Name:</span> <b>{displayName}</b>
            </div>
            <div>
              <span className="text-black/60">Email:</span>{" "}
              <b>{user.email || "—"}</b>
            </div>

            {/* ✅ Removed Role row */}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/account/settings"
              className="px-4 py-2 rounded-xl border hover:bg-black hover:text-white transition"
            >
              Account settings
            </Link>

            <Link
              to="/library"
              className="px-4 py-2 rounded-xl border hover:bg-black hover:text-white transition"
            >
              My library
            </Link>
          </div>
        </section>

        {/* Right */}
        <aside className="rounded-2xl border bg-white p-6 h-fit">
          <div className="font-semibold">Quick actions</div>

          <div className="mt-4 space-y-3">
            <Link
              to="/catalog"
              className="block px-4 py-2 rounded-xl border hover:bg-black hover:text-white transition"
            >
              Browse catalog
            </Link>
            <Link
              to="/cart"
              className="block px-4 py-2 rounded-xl border hover:bg-black hover:text-white transition"
            >
              View cart
            </Link>
            <Link
              to="/wishlist"
              className="block px-4 py-2 rounded-xl border hover:bg-black hover:text-white transition"
            >
              View wishlist
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
