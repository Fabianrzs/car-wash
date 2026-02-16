import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import PlanBlockingGuard from "@/components/guards/PlanBlockingGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 bg-gray-50 p-6">
          <PlanBlockingGuard>{children}</PlanBlockingGuard>
        </main>
      </div>
    </div>
  );
}
