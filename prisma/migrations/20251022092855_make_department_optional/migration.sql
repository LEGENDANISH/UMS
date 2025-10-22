-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_departmentId_fkey";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
