export default function PageSurface({ children, className = "" }) {
  return (
    <div
      className={`rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(16,10,39,0.8),rgba(11,8,28,0.9))] p-5 shadow-[0_26px_60px_-44px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
