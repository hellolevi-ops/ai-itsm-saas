CREATE TYPE "AiActionType" AS ENUM ('TICKET_TRIAGE');

CREATE TYPE "AiRunStatus" AS ENUM ('SUCCEEDED', 'FAILED');

CREATE TABLE "ai_runs" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" "AiActionType" NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "prompt_version" TEXT NOT NULL,
  "status" "AiRunStatus" NOT NULL,
  "input_hash" TEXT NOT NULL,
  "output" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "risk_level" TEXT NOT NULL DEFAULT 'LOW',
  "latency_ms" INTEGER NOT NULL,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "estimated_cost_micros" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_runs_workspace_id_idx" ON "ai_runs"("workspace_id");
CREATE INDEX "ai_runs_workspace_id_ticket_id_idx" ON "ai_runs"("workspace_id", "ticket_id");
CREATE INDEX "ai_runs_workspace_id_action_idx" ON "ai_runs"("workspace_id", "action");
CREATE INDEX "ai_runs_actor_id_idx" ON "ai_runs"("actor_id");

ALTER TABLE "ai_runs"
  ADD CONSTRAINT "ai_runs_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_runs"
  ADD CONSTRAINT "ai_runs_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_runs"
  ADD CONSTRAINT "ai_runs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
