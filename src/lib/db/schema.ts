import Dexie, { type Table } from "dexie";

import type {
  RecoveryLog,
  WorkoutLog,
  NutritionLog,
  SupplementLog,
  LifestyleLog,
  UserProfile,
  UserBaseline,
} from "@/types/models";

type SyncOperation = "insert" | "update" | "delete";

export interface SyncQueueItem {
  id: string;
  tableName: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface InsightRecord {
  id: string;
  userId: string;
  date: string;
  severity: "info" | "warning" | "alert";
  category: string;
  message: string;
  recommendation?: string;
  confidence?: number;
  triggeredBy?: string;
  rawData?: Record<string, number | string>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CorrelationRecord {
  id: string;
  userId: string;
  metricX: string;
  metricY: string;
  coefficient: number;
  sampleSize: number;
  windowDays: number;
  calculatedAt: string;
}

export class AetherDB extends Dexie {
  recoveryLogs!: Table<RecoveryLog, string>;
  workoutLogs!: Table<WorkoutLog, string>;
  nutritionLogs!: Table<NutritionLog, string>;
  supplementLogs!: Table<SupplementLog, string>;
  lifestyleLogs!: Table<LifestyleLog, string>;
  userProfiles!: Table<UserProfile, string>;
  userBaselines!: Table<UserBaseline, string>;

  syncQueue!: Table<SyncQueueItem, string>;
  insights!: Table<InsightRecord, string>;
  correlations!: Table<CorrelationRecord, string>;

  constructor() {
    super("AetherDB");

    this.version(1).stores({
      recoveryLogs: "id, userId, date, createdAt, updatedAt",
      workoutLogs: "id, userId, date, createdAt",
      nutritionLogs: "id, userId, date",
      supplementLogs: "id, userId, date",
      lifestyleLogs: "id, userId, date",
      userProfiles: "id, name",
      userBaselines: "userId, updatedAt",

      syncQueue: "id, tableName, operation, timestamp",
      insights: "id, userId, date, severity, category, createdAt",
      correlations:
        "id, userId, metricX, metricY, [metricX+metricY], calculatedAt",
    });
  }
}

export const db = new AetherDB();
