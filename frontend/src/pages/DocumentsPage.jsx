import React, { useState, useRef } from "react";
import { uploadDocument, ingestText } from "../utils/api.js";

function FileDropZone({ onSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef();

  const handle = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "md", "pdf"].includes(ext)) {
      setMessage({ type: "error", text: `Unsupported type: .${ext}. Use .txt, .md, or .pdf` });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadDocument(file);
      setMessage({ type: "success", text: `✓ "${res.filename}" ingested — ${res.chunks} chunks added` });
      onSuccess?.();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input ref={inputRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={(e) => handle(e.target.files[0])} />
        <div className="text-3xl mb-3 opacity-40">{uploading ? "⟳" : "◈"}</div>
        <p className="font-display font-semibold text-text-primary mb-1">
          {uploading ? "Ingesting..." : "Drop file here"}
        </p>
        <p className="font-mono text-xs text-text-dim">
          .txt · .md · .pdf · Max 10MB
        </p>
      </div>
      {message && (
        <div className={`mt-3 p-3 rounded-lg font-mono text-xs ${
          message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function TextIngestForm() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handle = async () => {
    if (text.trim().length < 20) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await ingestText(text.trim(), source || "manual-input");
      setMessage({ type: "success", text: `✓ Text ingested — ${res.chunks} chunks added to FAISS` });
      setText("");
      setSource("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="Source name (optional)"
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent/60 transition-colors"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to add to the knowledge base..."
        rows={6}
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent/60 transition-colors resize-none"
      />
      <div className="flex items-center justify-between">
        <button onClick={handle} disabled={text.trim().length < 20 || loading} className="btn-primary text-sm">
          {loading ? "Ingesting..." : "Add to Knowledge Base"}
        </button>
        <span className="font-mono text-xs text-text-dim">{text.length} chars</span>
      </div>
      {message && (
        <div className={`p-3 rounded-lg font-mono text-xs ${
          message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary mb-1">Knowledge Base</h2>
        <p className="font-body text-text-secondary text-sm">
          Upload documents to your FAISS vector store. All ingested content becomes searchable by the Retriever agent.
        </p>
      </div>

      <div className="glass-panel p-6">
        <p className="font-mono text-xs text-text-dim mb-4">UPLOAD FILE</p>
        <FileDropZone />
      </div>

      <div className="glass-panel p-6">
        <p className="font-mono text-xs text-text-dim mb-4">PASTE TEXT</p>
        <TextIngestForm />
      </div>

      <div className="glass-panel p-5">
        <p className="font-mono text-xs text-text-dim mb-3">PIPELINE INFO</p>
        <div className="space-y-2">
          {[
            ["Embeddings", "HuggingFace · all-MiniLM-L6-v2 (384d)"],
            ["Chunking", "RecursiveCharacterTextSplitter · 1000 / 200 overlap"],
            ["Index", "FAISS · L2 distance · persisted to disk"],
            ["Retrieval", "Top-K similarity search per sub-query"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs gap-4">
              <span className="font-mono text-text-dim flex-shrink-0">{k}</span>
              <span className="font-mono text-text-secondary text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
