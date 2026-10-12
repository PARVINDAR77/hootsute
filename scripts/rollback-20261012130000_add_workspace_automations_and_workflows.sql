-- Rollback migration: 20261012130000_add_workspace_automations_and_workflows

DROP TABLE IF EXISTS "automation_execution_logs" CASCADE;
DROP TABLE IF EXISTS "automation_rules" CASCADE;

DROP TYPE IF EXISTS "AutomationExecutionStatus";
DROP TYPE IF EXISTS "AutomationActionType";
DROP TYPE IF EXISTS "AutomationTriggerType";
