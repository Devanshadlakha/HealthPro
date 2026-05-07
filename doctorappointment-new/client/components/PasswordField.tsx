"use client";

import { useState } from "react";
import { checkPassword } from "@/lib/passwordPolicy";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  showRequirements?: boolean;
  required?: boolean;
};

export default function PasswordField({
  id = "password",
  name = "password",
  value,
  onChange,
  label = "Password:",
  showRequirements = true,
  required = true,
}: Props) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const checks = checkPassword(value);

  return (
    <div>
      <label htmlFor={id} className="block mb-1 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          id={id}
          name={name}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-3 py-2 pr-16 border rounded-md"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {showRequirements && (focused || value.length > 0) && (
        <ul className="mt-2 text-xs space-y-1">
          {checks.map((c) => (
            <li
              key={c.label}
              className={c.ok ? "text-green-600" : "text-gray-500"}
            >
              {c.ok ? "✓" : "○"} {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
