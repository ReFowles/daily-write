import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Input } from "./Input";

function Wrapped(props: Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [value, setValue] = useState("");
  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}

describe("Input", () => {
  it("propagates change events to onChange", () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} aria-label="name" />);
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "hi" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("forwards type/min/max/placeholder/required attributes", () => {
    render(
      <Wrapped
        type="number"
        min={1}
        max={10}
        placeholder="0-10"
        required
        aria-label="qty"
      />
    );
    const el = screen.getByLabelText("qty") as HTMLInputElement;
    expect(el.type).toBe("number");
    expect(el.min).toBe("1");
    expect(el.max).toBe("10");
    expect(el.placeholder).toBe("0-10");
    expect(el.required).toBe(true);
  });

  it("respects disabled", () => {
    render(<Input value="x" onChange={vi.fn()} disabled aria-label="d" />);
    expect(screen.getByLabelText("d")).toBeDisabled();
  });

  it("displays comma-formatted digits but reports raw digits through onChange", () => {
    const onChange = vi.fn();
    render(
      <Input
        value="13500"
        onChange={onChange}
        formatWithCommas
        aria-label="total"
      />
    );
    const el = screen.getByLabelText("total") as HTMLInputElement;
    expect(el.value).toBe("13,500");

    fireEvent.change(el, { target: { value: "1,2,3,4" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("1234");
  });
});
