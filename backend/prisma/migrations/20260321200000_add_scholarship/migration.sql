-- Add scholarship fields to students
ALTER TABLE `students` ADD COLUMN `scholarship_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00;

-- Add scholarship fields to payments
ALTER TABLE `payments` ADD COLUMN `has_scholarship` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `payments` ADD COLUMN `scholarship_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00;

-- Add apply_scholarship to recurring_payment_rules
ALTER TABLE `recurring_payment_rules` ADD COLUMN `apply_scholarship` BOOLEAN NOT NULL DEFAULT false;
