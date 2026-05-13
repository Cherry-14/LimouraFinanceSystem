import { Sidebar } from "./Sidebar";
import { MobileBar } from "./MobileBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileBar />
        <main className="flex-1 px-6 lg:px-12 py-8 lg:py-12 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
