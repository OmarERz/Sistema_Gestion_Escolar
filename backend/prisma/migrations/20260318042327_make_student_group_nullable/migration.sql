-- DropForeignKey
ALTER TABLE `students` DROP FOREIGN KEY `students_group_id_fkey`;

-- AlterTable
ALTER TABLE `students` MODIFY `group_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
