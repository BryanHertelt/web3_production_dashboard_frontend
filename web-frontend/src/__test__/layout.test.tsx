import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "../app/layout";
import "@testing-library/jest-dom";

describe("RootLayout component", () => {
  test("renders children within the layout", () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });
});
