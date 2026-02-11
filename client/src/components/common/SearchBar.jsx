import { useState } from "react";

export default function SearchBar({ onSubmit }) {
  const [q, setQ] = useState("");

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(q.trim());
      }}
    >
      <input
        className="w-full border rounded px-3 py-2 text-sm"
        placeholder="Search games..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="border rounded px-3 py-2 text-sm" type="submit">
        Search
      </button>
    </form>
  );
}
