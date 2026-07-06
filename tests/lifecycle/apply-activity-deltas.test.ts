import { describe, expect, it } from "vitest";
import { applyActivityDeltas, type ActivitySnapshot, type Content } from "../../src";

function createSnapshot(content?: Partial<Content>): ActivitySnapshot {
  const defaultComponents = [
    {
      id: "root",
      component: "box",
      children: ["title"]
    },
    {
      id: "title",
      component: "text",
      content: "${title}"
    }
  ];

  return {
    type: "ACTIVITY_SNAPSHOT",
    content: {
      dataModel: {
        title: "员工信息卡",
        department: "技术部",
        employees: [
          { id: 1, name: "Alice", role: "前端开发" },
          { id: 2, name: "Bob", role: "后端开发" }
        ],
        officeLocation: "北京",
        secretCode: "12345",
        ...content?.dataModel
      },
      components: content?.components ?? defaultComponents
    }
  };
}

describe("applyActivityDeltas", () => {
  it("applies replace, add, remove, move, copy and test patches in order", () => {
    const result = applyActivityDeltas([
      createSnapshot(),
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "replace", path: "/dataModel/title", value: "员工信息卡 V2" }]
      },
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "add", path: "/dataModel/employees/-", value: { id: 3, name: "Charlie", role: "产品经理" } }]
      },
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "remove", path: "/dataModel/secretCode" }]
      },
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "move", from: "/dataModel/officeLocation", path: "/dataModel/headquarters" }]
      },
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "copy", from: "/dataModel/employees/0/name", path: "/dataModel/starEmployeeName" }]
      },
      {
        type: "ACTIVITY_DELTA",
        patch: [
          { op: "test", path: "/dataModel/department", value: "技术部" },
          { op: "replace", path: "/dataModel/department", value: "研发中心" }
        ]
      }
    ]);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.errors[0]?.message);
    }

    expect(result.content.dataModel).toMatchObject({
      title: "员工信息卡 V2",
      department: "研发中心",
      headquarters: "北京",
      starEmployeeName: "Alice"
    });
    expect(result.content.dataModel.secretCode).toBeUndefined();
    expect(result.content.dataModel.employees).toEqual([
      { id: 1, name: "Alice", role: "前端开发" },
      { id: 2, name: "Bob", role: "后端开发" },
      { id: 3, name: "Charlie", role: "产品经理" }
    ]);
  });

  it("applies nested component paths and array insertions", () => {
    const result = applyActivityDeltas([
      createSnapshot(),
      {
        type: "ACTIVITY_DELTA",
        patch: [
          { op: "add", path: "/components/0/children/0", value: "notice" },
          {
            op: "add",
            path: "/components/-",
            value: {
              id: "notice",
              component: "text",
              content: "已更新"
            }
          }
        ]
      }
    ]);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.errors[0]?.message);
    }

    expect(result.content.components[0]?.children).toEqual(["notice", "title"]);
    expect(result.content.components[result.content.components.length - 1]).toMatchObject({
      id: "notice",
      component: "text",
      content: "已更新"
    });
  });

  it("does not mutate the original snapshot content", () => {
    const snapshot = createSnapshot();
    const originalContent = structuredClone(snapshot.content);

    const result = applyActivityDeltas([
      snapshot,
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "replace", path: "/dataModel/title", value: "已变更" }]
      }
    ]);

    expect(result.ok).toBe(true);
    expect(snapshot.content).toEqual(originalContent);
  });

  it("returns a clear error when no snapshot exists", () => {
    const result = applyActivityDeltas([
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "replace", path: "/dataModel/title", value: "无效" }]
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.content).toBeNull();
    expect(result.errors[0]?.message).toContain("no ACTIVITY_SNAPSHOT");
  });

  it("returns an error and keeps the last valid content when a patch path is invalid", () => {
    const result = applyActivityDeltas([
      createSnapshot(),
      {
        type: "ACTIVITY_DELTA",
        patch: [{ op: "replace", path: "/dataModel/missing/value", value: "无效" }]
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.content?.dataModel.title).toBe("员工信息卡");
    expect(result.errors[0]?.message).toContain("Cannot perform the operation");
  });

  it("rolls back all operations in a failed delta patch", () => {
    const result = applyActivityDeltas([
      createSnapshot(),
      {
        type: "ACTIVITY_DELTA",
        patch: [
          { op: "replace", path: "/dataModel/title", value: "不应保留" },
          { op: "test", path: "/dataModel/department", value: "不存在的部门" }
        ]
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.content?.dataModel.title).toBe("员工信息卡");
    expect(result.content?.dataModel.department).toBe("技术部");
  });

  it("patches a 1000 node schema and keeps the expected node count", () => {
    const components = Array.from({ length: 1000 }, (_, index) => ({
      id: index === 0 ? "root" : `node-${index}`,
      component: "text",
      content: `节点 ${index}`,
      children: index === 0 ? ["node-1"] : undefined
    }));
    const startedAt = performance.now();

    const result = applyActivityDeltas([
      createSnapshot({ components, dataModel: { selectedNode: "node-1" } }),
      {
        type: "ACTIVITY_DELTA",
        patch: [
          { op: "replace", path: "/components/999/content", value: "节点 999 已更新" },
          { op: "replace", path: "/dataModel/selectedNode", value: "node-999" }
        ]
      }
    ]);

    const durationMs = performance.now() - startedAt;

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.errors[0]?.message);
    }

    expect(result.content.components).toHaveLength(1000);
    expect(result.content.components[999]?.content).toBe("节点 999 已更新");
    expect(result.content.dataModel.selectedNode).toBe("node-999");
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });
});
