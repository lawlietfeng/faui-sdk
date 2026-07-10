import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  ActionConfig,
  Activity,
  ActivityDelta,
  ActivitySnapshot,
  CheckboxComponentConfig,
  Component,
  ComponentOptions,
  ConditionComponentConfig,
  Content,
  DatepickerComponentConfig,
  InputnumberComponentConfig,
  RadioComponentConfig,
  RepeaterComponentConfig,
  SelectComponentConfig,
  SwitchComponentConfig,
  TextareaComponentConfig,
  TimepickerComponentConfig,
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

  it("supports first field component variants for form renderer work", () => {
    const components: Component[] = [
      {
        id: "status",
        component: "select",
        field: "status",
        value: { path: "/form/status" },
        placeholder: "请选择状态",
        options: [
          { label: "启用", value: "active" },
          { label: "停用", value: "disabled" }
        ],
        disabled: "${loading}",
        allowClear: true,
        showSearch: { path: "/form/searchable" },
        maxTagCount: 2,
        rules: [{ required: true, message: "请选择状态" }]
      },
      {
        id: "level",
        component: "radio",
        field: "level",
        options: "levels",
        rules: [{ required: true }]
      },
      {
        id: "tags",
        component: "checkbox",
        field: "tags",
        checked: { path: "/form/tags" },
        options: [{ label: "重要", value: "important" }],
        rules: [{ type: "array", min: 1 }]
      },
      {
        id: "description",
        component: "textarea",
        field: "description",
        placeholder: "请输入说明",
        rows: 4,
        maxLength: "${maxDescriptionLength}",
        disabled: false
      },
      {
        id: "count",
        component: "inputnumber",
        field: "count",
        min: 1,
        max: 99,
        step: 1,
        precision: 0,
        rules: [{ type: "number", min: 1, max: 99 }]
      },
      {
        id: "enabled",
        component: "switch",
        field: "enabled",
        checked: { path: "/form/enabled" },
        checkedChildren: "开",
        unCheckedChildren: "关",
        disabled: { path: "/form/readonly" },
        size: "small"
      },
      {
        id: "date",
        component: "datepicker",
        field: "date",
        placeholder: "请选择日期",
        picker: "date",
        format: "YYYY-MM-DD",
        showTime: false,
        disabledDate: {
          before: { path: "/limits/minDate" },
          after: { path: "/limits/maxDate" }
        }
      },
      {
        id: "time",
        component: "timepicker",
        field: "time",
        placeholder: "请选择时间",
        format: "HH:mm",
        minuteStep: 15,
        secondStep: "${secondStep}",
        disabled: "${readonly}"
      }
    ];

    expect(components.map(component => component.component)).toEqual([
      "select",
      "radio",
      "checkbox",
      "textarea",
      "inputnumber",
      "switch",
      "datepicker",
      "timepicker"
    ]);
    expect(components[0]?.options).toEqual([
      { label: "启用", value: "active" },
      { label: "停用", value: "disabled" }
    ]);
    expect(components[5]?.checked).toEqual({ path: "/form/enabled" });
    expect(components[6]?.disabledDate).toEqual({
      before: { path: "/limits/minDate" },
      after: { path: "/limits/maxDate" }
    });
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

  it("keeps field component typings available on schema samples", () => {
    const options: ComponentOptions = [
      { label: "A", value: "a" },
      { label: "B", value: "b" }
    ];

    const select = {
      id: "assignee",
      component: "select",
      field: "assignee",
      options,
      mode: "multiple",
      disabled: "${readonly}"
    } satisfies SelectComponentConfig;

    const radio = {
      id: "priority",
      component: "radio",
      field: "priority",
      options
    } satisfies RadioComponentConfig;

    const checkbox = {
      id: "confirmed",
      component: "checkbox",
      checked: { path: "/form/confirmed" }
    } satisfies CheckboxComponentConfig;

    const textarea = {
      id: "remark",
      component: "textarea",
      rows: 3,
      maxLength: 200
    } satisfies TextareaComponentConfig;

    const inputnumber = {
      id: "amount",
      component: "inputnumber",
      min: 0,
      max: 100,
      precision: 2
    } satisfies InputnumberComponentConfig;

    const switchComponent = {
      id: "active",
      component: "switch",
      checked: { path: "/form/active" },
      disabled: { path: "/form/readonly" }
    } satisfies SwitchComponentConfig;

    const datepicker = {
      id: "start-date",
      component: "datepicker",
      picker: "month",
      disabledDate: {
        before: { path: "/limits/start" }
      }
    } satisfies DatepickerComponentConfig;

    const timepicker = {
      id: "start-time",
      component: "timepicker",
      hourStep: 1,
      minuteStep: "${minuteStep}"
    } satisfies TimepickerComponentConfig;

    expectTypeOf(select).toMatchTypeOf<Component>();
    expectTypeOf(radio.options).toMatchTypeOf<ComponentOptions | undefined>();
    expectTypeOf(checkbox.checked).toMatchTypeOf<ValueBinding | undefined>();
    expectTypeOf(textarea.maxLength).toMatchTypeOf<number | string | undefined>();
    expectTypeOf(inputnumber.precision).toMatchTypeOf<number | undefined>();
    expectTypeOf(switchComponent.disabled).toMatchTypeOf<boolean | string | ValueBinding | undefined>();
    expectTypeOf(datepicker.disabledDate?.before).toMatchTypeOf<ValueBinding | undefined>();
    expectTypeOf(timepicker.minuteStep).toMatchTypeOf<number | string | undefined>();
  });
});
