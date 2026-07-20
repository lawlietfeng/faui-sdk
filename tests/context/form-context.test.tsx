import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Rule } from "antd/es/form";
import {
  FormProvider,
  useFormContextOptional,
  type FormContextValue,
} from "../../src/context/FormContext";

function renderFormContext(submitButtonId?: string) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormProvider submitButtonId={submitButtonId}>{children}</FormProvider>
  );
  return renderHook(() => useFormContextOptional() as FormContextValue, { wrapper });
}

describe("FormContext", () => {
  it("returns null outside a form provider", () => {
    const { result } = renderHook(() => useFormContextOptional());
    expect(result.current).toBeNull();
  });

  it("registers an initial value only once and synchronizes later values", () => {
    const { result } = renderFormContext();

    act(() => result.current.registerField("name-input", {
      name: "name",
      initialValue: "Ann",
    }));
    expect(result.current.form.getFieldValue("name")).toBe("Ann");

    act(() => result.current.registerField("name-input", {
      name: "name",
      initialValue: "ignored",
    }));
    expect(result.current.form.getFieldValue("name")).toBe("Ann");

    act(() => result.current.syncFieldValue("name-input", "Bob"));
    expect(result.current.form.getFieldValue("name")).toBe("Bob");
  });

  it("ignores synchronization and validation for unknown fields", async () => {
    const { result } = renderFormContext();

    act(() => result.current.syncFieldValue("missing", "value"));
    await expect(result.current.validateField("missing")).resolves.toBe(true);
  });

  it("unregisters fields from validation", async () => {
    const { result } = renderFormContext();
    act(() => result.current.registerField("required", {
      name: "required",
      rules: [{ required: true, message: "Required" }],
    }));

    await act(async () => {
      expect(await result.current.validateAll()).toBe(false);
    });
    act(() => result.current.unregisterField("required"));
    await expect(result.current.validateAll()).resolves.toBe(true);
  });

  it("honors configured validation triggers", async () => {
    const { result } = renderFormContext();
    act(() => result.current.registerField("email", {
      name: "email",
      rules: [{ required: true, message: "Email required" }],
      validateTrigger: "onBlur",
    }));

    await expect(result.current.validateField("email", "onChange")).resolves.toBe(true);
    await act(async () => {
      expect(await result.current.validateField("email", "onBlur")).toBe(false);
    });
    expect(result.current.getFieldErrorInfo("email")).toEqual({
      validateStatus: "error",
      help: "Email required",
    });
  });

  it("clears an existing field error after a valid value", async () => {
    const { result } = renderFormContext();
    act(() => result.current.registerField("name", {
      name: "name",
      rules: [{ required: true }],
    }));

    await act(async () => {
      await result.current.validateField("name");
    });
    expect(result.current.getFieldErrorInfo("name").validateStatus).toBe("error");

    act(() => result.current.syncFieldValue("name", "Ann"));
    await act(async () => {
      await result.current.validateField("name");
    });
    expect(result.current.getFieldErrorInfo("name")).toEqual({});
  });

  it("validates required, whitespace, length, range, enum and pattern rules", async () => {
    const { result } = renderFormContext();
    const cases: Array<[string, unknown, Rule, string]> = [
      ["required", "", { required: true }, "该字段为必填项"],
      ["whitespace", "   ", { whitespace: false }, "该字段不能为空白"],
      ["len", "ab", { len: 3 }, "长度必须为 3"],
      ["min-string", "ab", { min: 3 }, "最小值/最短长度为 3"],
      ["max-array", [1, 2], { max: 1 }, "最大值/最长长度为 1"],
      ["min-number", 1, { min: 2 }, "最小值/最短长度为 2"],
      ["enum", "x", { type: "enum", enum: ["a", "b"] }, "字段值不在允许范围内"],
      ["pattern", "abc", { pattern: /^\d+$/ }, "字段格式不正确"],
    ];

    for (const [id, value, rule, message] of cases) {
      act(() => {
        result.current.registerField(id, { name: id, rules: [rule] });
        result.current.syncFieldValue(id, value);
      });
      await act(async () => {
        expect(await result.current.validateField(id)).toBe(false);
      });
      expect(result.current.getFieldErrorInfo(id).help).toBe(message);
    }
  });

  it.each([
    ["string", 1],
    ["number", "1"],
    ["boolean", "true"],
    ["array", {}],
    ["object", [1]],
    ["email", "invalid"],
    ["url", "ftp://example.com"],
  ] as const)("validates the %s field type", async (type, value) => {
    const { result } = renderFormContext();
    act(() => {
      result.current.registerField("field", {
        name: "field",
        rules: [{ type }],
      });
      result.current.syncFieldValue("field", value);
    });

    await act(async () => {
      expect(await result.current.validateField("field")).toBe(false);
    });
    expect(result.current.getFieldErrorInfo("field").help).toBe("字段类型不正确");
  });

  it("validates every registered field and recognizes the submit button", async () => {
    const { result } = renderFormContext("submit");
    act(() => {
      result.current.registerField("first", {
        name: "first",
        rules: [{ required: true, message: "First required" }],
      });
      result.current.registerField("second", {
        name: "second",
        rules: [{ required: true }],
      });
      result.current.syncFieldValue("second", "value");
    });

    await act(async () => {
      expect(await result.current.validateAll()).toBe(false);
    });

    expect(result.current.getFieldErrorInfo("first").help).toBe("First required");
    expect(result.current.getFieldErrorInfo("second")).toEqual({});
    expect(result.current.isSubmitButton("submit")).toBe(true);
    expect(result.current.isSubmitButton("other")).toBe(false);
  });

  it("returns detailed validation errors and accepts external errors", async () => {
    const { result } = renderFormContext();
    act(() => result.current.registerField("name", {
      name: "name",
      rules: [{ required: true, message: "Name required" }],
    }));

    await act(async () => {
      await expect(result.current.validateAllDetailed()).resolves.toEqual({
        valid: false,
        errors: { name: "Name required" },
      });
    });
    act(() => result.current.setExternalErrors({ name: "Custom error" }));
    expect(result.current.getFieldErrorInfo("name")).toEqual({
      validateStatus: "error",
      help: "Custom error",
    });
  });
});
