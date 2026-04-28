    "use client";

    import { axiosFetch } from "@/lib/axiosConfig";
    import { useEffect, useState } from "react";
    import { useRouter } from "next/navigation";
    import { useSearchParams } from "next/navigation";
    const VerifyToken = (params: any) => {
        const [password, setPassword] = useState("");
        const [retypepassword, setRetypePassword] = useState('');
        // const [token, settoken] = useState<string | null>(null);
        const searchParams = useSearchParams();
        const userType = searchParams.get('type');
        const token = searchParams.get("token");
        console.log(userType+"In resetpass");
        console.log(token+"token");
        
        const endpoint = userType === "doctor" 
        ? "/doctor-auth/verify-forgot-password-token" 
        : "/patient-auth/verify-forgot-password-token";
    const navigate=useRouter();
        // useEffect(() => {
        //     const pathname = window.location.pathname;
        //     console.log("Pathname:", pathname);
        
        //     const parts = pathname.split("/");
        //     console.log("URL Parts:", parts);
        
        //     settoken(parts[3]?.split("Doctor")[0]);
        //   }, []);

        const handleSubmit = async(e:any) => {
            e.preventDefault();
            if (password !== retypepassword) {
                alert("passwrd don't match")
                return;
            }
            console.log("Extracted token:", token);
            
            const res:any=await axiosFetch.post(endpoint,
                { token:token, password:password },
                { headers: { "Content-Type": "application/json" } }
            );
            if(res.status==200){
                navigate.push("/auth");
            }
        }
        return <>
            <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block mb-1 font-medium">New Password :</label>
                            <input
                                type="password"
                            minLength={8}
                                required
                                className="w-full px-3 py-2 border rounded-md"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-1 font-medium">Re-Type Password :</label>
                            <input
                                type="password"
                                minLength={8}
                                required
                                className="w-full px-3 py-2 border rounded-md"
                                onChange={(e) => setRetypePassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Reset Password </button>

                    </form>
                </div>
            </div></>;
    };
    export default VerifyToken;