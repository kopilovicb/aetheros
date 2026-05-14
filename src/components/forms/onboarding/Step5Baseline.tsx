type Step5BaselineProps = {
  onComplete: () => void;
};

export function Step5Baseline({ onComplete }: Step5BaselineProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#f9fafb]">
          Building your personal baseline
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#9ca3af]">
          For the first 14 days, AetherOS will collect your data silently.
          After that, full insights and recommendations unlock — calibrated
          entirely to you, not population averages.
        </p>
      </div>

      <div className="grid grid-cols-14 gap-1">
        {Array.from({ length: 14 }).map((_, index) => (
          <div
            aria-label={`Baseline day ${index + 1}`}
            className="h-8 rounded border border-[#2a2a2a] bg-[#111111]"
            key={index}
          />
        ))}
      </div>

      <button
        className="rounded-md bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#5558df]"
        onClick={onComplete}
        type="button"
      >
        Understood
      </button>
    </div>
  );
}
