-- DropIndex
DROP INDEX `user_favorites_device_id_event_id_key` ON `user_favorites`;

-- DropIndex
DROP INDEX `user_favorites_device_id_idx` ON `user_favorites`;

-- AlterTable
ALTER TABLE `user_favorites` DROP COLUMN `device_id`,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `user_favorites_user_id_idx` ON `user_favorites`(`user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `user_favorites_user_id_event_id_key` ON `user_favorites`(`user_id`, `event_id`);

-- AddForeignKey
ALTER TABLE `user_favorites` ADD CONSTRAINT `user_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
