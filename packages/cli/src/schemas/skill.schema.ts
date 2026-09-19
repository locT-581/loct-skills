import { z } from "zod";
import matter from "gray-matter";

export const SkillFrontmatterSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, "Skill name must be lowercase kebab-case"),
  version: z.string().default("1.0.0"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  triggers: z
    .object({
      globs: z.array(z.string()).default([]),
      intents: z.array(z.string()).default([]),
      default_mode: z.enum(["auto", "always", "manual"]).default("auto"),
    })
    .default({}),
  dependencies: z.array(z.string()).default([]),
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  content: string; // Markdown body without frontmatter
  raw: string;     // Entire original raw file content
}

export function parseSkillContent(rawContent: string): ParsedSkill {
  const parsed = matter(rawContent);
  const validatedFrontmatter = SkillFrontmatterSchema.parse(parsed.data);

  return {
    frontmatter: validatedFrontmatter,
    content: parsed.content.trim(),
    raw: rawContent,
  };
}
