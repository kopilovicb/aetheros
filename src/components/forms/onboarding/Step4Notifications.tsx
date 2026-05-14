import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type NotificationPreferencesData = {
  morningTime: string;
  eveningTime: string;
  notificationsEnabled: boolean;
};

type Step4NotificationsProps = {
  data: NotificationPreferencesData;
  onComplete: (data: NotificationPreferencesData) => void;
};

export function Step4Notifications({
  data,
  onComplete,
}: Step4NotificationsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#f9fafb]">
          When should we remind you?
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          You can change notification preferences anytime.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="morningTime">Morning check-in</Label>
        <Input
          id="morningTime"
          type="time"
          value={data.morningTime}
          onChange={(event) =>
            onComplete({ ...data, morningTime: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eveningTime">Evening reminder</Label>
        <Input
          id="eveningTime"
          type="time"
          value={data.eveningTime}
          onChange={(event) =>
            onComplete({ ...data, eveningTime: event.target.value })
          }
        />
      </div>

      <label className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-sm text-[#f9fafb]">
        <span>Enable notifications</span>
        <input
          checked={data.notificationsEnabled}
          className="h-5 w-5 accent-[#6366f1]"
          type="checkbox"
          onChange={(event) =>
            onComplete({
              ...data,
              notificationsEnabled: event.target.checked,
            })
          }
        />
      </label>
    </div>
  );
}
