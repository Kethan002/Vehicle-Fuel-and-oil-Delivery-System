import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user || location === "/auth") return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">FuelConnect</span>
          </Link>
          {user.role === "user" && (
            <Link href="/" className="text-foreground/60 transition-colors hover:text-foreground">
              Order Fuel
            </Link>
          )}
          {user.role === "seller" && (
            <Link href="/seller" className="text-foreground/60 transition-colors hover:text-foreground">
              Seller Dashboard
            </Link>
          )}
          {user.role === "admin" && (
            <Link href="/admin" className="text-foreground/60 transition-colors hover:text-foreground">
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <span className="text-sm text-muted-foreground">
            {user.name} ({user.role})
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
