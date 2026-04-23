import { useState, useEffect, forwardRef, InputHTMLAttributes } from "react";

function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? value.replace(/\./g, "") : String(value);
  const parsed = parseInt(num, 10);
  if (isNaN(parsed)) return "";
  return parsed.toLocaleString("vi-VN");
}

function parseNumber(formatted: string): number {
  const cleaned = formatted.replace(/\./g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value?: number | string;
  onChange?: (rawValue: number) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...rest }, ref) => {
    const [display, setDisplay] = useState(() => {
      if (value === undefined || value === "" || value === 0) return "";
      return formatNumber(value);
    });

    useEffect(() => {
      if (value === undefined || value === "" || value === 0) {
        setDisplay("");
        return;
      }
      const incoming = typeof value === "string" ? parseInt(value, 10) : value;
      const current = parseNumber(display);
      if (incoming !== current) {
        setDisplay(formatNumber(incoming));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d]/g, "");
      if (raw === "") {
        setDisplay("");
        onChange?.(0);
        return;
      }
      const num = parseInt(raw, 10);
      setDisplay(num.toLocaleString("vi-VN"));
      onChange?.(num);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        {...rest}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput, formatNumber, parseNumber };
