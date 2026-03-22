-- AlterTable
ALTER TABLE `student_academic_history` MODIFY COLUMN `status` ENUM('enrolled', 'promoted', 'withdrawn', 'repeated', 'reenrolled') NOT NULL DEFAULT 'enrolled';
