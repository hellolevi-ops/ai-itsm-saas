CREATE TYPE "BetaFeedbackType" AS ENUM ('FEEDBACK', 'BUG', 'INTERVIEW_NOTE');
CREATE TYPE "BetaFeedbackSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "BetaFeedbackStatus" AS ENUM ('OPEN', 'TRIAGED', 'CLOSED');

CREATE TABLE "beta_feedback" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "reporter_id" TEXT NOT NULL,
  "type" "BetaFeedbackType" NOT NULL,
  "severity" "BetaFeedbackSeverity" NOT NULL DEFAULT 'MEDIUM',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "BetaFeedbackStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "beta_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_feature_flags" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT NOT NULL,
  "changed_by_user_id" TEXT,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workspace_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "beta_feedback_workspace_id_idx" ON "beta_feedback"("workspace_id");
CREATE INDEX "beta_feedback_workspace_id_status_idx" ON "beta_feedback"("workspace_id", "status");
CREATE INDEX "beta_feedback_workspace_id_type_idx" ON "beta_feedback"("workspace_id", "type");
CREATE INDEX "beta_feedback_reporter_id_idx" ON "beta_feedback"("reporter_id");
CREATE INDEX "beta_feedback_created_at_idx" ON "beta_feedback"("created_at");

CREATE UNIQUE INDEX "workspace_feature_flags_workspace_id_key_key" ON "workspace_feature_flags"("workspace_id", "key");
CREATE INDEX "workspace_feature_flags_workspace_id_idx" ON "workspace_feature_flags"("workspace_id");
CREATE INDEX "workspace_feature_flags_workspace_id_enabled_idx" ON "workspace_feature_flags"("workspace_id", "enabled");
CREATE INDEX "workspace_feature_flags_changed_by_user_id_idx" ON "workspace_feature_flags"("changed_by_user_id");

ALTER TABLE "beta_feedback"
  ADD CONSTRAINT "beta_feedback_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "beta_feedback"
  ADD CONSTRAINT "beta_feedback_reporter_id_fkey"
  FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workspace_feature_flags"
  ADD CONSTRAINT "workspace_feature_flags_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_feature_flags"
  ADD CONSTRAINT "workspace_feature_flags_changed_by_user_id_fkey"
  FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
