export default function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
