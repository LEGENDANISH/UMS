-- DropForeignKey
ALTER TABLE "public"."Teacher" DROP CONSTRAINT "Teacher_departmentId_fkey";

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
