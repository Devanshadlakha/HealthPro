"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PatientPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/patient/hospitals");
    }, []);
    return null;
}
