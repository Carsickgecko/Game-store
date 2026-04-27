import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { getUser, isAdmin, isAuthenticated, logout } from "../store/auth.js";
import { getCartItems, getWishlistItems } from "../store/storage.js";
import { fetchMyLibrary } from "../api/library.js";
import { adminFetchGames, adminFetchUsers } from "../api/admin.js";
import AccountShell from "../components/account/AccountShell.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { toImageUrl } from "../utils/image.js";

function buildStats() {
  return {
    wishlist: getWishlistItems().length,
    cart: getCartItems().length,
  };
}

export default function Account() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const adminView = isAdmin();
  const [stats, setStats] = useState(() => ({
    wishlist: 0,
    cart: 0,
    library: 0,
    storeGames: 0,
    users: 0,
  }));

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    let alive = true;

    const syncUser = () => setUser(getUser());
    const syncLocalStats = () => {
      if (!alive) return;
      setStats((current) => ({ ...current, ...buildStats() }));
    };

    const hydrate = async () => {
      syncUser();

      if (isAdmin()) {
        try {
          const [games, users] = await Promise.all([
            adminFetchGames(),
            adminFetchUsers(),
          ]);

          if (!alive) return;
          setStats({
            wishlist: 0,
            cart: 0,
            library: 0,
            storeGames: Array.isArray(games) ? games.length : 0,
            users: Array.isArray(users) ? users.length : 0,
          });
        } catch {
          if (!alive) return;
          setStats({
            wishlist: 0,
            cart: 0,
            library: 0,
            storeGames: 0,
            users: 0,
          });
        }
        return;
      }

      syncLocalStats();

      try {
        const list = await fetchMyLibrary();
        if (!alive) return;
        setStats((current) => ({
          ...current,
          library: Array.isArray(list) ? list.length : 0,
        }));
      } catch {
        if (!alive) return;
        setStats((current) => ({ ...current, library: 0 }));
      }
    };

    hydrate();

    window.addEventListener("auth:changed", hydrate);
    window.addEventListener("store:changed", syncLocalStats);

    return () => {
      alive = false;
      window.removeEventListener("auth:changed", hydrate);
      window.removeEventListener("store:changed", syncLocalStats);
    };
  }, [navigate]);

  if (!user) return null;

  const displayName = user.name || user.fullName || user.username || "User";
  const avatarUrl = user.avatarUrl || user.avatar || "";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const logoutAction = (
    <button
      type="button"
      onClick={() => {
        logout();
        navigate("/");
      }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
    >
      <FiLogOut className="size-4" />
      {t("account.logout")}
    </button>
  );

  return (
    <AccountShell
      title={t("account.welcomeBack", { name: displayName })}
      description={
        adminView ? t("accountSettings.description") : t("account.description")
      }
      actions={logoutAction}
      isAdminView={adminView}
    >
      <div className="grid grid-cols-1 gap-6">
        <section className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                {avatarUrl ? (
                  <img
                    src={toImageUrl(avatarUrl)}
                    alt={displayName}
                    className="h-20 w-20 rounded-full border border-white/10 object-cover shadow-[0_20px_36px_-24px_rgba(220,38,38,0.95)]"
                  />
                ) : null}
                <div
                  className={`absolute inset-0 flex h-20 w-20 items-center justify-center rounded-full bg-[#dc2626] text-2xl font-bold text-white shadow-[0_20px_36px_-24px_rgba(220,38,38,0.95)] ${
                    avatarUrl ? "hidden" : ""
                  }`}
                >
                  {initials || "U"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-white/42">
                  {t("account.userProfile")}
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {displayName}
                </div>
                <div className="mt-1 text-sm text-white/58">
                  {user.email || t("account.noEmail")}
                </div>
              </div>
            </div>
          </div>

          {adminView ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/8 bg-black/18 p-5">
                <div className="inline-flex rounded-full bg-white/6 p-2 text-[#dc2626]">
                  <FiGrid className="size-5" />
                </div>
                <div className="mt-4 text-3xl font-bold text-white">
                  {stats.storeGames}
                </div>
                <div className="mt-1 text-sm text-white/58">
                  {t("account.storeGames")}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/18 p-5">
                <div className="inline-flex rounded-full bg-white/6 p-2 text-[#dc2626]">
                  <FiUsers className="size-5" />
                </div>
                <div className="mt-4 text-3xl font-bold text-white">
                  {stats.users}
                </div>
                <div className="mt-1 text-sm text-white/58">
                  {t("account.registeredUsers")}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/8 bg-black/18 p-5">
                <div className="inline-flex rounded-full bg-white/6 p-2 text-[#dc2626]">
                  <FiBookOpen className="size-5" />
                </div>
                <div className="mt-4 text-3xl font-bold text-white">
                  {stats.library}
                </div>
                <div className="mt-1 text-sm text-white/58">{t("account.gamesInLibrary")}</div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/18 p-5">
                <div className="inline-flex rounded-full bg-white/6 p-2 text-[#dc2626]">
                  <FiHeart className="size-5" />
                </div>
                <div className="mt-4 text-3xl font-bold text-white">
                  {stats.wishlist}
                </div>
                <div className="mt-1 text-sm text-white/58">{t("account.wishlistItems")}</div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/18 p-5">
                <div className="inline-flex rounded-full bg-white/6 p-2 text-[#dc2626]">
                  <FiShoppingBag className="size-5" />
                </div>
                <div className="mt-4 text-3xl font-bold text-white">
                  {stats.cart}
                </div>
                <div className="mt-1 text-sm text-white/58">{t("account.itemsInCart")}</div>
              </div>
            </div>
          )}
        </section>

      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <section className="rounded-[28px] border border-white/8 bg-[#1d1d1d] p-6">
          <div className="text-xs uppercase tracking-[0.28em] text-white/42">
            {t("account.accountDetails")}
          </div>
          <div className="mt-4 space-y-4 text-sm text-white/72">
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
              <span className="text-white/46">{t("account.displayName")}</span>
              <span className="font-medium text-white">{displayName}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
              <span className="text-white/46">{t("account.email")}</span>
              <span className="font-medium text-white">
                {user.email || t("account.notProvided")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/46">{t("account.accountStatus")}</span>
              <span className="rounded-full border border-[#dc2626]/30 bg-[#dc2626]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#fca5a5]">
                {t("account.active")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
