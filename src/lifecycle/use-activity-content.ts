import { useMemo } from "react";
import { applyActivityDeltas, type ApplyActivityDeltasResult } from "./apply-activity-deltas";
import type { Activity } from "../types/schema";

export function useActivityContent(activities: Activity[]): ApplyActivityDeltasResult {
  return useMemo(() => applyActivityDeltas(activities), [activities]);
}
