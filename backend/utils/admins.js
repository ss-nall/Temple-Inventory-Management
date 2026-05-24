const normalize = (value) => String(value || "").trim().toLowerCase();

const DEFAULT_ADMIN_EMAIL = "nallurisaatwik111@gmail.com";

export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || process.env.ALLOWED_ADMIN_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(",")
    .map((email) => normalize(email))
    .filter(Boolean);

export const isAdminEmail = (email) => getAdminEmails().includes(normalize(email));

export const normalizeEmail = normalize;
