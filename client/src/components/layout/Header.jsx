import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCartItems, getWishlistItems } from "../../store/storage.js";
import { getUser, logout, isAdmin } from "../../store/auth.js";
import { motion } from "framer-motion";

function Badge({ value }) {
  if (!value || value <= 0) return null;
  return (
    <span className="ml-2 text-xs bg-white text-black rounded-full px-2 py-0.5">
      {value}
    </span>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [user, setUser] = useState(null);

  // ✅ Mobile menu
  const [menuOpen, setMenuOpen] = useState(false);

  const goAbout = () => {
    setMenuOpen(false);

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

  // đóng menu khi đổi route (đỡ bị mở hoài)
  useEffect(() => {
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const onSubmit = (e) => {
    e.preventDefault();
    const keyword = q.trim();
    setMenuOpen(false);
    navigate(`/catalog${keyword ? `?q=${encodeURIComponent(keyword)}` : ""}`);
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-xl transition whitespace-nowrap ${
      isActive
        ? "bg-white text-black"
        : "text-white/80 hover:text-white hover:bg-white/10"
    }`;

  const aboutBtnClass =
    "px-3 py-2 rounded-xl transition text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap";

  return (
    <header className="sticky top-0 z-50 bg-neutral-950 text-white border-b border-white/10">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Top row */}
        <div className="h-16 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.img
              src="/images/logo-neonplay.png"
              alt="NeonPlay"
              className="h-14 sm:h-16 md:h-20 w-auto logo-neon"
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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/catalog" className={linkClass}>
              Store
            </NavLink>

            <button type="button" onClick={goAbout} className={aboutBtnClass}>
              About
            </button>

            <NavLink to="/wishlist" className={linkClass}>
              Wishlist <Badge value={wishCount} />
            </NavLink>

            <NavLink to="/cart" className={linkClass}>
              Cart <Badge value={cartCount} />
            </NavLink>

            {user ? (
              <>
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

          {/* Mobile buttons (right side) */}
          <div className="ml-auto md:hidden flex items-center gap-2">
            {/* Quick badges (optional) */}
            <Link
              to="/wishlist"
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm"
            >
              ♥
              <Badge value={wishCount} />
            </Link>
            <Link
              to="/cart"
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm"
            >
              🛒
              <Badge value={cartCount} />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
              aria-label="Toggle menu"
              title="Menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
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

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden pb-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 space-y-1">
              <NavLink
                to="/catalog"
                className={(args) => linkClass(args)}
                onClick={() => setMenuOpen(false)}
              >
                Store
              </NavLink>

              <button type="button" onClick={goAbout} className={aboutBtnClass}>
                About
              </button>

              <NavLink
                to="/wishlist"
                className={(args) => linkClass(args)}
                onClick={() => setMenuOpen(false)}
              >
                Wishlist <Badge value={wishCount} />
              </NavLink>

              <NavLink
                to="/cart"
                className={(args) => linkClass(args)}
                onClick={() => setMenuOpen(false)}
              >
                Cart <Badge value={cartCount} />
              </NavLink>

              {user ? (
                <>
                  {isAdmin() && (
                    <NavLink
                      to="/admin"
                      className={(args) => linkClass(args)}
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </NavLink>
                  )}

                  <NavLink
                    to="/account"
                    className={(args) => linkClass(args)}
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </NavLink>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className={(args) => linkClass(args)}
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
