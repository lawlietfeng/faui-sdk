import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const antdMocks = vi.hoisted(() => ({
  message: {
    success: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warning: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    loading: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(undefined),
    config: vi.fn(),
  },
  notification: {
    success: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warning: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(undefined),
    config: vi.fn(),
  },
}));

vi.mock("antd", () => antdMocks);

import type { ActionConfig } from "../../src/types/schema";
import { messageAction, setMessageApi } from "../../src/actions/message";
import { notificationAction, setNotificationApi } from "../../src/actions/notification";

const executor = {
  context: {
    $root: { user: { name: "Ann" } },
    $current: { id: 7 },
    $parent: null,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  setMessageApi(null);
  setNotificationApi(null);
});

describe("messageAction", () => {
  it.each(["success", "error", "warning", "info", "loading"] as const)(
    "opens a %s message with evaluated content",
    async (type) => {
      await messageAction({
        action: "message",
        payload: {
          type,
          content: "Hello ${$root.user.name}",
          duration: 2,
          key: "status",
        },
      }, executor);

      expect(antdMocks.message[type]).toHaveBeenCalledWith({
        content: "Hello Ann",
        duration: 2,
        key: "status",
      });
    },
  );

  it("uses info by default and configures maxCount", async () => {
    await messageAction({
      action: "message",
      payload: { content: 7, maxCount: 3 },
    }, executor);

    expect(antdMocks.message.config).toHaveBeenCalledWith({ maxCount: 3 });
    expect(antdMocks.message.info).toHaveBeenCalledWith({
      content: "7",
      duration: undefined,
      key: undefined,
    });
  });

  it("uses a registered App message API", async () => {
    const appApi = {
      success: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      loading: vi.fn().mockResolvedValue(undefined),
      open: vi.fn().mockResolvedValue(undefined),
    };
    setMessageApi(appApi);

    await messageAction({
      action: "message",
      payload: { type: "success", content: "saved" },
    }, executor);

    expect(appApi.success).toHaveBeenCalledWith({
      content: "saved",
      duration: undefined,
      key: undefined,
    });
    expect(antdMocks.message.success).not.toHaveBeenCalled();
  });

  it.each([undefined, null, ""])("warns for empty content: %p", async (content) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await messageAction({
      action: "message",
      payload: { content },
    }, executor);

    expect(warn).toHaveBeenCalledWith("message action requires payload.content");
  });
});

describe("notificationAction", () => {
  it.each(["success", "error", "warning", "info", "open"] as const)(
    "opens a %s notification with evaluated values",
    async (type) => {
      await notificationAction({
        action: "notification",
        payload: {
          type,
          message: "User ${$root.user.name}",
          description: "ID ${$current.id}",
          duration: 4,
          key: "notice",
          placement: "bottomRight",
        },
      }, executor);

      expect(antdMocks.notification[type]).toHaveBeenCalledWith({
        title: "User Ann",
        description: "ID 7",
        duration: 4,
        key: "notice",
        placement: "bottomRight",
      });
    },
  );

  it("supports persistent notifications and maxCount", async () => {
    await notificationAction({
      action: "notification",
      payload: {
        description: "Processing",
        duration: null,
        maxCount: 2,
      },
    }, executor);

    expect(antdMocks.notification.config).toHaveBeenCalledWith({ maxCount: 2 });
    expect(antdMocks.notification.info).toHaveBeenCalledWith({
      title: undefined,
      description: "Processing",
      duration: false,
      key: undefined,
      placement: undefined,
    });
  });

  it("uses a registered App notification API", async () => {
    const appApi = {
      success: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      open: vi.fn().mockResolvedValue(undefined),
    };
    setNotificationApi(appApi);

    await notificationAction({
      action: "notification",
      payload: { type: "success", message: "saved" },
    }, executor);

    expect(appApi.success).toHaveBeenCalled();
    expect(antdMocks.notification.success).not.toHaveBeenCalled();
  });

  it("warns when message and description are both empty", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await notificationAction({ action: "notification" } as ActionConfig, executor);

    expect(warn).toHaveBeenCalledWith(
      "notification action requires payload.message or payload.description",
    );
  });
});
