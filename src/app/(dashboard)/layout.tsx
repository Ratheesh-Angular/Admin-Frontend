import AdminDashboardLayoutClient from "@/components/layout/AdminDashboardLayoutClient";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDashboardLayoutClient>{children}</AdminDashboardLayoutClient>
  );
}
