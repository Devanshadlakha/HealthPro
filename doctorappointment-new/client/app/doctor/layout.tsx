import Navbar from "./component/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-16">
                {children}
            </div>
        </div>
    );
}
