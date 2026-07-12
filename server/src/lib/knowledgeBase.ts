import { readFileSync } from "fs";
import { join } from "path";

// Support knowledge base lives at the repo root alongside the other project
// docs (implementation-plan.md, project-scope.md), not under server/, so we
// resolve it relative to this file rather than cwd (the server runs with
// cwd server/, see CLAUDE.md).
const KNOWLEDGE_BASE_PATH = join(import.meta.dir, "../../../knowledge-base.md");

export const KNOWLEDGE_BASE = readFileSync(KNOWLEDGE_BASE_PATH, "utf-8");
