import { Label } from "@/components/ui/label";

export type FirstLogData = {
  sleepScore: number;
  sleepDuration: number;
  hrv: number;
  energyLevel: number;
};

type Step6FirstLogProps = {
  data: FirstLogData;
  onComplete: (data: FirstLogData) => void;
};

function SliderField({
  label,
  max,
  min,
  step,
  value,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-[#f9fafb]">{value}</span>
      </div>
      <input
        className="w-full accent-[#6366f1]"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function Step6FirstLog({ data, onComplete }: Step6FirstLogProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#f9fafb]">
          Let&apos;s log your first recovery check-in
        </h2>
      </div>

      <SliderField
        label="Sleep Score"
        max={100}
        min={0}
        value={data.sleepScore}
        onChange={(sleepScore) => onComplete({ ...data, sleepScore })}
      />
      <SliderField
        label="Sleep Duration"
        max={12}
        min={4}
        step={0.5}
        value={data.sleepDuration}
        onChange={(sleepDuration) => onComplete({ ...data, sleepDuration })}
      />
      <SliderField
        label="HRV"
        max={120}
        min={20}
        value={data.hrv}
        onChange={(hrv) => onComplete({ ...data, hrv })}
      />
      <SliderField
        label="Energy Level"
        max={10}
        min={0}
        value={data.energyLevel}
        onChange={(energyLevel) => onComplete({ ...data, energyLevel })}
      />
    </div>
  );
}
