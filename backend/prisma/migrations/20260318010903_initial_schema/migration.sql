-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_cycles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_cycles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `level` ENUM('kinder', 'primaria', 'secundaria', 'prepa') NOT NULL,
    `grade` VARCHAR(10) NOT NULL,
    `section` VARCHAR(10) NOT NULL,
    `promotion_order` INTEGER NOT NULL,
    `school_cycle_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `groups_level_grade_section_school_cycle_id_key`(`level`, `grade`, `section`, `school_cycle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name_1` VARCHAR(100) NOT NULL,
    `last_name_2` VARCHAR(100) NULL,
    `date_of_birth` DATE NOT NULL,
    `group_id` INTEGER NOT NULL,
    `school_cycle_id` INTEGER NOT NULL,
    `enrollment_date` DATE NOT NULL,
    `status` ENUM('active', 'inactive', 'withdrawn') NOT NULL DEFAULT 'active',
    `total_debt` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guardians` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name_1` VARCHAR(100) NOT NULL,
    `last_name_2` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `phone_secondary` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guardians_email_key`(`email`),
    UNIQUE INDEX `guardians_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_guardian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `guardian_id` INTEGER NOT NULL,
    `relationship` VARCHAR(50) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `student_guardian_student_id_guardian_id_key`(`student_id`, `guardian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscal_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guardian_id` INTEGER NOT NULL,
    `rfc` VARCHAR(13) NOT NULL,
    `business_name` VARCHAR(255) NOT NULL,
    `cfdi_usage` VARCHAR(100) NOT NULL,
    `fiscal_regime` VARCHAR(100) NULL,
    `fiscal_address_street` VARCHAR(255) NOT NULL,
    `fiscal_address_ext_number` VARCHAR(20) NULL,
    `fiscal_address_int_number` VARCHAR(20) NULL,
    `fiscal_address_neighborhood` VARCHAR(100) NULL,
    `fiscal_address_city` VARCHAR(100) NOT NULL,
    `fiscal_address_state` VARCHAR(100) NOT NULL,
    `fiscal_address_zip` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fiscal_data_guardian_id_key`(`guardian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_academic_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `school_cycle_id` INTEGER NOT NULL,
    `group_id` INTEGER NOT NULL,
    `status` ENUM('enrolled', 'promoted', 'withdrawn', 'repeated') NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_academic_history_student_id_school_cycle_id_key`(`student_id`, `school_cycle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_concepts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('mandatory', 'optional') NOT NULL,
    `default_amount` DECIMAL(10, 2) NOT NULL,
    `is_monthly` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurring_payment_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_concept_id` INTEGER NOT NULL,
    `school_cycle_id` INTEGER NOT NULL,
    `generation_day` INTEGER NOT NULL,
    `due_day` INTEGER NOT NULL,
    `start_month` INTEGER NOT NULL,
    `end_month` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `payment_concept_id` INTEGER NOT NULL,
    `school_cycle_id` INTEGER NOT NULL,
    `applies_to_month` TINYINT NULL,
    `base_amount` DECIMAL(10, 2) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `surcharge_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `final_amount` DECIMAL(10, 2) NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('pending', 'paid', 'partial', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
    `due_date` DATE NULL,
    `payment_date` DATE NULL,
    `payment_method` VARCHAR(50) NULL,
    `receipt_number` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_student_id_payment_concept_id_school_cycle_id_appli_key`(`student_id`, `payment_concept_id`, `school_cycle_id`, `applies_to_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uniform_catalog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `base_price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uniforms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `uniform_catalog_id` INTEGER NOT NULL,
    `size` VARCHAR(20) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `payment_id` INTEGER NULL,
    `is_delivered` BOOLEAN NOT NULL DEFAULT false,
    `delivery_date` DATE NULL,
    `order_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdrawals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `withdrawal_date` DATE NOT NULL,
    `reason` TEXT NOT NULL,
    `pending_debt_at_withdrawal` DECIMAL(10, 2) NOT NULL,
    `school_cycle_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `withdrawals_student_id_key`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_school_cycle_id_fkey` FOREIGN KEY (`school_cycle_id`) REFERENCES `school_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_school_cycle_id_fkey` FOREIGN KEY (`school_cycle_id`) REFERENCES `school_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardian` ADD CONSTRAINT `student_guardian_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardian` ADD CONSTRAINT `student_guardian_guardian_id_fkey` FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_data` ADD CONSTRAINT `fiscal_data_guardian_id_fkey` FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic_history` ADD CONSTRAINT `student_academic_history_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic_history` ADD CONSTRAINT `student_academic_history_school_cycle_id_fkey` FOREIGN KEY (`school_cycle_id`) REFERENCES `school_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic_history` ADD CONSTRAINT `student_academic_history_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_payment_rules` ADD CONSTRAINT `recurring_payment_rules_payment_concept_id_fkey` FOREIGN KEY (`payment_concept_id`) REFERENCES `payment_concepts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_payment_rules` ADD CONSTRAINT `recurring_payment_rules_school_cycle_id_fkey` FOREIGN KEY (`school_cycle_id`) REFERENCES `school_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_payment_concept_id_fkey` FOREIGN KEY (`payment_concept_id`) REFERENCES `payment_concepts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_school_cycle_id_fkey` FOREIGN KEY (`school_cycle_id`) REFERENCES `school_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uniforms` ADD CONSTRAINT `uniforms_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uniforms` ADD CONSTRAINT `uniforms_uniform_catalog_id_fkey` FOREIGN KEY (`uniform_catalog_id`) REFERENCES `uniform_catalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uniforms` ADD CONSTRAINT `uniforms_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_school_cycle_id_fkey` FOREIGN KEY (`school_cycle_id`) REFERENCES `school_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
