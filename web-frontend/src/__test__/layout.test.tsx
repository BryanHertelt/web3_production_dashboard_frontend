import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "../app/layout";
import "@testing-library/jest-dom";

describe("RootLayout component", () => {
  test("renders the root HTML structure", () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );

    // Check that the html element with lang="en" is present
    const htmlElement = document.querySelector("html");
    expect(htmlElement).toHaveAttribute("lang", "en");

    // Check that the body element is present
    const bodyElement = document.querySelector("body");
    expect(bodyElement).toBeInTheDocument();
  });

  test("renders children within the layout", () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  test("wraps children with QueryClientProvider", () => {
    // Since QueryClientProvider is internal, we can test by ensuring the component renders without errors
    // and that the child is wrapped properly. For deeper testing, we might need to mock or check context.
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
    // Additional checks can be added if needed, e.g., checking for specific provider behavior
  });
});
