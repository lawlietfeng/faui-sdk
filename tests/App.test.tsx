import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../examples/App";

describe("App", () => {
  it("renders the SDK example information", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "FAUI SDK" })).toBeInTheDocument();
    expect(screen.getByText("@lawlietfeng/faui-sdk")).toBeInTheDocument();
    expect(screen.getByText("Version: 0.0.0")).toBeInTheDocument();
    expect(screen.getByText("Mode: form")).toBeInTheDocument();
  });
});
