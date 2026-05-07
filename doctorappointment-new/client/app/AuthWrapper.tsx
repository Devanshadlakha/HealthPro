"use client";
import { axiosFetchType } from "@/lib/axiosConfig";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const Wrapper = ({ children }: any) => {
  const router = useRouter();
  const path = usePathname();

  // On app load: if the user appears logged in (role flag) AND we're at "/",
  // resolve their type via the cookie-authenticated /get-token-type and route
  // them to the right home. The actual auth credential is the httpOnly cookie;
  // the role flag in localStorage is just a UI hint and not security-sensitive.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("role");
    if (!role) return;
    axiosFetchType()
      .get("/get-token-type")
      .then((data) => {
        if (data.status !== 200) return;
        if (path !== "/") return;
        if (data.data.type === "patient") router.push("/patient/hospitals");
        else router.push("/doctor/profile");
      })
      .catch(() => {
        // Cookie expired or cleared on the server — drop the UI flag.
        localStorage.removeItem("role");
        localStorage.removeItem("patientname");
        localStorage.removeItem("doctorname");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard protected routes when the role flag disappears (logout in another tab).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("role") || "";
    if ((path.startsWith("/patient") || path.startsWith("/doctor")) && role === "") {
      router.push("/");
    }
  }, [path, router]);

  return <>{children}</>;
};

export default Wrapper;
