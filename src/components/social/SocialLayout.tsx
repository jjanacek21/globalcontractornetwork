import { ReactNode } from "react";
import { SocialSidebar } from "./SocialSidebar";
import { SocialHeader } from "./SocialHeader";

interface SocialLayoutProps {
  children: ReactNode;
}

export const SocialLayout = ({ children }: SocialLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <SocialHeader />
      <div className="flex">
        <SocialSidebar />
        <main className="flex-1 lg:ml-64 pt-16">
          <div className="max-w-4xl mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
