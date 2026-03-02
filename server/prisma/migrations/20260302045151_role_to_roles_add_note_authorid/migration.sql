/*
  Warnings:

  - You are about to drop the column `role` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "role",
ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "authorId" INTEGER;

-- DropTable
DROP TABLE "User";

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
