import { Navbar } from "@/components/layout/Navbar";
import { DropZone } from "@/components/upload/DropZone";

export default function HomePage() {
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