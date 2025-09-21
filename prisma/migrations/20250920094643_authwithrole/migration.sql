-- CreateTable
CREATE TABLE "public"."RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "scope" TEXT,
    "validFrom" TIMESTAMPTZ(6) NOT NULL,
    "validTo" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_idx" ON "public"."RoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "RoleAssignment_role_idx" ON "public"."RoleAssignment"("role");

-- CreateIndex
CREATE INDEX "RoleAssignment_validFrom_idx" ON "public"."RoleAssignment"("validFrom");

-- CreateIndex
CREATE INDEX "RoleAssignment_validTo_idx" ON "public"."RoleAssignment"("validTo");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_role_scope_idx" ON "public"."RoleAssignment"("userId", "role", "scope");

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
