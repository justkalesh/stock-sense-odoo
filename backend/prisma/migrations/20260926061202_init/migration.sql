-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('INTERNAL', 'VENDOR', 'CUSTOMER', 'LOSS');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "login_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otp_hash" TEXT,
    "otp_expires" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_code" TEXT,
    "full_name" TEXT,
    "type" "LocationType" NOT NULL,
    "warehouse_id" INTEGER,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" INTEGER,
    "uom" TEXT NOT NULL DEFAULT 'Units',
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "reorder_min" INTEGER NOT NULL DEFAULT 0,
    "reorder_max" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'DRAFT',
    "warehouse_id" INTEGER,
    "contact" TEXT,
    "delivery_address" TEXT,
    "source_loc_id" INTEGER NOT NULL,
    "dest_loc_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "done_date" TIMESTAMP(3),
    "responsible_id" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_lines" (
    "id" SERIAL NOT NULL,
    "operation_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "operation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_moves" (
    "id" SERIAL NOT NULL,
    "operation_id" INTEGER,
    "reference" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "source_loc_id" INTEGER NOT NULL,
    "dest_loc_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quants" (
    "product_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quants_pkey" PRIMARY KEY ("product_id","location_id")
);

-- CreateTable
CREATE TABLE "operation_sequences" (
    "warehouse_id" INTEGER NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "next_val" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "operation_sequences_pkey" PRIMARY KEY ("warehouse_id","operation_type")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_id_key" ON "users"("login_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_short_code_key" ON "warehouses"("short_code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_warehouse_id_short_code_key" ON "locations"("warehouse_id", "short_code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "operations_reference_key" ON "operations"("reference");

-- CreateIndex
CREATE INDEX "operations_status_idx" ON "operations"("status");

-- CreateIndex
CREATE INDEX "operations_scheduled_date_idx" ON "operations"("scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "operation_lines_operation_id_product_id_key" ON "operation_lines"("operation_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_moves_product_id_idx" ON "stock_moves"("product_id");

-- CreateIndex
CREATE INDEX "stock_moves_source_loc_id_dest_loc_id_idx" ON "stock_moves"("source_loc_id", "dest_loc_id");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_source_loc_id_fkey" FOREIGN KEY ("source_loc_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_dest_loc_id_fkey" FOREIGN KEY ("dest_loc_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_lines" ADD CONSTRAINT "operation_lines_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_lines" ADD CONSTRAINT "operation_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_source_loc_id_fkey" FOREIGN KEY ("source_loc_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_dest_loc_id_fkey" FOREIGN KEY ("dest_loc_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quants" ADD CONSTRAINT "quants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quants" ADD CONSTRAINT "quants_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_sequences" ADD CONSTRAINT "operation_sequences_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
