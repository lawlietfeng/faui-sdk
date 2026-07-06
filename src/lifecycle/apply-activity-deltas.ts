import { applyPatch } from "fast-json-patch";
import type { Activity, ActivityDelta, ActivitySnapshot, Content, PatchOperation } from "../types/schema";

export interface ActivityDeltaError {
  deltaIndex: number;
  patch: PatchOperation[];
  message: string;
  cause: unknown;
}

export type ApplyActivityDeltasResult =
  | {
      ok: true;
      content: Content;
      errors: [];
    }
  | {
      ok: false;
      content: Content | null;
      errors: ActivityDeltaError[];
    };

export function applyActivityDeltas(activities: Activity[]): ApplyActivityDeltasResult {
  const snapshotIndex = activities.findIndex(activity => activity.type === "ACTIVITY_SNAPSHOT");

  if (snapshotIndex === -1) {
    return {
      ok: false,
      content: null,
      errors: [
        {
          deltaIndex: -1,
          patch: [],
          message: "Invalid activity stream: no ACTIVITY_SNAPSHOT found",
          cause: null
        }
      ]
    };
  }

  const snapshot = activities[snapshotIndex];

  if (!isActivitySnapshot(snapshot)) {
    return {
      ok: false,
      content: null,
      errors: [
        {
          deltaIndex: -1,
          patch: [],
          message: "Invalid activity stream: no ACTIVITY_SNAPSHOT found",
          cause: null
        }
      ]
    };
  }

  let content = cloneContent(snapshot.content);
  const deltas = activities.slice(snapshotIndex + 1).filter(isActivityDelta);

  for (const [deltaIndex, delta] of deltas.entries()) {
    const nextContent = cloneContent(content);

    try {
      applyPatch(nextContent, delta.patch, true, true);
      content = nextContent;
    } catch (error) {
      return {
        ok: false,
        content,
        errors: [
          {
            deltaIndex,
            patch: delta.patch,
            message: error instanceof Error ? error.message : String(error),
            cause: error
          }
        ]
      };
    }
  }

  return {
    ok: true,
    content,
    errors: []
  };
}

function isActivityDelta(activity: Activity): activity is ActivityDelta {
  return activity.type === "ACTIVITY_DELTA";
}

function isActivitySnapshot(activity: Activity): activity is ActivitySnapshot {
  return activity.type === "ACTIVITY_SNAPSHOT";
}

function cloneContent(content: Content): Content {
  if (typeof structuredClone === "function") {
    return structuredClone(content);
  }

  return JSON.parse(JSON.stringify(content)) as Content;
}
