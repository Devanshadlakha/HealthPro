export type PasswordCheck = { label: string; ok: boolean };

export function checkPassword(pw: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "An uppercase letter (A-Z)", ok: /[A-Z]/.test(pw) },
    { label: "A lowercase letter (a-z)", ok: /[a-z]/.test(pw) },
    { label: "A digit (0-9)", ok: /\d/.test(pw) },
    { label: "A special character", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function isPasswordValid(pw: string): boolean {
  return checkPassword(pw).every((c) => c.ok);
}
