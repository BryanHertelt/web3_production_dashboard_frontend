import React from "react";
import { render, screen } from "@testing-library/react";
import InfoBox from "../shared/info-box/ui/info-box";
import "@testing-library/jest-dom";

describe("InfoBox component", () => {
  test("renders id, owner, assets, and joined correctly", () => {
    render(
      <InfoBox id={1} owner="Test Owner" assets="900" joined="2023-01-01" />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Test Owner")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
    expect(screen.getByText("2023-01-01")).toBeInTheDocument();
  });
});
