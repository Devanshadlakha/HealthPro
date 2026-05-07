    "use client";

    import { axiosFetch } from "@/lib/axiosConfig";
    import { useEffect, useState } from "react";
    import { useRouter } from "next/navigation";
    import { useSearchParams } from "next/navigation";
    import PasswordField from "@/components/PasswordField";
    import { isPasswordValid } from "@/lib/passwordPolicy";
    import { toast } from "react-toastify";
    const VerifyToken = (params: any) => {
        const [password, setPassword] = useState("");
        const [retypepassword, setRetypePassword] = useState('');
        const searchParams = useSearchParams();
        const userType = searchParams.get('type');
        const token = searchParams.get("token");

        const endpoint = userType === "doctor"
            ? "/doctor-auth/verify-forgot-password-token"
            : "/patient-auth/verify-forgot-password-token";
        const navigate = useRouter();

        const handleSubmit = async(e:any) => {
            e.preventDefault();
            if (!isPasswordValid(password)) {
                toast.error("Password does not meet the requirements");
                return;
            }
            if (password !== retypepassword) {
                toast.error("Passwords do not match");
                return;
            }
            try {
                const res:any = await axiosFetch.post(endpoint,
                    { token:token, password:password },
                    { headers: { "Content-Type": "application/json" } }
                );
                if(res.status==200){
                    toast.success("Password reset successfully");
                    navigate.push("/auth");
                }
            } catch (err) {
                toast.error("Failed to reset password");
                console.error(err);
            }
        }
        return <>
            <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <PasswordField
                            id="newPassword"
                            name="newPassword"
                            label="New Password :"
                            value={password}
                            onChange={setPassword}
                        />
                        <div>
                            <label htmlFor="retypePassword" className="block mb-1 font-medium">Re-Type Password :</label>
                            <input
                                type="password"
                                id="retypePassword"
                                name="retypePassword"
                                minLength={8}
                                required
                                value={retypepassword}
                                className="w-full px-3 py-2 border rounded-md"
                                onChange={(e) => setRetypePassword(e.target.value)}
                            />
                            {retypepassword.length > 0 && retypepassword !== password && (
                                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                            )}
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Reset Password </button>

                    </form>
                </div>
            </div></>;
    };
    export default VerifyToken;