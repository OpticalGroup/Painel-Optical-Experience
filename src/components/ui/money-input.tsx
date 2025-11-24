import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/utils";

interface MoneyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const MoneyInput = ({ value, onChange, placeholder, className }: MoneyInputProps) => {
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
        if (value) {
            // If value is a number or a string that looks like a number
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            if (!isNaN(numericValue)) {
                setDisplayValue(formatBRL(numericValue));
            } else {
                setDisplayValue("");
            }
        } else {
            setDisplayValue("");
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        // Remove everything that is not a digit
        const digits = rawValue.replace(/\D/g, "");

        if (!digits) {
            setDisplayValue("");
            onChange("");
            return;
        }

        // Convert to number (divide by 100 to handle cents)
        const numberValue = parseInt(digits) / 100;

        // Update display
        setDisplayValue(formatBRL(numberValue));

        // Pass the numeric value as string to the parent form
        onChange(numberValue.toFixed(2));
    };

    return (
        <Input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
};
