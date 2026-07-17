import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const antdMock = vi.hoisted(() => {
  const values = new Map<string, unknown>();
  return {
    calls: {} as Record<string, any[]>,
    values,
    formApi: {
      setFieldValue: vi.fn((name: string, value: unknown) => values.set(name, value)),
      getFieldValue: vi.fn((name: string) => values.get(name)),
    },
  };
});

vi.mock("antd", async () => {
  const ReactModule = await import("react");
  const make = (name: string) => {
    const Component = (props: any) => {
      antdMock.calls[name] = [...(antdMock.calls[name] ?? []), props];
      return ReactModule.createElement("div", { "data-antd": name }, props.children);
    };
    return Component;
  };
  const App = make("App") as any;
  App.useApp = () => ({ message: {}, notification: {} });
  const Input = make("Input") as any;
  Input.TextArea = make("Input.TextArea");
  const Radio = make("Radio") as any;
  Radio.Group = make("Radio.Group");
  const Checkbox = make("Checkbox") as any;
  Checkbox.Group = make("Checkbox.Group");
  const Form = make("Form") as any;
  Form.useForm = () => [antdMock.formApi];
  return {
    App,
    Form,
    Input,
    AutoComplete: make("AutoComplete"),
    InputNumber: make("InputNumber"),
    Select: make("Select"),
    Radio,
    Checkbox,
    DatePicker: make("DatePicker"),
    Upload: make("Upload"),
    Button: make("Button"),
    Switch: make("Switch"),
    Slider: make("Slider"),
    Rate: make("Rate"),
    Cascader: make("Cascader"),
    TreeSelect: make("TreeSelect"),
    TimePicker: make("TimePicker"),
    ColorPicker: make("ColorPicker"),
    Transfer: make("Transfer"),
    Mentions: make("Mentions"),
    Segmented: make("Segmented"),
    Calendar: make("Calendar"),
    message: { config: vi.fn(), info: vi.fn() },
    notification: { config: vi.fn(), info: vi.fn() },
  };
});

vi.mock("@ant-design/icons", () => ({
  UploadOutlined: () => <span>upload</span>,
}));

import type { ActionConfig, Component } from "../../src/types/schema";
import { RendererContextProvider } from "../../src/context/RendererContext";
import { FormProvider } from "../../src/context/FormContext";
import { AutoComplete } from "../../src/components/AutoComplete";
import { InputNumber } from "../../src/components/InputNumber";
import { Select } from "../../src/components/Select";
import { Radio } from "../../src/components/Radio";
import { Checkbox } from "../../src/components/Checkbox";
import { DatePicker } from "../../src/components/DatePicker";
import { Upload } from "../../src/components/Upload";
import { Switch } from "../../src/components/Switch";
import { Slider } from "../../src/components/Slider";
import { Rate } from "../../src/components/Rate";
import { Cascader } from "../../src/components/Cascader";
import { TreeSelect } from "../../src/components/TreeSelect";
import { TimePicker } from "../../src/components/TimePicker";
import { ColorPicker } from "../../src/components/ColorPicker";
import { Transfer } from "../../src/components/Transfer";
import { Mentions } from "../../src/components/Mentions";
import { Segmented } from "../../src/components/Segmented";
import { Textarea } from "../../src/components/Textarea";
import { Calendar } from "../../src/components/Calendar";

const componentMap = new Map<string, Component>();

function lastProps(name: string): any {
  const calls = antdMock.calls[name];
  return calls?.[calls.length - 1];
}

function renderControl(
  ComponentType: React.FC<any>,
  config: Record<string, unknown>,
  onAction: (action: ActionConfig) => void | Promise<void>,
  dataModel: Record<string, unknown> = { value: "initial" },
  withForm = false,
) {
  const resolved = { id: "control", component: "control", ...config } as unknown as Component;
  const control = <ComponentType config={resolved} componentMap={componentMap} />;
  return render(
    <RendererContextProvider dataModel={dataModel} componentRegistry={{}} onAction={onAction}>
      {withForm ? <FormProvider>{control}</FormProvider> : control}
    </RendererContextProvider>,
  );
}

beforeEach(() => {
  antdMock.calls = {};
  antdMock.values.clear();
  antdMock.formApi.setFieldValue.mockClear();
  antdMock.formApi.getFieldValue.mockClear();
});

type ControlCase = {
  name: string;
  component: React.FC<any>;
  antd: string;
  config?: Record<string, unknown>;
  args: unknown[];
  expected: unknown;
};

