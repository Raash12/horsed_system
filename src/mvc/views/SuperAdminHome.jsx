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
import { createStaffUser, listStaff } from "@/mvc/models/staffAdminModel";

export default function SuperAdminHome() {
  const { user, profile, signOut, isLoading } = useAuth();

  // BRANCH
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);

  // STAFF CREATE
  const [staffFullName, setStaffFullName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("doctor");
  const [staffBranchId, setStaffBranchId] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");

  // STAFF LIST
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState("");

  const branchOptions = useMemo(() => {
    return branches.map((b) => ({ id: b.id, name: b.name }));
  }, [branches]);

  // ================= BRANCH =================
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
  }, []);

  async function handleCreateBranch(e) {
    e.preventDefault();
    setCreatingBranch(true);
    try {
      await createBranch({ name: newBranchName });
      setNewBranchName("");
      refreshBranches();
    } catch (err) {
      setBranchesError(err?.message);
    } finally {
      setCreatingBranch(false);
    }
  }

  // ================= STAFF =================
  async function refreshStaff(branchId) {
    setStaffLoading(true);
    setStaffError("");
    try {
      const rows = await listStaff({ branchId });
      setStaff(rows || []);
    } catch (e) {
      setStaffError(e?.message || "Failed to load staff.");
    } finally {
      setStaffLoading(false);
    }
  }

  useEffect(() => {
    if (staffBranchId) {
      refreshStaff(staffBranchId);
    }
  }, [staffBranchId]);

  async function handleCreateStaff(e) {
    e.preventDefault();
    setCreatingStaff(true);
    setStaffMessage("");

    try {
      await createStaffUser({
        full_name: staffFullName, // ✅ NEW
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        branchId: staffBranchId,
      });

      setStaffFullName("");
      setStaffEmail("");
      setStaffPassword("");

      setStaffMessage("Staff created successfully ✅");

      refreshStaff(staffBranchId);
    } catch (err) {
      setStaffMessage(err?.message || "Failed to create staff.");
    } finally {
      setCreatingStaff(false);
    }
  }

  // ================= UI =================
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email}
          </p>
        </div>

        <Button onClick={signOut} variant="outline">
          Logout
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">

        {/* ================= BRANCH ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Branches</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreateBranch} className="flex gap-2 mb-4">
              <Input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Branch name"
              />
              <Button type="submit">
                {creatingBranch ? "..." : "Create"}
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ================= STAFF LIST ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.full_name || "-"}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.role}</TableCell>
                    <TableCell>
                      {s.branch_name || s.branch_id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ================= CREATE STAFF ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Create Staff</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreateStaff} className="space-y-3">

              <Input
                placeholder="Full Name"
                value={staffFullName}
                onChange={(e) => setStaffFullName(e.target.value)}
                required
              />

              <Input
                type="email"
                placeholder="Email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                required
              />

              <Input
                type="password"
                placeholder="Password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                required
              />

              <Select value={staffRole} onValueChange={setStaffRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                </SelectContent>
              </Select>

              <Select value={staffBranchId} onValueChange={setStaffBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" className="w-full">
                {creatingStaff ? "Creating..." : "Create Staff"}
              </Button>
            </form>

            {staffMessage && (
              <p className="text-sm mt-2">{staffMessage}</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}