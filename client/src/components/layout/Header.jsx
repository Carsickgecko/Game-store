import { createElement, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaHome,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { getUser, logout } from "../../store/auth.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getCartItems } from "../../store/storage.js";

function CountBadge({ value }) {
  if (!value || value <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#dc2626] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-[0_10px_18px_-10px_rgba(220,38,38,0.95)]">
      {value}
    </span>
  );
}

function IconActionLink({ to, label, icon, value = 0 }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        `relative flex h-11 w-11 items-center justify-center rounded-full border transition ${
          isActive
            ? "border-[#dc2626] bg-[#dc2626] text-white"
            : "border-white/10 bg-white/[0.06] text-white/82 hover:border-white/20 hover:bg-white/[0.12] hover:text-white"
        }`
      }
    >
      {createElement(icon, { className: "text-[18px]" })}
      <CountBadge value={value} />
    </NavLink>
  );
}

function TextActionLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full border px-4 py-2 text-sm font-medium transition ${
          isActive
            ? "border-[#dc2626] bg-[#dc2626] text-white"
            : "border-white/10 bg-white/[0.05] text-white/78 hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const goHomeAnchor = (anchorId) => {
    setMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/#about");
      setTimeout(() => {
        document
          .getElementById(anchorId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return;
    }

    document
      .getElementById(anchorId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goAbout = () => goHomeAnchor("about");

  useEffect(() => {
    const updateCounts = () => {
      const cartItems = getCartItems();

      setCartCount(cartItems.reduce((sum, item) => sum + (item.qty || 1), 0));
    };

    updateCounts();

    window.addEventListener("store:changed", updateCounts);
    window.addEventListener("storage", updateCounts);
    window.addEventListener("wishlist:changed", updateCounts);
    window.addEventListener("cart:changed", updateCounts);
    window.addEventListener("auth:changed", updateCounts);

    return () => {
      window.removeEventListener("store:changed", updateCounts);
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("wishlist:changed", updateCounts);
      window.removeEventListener("cart:changed", updateCounts);
      window.removeEventListener("auth:changed", updateCounts);
    };
  }, []);

  useEffect(() => {
    const updateAuth = () => setUser(getUser());

    updateAuth();
    window.addEventListener("auth:changed", updateAuth);

    return () => window.removeEventListener("auth:changed", updateAuth);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(location.pathname === "/catalog" ? params.get("q") || "" : "");
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const goCatalog = (keyword = q) => {
    const params = new URLSearchParams();
    const normalizedKeyword = keyword.trim();

    if (normalizedKeyword) {
      params.set("q", normalizedKeyword);
    }

    navigate(`/catalog${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    goCatalog(q);
  };

  const mobileLinkClass =
    "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#23262b]/96 text-white shadow-[0_16px_42px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-5">
            <Link to="/" className="shrink-0">
              <img
                src="/images/logo-neonplay.png"
                alt="NeonPlay"
                className="h-14 w-auto sm:h-16 lg:h-[4.6rem]"
              />
            </Link>

            <form onSubmit={onSubmit} className="hidden lg:flex flex-1">
              <div className="flex w-full items-center rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(74,76,82,0.92),rgba(43,45,49,0.98))] pl-2 pr-2 shadow-[0_22px_55px_-28px_rgba(0,0,0,0.95)]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("header.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                />

                <button
                  type="submit"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#dc2626] text-white shadow-[0_18px_34px_-18px_rgba(220,38,38,0.95)] transition hover:scale-[1.03] hover:bg-[#ef4444]"
                  aria-label={t("header.search")}
                >
                  <FaSearch className="text-base" />
                </button>
              </div>
            </form>

            <div className="ml-auto hidden lg:flex items-center gap-2">
              <IconActionLink
                to="/"
                label={t("common.home")}
                icon={FaHome}
              />

              <IconActionLink
                to="/cart"
                label={t("header.cart")}
                icon={FaShoppingCart}
                value={cartCount}
              />

              {user ? (
                <>
                  <IconActionLink
                    to="/account"
                    label={t("header.account")}
                    icon={FaUserCircle}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
                  >
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <TextActionLink to="/login" label={t("header.login")} />
              )}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <IconActionLink
                to="/"
                label={t("common.home")}
                icon={FaHome}
              />

              <IconActionLink
                to="/cart"
                label={t("header.cart")}
                icon={FaShoppingCart}
                value={cartCount}
              />

              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/85 transition hover:border-white/20 hover:bg-white/[0.12] hover:text-white"
                aria-label={t("header.toggleMenu")}
                title={t("header.menu")}
              >
                {menuOpen ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaBars className="text-lg" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-3 lg:hidden">
            <form onSubmit={onSubmit}>
              <div className="flex items-center rounded-full border border-white/10 bg-[#34373d] px-2 py-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("header.searchPlaceholderMobile")}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/40"
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#dc2626] text-white"
                  aria-label={t("header.search")}
                >
                  <FaSearch className="text-sm" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4">
            <div className="rounded-[26px] border border-white/10 bg-[#23262b]/98 p-3 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.95)]">
              <div className="grid grid-cols-1 gap-2">
                <NavLink
                  to="/catalog"
                  className={mobileLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {t("header.store")}
                </NavLink>

                <button
                  type="button"
                  onClick={() => navigate(user ? "/library" : "/login")}
                  className={mobileLinkClass}
                >
                  {t("header.library")}
                </button>

                <button
                  type="button"
                  onClick={goAbout}
                  className={mobileLinkClass}
                >
                  {t("header.about")}
                </button>

                {user ? (
                  <>
                    <NavLink
                      to="/account"
                      className={mobileLinkClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("header.account")}
                    </NavLink>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        navigate("/");
                      }}
                      className={mobileLinkClass}
                    >
                      {t("header.logout")}
                    </button>
                  </>
                ) : (
                  <NavLink
                    to="/login"
                    className={mobileLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("header.login")}
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
