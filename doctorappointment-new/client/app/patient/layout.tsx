"use client";
import { ProfileProvider } from "@/components/ProfileContext";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return <ProfileProvider>{children}</ProfileProvider>;
}
