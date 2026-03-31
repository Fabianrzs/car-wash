import { deletePayoutHandler } from "@/modules/commissions/handlers/payouts.handler";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return deletePayoutHandler(request, id);
}
