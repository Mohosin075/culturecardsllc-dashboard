"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, UserMinus, Trash2, Star, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchUsers, updateUserStatus, deleteUser, type User } from "@/app/store/slices/usersSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";

import UserProfileModal from "@/app/components/UserProfileModal";
import Pagination from "@/app/components/Pagination";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { items: users, loading } = useAppSelector((state) => state.users);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    showConfirm(
      `Are you sure you want to ${nextStatus === "Suspended" ? "suspend" : "activate"} this user?`,
      () => {
        dispatch(updateUserStatus({ userId, status: nextStatus }));
        showAlert(`User status updated to ${nextStatus}.`, "success");
      },
      "Toggle User Status"
    );
  };

  const handleDeleteUser = async (userId: string) => {
    showConfirm(
      "Are you sure you want to delete this user account? All associated data will be deleted.",
      () => {
        dispatch(deleteUser(userId));
        showAlert("User deleted successfully.", "success");
      },
      "Delete User"
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check role safely (contains string)
    const matchesRole = roleFilter === "All" || user.role?.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const { error } = useAppSelector((state) => state.users);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchUsers())} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Users Management</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-zinc-300 focus:outline-none focus:border-[#155DFC] transition-colors"
          />
        </div>
        
        {/* Interactive Filter Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 bg-[#111111] border px-4 py-3 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer ${
              isFilterOpen || roleFilter !== "All" || statusFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {(roleFilter !== "All" || statusFilter !== "All") && (
              <span className="w-2 h-2 rounded-full bg-[#155DFC]" />
            )}
          </button>

          {isFilterOpen && (
            <>
              {/* Overlay to close popover */}
              <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
              
              <div className="absolute right-0 mt-2 w-64 bg-[#111111]/95 border border-white/10 rounded-2xl p-5 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Filters</span>
                  <button
                    onClick={() => {
                      setRoleFilter("All");
                      setStatusFilter("All");
                    }}
                    className="text-[10px] text-[#155DFC] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Role Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Role</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Buyer", "Seller", "Admin"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          roleFilter === role
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Active", "Suspended"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          statusFilter === status
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm">
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Transactions</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.map((user: User) => (
                <tr key={user.userId} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm">{user.userId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${user.color || 'bg-blue-500'} flex items-center justify-center text-white font-bold`}>
                        {user.name ? user.name.charAt(0) : "U"}
                      </div>
                      <span className="font-medium text-lg">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{user.username}</td>
                  <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-[#155DFC]/10 text-[#155DFC] px-3 py-1 rounded-full text-xs font-medium border border-[#155DFC]/20">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{user.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{user.transactions}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        user.status === "Active"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 bg-black/40 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.userId, user.status)}
                        className={`p-2 bg-black/40 border border-white/5 rounded-xl transition-all cursor-pointer ${
                          user.status === "Active" 
                            ? "hover:bg-red-500/20 hover:border-red-500/30 text-zinc-400 hover:text-red-500" 
                            : "hover:bg-green-500/20 hover:border-green-500/30 text-zinc-400 hover:text-green-500"
                        }`}
                        title={user.status === "Active" ? "Suspend User" : "Activate User"}
                      >
                        <UserMinus size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.userId)}
                        className="p-2 bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
          totalItems={filteredUsers.length}
          itemNamePlural="users"
        />
      </div>

      <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
