import { Button } from "@/components/ui/button";

type Step1WelcomeProps = {
  onComplete: () => void;
};

export function Step1Welcome({ onComplete }: Step1WelcomeProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold text-[#f9fafb]">
          Welcome to AetherOS
        </h1>
        <p className="text-lg text-[#9ca3af]">
          Your personal recovery operating system
        </p>
      </div>

      <p className="text-sm leading-6 text-[#9ca3af]">
        AetherOS learns your body&apos;s patterns and gives you personalized
        insights. No generic advice — only what&apos;s true for you.
      </p>

      <Button
        className="bg-[#6366f1] text-white hover:bg-[#5558df]"
        onClick={onComplete}
        type="button"
      >
        Get Started
      </Button>
    </div>
  );
}
