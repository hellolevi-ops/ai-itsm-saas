-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeVisibility" AS ENUM ('INTERNAL', 'REQUESTER');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('TICKET', 'MANUAL');

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_ticket_id" TEXT,
    "source_type" "KnowledgeSourceType" NOT NULL DEFAULT 'MANUAL',
    "title" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "rollback" TEXT,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "KnowledgeVisibility" NOT NULL DEFAULT 'INTERNAL',
    "created_by_id" TEXT NOT NULL,
    "published_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_articles_workspace_id_idx" ON "knowledge_articles"("workspace_id");

-- CreateIndex
CREATE INDEX "knowledge_articles_workspace_id_status_idx" ON "knowledge_articles"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_articles_workspace_id_visibility_idx" ON "knowledge_articles"("workspace_id", "visibility");

-- CreateIndex
CREATE INDEX "knowledge_articles_workspace_id_source_ticket_id_idx" ON "knowledge_articles"("workspace_id", "source_ticket_id");

-- CreateIndex
CREATE INDEX "knowledge_articles_created_by_id_idx" ON "knowledge_articles"("created_by_id");

-- CreateIndex
CREATE INDEX "knowledge_articles_published_by_id_idx" ON "knowledge_articles"("published_by_id");

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_source_ticket_id_fkey" FOREIGN KEY ("source_ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
