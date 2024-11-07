-- AlterTable
ALTER TABLE "Query" ADD COLUMN     "result" TEXT;

-- CreateTable
CREATE TABLE "QueryUser" (
    "queryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "QueryUser_pkey" PRIMARY KEY ("queryId","userId")
);

-- AddForeignKey
ALTER TABLE "QueryUser" ADD CONSTRAINT "QueryUser_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryUser" ADD CONSTRAINT "QueryUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
