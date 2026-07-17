"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ETLRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/?view=logs");
  }, [router]);

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#080a10", color: "#94a3b8" }}>
      <p style={{ fontFamily: "sans-serif" }}>Redirecting to Pipeline Monitor & Database Logs...</p>
    </div>
  );
}
