import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiClock,
  FiDollarSign,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { getUser, isAdmin, isAuthenticated, logout } from "../store/auth.js";
import { getCartItems, getWishlistItems } from "../store/storage.js";
import { fetchMyLibrary } from "../api/library.js";
import { adminFetchStats } from "../api/admin.js";
import AccountShell from "../components/account/AccountShell.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { toImageUrl } from "../utils/image.js";

function buildStats() {
  return {
    wishlist: getWishlistItems().length,
    cart: getCartItems().length,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatChartDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatUpdatedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/18 p-5">
      <div className="inline-flex rounded-full bg-white/6 p-2 text-[#dc2626]">
        <Icon className="size-5" />
      </div>
      <div className="mt-4 text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/58">{label}</div>
      {detail ? <div className="mt-3 text-xs text-white/42">{detail}</div> : null}
    </div>
  );
}

function AdminSalesDashboard({ data, error }) {
  const summary = data?.summary || {};
  const daily = Array.isArray(data?.daily) ? data.daily : [];
  const topGames = Array.isArray(data?.topGames) ? data.topGames : [];
  const maxRevenue = Math.max(1, ...daily.map((day) => Number(day.revenue || 0)));

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-col gap-2 rounded-[24px] border border-white/8 bg-black/18 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-white/42">
            Sales analytics
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            Live admin dashboard
          </div>
          <p className="mt-1 text-sm text-white/54">
            Auto-refreshes every 15 seconds from completed orders.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/58">
          <FiClock className="size-4 text-[#dc2626]" />
          {data?.updatedAt
            ? `Updated ${formatUpdatedAt(data.updatedAt)}`
            : "Waiting for data"}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FiDollarSign}
          label="Total revenue"
          value={formatCurrency(summary.totalRevenue)}
          detail={`Today: ${formatCurrency(summary.todayRevenue)}`}
        />
        <MetricCard
          icon={FiShoppingBag}
          label="Completed orders"
          value={formatNumber(summary.completedOrders)}
          detail={`Today: ${formatNumber(summary.todayOrders)}`}
        />
        <MetricCard
          icon={FiBarChart2}
          label="Games sold"
          value={formatNumber(summary.gamesSold)}
          detail={`Today: ${formatNumber(summary.todayGamesSold)}`}
        />
        <MetricCard
          icon={FiActivity}
          label="Average order value"
          value={formatCurrency(summary.averageOrderValue)}
          detail={`${formatNumber(summary.activeGames)} active games`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[28px] border border-white/8 bg-black/18 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/42">
                Last 7 days
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Revenue by day
              </h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/52">
              Bar chart
            </div>
          </div>

          <div className="mt-6 flex h-64 items-end gap-3 rounded-[22px] border border-white/8 bg-[#111111] px-4 pb-4 pt-6">
            {daily.map((day) => {
              const revenue = Number(day.revenue || 0);
              const height = Math.max(10, Math.round((revenue / maxRevenue) * 180));

              return (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                  <div className="flex h-[188px] w-full items-end justify-center">
                    <div
                      className="w-full max-w-12 rounded-t-2xl bg-[linear-gradient(180deg,#ef4444,#991b1b)] shadow-[0_18px_34px_-22px_rgba(239,68,68,0.95)]"
                      style={{ height }}
                      title={`${formatChartDate(day.date)}: ${formatCurrency(revenue)} | ${formatNumber(day.gamesSold)} sold`}
                    />
                  </div>
                  <div className="text-center text-[11px] text-white/42">
                    {formatChartDate(day.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-black/18 p-5">
          <div className="text-xs uppercase tracking-[0.28em] text-white/42">
            Best sellers
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Top games sold
          </h3>

          <div className="mt-5 space-y-3">
            {topGames.length ? (
              topGames.map((game, index) => (
                <div
                  key={game.id}
                  className="rounded-2xl border border-white/8 bg-[#111111] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.2em] text-[#fca5a5]">
                        #{index + 1}
                      </div>
                      <div className="mt-1 line-clamp-1 font-semibold text-white">
                        {game.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {formatNumber(game.sold)}
                      </div>
                      <div className="text-xs text-white/42">sold</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-white/54">
                    {formatCurrency(game.revenue)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/8 bg-[#111111] p-4 text-sm text-white/54">
                No completed sales yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Account() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const adminView = isAdmin();
  const [adminStats, setAdminStats] = useState(null);
  const [adminStatsError, setAdminStatsError] = useState("");
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
    let adminStatsTimer;

    const syncUser = () => setUser(getUser());
    const syncLocalStats = () => {
      if (!alive) return;
      setStats((current) => ({ ...current, ...buildStats() }));
    };

    const syncAdminStats = async () => {
      try {
        const data = await adminFetchStats();
        if (!alive) return;

        const summary = data?.summary || {};
        setAdminStats(data);
        setAdminStatsError("");
        setStats({
          wishlist: 0,
          cart: 0,
          library: 0,
          storeGames: Number(summary.storeGames || 0),
          users: Number(summary.users || 0),
        });
      } catch (error) {
        if (!alive) return;
        setAdminStatsError(
          error?.response?.data?.message || "Failed to load admin statistics.",
        );
        setAdminStats(null);
        setStats({
          wishlist: 0,
          cart: 0,
          library: 0,
          storeGames: 0,
          users: 0,
        });
      }
    };

    const hydrate = async () => {
      syncUser();

      if (isAdmin()) {
        await syncAdminStats();
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

    if (isAdmin()) {
      adminStatsTimer = window.setInterval(syncAdminStats, 15000);
    }

    window.addEventListener("auth:changed", hydrate);
    window.addEventListener("store:changed", syncLocalStats);

    return () => {
      alive = false;
      if (adminStatsTimer) {
        window.clearInterval(adminStatsTimer);
      }
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
            <>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard
                  icon={FiGrid}
                  label={t("account.storeGames")}
                  value={formatNumber(stats.storeGames)}
                  detail={`${formatNumber(
                    adminStats?.summary?.activeGames,
                  )} active`}
                />

                <MetricCard
                  icon={FiUsers}
                  label={t("account.registeredUsers")}
                  value={formatNumber(stats.users)}
                  detail={`${formatNumber(
                    adminStats?.summary?.activeUsers,
                  )} active`}
                />
              </div>

              <AdminSalesDashboard
                data={adminStats}
                error={adminStatsError}
              />
            </>
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
