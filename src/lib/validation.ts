/**
 * Client-side validation helpers. These improve UX only — any future backend
 * must re-validate everything server-side.
 */

// Pragmatic email check: one @, no spaces, a dot in the domain, sane TLD.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (v.length > 254 || !EMAIL_RE.test(v)) return "Enter a valid email address, like name@example.com.";
  return null;
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; hint: string };

const COMMON = [
  "password", "123456", "12345678", "qwerty", "letmein", "welcome", "admin",
  "iloveyou", "monkey", "dragon", "football", "abc123", "111111", "sunshine",
  "princess", "passw0rd", "globe",
];

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;

export function passwordStrength(password: string, email = ""): Strength {
  if (!password) return { score: 0, label: "", hint: "Use 8 or more characters." };
  const lower = password.toLowerCase();
  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (password.length >= 16) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;

  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const weakPattern =
    COMMON.some((w) => lower.includes(w)) ||
    /(.)\1{2,}/.test(password) ||
    /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|asdf)/i.test(password) ||
    (local.length >= 3 && lower.includes(local));
  if (weakPattern) points -= 2;
  if (password.length < 8) points = Math.min(points, 1);

  const score = Math.max(0, Math.min(4, points - 1)) as Strength["score"];
  let hint = "Great — this password is hard to guess.";
  if (password.length < 8) hint = "Use at least 8 characters.";
  else if (weakPattern) hint = "Avoid common words, repeats, sequences, or your email.";
  else if (score < 3) hint = "Add length, mixed case, numbers, or symbols.";
  else if (score === 3) hint = "Good. A few more characters would make it stronger.";
  return { score, label: LABELS[score], hint };
}

export function validatePassword(password: string, email = ""): string | null {
  if (!password) return "Create a password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be 128 characters or fewer.";
  if (passwordStrength(password, email).score < 2) return "Choose a stronger password.";
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Confirm your password.";
  if (password !== confirm) return "Passwords don't match.";
  return null;
}
