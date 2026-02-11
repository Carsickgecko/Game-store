import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCartItems, getWishlistItems } from "../../store/storage.js";
import { getUser, logout, isAdmin } from "../../store/auth.js";
import { motion } from "framer-motion";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [user, setUser] = useState(null);

  const goAbout = () => {
    if (location.pathname !== "/") {
      navigate("/#about");
      setTimeout(() => {
        document
          .getElementById("about")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Cart + Wishlist badge
  useEffect(() => {
    const update = () => {
      setCartCount(getCartItems().reduce((s, it) => s + (it.qty || 1), 0));
      setWishCount(getWishlistItems().length);
    };
    update();

    window.addEventListener("store:changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("store:changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Auth state
  useEffect(() => {
    const updateAuth = () => setUser(getUser());
    updateAuth();
    window.addEventListener("auth:changed", updateAuth);
    return () => window.removeEventListener("auth:changed", updateAuth);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    navigate(`/catalog?q=${encodeURIComponent(q.trim())}`);
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-xl transition ${
      isActive
        ? "bg-white text-black"
        : "text-white/80 hover:text-white hover:bg-white/10"
    }`;

  const aboutBtnClass =
    "px-3 py-2 rounded-xl transition text-white/80 hover:text-white hover:bg-white/10";

  return (
    <header className="sticky top-0 z-50 bg-neutral-950 text-white border-b border-white/10">
      <div className="max-w-6xl mx-auto px-1 sm:px-4 h-28 flex items-center gap-4">
        <Link to="/" className="flex items-center -ml-10">
          <motion.img
            src="/images/logo-neonplay.png"
            alt="NeonPlay"
            className="h-20 md:h-24 w-auto logo-neon"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Link>

        {/* Search desktop */}
        <form onSubmit={onSubmit} className="flex-1 hidden md:block">
          <div className="flex items-center bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search games…"
              className="w-full bg-transparent outline-none text-sm placeholder:text-white/50"
            />
            <button
              type="submit"
              className="text-sm px-3 py-1 rounded-xl bg-white text-black"
            >
              Search
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-1">
          <NavLink to="/catalog" className={linkClass}>
            Store
          </NavLink>

          <button type="button" onClick={goAbout} className={aboutBtnClass}>
            About
          </button>

          <NavLink to="/wishlist" className={linkClass}>
            Wishlist
            {wishCount > 0 && (
              <span className="ml-2 text-xs bg-white text-black rounded-full px-2 py-0.5">
                {wishCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className={linkClass}>
            Cart
            {cartCount > 0 && (
              <span className="ml-2 text-xs bg-white text-black rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </NavLink>

          {user ? (
            <>
              {/* ✅ ADMIN LINK (chỉ hiện khi roleId = 2) */}
              {isAdmin() && (
                <NavLink to="/admin" className={linkClass}>
                  Admin
                </NavLink>
              )}

              <NavLink to="/account" className={linkClass}>
                Account
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          )}
        </nav>
      </div>

      {/* Search mobile */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={onSubmit}>
          <div className="flex items-center bg-white/10 rounded-2xl px-3 py-2 border border-white/10">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search games…"
              className="w-full bg-transparent outline-none text-sm placeholder:text-white/50"
            />
            <button
              type="submit"
              className="text-sm px-3 py-1 rounded-xl bg-white text-black"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
