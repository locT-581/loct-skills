import { ParsedSkill } from "../schemas/skill.schema.js";

export interface TargetAdapter {
  readonly name: string;
  readonly displayName: string;
  detect(projectRoot: string): Promise<boolean>;
  compile(skill: ParsedSkill, projectRoot: string): Promise<void>;
  remove(skillName: string, projectRoot: string): Promise<void>;
}
