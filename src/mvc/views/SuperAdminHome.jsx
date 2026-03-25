import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/mvc/controllers/auth/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createBranch, listBranches } from "@/mvc/models/branchModel";
import { createStaffUser } from "@/mvc/models/staffAdminModel";

export default function SuperAdminHome() {
  const { user, profile, signOut, isLoading } = useAuth();

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState("");

  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("doctor");
  const [staffBranchId, setStaffBranchId] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");

  const branchOptions = useMemo(() => {
    return branches.map((b) => ({ id: b.id, name: b.name }));
  }, [branches]);

  async function refreshBranches() {
    setBranchesLoading(true);
    setBranchesError("");
    try {
      const rows = await listBranches();
      setBranches(rows);
      if (!staffBranchId && rows?.[0]?.id) {
        setStaffBranchId(rows[0].id);
      }
    } catch (e) {
      setBranchesError(e?.message || "Failed to load branches.");
    } finally {
      setBranchesLoading(false);
    }
  }

  useEffect(() => {
    refreshBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateBranch(e) {
    e.preventDefault();
    setCreatingBranch(true);
    setBranchesError("");
    try {
      await createBranch({ name: newBranchName });
      setNewBranchName("");
      await refreshBranches();
    } catch (err) {
      setBranchesError(err?.message || "Failed to create branch.");
    } finally {
      setCreatingBranch(false);
    }
  }

  async function handleCreateStaff(e) {
    e.preventDefault();
    setCreatingStaff(true);
    setStaffMessage("");
    try {
      const res = await createStaffUser({
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        branchId: staffBranchId,
      });
      setStaffPassword("");
      setStaffMessage(`Created ${staffRole} (${staffEmail})`);
      return res;
    } catch (err) {
      setStaffMessage(err?.message || "Failed to create staff user.");
    } finally {
      setCreatingStaff(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
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

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Branches</CardTitle>
            <CardDescription>Create and view branches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateBranch} className="space-y-2">
              <Label htmlFor="branchName">Branch name</Label>
              <div className="flex gap-2">
                <Input
                  id="branchName"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. Muqdisho - Main"
                />
                <Button type="submit" disabled={creatingBranch || branchesLoading}>
                  {creatingBranch ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>

            {branchesError && (
              <div className="text-sm text-destructive">{branchesError}</div>
            )}

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[220px]">ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchesLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : branches.length ? (
                    branches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {b.id}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        No branches yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create staff</CardTitle>
            <CardDescription>Create doctor/reception and assign a branch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="staffEmail">Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@example.com"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="staffPassword">Password</Label>
                <Input
                  id="staffPassword"
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="min 6 characters"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label>Role</Label>
                <Select value={staffRole} onValueChange={setStaffRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="reception">Reception</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>Branch</Label>
                <Select value={staffBranchId} onValueChange={setStaffBranchId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!branchOptions.length && (
                  <div className="text-xs text-muted-foreground">
                    Create a branch first.
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={creatingStaff || !branchOptions.length}
              >
                {creatingStaff ? "Creating..." : "Create staff account"}
              </Button>
            </form>

            {staffMessage && (
              <div
                className={[
                  "text-sm",
                  staffMessage.toLowerCase().includes("failed") ||
                  staffMessage.toLowerCase().includes("error")
                    ? "text-destructive"
                    : "text-foreground",
                ].join(" ")}
              >
                {staffMessage}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Signed in as {user?.email || "unknown"} ({profile?.role || "unknown"}).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

