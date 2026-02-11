export default function FilterSidebar({ genre, onChangeGenre }) {
  const genres = ["All", "Action", "RPG", "Racing", "Strategy", "Indie"];

  return (
    <aside className="border rounded p-4 h-fit">
      <h3 className="font-semibold mb-3">Filters</h3>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Genre</div>
        <select
          className="w-full border rounded px-2 py-2 text-sm"
          value={genre}
          onChange={(e) => onChangeGenre?.(e.target.value)}
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs opacity-60">
        Next filters (optional): price range, rating, DRM, stock...
      </p>
    </aside>
  );
}
