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
      axiosFetch
        .post("/doctor-auth/verify-email-token", { token })
        .then(() => {
          alert("Doctor has been verified");
          navigate.push("/");
        })
        .catch((error) => {
          console.error("Doctor verification failed:", error);
          setType("wrong or already verified");
        });
    } else {
      axiosFetch
        .post("/patient-auth/verify-email-token", { token })
        .then(() => {
          setType("verification done redirecting to login");
          setTimeout(() => {
            navigate.push("/");
          }, 1000);
        });
    }
    // navigate / user / setType are stable for the lifetime of this verification flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return <>Verifying...</>;
};

export default VerifyToken;
