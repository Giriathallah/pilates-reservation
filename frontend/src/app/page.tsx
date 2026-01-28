"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import UserDashboard from "@/components/dashboard/UserDashboard";
import LandingPageContent from "@/components/home/LandingPageContent";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Navbar />

      {isLoading ? (
        // Simple loading state
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : user ? (
        <UserDashboard user={user} />
      ) : (
        <LandingPageContent />
      )}

      <Footer />
    </div>
  );
}