"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit, Trash2, Star, StarOff, AlertTriangle, Loader2,
  FolderOpen, Award, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { ImageUpload } from "@/components/ui/image-upload";

interface Category {
  id: string; 
  name: string; 
  slug: string; 
  description?: string | null;
  image?: string | null; 
  featured: boolean; 
  sortOrder: number;
  parentId?: string | null;
  _count: { products: number };
}

const EMPTY_FORM = { name: "", slug: "", description: "", image: "", featured: false, sortOrder: 0, parentId: "" };

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [subForm, setSubForm] = useState({ name: "", image: "" });
  const [addingSub, setAddingSub] = useState(false);

  // Local state for pending subcategories inside Add Category modal
  const [pendingSubs, setPendingSubs] = useState<{ name: string; image: string }[]>([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubImage, setNewSubImage] = useState("");

  function openCreate() {
    setEditing(null);
    const nextSortOrder = categories.length > 0
      ? Math.max(...categories.map((c) => c.sortOrder ?? 0)) + 1
      : 1;
    setForm({
      ...EMPTY_FORM,
      sortOrder: nextSortOrder,
    });
    setPendingSubs([]);
    setNewSubName("");
    setNewSubImage("");
    setOpen(true);
  }

  function addPendingSub() {
    if (!newSubName.trim()) return;
    setPendingSubs((prev) => [...prev, { name: newSubName.trim(), image: newSubImage }]);
    setNewSubName("");
    setNewSubImage("");
  }

  function removePendingSub(index: number) {
    setPendingSubs((prev) => prev.filter((_, i) => i !== index));
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ 
      name: cat.name, 
      slug: cat.slug, 
      description: cat.description ?? "", 
      image: cat.image ?? "", 
      featured: cat.featured, 
      sortOrder: cat.sortOrder, 
      parentId: cat.parentId ?? "" 
    });
    setOpen(true);
  }

  async function handleAddSub() {
    if (!subForm.name.trim() || !editing) return;
    setAddingSub(true);
    try {
      const payload = {
        name: subForm.name,
        slug: slugify(subForm.name),
        image: subForm.image || null,
        parentId: editing.id,
        featured: false,
        sortOrder: 0,
      };
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Error creating subcategory");
        return;
      }
      toast.success("Subcategory created!");
      setCategories((prev) => [...prev, { ...data.data, _count: { products: 0 } }]);
      setSubForm({ name: "", image: "" });
      router.refresh();
    } catch {
      toast.error("Error creating subcategory");
    } finally {
      setAddingSub(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        slug: form.slug || slugify(form.name), 
        parentId: form.parentId || null,
        subcategories: !editing ? pendingSubs : undefined
      };
      const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Failed to save category"); return; }
      toast.success(editing ? "Category updated" : "Category and subcategories created!");
      setOpen(false);
      router.refresh();
      if (editing) {
        setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...data.data } : c));
      } else {
        setCategories((prev) => [...prev, { ...data.data, _count: { products: 0 } }]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Failed to delete"); return; }
      toast.success("Category deleted successfully");
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleFeatured(cat: Category) {
    const res = await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !cat.featured }),
    });
    const data = await res.json();
    if (data.success) {
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, featured: !c.featured } : c));
      toast.success(cat.featured ? "Removed from featured home" : "Marked as featured on home");
    } else {
      toast.error(data.error ?? "Connection error");
    }
  }

  // Calculate statistics metrics
  const mainCategoriesCount = categories.filter(c => !c.parentId).length;
  const subCategoriesCount = categories.filter(c => c.parentId).length;
  const featuredCount = categories.filter(c => c.featured).length;
  const totalProductsClassified = categories.reduce((sum, c) => sum + c._count.products, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">Category Management</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            Create departments, organize products into subcategories, and configure the homepage.
          </p>
        </div>
        <Button 
          variant="luxury" 
          onClick={openCreate}
          className="rounded-xl px-5 py-2.5 text-xs font-bold shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4 me-1.5" /> New Category
        </Button>
      </div>

      {/* ── Statistics Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rayons principaux */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Main Categories</p>
            <h3 className="text-xl font-bold text-slate-900">{mainCategoriesCount}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
            <FolderOpen className="w-4 h-4" />
          </div>
        </div>

        {/* Sous-catégories */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Subcategories</p>
            <h3 className="text-xl font-bold text-slate-900">{subCategoriesCount}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
            <FolderOpen className="w-4 h-4 opacity-60" />
          </div>
        </div>

        {/* Vedettes Accueil */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Featured (Home)</p>
            <h3 className="text-xl font-bold text-amber-600">{featuredCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* Total Classés */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Classified Products</p>
            <h3 className="text-xl font-bold text-brand-900">{totalProductsClassified}</h3>
          </div>
          <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-900">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Table Listing ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {["Category", "Parent / Type", "Slug (URL)", "Products", "Sort Order", "Featured", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300">
                        <FolderOpen className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">No categories available. Create one.</p>
                    </div>
                  </td>
                </tr>
              )}
              {categories.map((cat) => {
                const parentCat = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                    {/* Visual & Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.image} alt="" className="w-10 h-10 object-cover bg-slate-100 rounded-xl shadow-xs border border-slate-200/40 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-400 shrink-0 shadow-xs">
                            <FolderOpen className="w-4 h-4 opacity-55" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[220px] font-medium">{cat.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Parent categorization type */}
                    <td className="px-4 py-3">
                      {parentCat ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{parentCat.name}</span>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Subcategory</span>
                        </div>
                      ) : (
                        <span className="bg-brand-50 text-brand-900 border border-brand-100 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-lg">
                          Main
                        </span>
                      )}
                    </td>
                    {/* Slug */}
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs max-w-[150px] truncate">{cat.slug}</td>
                    {/* Classified quantity */}
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-mono font-bold bg-slate-100 border border-slate-200/60 text-slate-800 text-[10px] px-2.5 py-0.5 rounded-lg shadow-2xs">
                        {cat._count.products} product{cat._count.products > 1 ? "s" : ""}
                      </Badge>
                    </td>
                    {/* Sort Priority */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 text-xs">{cat.sortOrder}</td>
                    {/* Featured toggle */}
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleFeatured(cat)} 
                        title={cat.featured ? "Remove from featured" : "Mark as featured"}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {cat.featured ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-xs scale-105" />
                        ) : (
                          <StarOff className="w-4 h-4 text-slate-300 hover:text-amber-400 transition-colors" />
                        )}
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button 
                          onClick={() => openEdit(cat)} 
                          title="Edit category"
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-2xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                           onClick={() => setDeleteTarget(cat)} 
                           title="Delete category"
                           className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Dialog Modal ────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border-0 p-0 shadow-2xl gap-0" aria-describedby={undefined}>
          {/* Top Luxury Gold accent line */}
          <div className="h-1.5 bg-gradient-to-r from-[#C9A96E] via-[#A88244] to-[#C9A96E] w-full shrink-0" />
          
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
            <DialogTitle className="font-display text-lg text-slate-900 font-bold tracking-tight">
              {editing ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
              {editing
                ? "Edit information, change cover image, and manage subcategories live."
                : "Create a new department, set display priority, and link subcategories."}
            </p>
          </DialogHeader>
          
          <div className="p-6 pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              
              {/* Left Column: General Info */}
              <div className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200/50 pb-2 mb-3">
                  1. General Information
                </h4>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Category Name</label>
                  <Input 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
                    className="border-gray-200 focus:border-slate-800 text-slate-800 bg-white rounded-xl"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Slug (Navigation URL)</label>
                  <Input 
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="border-gray-200 focus:border-slate-800 text-slate-800 bg-white rounded-xl font-mono"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Description</label>
                  <textarea 
                    rows={3} 
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-800 resize-none transition-all font-medium"
                    placeholder="Enter a brief description..."
                  />
                </div>
              </div>

              {/* Right Column: Settings & Media */}
              <div className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200/50 pb-2 mb-3">
                  2. Settings & Visuals
                </h4>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Display Order (Priority)</label>
                  <Input 
                    type="number" 
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="border-gray-200 focus:border-slate-800 text-slate-800 bg-white rounded-xl font-mono"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white hover:bg-slate-50/50 transition-all shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Featured</span>
                    <span className="text-[9px] text-slate-400 font-medium">Show on home page</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 accent-slate-900 cursor-pointer rounded" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Cover Image / Icon</label>
                  <ImageUpload
                    value={form.image ? [form.image] : []}
                    onChange={(url) => setForm({ ...form, image: url })}
                    onRemove={() => setForm({ ...form, image: "" })}
                    maxFiles={1}
                    folder="el-huyaam/categories"
                  />
                </div>
              </div>

              {/* ── Subcategories Section (Span 2 columns) ── */}
              <div className="col-span-1 md:col-span-2">
                {editing ? (
                  <div className="border-t border-slate-100 pt-5 mt-1 space-y-4">
                    <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-slate-900">
                      Subcategory Management
                    </h3>

                    {/* Subcategories list */}
                    <div className="space-y-2">
                      {categories.filter((c) => c.parentId === editing.id).length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50/50 p-4 border border-slate-100/50 border-dashed rounded-xl text-center">
                          No subcategories created yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {categories
                            .filter((c) => c.parentId === editing.id)
                            .map((sub) => (
                              <div key={sub.id} className="flex items-center justify-between p-2 border border-slate-150 rounded-xl bg-white shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                  {sub.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={sub.image} alt="" className="w-8 h-8 object-cover bg-slate-100 rounded-lg shrink-0 border border-slate-200/40" />
                                  ) : (
                                    <div className="w-8 h-8 bg-slate-50 border border-slate-250/50 rounded-lg flex items-center justify-center text-[10px] text-slate-400 shrink-0">—</div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{sub.name}</p>
                                    <p className="text-[9px] text-slate-450 font-mono truncate">{sub.slug}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    // Close editing dialog and prepare delete modal
                                    setOpen(false);
                                    setDeleteTarget(sub);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete subcategory"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Form to add a subcategory */}
                    <div className="bg-slate-50/80 p-4 border border-slate-150 space-y-3 rounded-2xl">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Add Subcategory Live</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Subcategory Name"
                          value={subForm.name}
                          onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                          className="bg-white border-gray-200 focus:border-slate-800 text-slate-850 rounded-xl flex-1"
                        />
                        <Button
                          variant="luxury"
                          onClick={handleAddSub}
                          loading={addingSub}
                          disabled={!subForm.name.trim()}
                          className="h-10 px-4 shrink-0 rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5 me-1" /> Add
                        </Button>
                      </div>
                      <div className="bg-white p-3 border border-slate-100 rounded-xl">
                        <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Subcategory Photo</label>
                        <ImageUpload
                          value={subForm.image ? [subForm.image] : []}
                          onChange={(url) => setSubForm({ ...subForm, image: url })}
                          onRemove={() => setSubForm({ ...subForm, image: "" })}
                          maxFiles={1}
                          folder="el-huyaam/categories"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-5 mt-1 space-y-4">
                    <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-slate-900">
                      Subcategories to Create
                    </h3>

                    {/* Local pending subcategories list */}
                    <div className="space-y-2">
                      {pendingSubs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50/50 p-4 border border-slate-100/50 border-dashed rounded-xl text-center">
                          No subcategories added. You can define them below.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {pendingSubs.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border border-slate-150 rounded-xl bg-white shadow-2xs">
                              <div className="flex items-center gap-2.5">
                                {sub.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={sub.image} alt="" className="w-8 h-8 object-cover bg-slate-100 rounded-lg shrink-0 border border-slate-200/40" />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-50 border border-slate-250/50 rounded-lg flex items-center justify-center text-[10px] text-slate-400 shrink-0">—</div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{sub.name}</p>
                                  <p className="text-[9px] text-slate-400 font-semibold truncate">Pending subcategory</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removePendingSub(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                title="Remove subcategory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form to add subcategory locally */}
                    <div className="bg-slate-50/80 p-4 border border-slate-150 space-y-3 rounded-2xl">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Define a Subcategory</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Subcategory Name"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          className="bg-white border-gray-200 focus:border-slate-800 text-slate-850 rounded-xl flex-1"
                        />
                        <Button
                          variant="luxury"
                          onClick={addPendingSub}
                          disabled={!newSubName.trim()}
                          className="h-10 px-4 shrink-0 rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5 me-1" /> Add
                        </Button>
                      </div>
                      <div className="bg-white p-3 border border-slate-100 rounded-xl">
                        <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Subcategory Photo</label>
                        <ImageUpload
                          value={newSubImage ? [newSubImage] : []}
                          onChange={(url) => setNewSubImage(url)}
                          onRemove={() => setNewSubImage("")}
                          maxFiles={1}
                          folder="el-huyaam/categories"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Action Footer */}
              <div className="col-span-1 md:col-span-2 flex gap-3 pt-6 border-t border-slate-100">
                <Button 
                  variant="luxury" 
                  onClick={handleSave} 
                  loading={saving} 
                  className="flex-1 h-11 text-xs uppercase tracking-widest rounded-xl font-bold"
                >
                  {editing ? "Save Changes" : "Create Main Category"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  className="flex-1 h-11 text-xs uppercase tracking-widest rounded-xl font-bold border-gray-200 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </Button>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="absolute inset-0 bg-black/60" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white w-full max-w-md shadow-2xl rounded-3xl overflow-hidden gap-0">
            {/* Top accent */}
            <div className="h-1.5 bg-red-500 w-full" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-red-50 border border-red-100 flex items-center justify-center shrink-0 rounded-2xl text-red-500 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-slate-900 font-bold text-base sm:text-lg">Delete Category</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">
                    You are about to delete the category <strong className="text-slate-800 font-bold">{deleteTarget.name}</strong>.
                  </p>
                </div>
              </div>

              {deleteTarget._count.products > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 mb-5 shadow-2xs">
                  <p className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>This category contains {deleteTarget._count.products} active product{deleteTarget._count.products > 1 ? "s" : ""}.</span>
                  </p>
                  <p className="text-[10px] text-amber-700 leading-relaxed mt-1.5 font-medium">
                    Move or archive these products first. Deleting categories that contain products is blocked for safety.
                  </p>
                </div>
              )}

              {deleteTarget._count.products === 0 && (
                <p className="text-xs text-slate-500 leading-relaxed mb-5 font-medium">
                  This action is irreversible. All data of this category will be permanently deleted from the system.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 border border-gray-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteTarget._count.products > 0}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl shadow-sm"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
