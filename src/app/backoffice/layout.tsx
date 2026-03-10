import { ReactNode } from "react";
import { BackofficeSidebar } from "@/components/BackofficeSidebar";
import { BackofficeAuthGuard } from "@/components/BackofficeAuthGuard";

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return (
    <BackofficeAuthGuard>
      <div className="flex h-screen overflow-hidden bg-surface-page">
        <BackofficeSidebar />

        <main className="min-w-0 flex-1 overflow-y-auto bg-surface-page p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </BackofficeAuthGuard>
  );
}
