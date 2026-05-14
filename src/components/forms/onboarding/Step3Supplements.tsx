import { Input } from "@/components/ui/input";

export type SupplementSetupData = {
  selectedSupplements: string[];
};

type Step3SupplementsProps = {
  data: SupplementSetupData;
  onComplete: (data: SupplementSetupData) => void;
};

const SUPPLEMENTS = [
  { name: "Magnesium", purpose: "sleep" },
  { name: "Creatine", purpose: "performance" },
  { name: "Omega-3", purpose: "recovery" },
  { name: "Vitamin D", purpose: "health" },
  { name: "Zinc", purpose: "recovery" },
];

export function Step3Supplements({ data, onComplete }: Step3SupplementsProps) {
  const toggleSupplement = (name: string) => {
    const isSelected = data.selectedSupplements.includes(name);
    onComplete({
      selectedSupplements: isSelected
        ? data.selectedSupplements.filter((supplement) => supplement !== name)
        : [...data.selectedSupplements, name],
    });
  };

  const addCustomSupplement = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName || data.selectedSupplements.includes(trimmedName)) {
      return;
    }

    onComplete({
      selectedSupplements: [...data.selectedSupplements, trimmedName],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#f9fafb]">
          Which supplements do you take?
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Optional. You can skip this and update it later.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SUPPLEMENTS.map((supplement) => {
          const isSelected = data.selectedSupplements.includes(supplement.name);

          return (
            <button
              className={`rounded-lg border p-4 text-left transition ${
                isSelected
                  ? "border-[#6366f1] bg-[#111111]"
                  : "border-[#2a2a2a] bg-[#1a1a1a]"
              }`}
              key={supplement.name}
              onClick={() => toggleSupplement(supplement.name)}
              type="button"
            >
              <p className="font-medium text-[#f9fafb]">{supplement.name}</p>
              <p className="mt-1 text-sm text-[#9ca3af]">
                {supplement.purpose}
              </p>
            </button>
          );
        })}
      </div>

      <Input
        placeholder="Add custom"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addCustomSupplement(event.currentTarget.value);
            event.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
