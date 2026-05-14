import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfileData = {
  firstName: string;
  age: string;
  primaryGoal: string;
};

type Step2ProfileProps = {
  data: ProfileData;
  onComplete: (data: ProfileData) => void;
};

const GOALS = [
  "Recovery optimization",
  "Training performance",
  "Sleep improvement",
  "General wellness",
];

export function Step2Profile({ data, onComplete }: Step2ProfileProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#f9fafb]">
          Basic profile
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          A few details help personalize your recovery baseline.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          required
          value={data.firstName}
          onChange={(event) =>
            onComplete({ ...data, firstName: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          min="1"
          required
          type="number"
          value={data.age}
          onChange={(event) => onComplete({ ...data, age: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryGoal">Primary goal</Label>
        <select
          className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f9fafb] outline-none"
          id="primaryGoal"
          required
          value={data.primaryGoal}
          onChange={(event) =>
            onComplete({ ...data, primaryGoal: event.target.value })
          }
        >
          <option value="">Select a goal</option>
          {GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
