import React from "react";
import { render } from "@testing-library/react";
import { Skeleton } from "@/shared/ui/feedback/skeleton/skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLDivElement;

    expect(div).toBeInTheDocument();
    expect(div.className).toContain("animate-pulse");
    expect(div.className).toContain("bg-gray-300");
    expect(div.style.width).toBe("100%");
    expect(div.style.height).toBe("1rem");
    expect(div.style.borderRadius).toBe("0.25rem");
  });

  it("applies custom width, height, rounded, and className", () => {
    const { container } = render(
      <Skeleton
        width="50px"
        height="20px"
        rounded="10px"
        className="custom-class"
      />
    );
    const div = container.firstChild as HTMLDivElement;

    expect(div.style.width).toBe("50px");
    expect(div.style.height).toBe("20px");
    expect(div.style.borderRadius).toBe("10px");
    expect(div.className).toContain("custom-class");
    expect(div.className).toContain("animate-pulse");
  });
});
