import AdminSidebar from "@/components/layout/AdminSidebar";
import Navbar from "@/components/layout/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 bg-slate-50 p-4 dark:bg-slate-950 md:p-6">{children}</main>
      </div>
    </div>
  );
}
