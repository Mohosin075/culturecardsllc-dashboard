"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Laptop, 
  Watch, 
  Layers as Cards, 
  Footprints, 
  Loader2, 
  X,
  Coins, 
  Trophy, 
  Gamepad, 
  Sparkles, 
  Shirt, 
  BookOpen, 
  Image as ImageIcon, 
  Disc, 
  Gem, 
  Search,
  Hash,
  Database,
  EyeOff
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import {
  fetchCategories,
  addCategory,
  editCategory,
  deleteCategory,
  type Category,
} from "@/app/store/slices/categoriesSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

// Dynamic Category Icon Engine mapping keywords in names to gorgeous Lucide icons
const getIconForCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("shoe") || n.includes("sneaker") || n.includes("foot") || n.includes("kick")) return Footprints;
  if (n.includes("coin") || n.includes("gold") || n.includes("silver") || n.includes("money") || n.includes("currency")) return Coins;
  if (n.includes("sport") || n.includes("trophy") || n.includes("jersey") || n.includes("athletic") || n.includes("base") || n.includes("basket") || n.includes("footb")) return Trophy;
  if (n.includes("game") || n.includes("play") || n.includes("toy") || n.includes("console") || n.includes("pokemon")) return Gamepad;
  if (n.includes("shirt") || n.includes("cloth") || n.includes("wear") || n.includes("apparel") || n.includes("jacket")) return Shirt;
  if (n.includes("watch") || n.includes("accessory") || n.includes("time") || n.includes("clock")) return Watch;
  if (n.includes("laptop") || n.includes("phone") || n.includes("tech") || n.includes("electronic") || n.includes("computer")) return Laptop;
  if (n.includes("book") || n.includes("comic") || n.includes("magazine") || n.includes("read") || n.includes("novel")) return BookOpen;
  if (n.includes("art") || n.includes("paint") || n.includes("photo") || n.includes("image") || n.includes("canvas")) return ImageIcon;
  if (n.includes("music") || n.includes("record") || n.includes("vinyl") || n.includes("disc") || n.includes("audio")) return Disc;
  if (n.includes("gem") || n.includes("jewelry") || n.includes("gold") || n.includes("ring") || n.includes("diamond")) return Gem;
  if (n.includes("rare") || n.includes("boost") || n.includes("special") || n.includes("limited") || n.includes("high")) return Sparkles;
  
  return Cards; // Default fallback icon
};

