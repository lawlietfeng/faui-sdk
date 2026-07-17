import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../examples/App";

describe("App", () => {
  it("renders the SDK example shell", () => {
    render(<App />);

    expect(screen.getByText("FAUI")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "01-企业级复杂表单" })).toBeInTheDocument();
    expect(screen.getByText("Lifecycle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\{ \} JSON/ })).toBeInTheDocument();
  });
});
