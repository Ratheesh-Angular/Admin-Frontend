import { UsersKycListClient } from "@/components/users-kyc/UsersKycListClient";

export default function CorporateUsersPage() {
  return (
    <UsersKycListClient
      role="CORPORATE"
      title="Corporate Users"
      description="Review corporate customer KYC applications."
      detailBasePath="/corporate-users"
    />
  );
}