const controlCases: ControlCase[] = [
  { name: "autocomplete", component: AutoComplete, antd: "AutoComplete", args: ["next"], expected: "next" },
  { name: "inputnumber", component: InputNumber, antd: "InputNumber", args: [2], expected: 2 },
  { name: "select", component: Select, antd: "Select", config: { options: [{ label: "Next", value: "next" }] }, args: ["next"], expected: "next" },
  { name: "radio", component: Radio, antd: "Radio.Group", config: { options: [{ label: "Next", value: "next" }] }, args: [{ target: { value: "next" } }], expected: "next" },
  { name: "checkbox", component: Checkbox, antd: "Checkbox", config: { checked: { path: "/value" } }, args: [{ target: { checked: true } }], expected: true },
  { name: "checkbox group", component: Checkbox, antd: "Checkbox.Group", config: { options: [{ label: "A", value: "a" }] }, args: [["a"]], expected: ["a"] },
  { name: "datepicker", component: DatePicker, antd: "DatePicker", args: [null, "2026-01-02"], expected: "2026-01-02" },
  { name: "upload", component: Upload, antd: "Upload", args: [{ fileList: [{ uid: "1", name: "a.txt" }] }], expected: [{ uid: "1", name: "a.txt" }] },
  { name: "switch", component: Switch, antd: "Switch", args: [true], expected: true },
  { name: "slider", component: Slider, antd: "Slider", args: [[1, 2]], expected: [1, 2] },
  { name: "rate", component: Rate, antd: "Rate", args: [4], expected: 4 },
  { name: "cascader", component: Cascader, antd: "Cascader", args: [["a", "b"]], expected: ["a", "b"] },
  { name: "treeselect", component: TreeSelect, antd: "TreeSelect", args: ["node"], expected: "node" },
  { name: "timepicker", component: TimePicker, antd: "TimePicker", args: [null, "10:30"], expected: "10:30" },
  { name: "colorpicker", component: ColorPicker, antd: "ColorPicker", args: [{}, "#ffffff"], expected: "#ffffff" },
  { name: "transfer", component: Transfer, antd: "Transfer", config: { options: [{ key: "a", title: "A" }] }, args: [["a"]], expected: ["a"] },
  { name: "mentions", component: Mentions, antd: "Mentions", args: ["hello"], expected: "hello" },
  { name: "segmented", component: Segmented, antd: "Segmented", config: { options: ["a", "b"] }, args: ["b"], expected: "b" },
  { name: "textarea", component: Textarea, antd: "Input.TextArea", args: [{ target: { value: "text" } }], expected: "text" },
];

describe("form control change contracts", () => {
  it.each(controlCases)("$name writes its bound value", async ({ component, antd, config, args, expected }) => {
    const onAction = vi.fn();
    const binding = antd === "Checkbox" ? {} : { value: { path: "/value" } };
    renderControl(component, { ...binding, ...config }, onAction);

    act(() => lastProps(antd).onChange(...args));

    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update_data", path: "/value", value: expected }),
      expect.anything(),
    ));
  });

  it.each(controlCases)("$name runs custom on_change with the component value", async ({ component, antd, config, args, expected }) => {
    const onAction = vi.fn();
    renderControl(component, {
      value: { path: "/value" },
      ...config,
      on_change: { action: "update_data", path: "/custom" },
    }, onAction);

    act(() => lastProps(antd).onChange(...args));

    await waitFor(() => expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/custom", value: expected }),
      expect.objectContaining({ $value: expected }),
    ));
  });
});

describe("date and upload control details", () => {
  it.each(controlCases)("$name registers and synchronizes with a form", async ({ component, antd, config, args }) => {
    const onAction = vi.fn();
    renderControl(component, {
      value: { path: "/value" },
      field: "customField",
      rules: [{ required: true, pattern: "^x" }],
      validateTrigger: ["onChange", "onBlur"],
      ...config,
    }, onAction, { value: "initial" }, true);

    act(() => lastProps(antd).onChange(...args));

    await waitFor(() => expect(antdMock.formApi.setFieldValue).toHaveBeenCalled());
  });

  it("DatePicker enforces dynamic before and after date limits", () => {
    const onAction = vi.fn();
    renderControl(DatePicker, {
      value: { path: "/value" },
      disabledDate: {
        before: { path: "/before" },
        after: { path: "/after" },
      },
    }, onAction, { value: "2026-06-01", before: "2026-01-01", after: "2026-12-31" });

    const disabledDate = lastProps("DatePicker").disabledDate;
    expect(disabledDate(dayjs("2025-12-31"))).toBe(true);
    expect(disabledDate(dayjs("2027-01-01"))).toBe(true);
    expect(disabledDate(dayjs("2026-06-01"))).toBe(false);
  });

  it("Calendar emits formatted selection and panel details", async () => {
    const onAction = vi.fn();
    renderControl(Calendar, {
      value: { path: "/value" },
      format: "YYYY/MM/DD",
      on_change: { action: "update_data", path: "/selected" },
      on_panel_change: { action: "update_data", path: "/panel" },
    }, onAction, { value: "2026/01/01" });
    const props = lastProps("Calendar");

    act(() => props.onSelect(dayjs("2026-02-03"), { source: "date" }));
    act(() => props.onPanelChange(dayjs("2027-01-01"), "year"));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
    expect(onAction.mock.calls[0][0]).toMatchObject({
      path: "/selected",
      value: "2026/02/03",
      payload: { source: "date" },
    });
    expect(onAction.mock.calls[1][0]).toMatchObject({
      path: "/panel",
      value: "2027/01/01",
      payload: { mode: "year" },
    });
  });
});
