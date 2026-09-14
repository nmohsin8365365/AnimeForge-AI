---
name: Drizzle schema IDs
description: Why generated identity columns are avoided in this workspace's drizzle-zod schemas.
---

Use `serial(...).primaryKey()` for tables that also expose a `createInsertSchema(...).omit({ id: true })` schema. Generated identity columns caused drizzle-zod's schema shape to omit `id` before `.omit()` was applied.

**Why:** The first database push failed during schema module evaluation with an "Unrecognized key: id" error. Switching to serial keys restored schema generation and `drizzle-kit push`.

**How to apply:** When adding new persisted entities that use drizzle-zod insert schemas, follow the existing serial-key convention unless the validation library behavior is rechecked.