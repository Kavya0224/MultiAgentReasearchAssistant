# ResearchOS — Multi-Agent Research Assistant

A stateful multi-agent research system built with **LangGraph JS**, **LangChain JS**, **Groq API**, and **FAISS** vector store. Four specialized agents coordinate through a shared-state graph to decompose, retrieve, summarize, and validate research queries with automatic hallucination detection and re-retrieval.

---

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                   LangGraph State Graph                  │
│                                                          │
│  ┌──────────┐    ┌───────────┐    ┌──────────────┐      │
│  │ Planner  │───▶│ Retriever │───▶│  Summarizer  │      │
│  │  Agent   │    │  Agent    │    │    Agent     │      │
│  └──────────┘    └───────────┘    └──────┬───────┘      │
│      │                ▲                  │               │
│      │    re-retrieve │                  ▼               │
│      │           ┌────┴──────────────────────┐           │
│      │           │      Validator Agent       │           │
│      └──────────▶│  Hallucination Detection   │           │
│                  └───────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                   Final Response
```

### Agents

| Agent | Role | LLM |
|---|---|---|
| **Planner** | Decomposes query into sub-queries & keywords | Groq llama-3.3-70b |
| **Retriever** | Semantic FAISS search across all sub-queries | FAISS + HF Embeddings |
| **Summarizer** | Synthesizes chunks into structured answer | Groq llama-3.3-70b |
| **Validator** | Fact-checks against source chunks, triggers re-retrieval if hallucinated | Groq llama-3.3-70b |

---

## Tech Stack

- **Orchestration**: LangGraph JS (stateful agent graph)
- **LLM**: Groq API (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`)
- **Embeddings**: HuggingFace Transformers (`all-MiniLM-L6-v2`)
- **Vector Store**: FAISS (`faiss-node`) — persisted to disk
- **RAG**: LangChain JS (splitters, prompts, chains)
- **Backend**: Node.js + Express.js (SSE streaming)
- **Frontend**: React + Zustand + Tailwind CSS + Vite

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- A [Groq API key](https://console.groq.com)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd multi-agent-research-assistant
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your GROQ_API_KEY
```

### 3. Run Development Servers

```bash
npm run dev
```

This starts:
- Backend API at `http://localhost:3001`
- Frontend at `http://localhost:5173`

### 4. (Optional) Ingest Documents

```bash
cd backend
npm run ingest path/to/your/document.pdf
npm run ingest path/to/notes.txt
```

---

## API Endpoints

### Research
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/research` | Start a research job |
| `GET` | `/api/research/:jobId` | Poll job status |
| `GET` | `/api/research/:jobId/stream` | SSE live stream |
| `GET` | `/api/research` | List recent jobs |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload file (.txt, .md, .pdf) |
| `POST` | `/api/documents/text` | Ingest raw text |

### Status
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Service health |

---

## Project Structure

```
multi-agent-research/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── planner.js       # Planner Agent
│   │   │   ├── retriever.js     # Retriever Agent
│   │   │   ├── summarizer.js    # Summarizer Agent
│   │   │   └── validator.js     # Validator Agent
│   │   ├── graph/
│   │   │   └── researchGraph.js # LangGraph state graph
│   │   ├── rag/
│   │   │   ├── vectorStore.js   # FAISS store manager
│   │   │   └── ingest.js        # CLI ingestion script
│   │   ├── routes/
│   │   │   ├── research.js      # Research routes + SSE
│   │   │   ├── documents.js     # Document upload routes
│   │   │   └── status.js        # Health check
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   └── llm.js           # Groq LLM configuration
│   │   ├── utils/
│   │   │   └── logger.js        # Winston logger
│   │   └── index.js             # Express server entry
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Navigation shell
│   │   │   ├── QueryInput.jsx   # Query form + SSE client
│   │   │   ├── AgentGraph.jsx   # Live agent pipeline viz
│   │   │   └── ResearchResult.jsx # Tabbed results view
│   │   ├── pages/
│   │   │   ├── ResearchPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   ├── store/
│   │   │   └── researchStore.js # Zustand state
│   │   ├── utils/
│   │   │   └── api.js           # API + SSE client
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
├── package.json                 # Monorepo root
└── README.md
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | **Required**. Your Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Primary LLM model |
| `PORT` | `3001` | Backend server port |
| `FAISS_INDEX_PATH` | `./data/faiss_index` | FAISS persistence path |
| `CHUNK_SIZE` | `1000` | Text chunk size (tokens) |
| `CHUNK_OVERLAP` | `200` | Chunk overlap |
| `TOP_K_RESULTS` | `5` | Chunks per sub-query |
| `VALIDATOR_THRESHOLD` | `0.75` | Min confidence score |
| `MAX_ITERATIONS` | `5` | Max re-retrieval loops |
| `ENABLE_RE_RETRIEVAL` | `true` | Toggle re-retrieval |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

---

## License

MIT
