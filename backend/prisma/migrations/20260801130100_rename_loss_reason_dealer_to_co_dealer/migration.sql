-- Rename LossReason enum value LOST_TO_DEALER -> LOST_TO_CO_DEALER to match the
-- "Lost to Co-Dealer" label exactly.
ALTER TYPE "LossReason" RENAME VALUE 'LOST_TO_DEALER' TO 'LOST_TO_CO_DEALER';
