import { UserKycDetailClient } from "@/components/users-kyc/UserKycDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function PersonalUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <UserKycDetailClient
      userId={id}
      backHref="/personal-users"
      backLabel="Back to personal users"
      pageTitle="Personal user details"
    />
  );
}
