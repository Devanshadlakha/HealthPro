"use client";

import { axiosFetch } from "@/lib/axiosConfig";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const VerifyToken = (params: any) => {
  const [type, setType] = useState<
    | "verifying"
    | "wrong or already verified"
    | "verification done redirecting to login"
  >("verifying");

  const searchParams = useSearchParams();
  const user = searchParams.get("type"); 
  const token = params.params.verifytoken;

  const navigate = useRouter();

  useEffect(() => {
    if (user === "Doctor") {
      console.log(token,user);
      
      axiosFetch
        .post("/doctor-auth/verify-email-token", {
          token,
        })
        .then(() => {
          alert("Doctor has been verified");
          navigate.push("/");
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      axiosFetch
        .post("/patient-auth/verify-email-token", {
          token,
        })
        .then(() => {
          setType("verification done redirecting to login");
          setTimeout(() => {
            navigate.push("/");
          }, 1000);
        });
    }
  }, [token]);

  return <>Verifying...</>;
};

export default VerifyToken;
