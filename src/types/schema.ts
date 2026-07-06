import type { Operation } from "fast-json-patch";

export type Activity = ActivitySnapshot | ActivityDelta;

export interface ActivitySnapshot {
  type: "ACTIVITY_SNAPSHOT";
  content: Content;
}

export type PatchOperation = Exclude<Operation, { op: "_get" }>;

export interface ActivityDelta {
  type: "ACTIVITY_DELTA";
  eventType?: string;
  messageId?: string;
  activityType?: string;
  patch: PatchOperation[];
}

export interface Content {
  components: Component[];
  dataModel: DataModel;
}

export type DataModel = Record<string, unknown>;

export interface ValueBinding {
  path: string;
}

export interface Component {
  id: string;
  component: string;
  children?: string[];
  value?: ValueBinding;
  data?: ValueBinding;
  checked?: ValueBinding;
  content?: string;
  style?: Record<string, string | number>;
  [key: string]: unknown;
}
