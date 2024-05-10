-- CreateTable
CREATE TABLE `SavedCart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checkoutToken` VARCHAR(191) NOT NULL,
    `productsIds` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
