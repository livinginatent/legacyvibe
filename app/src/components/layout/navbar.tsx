"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/src/components/ui/button";
import { Cpu, LogOut, LayoutDashboard, User } from "lucide-react";
import { getCurrentUser, signOut } from "@/app/auth/actions";

type UserType = {
  id: string;
  email?: string;
} | null;

const Navbar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount and when route changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    checkAuth();
  }, [pathname]); // Re-check when pathname changes

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">
              Cadra<span className="text-primary">code</span>
            </span>
          </Link>

          {/* Auth Section */}
          {!isLoading && (
            <div className="flex items-center gap-4">
              {user ? (
                /* Logged In User UI */
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg glass-card border border-primary/20">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-mono text-foreground">
                      {user.email?.split("@")[0]}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-primary/50"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  <form action={handleSignOut}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </form>
                </>
              ) : (
                /* Logged Out User UI */
                <Button variant="default" asChild>
                  <Link href="/login">Scan My Repo</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
