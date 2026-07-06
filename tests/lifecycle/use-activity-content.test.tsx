import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Activity, useActivityContent } from "../../src";

function ActivityContentPreview({ activities }: { activities: Activity[] }) {
  const result = useActivityContent(activities);

  if (!result.ok) {
    return <div role="alert">{result.errors[0]?.message}</div>;
  }

  return <div>{String(result.content.dataModel.title)}</div>;
}

describe("useActivityContent", () => {
  it("returns patched content that can be consumed by a React component", () => {
    render(
      <ActivityContentPreview
        activities={[
          {
            type: "ACTIVITY_SNAPSHOT",
            content: {
              dataModel: {
                title: "初始标题"
              },
              components: [
                {
                  id: "root",
                  component: "text",
                  content: "${title}"
                }
              ]
            }
          },
          {
            type: "ACTIVITY_DELTA",
            patch: [{ op: "replace", path: "/dataModel/title", value: "Delta 标题" }]
          }
        ]}
      />
    );

    expect(screen.getByText("Delta 标题")).toBeInTheDocument();
  });
});
