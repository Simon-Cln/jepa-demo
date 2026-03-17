import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ── Storage ────────────────────────────────────────────────────────────────────
// All notes are stored in  <project-root>/notes-data/
//   _index.json          → tree structure (flat array of nodes)
//   <uuid>.md            → file contents

const DATA_DIR  = path.join(process.cwd(), "notes-data");
const INDEX_FILE = path.join(DATA_DIR, "_index.json");

export interface TreeNode {
  id:        string;
  name:      string;
  type:      "file" | "folder";
  parentId:  string | null;
  createdAt: number;
  updatedAt: number;
}

interface Index {
  nodes:     TreeNode[];
  updatedAt: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readIndex(): Index {
  ensureDir();
  if (!fs.existsSync(INDEX_FILE)) return { nodes: [], updatedAt: Date.now() };
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8")) as Index;
}

function writeIndex(index: Index) {
  index.updatedAt = Date.now();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), "utf-8");
}

function contentPath(id: string) {
  return path.join(DATA_DIR, `${id}.md`);
}

function collectDescendants(nodes: TreeNode[], id: string): string[] {
  const result: string[] = [];
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    result.push(cur);
    nodes.filter(n => n.parentId === cur).forEach(n => queue.push(n.id));
  }
  return result;
}

// ── GET ────────────────────────────────────────────────────────────────────────
// GET /api/notes            → { nodes, updatedAt }
// GET /api/notes?id=<uuid>  → { content: string }

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");

  if (id) {
    const p = contentPath(id);
    const content = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
    return NextResponse.json({ content });
  }

  return NextResponse.json(readIndex());
}

// ── POST ───────────────────────────────────────────────────────────────────────
// Body: { action, ...payload }

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action:   "create" | "rename" | "save" | "delete" | "move";
    type?:    "file" | "folder";
    name?:    string;
    parentId?: string | null;
    id?:      string;
    content?: string;
    newParentId?: string | null;
  };

  const index = readIndex();

  // ── create ──────────────────────────────────────────────────────────────────
  if (body.action === "create") {
    const node: TreeNode = {
      id:        randomUUID(),
      name:      body.name ?? "Sans titre",
      type:      body.type ?? "file",
      parentId:  body.parentId ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    index.nodes.push(node);
    if (node.type === "file") fs.writeFileSync(contentPath(node.id), "", "utf-8");
    writeIndex(index);
    return NextResponse.json(node);
  }

  // ── rename ──────────────────────────────────────────────────────────────────
  if (body.action === "rename" && body.id) {
    const node = index.nodes.find(n => n.id === body.id);
    if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
    node.name      = body.name ?? node.name;
    node.updatedAt = Date.now();
    writeIndex(index);
    return NextResponse.json(node);
  }

  // ── save content ────────────────────────────────────────────────────────────
  if (body.action === "save" && body.id) {
    const node = index.nodes.find(n => n.id === body.id && n.type === "file");
    if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
    fs.writeFileSync(contentPath(body.id), body.content ?? "", "utf-8");
    node.updatedAt = Date.now();
    writeIndex(index);
    return NextResponse.json({ ok: true });
  }

  // ── move ────────────────────────────────────────────────────────────────────
  if (body.action === "move" && body.id) {
    const node = index.nodes.find(n => n.id === body.id);
    if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
    node.parentId  = body.newParentId ?? null;
    node.updatedAt = Date.now();
    writeIndex(index);
    return NextResponse.json(node);
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  if (body.action === "delete" && body.id) {
    const toDelete = collectDescendants(index.nodes, body.id);
    for (const delId of toDelete) {
      const p = contentPath(delId);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    index.nodes = index.nodes.filter(n => !toDelete.includes(n.id));
    writeIndex(index);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
