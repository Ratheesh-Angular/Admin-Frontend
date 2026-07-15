import { UsersKycListClient } from "@/components/users-kyc/UsersKycListClient";

export default function PersonalUsersPage() {
  return (
    <UsersKycListClient
      role="INDIVIDUAL"
      title="Personal Users"
      description="Review individual customer KYC applications."
      detailBasePath="/personal-users"
    />
  );
}
