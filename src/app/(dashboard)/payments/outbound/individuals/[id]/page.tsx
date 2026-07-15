import { OutboundTransferDetailClient } from "@/components/payments/OutboundTransferDetailClient";

type Params = { params: Promise<{ id: string }> };

export default async function OutboundIndividualDetailPage({ params }: Params) {
  const { id } = await params;
  return (
    <OutboundTransferDetailClient
      transferId={id}
      backHref="/payments/outbound/individuals"
      backLabel="Back to individual outbound list"
    />
  );
}
