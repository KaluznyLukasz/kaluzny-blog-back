-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "image_id" UUID;

-- CreateIndex
CREATE INDEX "articles_image_id_idx" ON "articles"("image_id");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
