"use client";

type CreditScoreStepProps = {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
};

const MIN_SCORE = 300;
const MAX_SCORE = 850;

export function CreditScoreStep({ value, onChange, onNext, onBack }: CreditScoreStepProps) {
  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    const num = cleaned === "" ? 0 : parseInt(cleaned, 10);
    onChange(isNaN(num) ? 0 : num);
  };

  const isValid = value >= MIN_SCORE && value <= MAX_SCORE;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink-1 tracking-tight mb-2">
          What is your credit score?
        </h2>
        <p className="text-sm text-ink-3">
          Enter a score between 300 and 850. You can find this on your credit report.
        </p>
      </div>
      <div>
        <input
          type="text"
          inputMode="numeric"
          value={value > 0 ? value : ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl border border-[#e5e7eb] bg-navy-800 px-4 py-3 font-mono text-lg font-semibold text-ink-1 placeholder-ink-4 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/30"
        />
        <p className="text-xs text-ink-4 mt-2">
          Range: {MIN_SCORE} – {MAX_SCORE}
        </p>
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
          disabled={!isValid}
          className="rounded-lg bg-gold-400 hover:bg-gold-300 disabled:bg-navy-800 disabled:text-ink-4 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
