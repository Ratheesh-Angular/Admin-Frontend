import { OutboundTransferListClient } from "@/components/payments/OutboundTransferListClient";

export default function OutboundCorporatesPage() {
  return (
    <OutboundTransferListClient
      role="CORPORATE"
      title="Outbound list (Corporates)"
      description="Outbound transfers from corporate customers in your provisioned countries."
      detailBasePath="/payments/outbound/corporates"
    />
  );
}
