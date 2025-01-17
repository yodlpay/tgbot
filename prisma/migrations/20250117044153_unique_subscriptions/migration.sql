/*
  Warnings:

  - A unique constraint covering the columns `[groupId,from,to,status]` on the table `Subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Subscriptions_groupId_from_to_status_key" ON "Subscriptions"("groupId", "from", "to", "status");
