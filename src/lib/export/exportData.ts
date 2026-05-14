import { db } from "@/lib/db/schema";
import type {
  LifestyleLog,
  NutritionLog,
  RecoveryLog,
  SupplementLog,
  UserBaseline,
  UserProfile,
  WorkoutLog,
} from "@/types/models";

const EXPORT_KEYS = [
  "recoveryLogs",
  "workoutLogs",
  "nutritionLogs",
  "supplementLogs",
  "lifestyleLogs",
  "userProfiles",
  "userBaselines",
] as const;

interface AetherExport {
  exportedAt: string;
  recoveryLogs: RecoveryLog[];
  workoutLogs: WorkoutLog[];
  nutritionLogs: NutritionLog[];
  supplementLogs: SupplementLog[];
  lifestyleLogs: LifestyleLog[];
  userProfiles: UserProfile[];
  userBaselines: UserBaseline[];
}

type ImportableKey = (typeof EXPORT_KEYS)[number];

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadText(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCSV(value: number | string): string {
  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExpectedKeys(value: unknown): value is Record<ImportableKey, unknown[]> {
  if (!isRecord(value)) {
    return false;
  }

  return EXPORT_KEYS.every((key) => Array.isArray(value[key]));
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file as text."));
    };
    reader.onerror = () => reject(new Error("Unable to read import file."));
    reader.readAsText(file);
  });
}

export async function exportJSON(): Promise<void> {
  const data: AetherExport = {
    exportedAt: new Date().toISOString(),
    recoveryLogs: await db.recoveryLogs.toArray(),
    workoutLogs: await db.workoutLogs.toArray(),
    nutritionLogs: await db.nutritionLogs.toArray(),
    supplementLogs: await db.supplementLogs.toArray(),
    lifestyleLogs: await db.lifestyleLogs.toArray(),
    userProfiles: await db.userProfiles.toArray(),
    userBaselines: await db.userBaselines.toArray(),
  };

  downloadText(
    `aetheros-export-${getTodayDate()}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

export async function exportCSV(): Promise<void> {
  const headers = [
    "date",
    "sleepScore",
    "sleepDuration",
    "hrv",
    "bodyBattery",
    "stressLevel",
    "soreness",
    "energyLevel",
    "notes",
  ];
  const recoveryLogs = await db.recoveryLogs.orderBy("date").toArray();
  const rows = recoveryLogs.map((log) =>
    [
      log.date,
      log.sleepScore,
      log.sleepDuration,
      log.hrv,
      log.bodyBattery,
      log.stressLevel,
      log.soreness,
      log.energyLevel,
      log.notes,
    ]
      .map(escapeCSV)
      .join(","),
  );

  downloadText(
    `aetheros-recovery-${getTodayDate()}.csv`,
    [headers.join(","), ...rows].join("\n"),
    "text/csv",
  );
}

export async function importJSON(
  file: File,
): Promise<{ success: boolean; summary: string; error?: string }> {
  try {
    const raw = await readFileAsText(file);
    const parsed: unknown = JSON.parse(raw);

    if (!hasExpectedKeys(parsed)) {
      return {
        success: false,
        summary: "Import failed.",
        error: "Invalid AetherOS export file.",
      };
    }

    const summary = `Found ${parsed.recoveryLogs.length} recovery logs, ${parsed.workoutLogs.length} workouts. Import will merge with existing data. Continue?`;
    const confirmed = window.confirm(summary);

    if (!confirmed) {
      return {
        success: false,
        summary: "Import cancelled.",
      };
    }

    await db.transaction(
      "rw",
      [
        db.recoveryLogs,
        db.workoutLogs,
        db.nutritionLogs,
        db.supplementLogs,
        db.lifestyleLogs,
        db.userProfiles,
        db.userBaselines,
      ],
      async () => {
        await db.recoveryLogs.bulkPut(parsed.recoveryLogs as RecoveryLog[]);
        await db.workoutLogs.bulkPut(parsed.workoutLogs as WorkoutLog[]);
        await db.nutritionLogs.bulkPut(parsed.nutritionLogs as NutritionLog[]);
        await db.supplementLogs.bulkPut(parsed.supplementLogs as SupplementLog[]);
        await db.lifestyleLogs.bulkPut(parsed.lifestyleLogs as LifestyleLog[]);
        await db.userProfiles.bulkPut(parsed.userProfiles as UserProfile[]);
        await db.userBaselines.bulkPut(parsed.userBaselines as UserBaseline[]);
      },
    );

    return {
      success: true,
      summary: "Import complete!",
    };
  } catch (error) {
    return {
      success: false,
      summary: "Import failed.",
      error: error instanceof Error ? error.message : "Invalid import file.",
    };
  }
}
