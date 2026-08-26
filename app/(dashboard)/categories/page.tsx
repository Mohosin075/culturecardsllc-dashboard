"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ChevronRight, Laptop, Watch, Layers as Cards, Footprints, Loader2, X } from "lucide-react";


const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  "Footprints": Footprints,
  "Cards": Cards,
  "Watch": Watch,
  "Laptop": Laptop,
};

const getIconByName = (name: string) => {
  return iconMap[name] || Cards;
};

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

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { items: categories, loading } = useAppSelector((state) => state.categories);
  const { showAlert, showConfirm } = useAlert();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const totalPages = Math.ceil(categories.length / rowsPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

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
        // The backend also allows updating name if needed, but our current API thunk only sends description. 
        // We can update the thunk later if name edit is needed, but for now we follow the existing behavior.
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
      "Are you sure you want to delete this category?",
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

  const { error } = useAppSelector((state) => state.categories);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchCategories())} />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Categories Management</h1>
        <button
          onClick={handleAddClick}
          className="bg-[#155DFC] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.length === 0 ? (
          <div className="col-span-full bg-[#111111] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
              <Cards size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-200">No Categories Found</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                There are no product categories configured. Click the &quot;Add Category&quot; button to create one.
              </p>
            </div>
          </div>
        ) : (
          <>
            {paginatedCategories.map((category: Category) => {
              const Icon = getIconByName(category.iconName);
              return (
                <div key={category.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-300">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-zinc-100">{category.name}</h2>
                        <p className="text-sm text-zinc-500">{category.count} listings</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="p-2 bg-black/40 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {category.description && (
                    <div className="text-sm text-zinc-400">
                      {category.description}
                    </div>
                  )}
                </div>
              );
            })}
            {categories.length > 0 && (
              <div className="col-span-full mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={setRowsPerPage}
                  totalItems={categories.length}
                  itemNamePlural="categories"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => !isSubmitting && setModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#111111]/90 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {modalMode === "add" ? "Add New Category" : "Edit Category"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rare Coins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting || modalMode === "edit"} // Disabling name edit if we only support description edits right now, or we can enable it!
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-[#155DFC] transition-colors disabled:opacity-50"
                  autoFocus
                />
                {modalMode === "edit" && <p className="text-xs text-zinc-500 mt-1">Name cannot be changed currently.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Category Description</label>
                <textarea
                  placeholder="Describe this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-[#155DFC] transition-colors resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-zinc-200 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="px-5 py-2.5 bg-[#155DFC] hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-[#155DFC]/20 flex items-center justify-center min-w-[100px] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (modalMode === "add" ? "Create" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