// Generates translucent colors for icon background based on category index or ID
const getIconColors = (index: number) => {
  const schemes = [
    { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
    { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
  ];
  return schemes[index % schemes.length];
};

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { items: categories, loading, error } = useAppSelector((state) => state.categories);
  const { showAlert, showConfirm } = useAlert();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Compute Stats summary card data
  const totalCategoriesCount = categories.length;
  const totalListingsCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
  
  // Find top category by listings count
  const topCategory = categories.length > 0 
    ? [...categories].sort((a, b) => (b.count || 0) - (a.count || 0))[0]
    : null;

  // Unused categories count
  const unusedCategoriesCount = categories.filter(cat => (cat.count || 0) === 0).length;

  // Filtering
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Pagination on filtered list
  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleAddClick = () => {
    setModalMode("add");
    setEditId(null);
    setFormData({ name: "", description: "" });
    setModalOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setModalMode("edit");
    setEditId(category.id);
    setFormData({ name: category.name, description: category.description || "" });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert("Category name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await dispatch(addCategory({ name: formData.name, description: formData.description })).unwrap();
        showAlert("Category added successfully.", "success");
      } else if (modalMode === "edit" && editId) {
        await dispatch(editCategory({ id: editId, description: formData.description })).unwrap();
        showAlert("Category updated successfully.", "success");
      }
      setModalOpen(false);
    } catch (error: any) {
      showAlert(error?.message || `Failed to ${modalMode} category`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    showConfirm(
      "Are you sure you want to delete this category? All listings belonging to this category may be affected.",
      async () => {
        try {
          await dispatch(deleteCategory(id)).unwrap();
          showAlert("Category deleted successfully.", "success");
        } catch (error: any) {
          showAlert(error?.message || "Failed to delete category", "error");
        }
      },
      "Delete Category"
    );
  };

  if (loading && categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-7 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-32 bg-zinc-800/60 rounded-md"></div>
          </div>
          <div className="h-10 w-40 bg-zinc-800 rounded-xl"></div>
        </div>

        {/* Stats Summary Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 border border-white/5 rounded-2xl"></div>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-12 bg-zinc-900 rounded-xl w-full"></div>

        {/* Grid List Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-zinc-900 border border-white/5 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchCategories())} />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Categories Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
            Configure, manage, and edit product categorization details for the listing platform.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-[#155DFC] hover:bg-blue-600 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10 border border-blue-400/20 shrink-0 self-start sm:self-auto"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Statistics Cards Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Categories */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Categories</span>
            <p className="text-2xl font-bold text-white font-mono">{totalCategoriesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
            <Hash size={18} />
          </div>
        </div>

        {/* Card 2: Total Listings */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Listings</span>
            <p className="text-2xl font-bold text-blue-400 font-mono">{totalListingsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Database size={18} />
          </div>
        </div>

        {/* Card 3: Popular Category */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block truncate">Popular Category</span>
            <p className="text-sm font-bold text-emerald-400 truncate mt-1">
              {topCategory ? `${topCategory.name} (${topCategory.count || 0})` : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 ml-2">
            <Trophy size={18} />
          </div>
        </div>

        {/* Card 4: Unused Categories */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unused Categories</span>
            <p className="text-2xl font-bold text-red-400 font-mono">{unusedCategoriesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <EyeOff size={18} />
          </div>
        </div>
      </div>

      {/* Live Search and Filters Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-4 flex items-center text-zinc-500">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search categories by name, keywords, description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121214]/60 hover:bg-[#151518]/60 focus:bg-black/40 border border-white/5 focus:border-[#155DFC]/50 focus:outline-none transition-all py-3.5 pl-12 pr-4 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:ring-1 focus:ring-[#155DFC]/20 shadow-inner"
        />
      </div>

      {/* Categories Grid list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full relative overflow-hidden bg-[#121214]/20 border border-white/5 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 relative z-10">
              <Cards size={28} className="text-zinc-600" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <h3 className="text-lg font-bold text-zinc-200">No Categories Found</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery 
                  ? `No categories match the search query "${searchQuery}".`
                  : "There are no product categories configured yet. Click \"Add Category\" to get started."}
              </p>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="relative z-10 text-xs text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <>
            {paginatedCategories.map((category: Category, idx: number) => {
              const Icon = getIconForCategory(category.name);
              const colorConfig = getIconColors(idx);
              return (
                <div 
                  key={category.id} 
                  className="group relative bg-[#121214]/40 hover:bg-[#161619]/40 border border-white/5 hover:border-white/12 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.4)]"
                >
                  <div className="space-y-4">
                    {/* Category Card Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Custom Category Icon Box */}
                        <div className={`w-12 h-12 ${colorConfig.bg} ${colorConfig.border} border rounded-xl flex items-center justify-center ${colorConfig.text} shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                          <Icon size={22} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                            {category.name}
                          </h2>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {category.count || 0} listings
                          </span>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="w-8 h-8 rounded-lg bg-zinc-900/60 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Edit Category"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="w-8 h-8 rounded-lg bg-zinc-900/60 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Category Description */}
                    {category.description && (
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium pl-1 line-clamp-3">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {filteredCategories.length > 0 && (
              <div className="col-span-full mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={setRowsPerPage}
                  totalItems={filteredCategories.length}
                  itemNamePlural="categories"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Category Creation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => !isSubmitting && setModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#121215] border border-white/10 rounded-3xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white">
                {modalMode === "add" ? "Create Category" : "Modify Category"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sports Memorabilia"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting || modalMode === "edit"}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-[#155DFC] transition-colors focus:ring-1 focus:ring-[#155DFC]/20 disabled:opacity-50 text-sm font-medium"
                  autoFocus
                />
                {modalMode === "edit" && (
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Note: To preserve listing integrations, category names cannot be edited once created.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category Description</label>
                <textarea
                  placeholder="Provide a description explaining what product types belong to this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-[#155DFC] transition-colors resize-none disabled:opacity-50 text-sm font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="px-5 py-2.5 bg-[#155DFC] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-[#155DFC]/20 flex items-center justify-center min-w-[100px] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (modalMode === "add" ? "Create Category" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
