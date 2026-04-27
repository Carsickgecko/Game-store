import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { localizeGenre } from "../../utils/localizeStoreValue.js";

export default function FilterSidebar({ genre, onChangeGenre }) {
  const { t } = useLanguage();
  const genres = ["All", "Action", "RPG", "Racing", "Strategy", "Indie"];

  return (
    <aside className="border rounded p-4 h-fit">
      <h3 className="font-semibold mb-3">{t("catalog.filters")}</h3>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">{t("common.genre")}</div>
        <select
          className="w-full border rounded px-2 py-2 text-sm"
          value={genre}
          onChange={(e) => onChangeGenre?.(e.target.value)}
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? t("catalog.all") : localizeGenre(g, t)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs opacity-60">
        {t("catalog.nextFilters")}
      </p>
    </aside>
  );
}
