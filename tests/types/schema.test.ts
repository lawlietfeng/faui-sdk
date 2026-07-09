import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  ActionConfig,
  Activity,
  ActivityDelta,
  ActivitySnapshot,
  Component,
  ConditionComponentConfig,
  Content,
  RepeaterComponentConfig,
  ValueBinding
} from "../../src";

describe("schema types", () => {
  it("supports snapshot and delta activities", () => {
    const snapshot: ActivitySnapshot = {
      type: "ACTIVITY_SNAPSHOT",
      content: {
        dataModel: {
          title: "员工信息卡",
          users: [{ id: 1, name: "Ann" }]
        },
        components: [
          {
            id: "root",
            component: "form",
            children: ["search", "submit"]
          },
          {
            id: "search",
            component: "input",
            field: "keyword",
            value: { path: "/keyword" },
            placeholder: "请输入关键词"
          },
          {
            id: "submit",
            component: "button",
            label: "提交",
            on_tap: [{ action: "message", payload: { level: "success", text: "ok" } }]
          }
        ]
      }
    };

    const delta: ActivityDelta = {
      type: "ACTIVITY_DELTA",
      eventType: "update",
      patch: [{ op: "replace", path: "/dataModel/title", value: "员工信息卡 V2" }]
    };

    const activities: Activity[] = [snapshot, delta];

    expect(activities).toHaveLength(2);
    expect(snapshot.content.components[1]?.value).toEqual({ path: "/keyword" });
    expect(delta.patch[0]?.path).toBe("/dataModel/title");
  });

  it("keeps component bindings, visibility and actions composable", () => {
    const submitAction: ActionConfig = {
      action: "update_data",
      path: "/filters/status",
      value: "${enabled ? 'active' : 'disabled'}",
      on_success: {
        action: "message",
        payload: {
          level: "success",
          text: "状态已更新"
        }
      },
      on_error: [
        {
          action: "notification",
          payload: {
            type: "error",
            text: "更新失败"
          }
        }
      ]
    };

    const component: Component = {
      id: "status-button",
      component: "button",
      label: "更新状态",
      visible: "${enabled}",
      value: { path: "/filters/status" },
      on_tap: [submitAction]
    };

    expect(component.visible).toBe("${enabled}");
    expect(component.on_tap?.[0]).toEqual(submitAction);
  });

  it("reserves condition and repeater fields for later renderer work", () => {
    const condition: ConditionComponentConfig = {
      id: "user-condition",
      component: "condition",
      when: "${users.length > 0}",
      then: ["user-list"],
      else: ["empty-state"],
      match: { path: "/currentStatus" },
      cases: {
        active: ["user-list"],
        empty: ["empty-state"]
      },
      default: ["empty-state"]
    };

    const repeater: RepeaterComponentConfig = {
      id: "user-list",
      component: "repeater",
      data: { path: "/users" },
      direction: "vertical",
      gap: 12,
      keyField: "id",
      children: ["user-card"]
    };

    expect(condition.then).toEqual(["user-list"]);
    expect(repeater.data).toEqual({ path: "/users" });
  });

  it("exports reusable content aliases for lifecycle and renderer integration", () => {
    const content: Content = {
      dataModel: {
        enabled: true
      },
      components: [
        {
          id: "root",
          component: "box",
          visible: true,
          children: ["child"]
        },
        {
          id: "child",
          component: "text",
          content: "hello"
        }
      ]
    };

    expect(content.components[0]?.children).toEqual(["child"]);
    expect(content.dataModel.enabled).toBe(true);
  });
});

describe("schema type assertions", () => {
  it("keeps ValueBinding and action payload typings available", () => {
    const binding: ValueBinding = { path: "/form/name" };

    expect(binding.path).toBe("/form/name");
    expectTypeOf(binding).toEqualTypeOf<ValueBinding>();
  });

  it("keeps component action typings available on schema samples", () => {
    const component = {
      id: "submit",
      component: "button",
      on_mount: {
        action: "message",
        payload: {
          text: "mounted"
        }
      }
    } satisfies Component;

    expectTypeOf(component.component).toEqualTypeOf<"button">();
    expectTypeOf(component.on_mount).toMatchTypeOf<ActionConfig | ActionConfig[] | undefined>();
  });
});
