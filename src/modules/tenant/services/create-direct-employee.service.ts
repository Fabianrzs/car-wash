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
  const normalizedName = name.trim();
  const normalizedEmployeeCode = employeeCode.trim().toLowerCase();
  const normalizedPin = pin.trim();

  if (normalizedPin.length !== 4 || !/^\d{4}$/.test(normalizedPin)) {
    throw new TenantModuleError("El PIN debe ser de 4 dígitos numéricos", 400);
  }

  // Check code is unique within this tenant
  const existing = await tenantModuleRepository.findTenantUserFirst({
    where: { tenantId, employeeCode: normalizedEmployeeCode },
    select: { id: true },
  });
  if (existing) {
    throw new TenantModuleError("Ya existe un empleado con ese código en este lavadero", 400);
  }

  // Internal email is only a technical identifier, so we keep it unique per creation.
  const internalEmail = `${normalizedEmployeeCode}.${crypto.randomUUID()}@${tenantSlug}.internal`;

  const [hashedPassword, hashedPin] = await Promise.all([
    bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
    bcrypt.hash(normalizedPin, 10),
  ]);

  return tenantModuleRepository.transaction(async (tx) => {
    const user = await tenantModuleRepository.createUser(
      {
        data: {
          name: normalizedName,
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
          employeeCode: normalizedEmployeeCode,
          employeePin: hashedPin,
        },
      },
      tx
    );

    return { employeeCode: normalizedEmployeeCode, pin: normalizedPin, name: normalizedName };
  });
}
