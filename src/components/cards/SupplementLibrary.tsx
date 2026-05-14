"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplementEntry } from "@/types/models";

type SupplementDraft = Omit<SupplementEntry, "taken">;

const SUPPLEMENT_LIBRARY_KEY = "aetheros_supplement_library";

const EMPTY_DRAFT: SupplementDraft = {
  name: "",
  dosage: "",
  timing: "Morning",
  purpose: "Health",
};

const TIMINGS = [
  "Morning",
  "Pre-workout",
  "With meals",
  "Evening",
  "Before bed",
];

const PURPOSES = ["Sleep", "Recovery", "Performance", "Health"];

const TEMPLATES: SupplementDraft[] = [
  {
    name: "Magnesium Glycinate",
    dosage: "400mg",
    timing: "Before bed",
    purpose: "Sleep",
  },
  {
    name: "Creatine Monohydrate",
    dosage: "5g",
    timing: "Morning",
    purpose: "Performance",
  },
  {
    name: "Omega-3",
    dosage: "2g",
    timing: "With meals",
    purpose: "Recovery",
  },
  {
    name: "Vitamin D3",
    dosage: "2000IU",
    timing: "Morning",
    purpose: "Health",
  },
  {
    name: "Zinc",
    dosage: "25mg",
    timing: "Evening",
    purpose: "Recovery",
  },
];

function readLibrary(): SupplementEntry[] {
  const rawLibrary = localStorage.getItem(SUPPLEMENT_LIBRARY_KEY);

  if (!rawLibrary) {
    return [];
  }

  try {
    const parsedLibrary: unknown = JSON.parse(rawLibrary);
    return Array.isArray(parsedLibrary)
      ? parsedLibrary.filter(
          (item): item is SupplementEntry =>
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

function saveLibrary(library: SupplementEntry[]): void {
  localStorage.setItem(SUPPLEMENT_LIBRARY_KEY, JSON.stringify(library));
}

function toEntry(draft: SupplementDraft): SupplementEntry {
  return {
    ...draft,
    taken: false,
  };
}

export function SupplementLibrary() {
  const [library, setLibrary] = useState<SupplementEntry[]>(() =>
    typeof window === "undefined" ? [] : readLibrary(),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<SupplementDraft>(EMPTY_DRAFT);

  const persistLibrary = (nextLibrary: SupplementEntry[]) => {
    setLibrary(nextLibrary);
    saveLibrary(nextLibrary);
  };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setIsAdding(false);
    setEditingIndex(null);
  };

  const saveDraft = () => {
    if (!draft.name.trim()) {
      return;
    }

    const entry = toEntry({
      ...draft,
      name: draft.name.trim(),
    });

    if (editingIndex !== null) {
      persistLibrary(
        library.map((item, index) => (index === editingIndex ? entry : item)),
      );
    } else {
      persistLibrary([...library, entry]);
    }

    resetDraft();
  };

  const startEdit = (index: number) => {
    const item = library[index];
    setDraft({
      name: item.name,
      dosage: item.dosage,
      timing: item.timing,
      purpose: item.purpose,
    });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const deleteItem = (index: number) => {
    persistLibrary(library.filter((_, itemIndex) => itemIndex !== index));
  };

  const addTemplate = (template: SupplementDraft) => {
    if (library.some((item) => item.name === template.name)) {
      return;
    }

    persistLibrary([...library, toEntry(template)]);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[#f9fafb]">
            Current Library
          </h1>
          <Button
            className="bg-[#6366f1] text-white hover:bg-[#5558df]"
            type="button"
            onClick={() => setIsAdding(true)}
          >
            Add Supplement
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {library.map((supplement, index) => (
            <article
              className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
              key={`${supplement.name}-${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium text-[#f9fafb]">
                    {supplement.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {supplement.dosage} — {supplement.timing} —{" "}
                    {supplement.purpose}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => startEdit(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => deleteItem(index)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {isAdding ? (
          <div className="mt-5 space-y-3 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
            <div className="space-y-2">
              <Label htmlFor="supplementName">Name</Label>
              <Input
                id="supplementName"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplementDosage">Dosage</Label>
              <Input
                id="supplementDosage"
                placeholder="400mg"
                value={draft.dosage}
                onChange={(event) =>
                  setDraft({ ...draft, dosage: event.target.value })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-10 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-sm text-[#f9fafb]"
                value={draft.timing}
                onChange={(event) =>
                  setDraft({ ...draft, timing: event.target.value })
                }
              >
                {TIMINGS.map((timing) => (
                  <option key={timing} value={timing}>
                    {timing}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-sm text-[#f9fafb]"
                value={draft.purpose}
                onChange={(event) =>
                  setDraft({ ...draft, purpose: event.target.value })
                }
              >
                {PURPOSES.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-[#6366f1] text-white hover:bg-[#5558df]"
                type="button"
                onClick={saveDraft}
              >
                Save
              </Button>
              <Button type="button" variant="outline" onClick={resetDraft}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Quick Add Templates
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((template) => {
            const isAdded = library.some((item) => item.name === template.name);

            return (
              <article
                className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
                key={template.name}
              >
                <h3 className="font-medium text-[#f9fafb]">{template.name}</h3>
                <p className="mt-1 text-sm text-[#9ca3af]">
                  {template.dosage} — {template.timing} — {template.purpose}
                </p>
                <Button
                  className="mt-3"
                  disabled={isAdded}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => addTemplate(template)}
                >
                  {isAdded ? "Added" : "Add"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-5 text-[#6b7280]">
        This app does not provide medical advice. Consult a healthcare
        professional before starting any supplement.
      </p>
    </div>
  );
}
