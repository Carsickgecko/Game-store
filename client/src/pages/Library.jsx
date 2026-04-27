import { useEffect, useState } from "react";
import { fetchMyLibrary } from "../api/library.js";
import ProductCard from "../components/product/ProductCard.jsx";
import AccountShell from "../components/account/AccountShell.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";

export default function Library() {
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const list = await fetchMyLibrary();
        if (!alive) return;
        setGames(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || t("library.failedLoad"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  return (
    <AccountShell
      title={t("library.title")}
      description={t("library.description")}
    >
      {loading ? <div className="text-white/60">{t("common.loading")}</div> : null}

      {err ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {!loading && !err && games.length === 0 ? (
        <div className="rounded-[28px] border border-white/8 bg-[#1d1d1d] px-6 py-10 text-white/60">
          {t("library.empty")}
        </div>
      ) : null}

      {!loading && !err && games.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((g) => (
            <ProductCard key={g.id} product={g} mode="library" />
          ))}
        </div>
      ) : null}
    </AccountShell>
  );
}
