import { z } from "zod";

export const InstalledSkillSchema = z.object({
  version: z.string(),
  commit: z.string().default("local"),
  contentHash: z.string(),
  targets: z.array(z.string()).default([]),
  installedAt: z.string().default(() => new Date().toISOString()),
});

export type InstalledSkill = z.infer<typeof InstalledSkillSchema>;

export const LockfileSchema = z.object({
  $schema: z.string().optional(),
  repository: z.string().default("local"),
  installed: z.record(InstalledSkillSchema).default({}),
});

export type Lockfile = z.infer<typeof LockfileSchema>;
