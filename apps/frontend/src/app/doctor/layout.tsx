"use client";
import AppShell from '@/components/AppShell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="DOCTOR">{children}</AppShell>;
}
