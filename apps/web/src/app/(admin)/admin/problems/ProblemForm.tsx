"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownEditor } from "./MarkdownEditor";
import { CreateProblemInput, createProblemServer, updateProblemServer } from "@/app/actions/admin/problems";
import { createTagServer } from "@/app/actions/admin/tags";
import { toast } from "sonner";
import { Save, Plus, Trash2, Tag as TagIcon, Check, Code2 } from "lucide-react";

type Tag = { id: string; name: string };
type Language = { id: string; name: string; slug: string };

export function ProblemForm({ 
  initialTags, 
  initialLanguages,
  initialData,
  problemId
}: { 
  initialTags: Tag[], 
  initialLanguages: Language[],
  initialData?: any,
  problemId?: string
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "desc" | "cases" | "tags" | "templates">("basic");

  // Form State
  const [formData, setFormData] = useState<Omit<CreateProblemInput, "tagIds">>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    difficulty: initialData?.difficulty || "EASY",
    timeLimit: initialData?.timeLimit || 1000,
    memoryLimit: initialData?.memoryLimit || 256000,
    isPublic: initialData?.isPublic || false,
    description: initialData?.description || "Write problem description here...",
    testCases: initialData?.testCases || [],
    samples: initialData?.samples || [],
    templates: initialData?.templates || []
  });

  // Tags State
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  const [newTagName, setNewTagName] = useState("");

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTagServer(newTagName);
      setAvailableTags(prev => [...prev, newTag]);
      setSelectedTagIds(prev => [...prev, newTag.id]);
      setNewTagName("");
      toast.success("Tag created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create tag");
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", isHidden: true, weight: 1 }]
    }));
  };

  const addSample = () => {
    setFormData(prev => ({
      ...prev,
      samples: [...prev.samples, { input: "", expectedOutput: "", explanation: "", order: prev.samples.length }]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      toast.error("Title and Slug are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (problemId) {
        await updateProblemServer(problemId, {
          ...formData,
          tagIds: selectedTagIds
        });
        toast.success("Problem updated successfully!");
      } else {
        await createProblemServer({
          ...formData,
          tagIds: selectedTagIds
        });
        toast.success("Problem created successfully!");
      }
      router.push("/admin/problems");
    } catch (e: any) {
      toast.error(e.message || "Failed to save problem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto">
        {(["basic", "desc", "cases", "tags", "templates"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-500/5 dark:text-blue-400" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
            }`}
          >
            {tab === "basic" && "Basic Info"}
            {tab === "desc" && "Description (MDX)"}
            {tab === "cases" && "I/O & Cases"}
            {tab === "tags" && "Tags"}
            {tab === "templates" && "Code Templates"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Problem Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => {
                  const title = e.target.value;
                  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setFormData(prev => ({ ...prev, title, slug }));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                placeholder="e.g. Two Sum"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Slug</label>
              <input 
                type="text" 
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono text-sm"
                placeholder="e.g. two-sum"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Difficulty</label>
              <select 
                value={formData.difficulty}
                onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Time Limit (ms)</label>
              <input 
                type="number" 
                value={formData.timeLimit}
                onChange={e => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Memory Limit (KB)</label>
              <input 
                type="number" 
                value={formData.memoryLimit}
                onChange={e => setFormData(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 mt-8">
              <input 
                type="checkbox" 
                id="isPublic"
                checked={formData.isPublic}
                onChange={e => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Publish immediately (Make Public)
              </label>
            </div>
          </div>
        )}

        {/* Description Tab */}
        {activeTab === "desc" && (
          <div className="h-[60vh] min-h-[300px]">
            <MarkdownEditor 
              markdown={formData.description}
              onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
            />
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === "cases" && (
          <div className="space-y-8">
            {/* Samples */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Public Samples</h3>
                <button onClick={addSample} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Sample
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.samples.map((sample, i) => (
                  <div key={i} className="p-4 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-sm text-slate-500">Sample {i + 1}</span>
                      <button onClick={() => setFormData(prev => ({ ...prev, samples: prev.samples.filter((_, idx) => idx !== i) }))} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Input</label>
                        <textarea value={sample.input} onChange={e => {
                          const newSamples = [...formData.samples];
                          newSamples[i].input = e.target.value;
                          setFormData(prev => ({ ...prev, samples: newSamples }));
                        }} className="w-full p-2 mt-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono text-sm" rows={3} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Expected Output</label>
                        <textarea value={sample.expectedOutput} onChange={e => {
                          const newSamples = [...formData.samples];
                          newSamples[i].expectedOutput = e.target.value;
                          setFormData(prev => ({ ...prev, samples: newSamples }));
                        }} className="w-full p-2 mt-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono text-sm" rows={3} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Explanation (Optional)</label>
                      <input type="text" value={sample.explanation} onChange={e => {
                        const newSamples = [...formData.samples];
                        newSamples[i].explanation = e.target.value;
                        setFormData(prev => ({ ...prev, samples: newSamples }));
                      }} className="w-full p-2 mt-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white text-sm" />
                    </div>
                  </div>
                ))}
                {formData.samples.length === 0 && <p className="text-sm text-slate-500">No public samples added.</p>}
              </div>
            </div>

            <hr className="border-slate-200 dark:border-zinc-800" />

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Hidden Test Cases</h3>
                <button onClick={addTestCase} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Test Case
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.testCases.map((tc, i) => (
                  <div key={i} className="p-4 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-sm text-slate-500">Test Case {i + 1}</span>
                      <button onClick={() => setFormData(prev => ({ ...prev, testCases: prev.testCases.filter((_, idx) => idx !== i) }))} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Input</label>
                        <textarea value={tc.input} onChange={e => {
                          const newTc = [...formData.testCases];
                          newTc[i].input = e.target.value;
                          setFormData(prev => ({ ...prev, testCases: newTc }));
                        }} className="w-full p-2 mt-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono text-sm" rows={3} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Expected Output</label>
                        <textarea value={tc.expectedOutput} onChange={e => {
                          const newTc = [...formData.testCases];
                          newTc[i].expectedOutput = e.target.value;
                          setFormData(prev => ({ ...prev, testCases: newTc }));
                        }} className="w-full p-2 mt-1 border rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono text-sm" rows={3} />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.testCases.length === 0 && <p className="text-sm text-slate-500">No hidden test cases added.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === "tags" && (
          <div className="max-w-2xl space-y-6">
            
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Create New Tag</label>
              <div className="flex mt-1.5 gap-2">
                <input 
                  type="text" 
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateTag()}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                  placeholder="e.g. Dynamic Programming"
                />
                <button 
                  onClick={handleCreateTag}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium text-sm"
                >
                  Create
                </button>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-zinc-800" />

            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">Available Tags</h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        isSelected 
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag.name}
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">Language Templates</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Provide starter code for different programming languages (Optional).</p>
              </div>
              <button 
                onClick={() => {
                  if (initialLanguages.length > 0) {
                    setFormData(prev => ({
                      ...prev,
                      templates: [...prev.templates, { languageId: initialLanguages[0].id, boilerplate: "" }]
                    }));
                  } else {
                    toast.error("No languages available in the database.");
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Template
              </button>
            </div>

            <div className="space-y-6">
              {formData.templates.map((template, i) => (
                <div key={i} className="p-4 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Code2 className="w-5 h-5 text-slate-400" />
                      <select 
                        value={template.languageId}
                        onChange={e => {
                          const newTemplates = [...formData.templates];
                          newTemplates[i].languageId = e.target.value;
                          setFormData(prev => ({ ...prev, templates: newTemplates }));
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-medium text-sm"
                      >
                        {initialLanguages.map(lang => (
                          <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, templates: prev.templates.filter((_, idx) => idx !== i) }))} 
                      className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5 block">Boilerplate Code</label>
                    <textarea 
                      value={template.boilerplate} 
                      onChange={e => {
                        const newTemplates = [...formData.templates];
                        newTemplates[i].boilerplate = e.target.value;
                        setFormData(prev => ({ ...prev, templates: newTemplates }));
                      }} 
                      placeholder="// Write starter code here..."
                      className="w-full p-4 border border-slate-300 rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-300 font-mono text-sm min-h-[200px]" 
                      spellCheck={false}
                    />
                  </div>
                </div>
              ))}
              {formData.templates.length === 0 && (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl">
                  <Code2 className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-zinc-400">No language templates added.</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Users will start with a blank editor for all languages.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer / Submit */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3">
        <button
          onClick={() => router.push("/admin/problems")}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {problemId ? "Update Problem" : "Create Problem"}
        </button>
      </div>
    </div>
  );
}
