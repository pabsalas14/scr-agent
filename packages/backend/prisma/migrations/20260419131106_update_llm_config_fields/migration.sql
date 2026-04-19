-- Rename LM Studio fields to generic LLM fields
ALTER TABLE "user_settings" RENAME COLUMN "lmstudioBaseUrl" TO "llmBaseUrl";
ALTER TABLE "user_settings" RENAME COLUMN "lmstudioModel" TO "llmModel";

-- Add new LLM configuration fields
ALTER TABLE "user_settings" ADD COLUMN "llmApiKey" VARCHAR(500);
ALTER TABLE "user_settings" ADD COLUMN "llmCustomHeaders" TEXT;
