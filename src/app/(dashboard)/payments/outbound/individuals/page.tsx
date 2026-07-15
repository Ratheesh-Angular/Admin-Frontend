import { OutboundTransferListClient } from "@/components/payments/OutboundTransferListClient";

export default function OutboundIndividualsPage() {
  return (
    <OutboundTransferListClient
      role="INDIVIDUAL"
      title="Outbound list (Individuals)"
      description="Outbound transfers from individual customers in your provisioned countries."
      detailBasePath="/payments/outbound/individuals"
    />
  );
}
