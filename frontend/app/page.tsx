"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { DropZone } from "@/components/upload/DropZone";
import { useDataStore } from "@/stores/useDataStore";

export default function HomePage() {
  const router = useRouter();
  const { dataset, uploadStatus } = useDataStore();

  // Redirect to dashboard when upload is complete
  useEffect(() => {
    if (uploadStatus === "complete" && dataset) {
      // Small delay to show success state
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }
  }, [uploadStatus, dataset, router]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <DropZone />
      </div>
    </div>
  );
}