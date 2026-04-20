-- AddColumn for agent model configuration
ALTER TABLE "agent_prompts" ADD COLUMN "model" character varying(100);
ALTER TABLE "agent_prompts" ADD COLUMN "provider" character varying(50);
