import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import PlanBlockingGuard from "@/components/guards/PlanBlockingGuard";
import TenantGuard from "@/components/guards/TenantSelectorModal";
import EmployeeRouteGuard from "@/components/guards/EmployeeRouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col md:ml-60">
        <Navbar />
        <main className="flex-1 p-5 md:p-6">
          <TenantGuard>
            <PlanBlockingGuard>
              <EmployeeRouteGuard>{children}</EmployeeRouteGuard>
            </PlanBlockingGuard>
          </TenantGuard>
        </main>
      </div>
    </div>
  );
}
