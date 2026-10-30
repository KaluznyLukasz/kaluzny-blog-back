-- CreateTable
CREATE TABLE "images" (
    "id" UUID NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "images_uploaded_at_id_idx" ON "images"("uploaded_at" DESC, "id");
