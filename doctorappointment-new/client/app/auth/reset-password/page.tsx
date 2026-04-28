'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { axiosFetch } from "@/lib/axiosConfig";


const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get user type from URL query parameter
    const userType = searchParams.get('type');

    console.log(userType);
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate user type
        if (userType !== "doctor" && userType !== "patient") {
            alert("Invalid user type");
            return;
        }

        // Validate email
        if (!email) {
            alert("Please enter an email address");
            return;
        }

    

        setIsLoading(true);

        try {
            // Determine the API endpoint based on user type
            const endpoint = userType === "doctor" 
                ? "/doctor-auth/reset-password" 
                : "/patient-auth/reset-password";

            const response = await axiosFetch.post(endpoint, { email });

    
                alert("Reset password link sent to your email");
                router.push(`/auth`);
            
          
        } catch (error: any) {
            // Handle different error scenarios
            if (error.response) {
                alert(error.response.data.message || "Failed to send reset password link");
            } else if (error.request) {
                alert("No response from server. Please check your network connection.");
            } else {
                alert("An unexpected error occurred");
            }
            console.error("Reset password error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Forgot Password
                        </h2>
                        <p className="text-gray-600 mt-2">
                            {userType === 'doctor' 
                                ? 'Reset password for Doctor Account' 
                                : userType === 'patient' 
                                ? 'Reset password for Patient Account' 
                                : 'Invalid User Type'}
                        </p>
                    </div>

                    <div>
                        <label 
                            htmlFor="email" 
                            className="block mb-2 text-sm font-medium text-gray-700"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="Enter your email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-300 ${
                            isLoading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Password Link'}
                    </button>

                    <div className="text-center mt-4">
                        <p 
                            onClick={() => router.push('/auth/login')} 
                            className="text-blue-500 hover:underline cursor-pointer"
                        >
                            Back to Login
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;