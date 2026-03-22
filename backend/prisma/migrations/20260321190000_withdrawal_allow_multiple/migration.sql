-- Drop foreign key that depends on the unique index
ALTER TABLE `withdrawals` DROP FOREIGN KEY `withdrawals_student_id_fkey`;

-- Drop unique index to allow multiple withdrawals per student
DROP INDEX `withdrawals_student_id_key` ON `withdrawals`;

-- Re-add foreign key with a regular index
CREATE INDEX `withdrawals_student_id_idx` ON `withdrawals`(`student_id`);
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
