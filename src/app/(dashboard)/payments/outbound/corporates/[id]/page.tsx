import { OutboundTransferDetailClient } from "@/components/payments/OutboundTransferDetailClient";

type Params = { params: Promise<{ id: string }> };

export default async function OutboundCorporateDetailPage({ params }: Params) {
  const { id } = await params;
  return (
    <OutboundTransferDetailClient
      transferId={id}
      backHref="/payments/outbound/corporates"
      backLabel="Back to corporate outbound list"
    />
  );
}
