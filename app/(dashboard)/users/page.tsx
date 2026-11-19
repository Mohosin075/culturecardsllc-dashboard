"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, UserMinus, UserCheck, Trash2, Star, Loader2, Sparkles, MoreVertical } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchUsers, updateUserStatus, toggleUserCelebrity, deleteUser, type User } from "@/app/store/slices/usersSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";

import UserProfileModal from "@/app/components/UserProfileModal";
import Pagination from "@/app/components/Pagination";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { items: users, loading } = useAppSelector((state) => state.users);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".action-dropdown-container")) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

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

  const handleToggleCelebrity = async (userId: string, currentCelebrity?: boolean) => {
    const nextStatus = !currentCelebrity;
    showConfirm(
      `Are you sure you want to ${nextStatus ? "mark this user as a Celebrity / VIP" : "remove Celebrity status from this user"}?`,
      () => {
        dispatch(toggleUserCelebrity({ userId, isCelebrity: nextStatus }));
        showAlert(`User ${nextStatus ? "marked as Celebrity / VIP" : "removed from Celebrity status"}.`, "success");
      },
      "Toggle Celebrity Status"
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
    
    const matchesRole = roleFilter === "All" || user.role?.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#155DFC] transition-colors"
          />
        </div>

        {/* Filter Button & Popover */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-sm font-medium transition-all cursor-pointer ${
              isFilterOpen || roleFilter !== "All" || statusFilter !== "All"
                ? "bg-[#155DFC]/10 border-[#155DFC] text-[#155DFC]"
                : "bg-[#111111] border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
            }`}
          >
            <Filter size={18} />
            <span>Filter</span>
            {(roleFilter !== "All" || statusFilter !== "All") && (
              <span className="w-2 h-2 rounded-full bg-[#155DFC]" />
            )}
          </button>

          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute right-0 mt-3 w-64 p-4 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl z-30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filters</span>
                  {(roleFilter !== "All" || statusFilter !== "All") && (
                    <button
                      onClick={() => {
                        setRoleFilter("All");
                        setStatusFilter("All");
                      }}
                      className="text-[10px] text-[#155DFC] hover:underline font-bold"
                    >
                      Reset All
                    </button>
                  )}
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
          <table className="w-full text-left whitespace-nowrap min-w-[950px]">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Transactions</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.map((user: User) => (
                <tr key={user.userId} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                  {/* Name Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full ${user.color || 'bg-blue-600'} flex items-center justify-center text-white font-bold shadow-sm`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        {user.isCelebrity && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-black ring-2 ring-[#111111]" title="Celebrity / VIP">
                            <Sparkles size={9} className="fill-black" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base text-zinc-100">{user.name}</span>
                        {user.isCelebrity && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Sparkles size={10} className="fill-amber-400" /> VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Username Column */}
                  <td className="px-6 py-4 text-zinc-400">{user.username}</td>

                  {/* Email Column */}
                  <td className="px-6 py-4 text-zinc-400">{user.email}</td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <span className="bg-[#155DFC]/10 text-[#155DFC] px-3 py-1 rounded-full text-xs font-medium border border-[#155DFC]/20">
                      {user.role}
                    </span>
                  </td>

                  {/* Rating Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{user.rating}</span>
                    </div>
                  </td>

                  {/* Transactions Column */}
                  <td className="px-6 py-4 font-medium">{user.transactions}</td>

                  {/* Status Column */}
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

                  {/* Actions Column with Dropdown Menu */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left action-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === user.userId ? null : user.userId);
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          openDropdownId === user.userId
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-black/40 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdownId === user.userId && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#181818] border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                          {/* View Profile */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                          >
                            <Eye size={14} className="text-zinc-400" />
                            <span>View Profile</span>
                          </button>

                          {/* Toggle Celebrity */}
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleToggleCelebrity(user.userId, user.isCelebrity);
                            }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors text-left cursor-pointer ${
                              user.isCelebrity
                                ? "text-amber-400 hover:bg-amber-500/10"
                                : "text-zinc-300 hover:text-amber-400 hover:bg-white/5"
                            }`}
                          >
                            <Sparkles size={14} className={user.isCelebrity ? "fill-amber-400 text-amber-400" : "text-zinc-400"} />
                            <span>{user.isCelebrity ? "Remove Celebrity" : "Make Celebrity / VIP"}</span>
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleToggleStatus(user.userId, user.status);
                            }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors text-left cursor-pointer ${
                              user.status === "Active"
                                ? "text-zinc-300 hover:text-red-400 hover:bg-white/5"
                                : "text-green-400 hover:bg-green-500/10"
                            }`}
                          >
                            {user.status === "Active" ? (
                              <>
                                <UserMinus size={14} className="text-zinc-400" />
                                <span>Suspend Account</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} className="text-green-400" />
                                <span>Activate Account</span>
                              </>
                            )}
                          </button>

                          <div className="h-px bg-white/5 my-1" />

                          {/* Delete Account */}
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleDeleteUser(user.userId);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                          >
                            <Trash2 size={14} className="text-red-400" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      )}
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
