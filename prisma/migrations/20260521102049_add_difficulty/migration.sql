-- AlterTable
ALTER TABLE `questions` ADD COLUMN `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium';
