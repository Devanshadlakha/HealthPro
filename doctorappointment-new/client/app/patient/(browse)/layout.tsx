"use client";
import PatientTopNav from "./components/PatientTopNav";
import AIChatbot from "./hospitals/components/AIChatbot";

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <PatientTopNav />
            <main className="w-full">{children}</main>
            <AIChatbot />
        </div>
    );
}
