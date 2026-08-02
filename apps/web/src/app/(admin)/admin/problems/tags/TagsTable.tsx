"use client";

import React, { useState } from "react";
import { Search, Edit3, Trash2, Save, X, Plus } from "lucide-react";
import { updateTagServer, deleteTagServer, createTagServer } from "@/app/actions/admin/tags";
import { toast } from "sonner";

export type TagSummary = {
  id: string;
  name: string;
  problemCount: number;
};

export function TagsTable({ initialTags }: { initialTags: TagSummary[] }) {
  const [tags, setTags] = useState(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const tag = await createTagServer(newName);
      setTags(prev => [...prev, { id: tag.id, name: tag.name, problemCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setIsCreating(false);
      setNewName("");
      toast.success("Tag created successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to create tag");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateTagServer(id, editName);
      setTags(prev => prev.map(t => t.id === id ? { ...t, name: editName.trim() } : t));
      setEditingId(null);
      toast.success("Tag renamed successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to update tag");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${name}"? It will be removed from all problems currently using it.`)) return;
    try {
      await deleteTagServer(id);
      setTags(prev => prev.filter(t => t.id !== id));
      toast.success("Tag deleted successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-500/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Tag
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
            <thead className="bg-slate-50 dark:bg-zinc-950/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Tag Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Problems Using Tag</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {isCreating && (
                <tr className="bg-blue-50/50 dark:bg-blue-500/5">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <input 
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreate()}
                      placeholder="Tag Name..."
                      className="px-3 py-1.5 border border-blue-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-[200px]"
                    />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">0</td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleCreate} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Save"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setIsCreating(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">
                      {editingId === tag.id ? (
                        <input 
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleUpdate(tag.id)}
                          className="px-3 py-1.5 border border-blue-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-[200px]"
                        />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          {tag.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-zinc-400 font-medium">
                      {tag.problemCount} {tag.problemCount === 1 ? 'problem' : 'problems'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === tag.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdate(tag.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Save"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setEditingId(tag.id); setEditName(tag.name); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Rename Tag"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                !isCreating && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
                      No tags found.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
