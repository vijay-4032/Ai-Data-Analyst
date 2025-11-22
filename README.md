# 🧠 AI Analyst

> AI-powered data analytics dashboard. Upload your data, get instant insights.

![AI Analyst Dashboard](docs/preview.png)

## ✨ Features

- **📤 Smart Upload** - Drag & drop CSV/Excel files with auto-detection
- **📊 Auto Visualizations** - AI recommends the best charts for your data
- **💡 AI Insights** - Automatically discover trends, anomalies & patterns
- **💬 Chat Interface** - Ask questions about your data in natural language
- **🌙 Dark Mode** - Beautiful dark/light theme support
- **📱 Responsive** - Works on desktop, tablet & mobile

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful charts
- **Zustand** - State management
- **Lucide Icons** - Icon library

### Backend
- **FastAPI** - Modern Python API framework
- **Pandas** - Data processing
- **OpenAI / Claude** - AI-powered insights
- **PostgreSQL** - Database
- **Redis** - Caching

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/ai-analyst.git
cd ai-analyst

# Copy environment files
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env

# Add your API keys to backend/.env
# OPENAI_API_KEY=sk-...

# Start all services
docker-compose up -d

# Open http://localhost:3000
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env and add your API keys

# Run server
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
ai-analyst/
├── frontend/                 # Next.js frontend
│   ├── app/                  # Pages & API routes
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components
│   │   ├── layout/          # Layout components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── charts/          # Chart components
│   │   ├── upload/          # Upload components
│   │   └── chat/            # Chat components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── lib/                 # Utilities
│   └── types/               # TypeScript types
│
├── backend/                  # FastAPI backend
│   └── app/
│       ├── api/v1/          # API endpoints
│       ├── services/        # Business logic
│       ├── models/          # Pydantic schemas
│       ├── core/            # Core utilities
│       └── db/              # Database layer
│
├── docker-compose.yml       # Docker configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (`backend/.env`):**
```env
# Required
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/ai_analyst

# AI (at least one required for AI features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
REDIS_URL=redis://localhost:6379/0
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Upload CSV/Excel file |
| GET | `/api/v1/upload/{id}` | Get upload status |
| POST | `/api/v1/analysis/{dataset_id}` | Start analysis |
| GET | `/api/v1/analysis/{id}` | Get analysis results |
| POST | `/api/v1/chat` | Send chat message |

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel
```

### Railway / Render (Backend)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy!

### Docker Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 💬 Support

- 📧 Email: support@ai-analyst.app
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/ai-analyst/issues)
- 💡 Discussions: [GitHub Discussions](https://github.com/your-username/ai-analyst/discussions)

---

Built with ❤️ using Next.js and FastAPI