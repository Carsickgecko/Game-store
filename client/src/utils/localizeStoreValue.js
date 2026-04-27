function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function translateFromGroups(value, t, groups) {
  const source = String(value || "").trim();

  if (!source) {
    return source;
  }

  const token = normalizeKey(source);

  for (const group of groups) {
    const key = `${group}.${token}`;
    const translated = t(key);

    if (translated !== key) {
      return translated;
    }
  }

  return source;
}

function translateList(value, t, groups) {
  return String(value || "")
    .split(/[|,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => translateFromGroups(part, t, groups))
    .join(" | ");
}

export function localizeGenre(value, t) {
  return translateList(value, t, ["taxonomy.genres"]);
}

export function localizePlatform(value, t) {
  return translateList(value, t, ["taxonomy.platforms"]);
}

export function localizeTag(value, t) {
  return translateFromGroups(value, t, [
    "taxonomy.tags",
    "taxonomy.genres",
    "taxonomy.platforms",
  ]);
}

export function localizeMeta(value, t) {
  return String(value || "")
    .split(/[|•]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => localizeTag(part, t))
    .join(" | ");
}
