import { UserKycDetailClient } from "@/components/users-kyc/UserKycDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function CorporateUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <UserKycDetailClient
      userId={id}
      backHref="/corporate-users"
      backLabel="Back to corporate users"
      pageTitle="Corporate user details"
    />
  );
}
