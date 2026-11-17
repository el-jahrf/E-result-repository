import AdminNavigation from "@/components/admin/admin-navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F1E7] lg:flex-row">
      <AdminNavigation />

      <main className="min-w-0 flex-1 bg-[#F7F1E7] text-[#2B211C]">
        {children}
      </main>
    </div>
  );
}