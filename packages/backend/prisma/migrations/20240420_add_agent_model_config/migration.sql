-- Tabla agent_prompts: el historial original solo añadía columnas; en BD nueva la tabla no existía.
CREATE TABLE IF NOT EXISTS "agent_prompts" (
  "id" TEXT NOT NULL,
  "agentName" VARCHAR(50) NOT NULL,
  "prompt" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "model" VARCHAR(100),
  "provider" VARCHAR(50),
  "updatedBy" VARCHAR(255),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_prompts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_prompts_agentName_key" ON "agent_prompts"("agentName");

-- Idempotente si la tabla ya existía sin model/provider
ALTER TABLE "agent_prompts" ADD COLUMN IF NOT EXISTS "model" character varying(100);
ALTER TABLE "agent_prompts" ADD COLUMN IF NOT EXISTS "provider" character varying(50);
