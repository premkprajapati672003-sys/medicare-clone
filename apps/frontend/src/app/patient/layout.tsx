"use client";
import AppShell from '@/components/AppShell';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="PATIENT">{children}</AppShell>;
}
