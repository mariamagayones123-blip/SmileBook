// Password rules shown as a live checklist on the sign-up page.
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { id: 'upper', label: 'Uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Number (0–9)', test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Special character (@ # !)', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
]
