"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import type { SupplementEntry, SupplementLog } from "@/types/models";

export type SupplementLibraryItem = SupplementEntry;

export type SupplementAdherenceStat = {
  name: string;
  adherencePercentage: number;
  daysTracked: number;
};

type SupplementData = {
  library: SupplementLibraryItem[];
  todaysLog: SupplementLog | null;
  adherenceStats: SupplementAdherenceStat[];
  isLoading: boolean;
};

type LoadedSupplementData = Omit<SupplementData, "isLoading">;

const SUPPLEMENT_LIBRARY_KEY = "aetheros_supplement_library";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function readLibrary(): SupplementLibraryItem[] {
  const rawLibrary = localStorage.getItem(SUPPLEMENT_LIBRARY_KEY);

  if (!rawLibrary) {
    return [];
  }

  try {
    const parsedLibrary: unknown = JSON.parse(rawLibrary);
    return Array.isArray(parsedLibrary)
      ? parsedLibrary.filter(
          (item): item is SupplementLibraryItem =>
            typeof item === "object" &&
            item !== null &&
            "name" in item &&
            typeof item.name === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function calculateAdherenceStats(
  library: SupplementLibraryItem[],
  logs: SupplementLog[],
): SupplementAdherenceStat[] {
  return library.map((supplement) => {
    const trackedEntries = logs.flatMap((log) =>
      log.supplements.filter((entry) => entry.name === supplement.name),
    );
    const takenCount = trackedEntries.filter((entry) => entry.taken).length;

    return {
      name: supplement.name,
      adherencePercentage:
        trackedEntries.length > 0
          ? Math.round((takenCount / trackedEntries.length) * 100)
          : 0,
      daysTracked: trackedEntries.length,
    };
  });
}

async function loadSupplementData(): Promise<LoadedSupplementData> {
  const library = readLibrary();
  const today = getTodayDate();
  const windowStart = getWindowStartDate(30);
  const [todaysLog, logs] = await Promise.all([
    db.supplementLogs.where("date").equals(today).first(),
    db.supplementLogs.where("date").aboveOrEqual(windowStart).sortBy("date"),
  ]);

  return {
    library,
    todaysLog: todaysLog ?? null,
    adherenceStats: calculateAdherenceStats(library, logs),
  };
}

export function useSupplementData(): SupplementData {
  const [data, setData] = useState<LoadedSupplementData>({
    library: [],
    todaysLog: null,
    adherenceStats: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void loadSupplementData().then((loadedData) => {
      if (!isMounted) {
        return;
      }

      setData(loadedData);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    ...data,
    isLoading,
  };
}
