import bcrypt from "bcryptjs";
import crypto from "crypto";
import { TenantModuleError } from "@/modules/tenant/tenant.errors";
import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

interface CreateDirectEmployeeInput {
  tenantId: string;
  tenantSlug: string;
  name: string;
  employeeCode: string;
  pin: string;
}

export async function createDirectEmployeeService({
  tenantId,
  tenantSlug,
  name,
  employeeCode,
  pin,
}: CreateDirectEmployeeInput) {
  // Check code is unique within this tenant
  const existing = await tenantModuleRepository.findTenantUserFirst({
    where: { tenantId, employeeCode },
    select: { id: true },
  });
  if (existing) {
    throw new TenantModuleError("Ya existe un empleado con ese código en este lavadero", 400);
  }

  // Generate internal email (never used for login)
  const internalEmail = `${employeeCode}@${tenantSlug}.internal`;

  // Check email not taken (safety)
  const emailTaken = await tenantModuleRepository.findUserUnique({
    where: { email: internalEmail },
    select: { id: true },
  });
  if (emailTaken) {
    throw new TenantModuleError("Código de empleado no disponible, elige otro", 400);
  }

  const [hashedPassword, hashedPin] = await Promise.all([
    bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
    bcrypt.hash(pin, 10),
  ]);

  return tenantModuleRepository.transaction(async (tx) => {
    const user = await tenantModuleRepository.createUser(
      {
        data: {
          name,
          email: internalEmail,
          password: hashedPassword,
        },
      },
      tx
    );

    await tenantModuleRepository.createTenantUser(
      {
        data: {
          userId: user.id,
          tenantId,
          role: "EMPLOYEE",
          employeeCode,
          employeePin: hashedPin,
        },
      },
      tx
    );

    return { employeeCode, pin, name };
  });
}
