ALTER TABLE "Order"
ADD COLUMN "estimatedDeliveryAt" TIMESTAMP(3),
ADD COLUMN "revisedDeliveryAt" TIMESTAMP(3),
ADD COLUMN "shipmentUpdatedAt" TIMESTAMP(3);
