import { cookies } from "next/headers";

export const VISITOR_COOKIE_NAME = "tabi_note_visitor";

export const getMonthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}`;

export const ensureVisitorId = () => {
  const store = cookies();
  const existing = store.get(VISITOR_COOKIE_NAME)?.value;
  if (existing) return existing;

  const visitorId = crypto.randomUUID();
  store.set(VISITOR_COOKIE_NAME, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return visitorId;
};
