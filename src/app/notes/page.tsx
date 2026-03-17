"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FolderPlus, FilePlus, Trash2, Pencil, ChevronRight,
  ChevronDown, Check, X, Copy, Columns2, AlignLeft, Eye,
  FileText, Folder,
} from "lucide-react";

const NotePreview = dynamic(
  () => import("@/components/notes/NotePreview").then(m => m.NotePreview),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-gray-700 text-xs">Chargement…</div> }
);

// ── Types ──────────────────────────────────────────────────────────────────────
interface TreeNode {
  id: string; name: string; type: "file" | "folder";
  parentId: string | null; createdAt: number; updatedAt: number;
}
type ViewMode = "write" | "split" | "preview";

// ── API ────────────────────────────────────────────────────────────────────────
const api = {
  async tree() {
    const r = await fetch("/api/notes", { cache: "no-store" });
    return r.json() as Promise<{ nodes: TreeNode[]; updatedAt: number }>;
  },
  async content(id: string) {
    const r = await fetch(`/api/notes?id=${id}`, { cache: "no-store" });
    return ((await r.json()) as { content: string }).content ?? "";
  },
  async post(body: object) {
    return fetch("/api/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};

// ── Tree helpers ───────────────────────────────────────────────────────────────
function sortNodes(ns: TreeNode[]) {
  return [...ns].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
function children(ns: TreeNode[], parentId: string | null) {
  return sortNodes(ns.filter(n => n.parentId === parentId));
}

// ── Inline rename input ────────────────────────────────────────────────────────
function InlineInput({ defaultValue, onConfirm, onCancel }: {
  defaultValue: string; onConfirm: (v: string) => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.select(), []);
  return (
    <input
      ref={ref} defaultValue={defaultValue} autoFocus
      className="flex-1 bg-transparent border-b border-white/30 text-white text-[11px] outline-none px-1 min-w-0 py-0.5"
      onKeyDown={e => {
        if (e.key === "Enter") onConfirm((e.target as HTMLInputElement).value.trim());
        if (e.key === "Escape") onCancel();
      }}
      onBlur={e => onConfirm(e.target.value.trim())}
      onClick={e => e.stopPropagation()}
    />
  );
}

// ── TreeItem ───────────────────────────────────────────────────────────────────
function TreeItem({ node, nodes, depth, selectedId, expanded, onSelect, onToggle, onRefresh }: {
  node: TreeNode; nodes: TreeNode[]; depth: number; selectedId: string | null;
  expanded: Set<string>; onSelect: (id: string) => void;
  onToggle: (id: string) => void; onRefresh: () => void;
}) {
  const [renaming, setRenaming]   = useState(false);
  const [creating, setCreating]   = useState<"file" | "folder" | null>(null);
  const isOpen     = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const kids       = children(nodes, node.id);

  const doRename = async (name: string) => {
    setRenaming(false);
    if (!name || name === node.name) return;
    await api.post({ action: "rename", id: node.id, name });
    onRefresh();
  };

  const doCreate = async (name: string) => {
    setCreating(null);
    if (!name) return;
    await api.post({ action: "create", type: creating, name, parentId: node.id });
    if (!isOpen) onToggle(node.id);
    onRefresh();
  };

  const doDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = node.type === "folder"
      ? `Supprimer "${node.name}" et tout son contenu ?` : `Supprimer "${node.name}" ?`;
    if (!confirm(msg)) return;
    await api.post({ action: "delete", id: node.id });
    onRefresh();
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer select-none transition-all duration-150 rounded-sm mx-1 ${
          isSelected
            ? "bg-white/10 text-white border-l-2 border-white"
            : "text-gray-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
        onClick={() => node.type === "folder" ? onToggle(node.id) : onSelect(node.id)}
      >
        {/* Icon */}
        <span className="shrink-0 w-4 flex items-center justify-center">
          {node.type === "folder" ? (
            isOpen
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
          ) : (
            <FileText className="w-3 h-3 opacity-50" />
          )}
        </span>

        {/* Name */}
        {renaming ? (
          <InlineInput defaultValue={node.name} onConfirm={doRename} onCancel={() => setRenaming(false)} />
        ) : (
          <span className="flex-1 text-[11px] tracking-wide truncate font-medium">{node.name}</span>
        )}

        {/* Hover actions */}
        {!renaming && (
          <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {node.type === "folder" && (
              <>
                <button title="Nouveau fichier" onClick={e => { e.stopPropagation(); setCreating("file"); if (!isOpen) onToggle(node.id); }} className="p-0.5 hover:text-white rounded">
                  <FilePlus className="w-3 h-3" />
                </button>
                <button title="Nouveau dossier" onClick={e => { e.stopPropagation(); setCreating("folder"); if (!isOpen) onToggle(node.id); }} className="p-0.5 hover:text-white rounded">
                  <FolderPlus className="w-3 h-3" />
                </button>
              </>
            )}
            <button title="Renommer" onClick={e => { e.stopPropagation(); setRenaming(true); }} className="p-0.5 hover:text-white rounded">
              <Pencil className="w-3 h-3" />
            </button>
            <button title="Supprimer" onClick={doDelete} className="p-0.5 hover:text-red-400 rounded">
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      {/* Inline create input */}
      {creating && (
        <div className="flex items-center gap-1.5 py-1 pr-2 mx-1" style={{ paddingLeft: `${6 + (depth + 1) * 14}px` }}>
          <span className="w-4 shrink-0 flex items-center justify-center">
            {creating === "folder" ? <Folder className="w-3 h-3 opacity-40" /> : <FileText className="w-3 h-3 opacity-40" />}
          </span>
          <InlineInput defaultValue="" onConfirm={doCreate} onCancel={() => setCreating(null)} />
          <button onClick={() => setCreating(null)} className="text-gray-600 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Children */}
      {node.type === "folder" && isOpen && (
        <div>
          {kids.map(k => (
            <TreeItem key={k.id} node={k} nodes={nodes} depth={depth + 1}
              selectedId={selectedId} expanded={expanded}
              onSelect={onSelect} onToggle={onToggle} onRefresh={onRefresh} />
          ))}
          {kids.length === 0 && !creating && (
            <div className="text-[10px] text-gray-700 py-1 italic" style={{ paddingLeft: `${6 + (depth + 1) * 14 + 16}px` }}>
              vide
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ id, nodes }: { id: string | null; nodes: TreeNode[] }) {
  if (!id) return null;
  const parts: string[] = [];
  let cur: string | null = id;
  while (cur) {
    const node = nodes.find(n => n.id === cur);
    if (!node) break;
    parts.unshift(node.name);
    cur = node.parentId;
  }
  return (
    <span className="text-[11px] text-gray-600 truncate">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5 opacity-30">/</span>}
          <span className={i === parts.length - 1 ? "text-gray-400" : ""}>{p}</span>
        </span>
      ))}
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [nodes,      setNodes]      = useState<TreeNode[]>([]);
  const [updatedAt,  setUpdatedAt]  = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content,    setContent]    = useState("");
  const [saved,      setSaved]      = useState("");
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [view,       setView]       = useState<ViewMode>("split");
  const [copied,     setCopied]     = useState(false);
  const [creating,   setCreating]   = useState<"file" | "folder" | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load tree ────────────────────────────────────────────────────────────────
  const loadTree = useCallback(async (force = false) => {
    const data = await api.tree();
    if (force || data.updatedAt > updatedAt) {
      setNodes(data.nodes);
      setUpdatedAt(data.updatedAt);
    }
  }, [updatedAt]);

  useEffect(() => { loadTree(true); }, []); // eslint-disable-line

  // ── Polling 2s ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => loadTree(), 2000);
    return () => clearInterval(t);
  }, [loadTree]);

  // ── Load content on select ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    api.content(selectedId).then(c => { setContent(c); setSaved(c); });
  }, [selectedId]); // eslint-disable-line

  // ── Auto-save (debounced 800ms) ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || content === saved) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await api.post({ action: "save", id: selectedId, content });
      setSaved(content);
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [content, selectedId, saved]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleExpand = (id: string) => setExpanded(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const handleSelect = async (id: string) => {
    if (id === selectedId) return;
    if (selectedId && content !== saved) {
      await api.post({ action: "save", id: selectedId, content });
    }
    setSelectedId(id);
  };

  const handleCreateRoot = async (name: string) => {
    setCreating(null);
    if (!name) return;
    const r = await api.post({ action: "create", type: creating, name, parentId: null });
    const node = await r.json() as TreeNode;
    await loadTree(true);
    if (node.type === "file") handleSelect(node.id);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const selectedNode = nodes.find(n => n.id === selectedId);
  const isDirty = content !== saved;
  const rootNodes = children(nodes, null);
  const fileCount = nodes.filter(n => n.type === "file").length;
  const folderCount = nodes.filter(n => n.type === "folder").length;

  return (
    <div className="bg-[#111] text-white min-h-screen flex flex-col" style={{ height: "100svh" }}>

      {/* ── Top bar ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 border-b border-white/20 flex items-stretch bg-[#111] mt-14">

        {/* Title */}
        <div className="flex items-center gap-3 px-6 border-r border-white/20 shrink-0">
          <span className="text-[11px] uppercase tracking-widest font-bold">Notebook</span>
          <span className="text-[10px] text-gray-700 uppercase tracking-widest hidden sm:block">
            {fileCount} fichier{fileCount !== 1 ? "s" : ""} · {folderCount} dossier{folderCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center px-6 min-w-0 border-r border-white/20">
          {selectedNode
            ? <Breadcrumb id={selectedId} nodes={nodes} />
            : <span className="text-[11px] text-gray-700 uppercase tracking-widest">Aucun fichier sélectionné</span>
          }
          {isDirty && <span className="ml-3 w-1.5 h-1.5 rounded-full bg-white/40 shrink-0 animate-pulse" title="Sauvegarde en cours…" />}
        </div>

        {/* View mode */}
        <div className="flex items-stretch border-r border-white/20 shrink-0">
          {([
            { mode: "write"   as ViewMode, icon: <AlignLeft className="w-3.5 h-3.5" />,  title: "Éditeur" },
            { mode: "split"   as ViewMode, icon: <Columns2  className="w-3.5 h-3.5" />,  title: "Splitté" },
            { mode: "preview" as ViewMode, icon: <Eye       className="w-3.5 h-3.5" />,  title: "Aperçu"  },
          ]).map(({ mode, icon, title }) => (
            <button
              key={mode} title={title}
              onClick={() => setView(mode)}
              className={`px-4 flex items-center border-r last:border-r-0 border-white/10 transition-colors ${
                view === mode ? "text-white bg-white/8" : "text-gray-600 hover:text-white hover:bg-white/5"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-stretch shrink-0">
          {selectedNode && (
            <button
              onClick={handleCopy} disabled={!content}
              className="flex items-center gap-1.5 px-4 text-[10px] uppercase tracking-widest text-gray-600 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors border-r border-white/20"
            >
              {copied ? <><Check className="w-3 h-3" />Copié</> : <><Copy className="w-3 h-3" />Copier</>}
            </button>
          )}
          <Link href="/" className="flex items-center px-4 text-[10px] uppercase tracking-widest text-gray-700 hover:text-white hover:bg-white/5 transition-colors">
            ← Accueil
          </Link>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 border-r border-white/20 flex flex-col bg-[#0e0e0e] overflow-hidden">

          {/* Sidebar header */}
          <div className="flex items-center h-9 border-b border-white/10 shrink-0 px-3">
            <span className="flex-1 text-[10px] uppercase tracking-widest text-gray-700">Explorateur</span>
            <button title="Nouveau fichier" onClick={() => setCreating("file")} className="p-1.5 text-gray-700 hover:text-white hover:bg-white/5 rounded transition-colors">
              <FilePlus className="w-3 h-3" />
            </button>
            <button title="Nouveau dossier" onClick={() => setCreating("folder")} className="p-1.5 text-gray-700 hover:text-white hover:bg-white/5 rounded transition-colors">
              <FolderPlus className="w-3 h-3" />
            </button>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto py-1">
            {rootNodes.map(node => (
              <TreeItem
                key={node.id} node={node} nodes={nodes} depth={0}
                selectedId={selectedId} expanded={expanded}
                onSelect={handleSelect} onToggle={toggleExpand}
                onRefresh={() => loadTree(true)}
              />
            ))}

            {creating && (
              <div className="flex items-center gap-1.5 py-1 pr-2 mx-1 pl-2">
                <span className="w-4 shrink-0 flex items-center justify-center">
                  {creating === "folder" ? <Folder className="w-3 h-3 opacity-40" /> : <FileText className="w-3 h-3 opacity-40" />}
                </span>
                <InlineInput defaultValue="" onConfirm={handleCreateRoot} onCancel={() => setCreating(null)} />
                <button onClick={() => setCreating(null)} className="text-gray-600 hover:text-white"><X className="w-3 h-3" /></button>
              </div>
            )}

            {rootNodes.length === 0 && !creating && (
              <div className="px-4 py-8 text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-700 mb-3">Aucun fichier</p>
                <button onClick={() => setCreating("file")} className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-white border border-white/10 px-3 py-1.5 transition-colors">
                  + Créer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Editor / Preview ─────────────────────────────────────────────────── */}
        {selectedNode?.type === "file" ? (
          <div className="flex-1 flex overflow-hidden min-w-0">

            {/* Editor pane */}
            {(view === "write" || view === "split") && (
              <div className={`flex flex-col overflow-hidden ${view === "split" ? "w-1/2 border-r border-white/20" : "flex-1"}`}>
                <div className="shrink-0 h-8 border-b border-white/10 flex items-center px-6 gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-gray-700">Markdown</span>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={`# ${selectedNode.name}\n\nMarkdown + Mermaid supportés.\n\n\`\`\`mermaid\nflowchart LR\n  A --> B\n\`\`\``}
                  className="flex-1 w-full px-8 py-6 bg-transparent text-white/90 text-sm leading-7 resize-none outline-none placeholder:text-gray-800"
                  style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "13px" }}
                />
              </div>
            )}

            {/* Preview pane */}
            {(view === "preview" || view === "split") && (
              <div className={`flex flex-col overflow-hidden ${view === "split" ? "w-1/2" : "flex-1"}`}>
                <div className="shrink-0 h-8 border-b border-white/10 flex items-center px-6">
                  <span className="text-[10px] uppercase tracking-widest text-gray-700">Aperçu</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <NotePreview content={content} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#0d0d0d]">
            <div className="text-center space-y-4">
              <div className="text-5xl opacity-10">✦</div>
              <p className="text-[11px] uppercase tracking-widest text-gray-700">
                Sélectionnez un fichier
              </p>
              <button
                onClick={() => setCreating("file")}
                className="text-[11px] uppercase tracking-widest border border-white/10 px-5 py-2.5 text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
              >
                + Nouveau fichier
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
