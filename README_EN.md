# StudyCoach - AI Learning Assistant

[English](./README_EN.md) | [中文](./README.md)

<div align="center">

![StudyCoach Logo](https://img.shields.io/badge/StudyCoach-AI%20Learning%20Assistant-blue?style=for-the-badge)

A full-stack AI learning assistant built on large language models, integrating knowledge-base retrieval, document processing, AI chat, and voice interaction.

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.3.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26.2-0170FE?style=flat-square&logo=ant-design)](https://ant.design/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

## 🚀 Features

### 🤖 AI Chat ✅

- Multi-model support: OpenAI GPT series and DeepSeek V3
- Streaming responses: real-time conversation via SSE
- Session management: multiple sessions stored locally with full history
- Connection stability: tuned HTTP client timeouts and retry strategy

### 📚 Knowledge Retrieval ✅

- Document parsing: PDF, HTML, and more
- Vector search: semantic search powered by Elasticsearch
- RAG enhancement: retrieval-augmented generation for better accuracy
- MinIO storage: object storage for documents
- Smart caching: layered caching for web content and search results

> RAG module references and leverages the excellent implementation from [wangle201210/go-rag](https://github.com/wangle201210/go-rag)

### 🔍 Intelligent Search ✅

- Web search: integrated DuckDuckGo
- Concurrent crawling: goroutine-based fetching of multiple URLs for efficiency

### 🎙️ Voice Interaction (New) ✅

- Text-to-Speech (TTS): integrated SiliconFlow API using `FunAudioLLM/CosyVoice2-0.5B` to synthesize natural speech with frontend playback
- Speech-to-Text (ASR): local SenseVoice (ROCm accelerated) for low-latency speech recognition, forming a closed-loop voice Q&A
- Frontend UX: VAD (Voice Activity Detection), request cancellation (AbortController), proper mic release and playback cleanup to reduce silent misrecognition and resource occupation

### 💾 Data Storage ✅

- PostgreSQL: core business data
- Redis: session and hot data cache
- MinIO: object storage (documents and media)
- Elasticsearch: full-text and vector search

### 🎨 Modern Frontend ✅

- Responsive design: desktop and mobile
- Component architecture: React 18 + TypeScript + Ant Design
- Routing & state: React Router + localStorage for session state
- SSE client: optimized event-stream client for real-time interaction
- Voice recording & playback: mic recording, AI narration, call overlay components

## 📁 Project Structure

```
studyCoach/
├── backend/                    # Go backend services
│   ├── api/                    # API definitions
│   │   ├── ai_chat/            # AI chat APIs
│   │   ├── chat_sessions/      # session management APIs
│   │   ├── check_jwt/          # JWT verification APIs
│   │   ├── login/              # login APIs
│   │   ├── rag/                # RAG retrieval APIs
│   │   └── voice/              # voice-related APIs (TTS/ASR) ✅
│   ├── internal/               # business logic internals
│   │   ├── controller/         # controller layer
│   │   ├── logic/              # service logic layer
│   │   └── service/            # service layer
│   ├── manifest/               # configs
│   └── main.go                 # entrypoint
├── general-template/           # React frontend app
│   ├── src/
│   │   ├── pages/
│   │   │   └── AiChat/         # AI chat page (with voice call) ✅
│   │   ├── utils/
│   │   │   └── sse/            # SSE client wrappers ✅
│   └── public/                 # static assets (WASM/ONNX etc.)
├── docker/                     # Docker configuration
│   ├── postgres/               # PostgreSQL configs
│   └── redis/                  # Redis configs
├── docker-compose.yml          # Docker Compose configurations
└── README.md                   # documentation
```

## 🛠️ Tech Stack

### Backend

- Go 1.24, GoFrame v2, Eino (multi-model integration)
- PostgreSQL, Redis, Elasticsearch, MinIO

### AI Stack

- Dialogue & generation: OpenAI GPT, DeepSeek V3, etc.
- RAG: Elasticsearch + document embeddings
- Streaming: SSE for low-latency output
- Voice:
  - TTS: `FunAudioLLM/CosyVoice2-0.5B` (SiliconFlow API)
  - ASR: SenseVoice (local, ROCm accelerated)
  - Frontend: VAD threshold tuning, request cancellation, resource release optimizations

### Frontend

- React 18, TypeScript, Vite, Ant Design
- React Router, SSE client, custom Hooks
- Voice components: mic record button, voice call overlay, audio playback cleanup

### Deployment

- Docker, Docker Compose
- Nginx (reverse proxy recommended for production)

## 🚀 Quick Start

### Local Development

1. Clone the repo

```bash
git clone <repository-url>
cd studyCoach
```

2. Configure environment variables (backend/frontend)

```bash
# Backend
cp backend/studyCoach/.env.example backend/studyCoach/.env
# Frontend
cp general-template/.env.example general-template/.env
```

3. Start backend service

```bash
cd backend
go run main.go
```

4. Start frontend service

```bash
cd general-template
npm install
npm run dev
```

> Voice features: backend integrates TTS (SiliconFlow API) and local ASR (SenseVoice); frontend includes recording and playback components for voice narration and calls.

### Docker Deployment

Full Docker deployment is provided:

```bash
docker-compose up -d
```

Visit: `http://localhost`

## 🔧 Performance Tuning

- Frontend API timeout: 60s
- Rerank service timeout: 30s
- Model generation timeout: 30s
- Web search timeout: 30s
- Content fetching timeout: 30s

Relevant files:
- Frontend timeout: `general-template/src/utils/axios/config.ts`
- Backend timeouts: `studyCoach/rerank/rerank.go`, `studyCoach/api/retriever.go`
- Others: `studyCoach/api/openai.go`, `studyCoach/configTool/maincontent.go`

## 🔍 Troubleshooting

- Empty retrieval or timeout: check frontend/backend timeouts and Elasticsearch status
- SSE disconnects: verify backend HTTP timeouts and proxy configuration
- DB connectivity: confirm environment variables and container networking
- API payload format: ensure empty arrays return as `[]` and structure matches frontend
- Voice: if mic is occupied or playback not stopped, ensure request cancellation and resource release (VAD pause/destroy, MediaStream track stop) are enabled in frontend

---

## 📄 License

MIT License

## 🤝 Contribution

Contributions, issues, and feature requests are welcome!