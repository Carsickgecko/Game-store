export default function RatingStars({ value = 0, size = "text-base" }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"✩".repeat(empty)}
    </span>
  );
}
