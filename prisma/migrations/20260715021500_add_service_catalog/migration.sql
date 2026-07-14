-- CreateEnum
CREATE TYPE "ServiceCatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RequestTemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkingHoursStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "service_catalog_item_id" TEXT,
ADD COLUMN "request_template_id" TEXT,
ADD COLUMN "response_due_at" TIMESTAMP(3),
ADD COLUMN "resolution_due_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "service_catalog_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "default_priority" "TicketPriority" NOT NULL DEFAULT 'P3',
    "response_target_minutes" INTEGER NOT NULL DEFAULT 240,
    "resolution_target_minutes" INTEGER NOT NULL DEFAULT 1440,
    "status" "ServiceCatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_templates" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "service_catalog_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_title" TEXT NOT NULL,
    "default_description" TEXT NOT NULL,
    "default_priority" "TicketPriority" NOT NULL DEFAULT 'P3',
    "default_category" TEXT,
    "status" "RequestTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_working_hours" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "workdays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "start_minute_of_day" INTEGER NOT NULL DEFAULT 540,
    "end_minute_of_day" INTEGER NOT NULL DEFAULT 1080,
    "holiday_dates" JSONB,
    "status" "WorkingHoursStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_items_workspace_id_name_key" ON "service_catalog_items"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "service_catalog_items_workspace_id_idx" ON "service_catalog_items"("workspace_id");

-- CreateIndex
CREATE INDEX "service_catalog_items_workspace_id_status_idx" ON "service_catalog_items"("workspace_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "request_templates_workspace_id_name_key" ON "request_templates"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "request_templates_workspace_id_idx" ON "request_templates"("workspace_id");

-- CreateIndex
CREATE INDEX "request_templates_workspace_id_status_idx" ON "request_templates"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "request_templates_workspace_id_service_catalog_item_id_idx" ON "request_templates"("workspace_id", "service_catalog_item_id");

-- CreateIndex
CREATE INDEX "tickets_workspace_id_service_catalog_item_id_idx" ON "tickets"("workspace_id", "service_catalog_item_id");

-- CreateIndex
CREATE INDEX "tickets_workspace_id_request_template_id_idx" ON "tickets"("workspace_id", "request_template_id");

-- CreateIndex
CREATE INDEX "tickets_workspace_id_response_due_at_idx" ON "tickets"("workspace_id", "response_due_at");

-- CreateIndex
CREATE INDEX "tickets_workspace_id_resolution_due_at_idx" ON "tickets"("workspace_id", "resolution_due_at");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_working_hours_workspace_id_key" ON "workspace_working_hours"("workspace_id");

-- CreateIndex
CREATE INDEX "workspace_working_hours_workspace_id_status_idx" ON "workspace_working_hours"("workspace_id", "status");

-- AddForeignKey
ALTER TABLE "service_catalog_items" ADD CONSTRAINT "service_catalog_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_templates" ADD CONSTRAINT "request_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_templates" ADD CONSTRAINT "request_templates_service_catalog_item_id_fkey" FOREIGN KEY ("service_catalog_item_id") REFERENCES "service_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_service_catalog_item_id_fkey" FOREIGN KEY ("service_catalog_item_id") REFERENCES "service_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_request_template_id_fkey" FOREIGN KEY ("request_template_id") REFERENCES "request_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_working_hours" ADD CONSTRAINT "workspace_working_hours_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
