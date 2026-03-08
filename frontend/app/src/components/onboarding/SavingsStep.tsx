"use client";

type SavingsStepProps = {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
};

export function SavingsStep({ value, onChange, onNext, onBack }: SavingsStepProps) {
  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    const num = cleaned === "" ? 0 : parseFloat(cleaned);
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink-1 tracking-tight mb-2">
          How much do you have in savings?
        </h2>
        <p className="text-sm text-ink-3">
          Total amount in savings accounts, emergency fund, or cash reserves.
        </p>
      </div>
      <div>
        <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-navy-800 px-4 py-3 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400/30">
          <span className="text-ink-4 font-medium">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={value > 0 ? value.toLocaleString("en-US") : ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent font-mono text-lg font-semibold text-ink-1 placeholder-ink-4 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-navy-800 hover:bg-navy-700 px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-gold-400 hover:bg-gold-300 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
