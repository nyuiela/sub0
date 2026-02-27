import { readFile } from "fs/promises";
import { join } from "path";
import { SkillContent } from "@/components/skill/SkillContent";

const SKILL_MD_PATH = join(process.cwd(), "md", "skill.openclaw.md");

export default async function SkillPage() {
  let content: string;
  try {
    content = await readFile(SKILL_MD_PATH, "utf-8");
  } catch {
    content = "# Sub0 Skill\n\nSkill document not found. See `md/skill.openclaw.md` in the repo.";
  }
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Sub0 skill (OpenClaw)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Instructions for AI agents to connect to our API. Fetch this page or the raw markdown from your agent or MCP.
        </p>
      </header>
      <SkillContent content={content} />
    </main>
  );
}
