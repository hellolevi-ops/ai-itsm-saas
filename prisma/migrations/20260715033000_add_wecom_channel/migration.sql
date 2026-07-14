-- CreateEnum
ALTER TYPE "TicketSource" ADD VALUE 'WECOM';

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('WECOM');

-- CreateEnum
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ChannelInboundMessageStatus" AS ENUM ('RECEIVED', 'TICKET_CREATED', 'DUPLICATE', 'REJECTED');

-- CreateTable
CREATE TABLE "channel_connections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "name" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "ChannelConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_inbound_messages" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "external_message_id" TEXT NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "external_user_name" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ChannelInboundMessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_inbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_connections_workspace_id_type_name_key" ON "channel_connections"("workspace_id", "type", "name");

-- CreateIndex
CREATE INDEX "channel_connections_workspace_id_idx" ON "channel_connections"("workspace_id");

-- CreateIndex
CREATE INDEX "channel_connections_workspace_id_type_idx" ON "channel_connections"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "channel_connections_workspace_id_status_idx" ON "channel_connections"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "channel_connections_created_by_id_idx" ON "channel_connections"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_inbound_messages_connection_id_external_message_id_key" ON "channel_inbound_messages"("connection_id", "external_message_id");

-- CreateIndex
CREATE INDEX "channel_inbound_messages_workspace_id_idx" ON "channel_inbound_messages"("workspace_id");

-- CreateIndex
CREATE INDEX "channel_inbound_messages_connection_id_idx" ON "channel_inbound_messages"("connection_id");

-- CreateIndex
CREATE INDEX "channel_inbound_messages_ticket_id_idx" ON "channel_inbound_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "channel_inbound_messages_workspace_id_status_idx" ON "channel_inbound_messages"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "channel_inbound_messages_received_at_idx" ON "channel_inbound_messages"("received_at");

-- AddForeignKey
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_inbound_messages" ADD CONSTRAINT "channel_inbound_messages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_inbound_messages" ADD CONSTRAINT "channel_inbound_messages_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_inbound_messages" ADD CONSTRAINT "channel_inbound_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
