// Single registry of message namespaces. To add one: create
// messages/pl/<name>.json, messages/en/<name>.json and add "<name>" here.
export const namespaces = [
  "common",
  "nav",
  "auth",
  "dashboard",
  "members",
  "memberships",
  "checkin",
  "pos",
  "products",
  "reports",
  "admin",
  "users",
  "membershipTypes",
] as const;
export type Namespace = (typeof namespaces)[number];
