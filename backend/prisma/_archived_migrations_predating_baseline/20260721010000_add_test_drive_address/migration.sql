-- Add an optional, anytime-editable address to each test drive.
ALTER TABLE "test_drive_feedback" ADD COLUMN "address" TEXT;
