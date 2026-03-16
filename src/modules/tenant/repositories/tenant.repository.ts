import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";

export type TenantModuleDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: TenantModuleDatabase) {
  return database ?? prisma;
}

class TenantModuleRepository {
  transaction<T>(callback: (database: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  findTenantUnique<T extends Prisma.TenantFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenant.findUnique(args);
  }

  findTenantFirst<T extends Prisma.TenantFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenant.findFirst(args);
  }

  findManyTenants<T extends Prisma.TenantFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenant.findMany(args);
  }

  updateTenant<T extends Prisma.TenantUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenant.update(args);
  }

  countTenants<T extends Prisma.TenantCountArgs>(
    args?: Prisma.SelectSubset<T, Prisma.TenantCountArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenant.count(args);
  }

  findPlanUnique<T extends Prisma.PlanFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).plan.findUnique(args);
  }

  findPlanFirst<T extends Prisma.PlanFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).plan.findFirst(args);
  }

  findInvoiceUnique<T extends Prisma.InvoiceFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvoiceFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.findUnique(args);
  }

  findInvoiceFirst<T extends Prisma.InvoiceFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvoiceFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.findFirst(args);
  }

  findManyInvoices<T extends Prisma.InvoiceFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvoiceFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.findMany(args);
  }

  createInvoice<T extends Prisma.InvoiceCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvoiceCreateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.create(args);
  }

  updateInvoice<T extends Prisma.InvoiceUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvoiceUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.update(args);
  }

  updateManyInvoices<T extends Prisma.InvoiceUpdateManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvoiceUpdateManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.updateMany(args);
  }

  countInvoices<T extends Prisma.InvoiceCountArgs>(
    args?: Prisma.SelectSubset<T, Prisma.InvoiceCountArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invoice.count(args);
  }

  findPaymentUnique<T extends Prisma.PaymentFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).payment.findUnique(args);
  }

  createPayment<T extends Prisma.PaymentCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentCreateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).payment.create(args);
  }

  updatePayment<T extends Prisma.PaymentUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).payment.update(args);
  }

  countPayments<T extends Prisma.PaymentCountArgs>(
    args?: Prisma.SelectSubset<T, Prisma.PaymentCountArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).payment.count(args);
  }

  findManyInvitations<T extends Prisma.InvitationFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invitation.findMany(args);
  }

  findInvitationUnique<T extends Prisma.InvitationFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invitation.findUnique(args);
  }

  findInvitationFirst<T extends Prisma.InvitationFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invitation.findFirst(args);
  }

  createInvitation<T extends Prisma.InvitationCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationCreateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invitation.create(args);
  }

  updateInvitation<T extends Prisma.InvitationUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).invitation.update(args);
  }

  findTenantUserUnique<T extends Prisma.TenantUserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.findUnique(args);
  }

  findTenantUserFirst<T extends Prisma.TenantUserFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.findFirst(args);
  }

  findManyTenantUsers<T extends Prisma.TenantUserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.findMany(args);
  }

  createTenantUser<T extends Prisma.TenantUserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserCreateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.create(args);
  }

  createManyTenantUsers<T extends Prisma.TenantUserCreateManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserCreateManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.createMany(args);
  }

  updateTenantUser<T extends Prisma.TenantUserUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.update(args);
  }

  deleteTenantUser<T extends Prisma.TenantUserDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserDeleteArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).tenantUser.delete(args);
  }

  findUserUnique<T extends Prisma.UserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).user.findUnique(args);
  }

  findManyUsers<T extends Prisma.UserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).user.findMany(args);
  }

  findScheduledPlanChangeFirst<T extends Prisma.ScheduledPlanChangeFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.ScheduledPlanChangeFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).scheduledPlanChange.findFirst(args);
  }

  findManyScheduledPlanChanges<T extends Prisma.ScheduledPlanChangeFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ScheduledPlanChangeFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).scheduledPlanChange.findMany(args);
  }

  createScheduledPlanChange<T extends Prisma.ScheduledPlanChangeCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ScheduledPlanChangeCreateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).scheduledPlanChange.create(args);
  }

  updateScheduledPlanChange<T extends Prisma.ScheduledPlanChangeUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ScheduledPlanChangeUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).scheduledPlanChange.update(args);
  }

  updateManyScheduledPlanChanges<T extends Prisma.ScheduledPlanChangeUpdateManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ScheduledPlanChangeUpdateManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).scheduledPlanChange.updateMany(args);
  }

  findPaymentReminderFirst<T extends Prisma.PaymentReminderFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentReminderFindFirstArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).paymentReminder.findFirst(args);
  }

  findManyPaymentReminders<T extends Prisma.PaymentReminderFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentReminderFindManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).paymentReminder.findMany(args);
  }

  createManyPaymentReminders<T extends Prisma.PaymentReminderCreateManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentReminderCreateManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).paymentReminder.createMany(args);
  }

  updatePaymentReminder<T extends Prisma.PaymentReminderUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentReminderUpdateArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).paymentReminder.update(args);
  }

  updateManyPaymentReminders<T extends Prisma.PaymentReminderUpdateManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.PaymentReminderUpdateManyArgs>,
    database?: TenantModuleDatabase
  ) {
    return getDatabase(database).paymentReminder.updateMany(args);
  }
}

export const tenantModuleRepository = new TenantModuleRepository();

