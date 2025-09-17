import React from "react";
import { render, screen } from "@testing-library/react";
import Searchbar from "../widgets/example-widget/ui/searchbar";

describe("Searchbar component", () => {
  test("renders search input with correct placeholder", () => {
    render(<Searchbar />);
    const inputElement = screen.getByPlaceholderText(/search.../i);
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute("type", "search");
  });
});
