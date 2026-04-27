import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadWishlist, removeFromWishlist } from "../store/actions.js";
import { isAuthenticated } from "../store/auth.js";
import { getWishlistItems } from "../store/storage.js";
import ProductCard from "../components/product/ProductCard.jsx";
import AccountShell from "../components/account/AccountShell.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";

export default function Wishlist() {
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const hydrateWishlist = async () => {
    setLoading(true);
    setErr("");

    try {
      const list = await loadWishlist();
      setGames(Array.isArray(list) ? list : []);
    } catch (error) {
      setErr(error?.response?.data?.message || t("wishlist.failedLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncFromStore = () => {
      setGames(getWishlistItems());
      setLoading(false);
    };

    hydrateWishlist();

    window.addEventListener("store:changed", syncFromStore);
    window.addEventListener("storage", syncFromStore);
    window.addEventListener("auth:changed", hydrateWishlist);

    return () => {
      window.removeEventListener("store:changed", syncFromStore);
      window.removeEventListener("storage", syncFromStore);
      window.removeEventListener("auth:changed", hydrateWishlist);
    };
  }, []);

  const onRemove = async (gameId) => {
    setErr("");

    try {
      const next = await removeFromWishlist(gameId);
      setGames(Array.isArray(next) ? next : []);
      window.dispatchEvent(new CustomEvent("wishlist:changed"));
    } catch (error) {
      setErr(error?.response?.data?.message || t("wishlist.removeFailed"));
    }
  };

  return (
    <AccountShell
      title={t("wishlist.title")}
      description={
        isAuthenticated()
          ? t("wishlist.descriptionAuth")
          : t("wishlist.descriptionGuest")
      }
      actions={
        <Link
          to="/catalog"
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
        >
          {t("wishlist.backToCatalog")}
        </Link>
      }
      showTabs={isAuthenticated()}
    >
      {loading ? <div className="text-white/60">{t("common.loading")}</div> : null}

      {err ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {!loading && !err && games.length === 0 ? (
        <div className="rounded-[28px] border border-white/8 bg-[#1d1d1d] px-6 py-10 text-white/60">
          {t("wishlist.empty")}
        </div>
      ) : null}

      {!loading && !err && games.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="relative">
              <ProductCard product={game} mode="store" />

              <button
                type="button"
                onClick={() => onRemove(game.id)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:border-white/18 hover:bg-white/10"
              >
                {t("wishlist.remove")}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </AccountShell>
  );
}
