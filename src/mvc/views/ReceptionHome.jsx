import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/mvc/controllers/auth/AuthProvider";

export default function ReceptionHome() {
  const { user, profile, signOut, isLoading } = useAuth();

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reception Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.email || "unknown"}
          </p>
          {profile?.branch_id && (
            <p className="mt-1 text-sm text-muted-foreground">Branch: {profile.branch_id}</p>
          )}
        </div>

        <Button variant="outline" onClick={signOut} disabled={isLoading}>
          Logout
        </Button>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        Next step (Step 2): receptionist can register customers for their branch.
      </div>
    </div>
  );
}

