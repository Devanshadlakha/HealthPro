"use client";
import { axiosFetchType } from "@/lib/axiosConfig";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const Wrapper = ({ children }: any) => {
  const router = useRouter();
  const path = usePathname();

  // Initial: validate the stored token (if any) and redirect from "/" to the right home.
  // Runs once. Does NOT block rendering — children paint immediately while the
  // token check happens in the background.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token") || "";
    if (!token) return;
    axiosFetchType(token)
      .get("/get-token-type")
      .then((data) => {
        if (data.status !== 200) return;
        if (path !== "/") return;
        if (data.data.type === "patient") router.push("/patient/hospitals");
        else router.push("/doctor/profile");
      })
      .catch(() => {
        localStorage.removeItem("token");
      });
    // Intentionally only on mount — token validation is a one-shot at app start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard protected routes when the token disappears (logout in another tab, etc.).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token") || "";
    if (
      (path.startsWith("/patient") || path.startsWith("/doctor")) &&
      token === ""
    ) {
      router.push("/");
    }
  }, [path, router]);

  return <>{children}</>;
};

export default Wrapper;
