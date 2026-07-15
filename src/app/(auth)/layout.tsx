import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin sign in — Flex Money",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
