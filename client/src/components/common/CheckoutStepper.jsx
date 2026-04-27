import { FiCheck } from "react-icons/fi";

function StepItem({ index, label, status = "pending", showConnector = true }) {
  const isCurrent = status === "current";
  const isComplete = status === "complete";
  const isReached = isCurrent || isComplete;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition ${
          isCurrent
            ? "border-emerald-300 bg-emerald-500/18 text-emerald-100 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]"
            : isComplete
              ? "border-emerald-400/55 bg-emerald-500/12 text-emerald-200"
              : "border-white/20 text-white/38"
        }`}
      >
        {isReached ? <FiCheck className="size-4" /> : index}
      </div>

      <span
        className={`whitespace-nowrap text-sm font-medium transition ${
          isCurrent
            ? "text-white"
            : isComplete
              ? "text-emerald-200"
              : "text-white/38"
        }`}
      >
        {label}
      </span>

      {showConnector ? (
        <div
          className={`hidden h-px flex-1 md:block ${
            isComplete ? "bg-emerald-400/35" : "bg-white/12"
          }`}
        />
      ) : null}
    </div>
  );
}

export default function CheckoutStepper({ steps }) {
  return (
    <div className="border-y border-white/8 bg-[#121212]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center">
        {steps.map((step, index) => (
          <StepItem
            key={step.label}
            index={index + 1}
            label={step.label}
            status={step.status}
            showConnector={index < steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
