<div align="center">

# ✨ JARVIS - AI Task Manager Agent

### *Your Intelligent Personal Assistant for Seamless Task Management*

[![Next. js](https://img.shields.io/badge/Next.js-16.1.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![LangChain](https://img.shields.io/badge/LangChain-AI-FF6B6B?style=for-the-badge)](https://langchain.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge)](LICENSE)

[🚀 Live Demo](https://yugii.me) • [📖 Documentation](#documentation) • [🐛 Report Bug](https://github.com/yugan243/AI-Task-Manager-Agent/issues) • [💡 Request Feature](https://github.com/yugan243/AI-Task-Manager-Agent/issues)


</div>

---

## 🌟 Overview

**JARVIS** is a next-generation AI-powered task management system that understands natural language, adapts to your workflow, and autonomously manages your to-do list. Built with cutting-edge technologies like **LangChain**, **Google Gemini AI**, and **LangGraph**, JARVIS doesn't just store tasks—it *thinks* about them.  

### 💎 What Makes JARVIS Different?  

- **🧠 True AI Understanding**: No rigid commands—just talk naturally
- **🔄 Autonomous Decision Making**: Uses LangGraph for intelligent task routing
- **🌐 Real-Time Internet Access**: Checks weather, news, and facts before adding tasks
- **🎯 Zero-Friction UX**: Never ask users for task IDs—JARVIS finds them automatically
- **🎨 VisionOS-Inspired Design**: Glassmorphic UI with smooth animations
- **💬 Conversational Memory**: Remembers context across your entire session

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Natural Language Processing** | "Add buy milk if it rains tomorrow" → JARVIS checks weather, then decides |
| **Smart Task Matching** | "Mark the gym task done" → No ID needed, JARVIS finds it by name |
| **Conditional Logic** | Supports "if-then" statements with real-world data validation |
| **Session Persistence** | Full chat history stored with sliding window optimization |
| **Real-Time Search** | Integrated Google search for weather, stocks, news |
| **Multi-Tool Orchestration** | Chains multiple tools (search → analyze → add task) automatically |
| **Glassmorphic UI** | Modern, translucent design inspired by Apple's VisionOS |
| **OAuth Authentication** | Secure login via Supabase Auth |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Interface│  │ Task Sidebar │  │  Auth Flow   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────���─────────────┬──────────────────────────────────┘
                           │ Axios HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express. js)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              LangGraph Agent Workflow                 │   │
│  │   ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐     │   │
│  │   │Agent │───▶│Tools │───▶│Logic │───▶│ End  │     │   │
│  │   │ Node │    │ Node │    │ Gate ��    │State │     │   │
│  │   └──────┘    └──────┘    └──────┘    └──────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Task Tools  │  │ Search Tool  │  │  Chat Model  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)                    │
│     ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│     │  Tasks  │    │Messages │    │Sessions │              │
│     └─────────┘    └─────────┘    └─────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Supabase Account** ([Sign up free](https://supabase.com))
- **Google AI API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Serper API Key** ([For search](https://serper.dev))

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yugan243/AI-Task-Manager-Agent. git
cd AI-Task-Manager-Agent
```

#### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Google AI
GOOGLE_API_KEY=your_google_gemini_api_key

# Search (Serper)
SERPER_API_KEY=your_serper_api_key

# Server
PORT=10000
```

#### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:10000
```

#### 4️⃣ Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth. users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions Table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_messages_session ON messages(session_id);
```

#### 5️⃣ Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 💬 Usage Examples

### Basic Task Management

```
You: "Add buy groceries to my list"
JARVIS: ✅ Task added:  "Buy groceries"

You: "What do I need to do today?"
JARVIS: You have 3 pending tasks:  
        1. Buy groceries
        2. Call dentist
        3. Finish report

You: "Mark the groceries task as done"
JARVIS: ✅ Task completed: "Buy groceries"
```

### Smart Conditional Tasks

```
You: "If it rains tomorrow in New York, add umbrella to my shopping list"
JARVIS: 🌐 *Checking weather.. .*
        Weather forecast shows rain tomorrow.  
        ✅ Task added: "Buy umbrella" (Due: Tomorrow)
```

### Real-Time Information

```
You: "What's the weather like in Tokyo?"
JARVIS: 🌐 *Searching.. .*
        Current weather in Tokyo:  Sunny, 22°C
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.3 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: TailwindCSS 4.0
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Auth**: Supabase Auth

### Backend
- **Runtime**: Node.js with Express 5.2.1
- **AI Framework**: LangChain 1.2.7
- **Agent Orchestration**: LangGraph 1.1.0
- **LLM**: Google Gemini 2.5 Flash Lite
- **Database Client**: Supabase JS SDK
- **Search**: Serper API (Google Search)
- **Testing**: Jest + Supertest

### Infrastructure
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (OAuth)
- **Hosting**: Render (Backend) + Vercel (Frontend)

---

## 📂 Project Structure

```
AI-Task-Manager-Agent/
├── backend/
│   ├── config/
│   │   └── supabaseClient.js      # Database connection
│   ├── controllers/
│   │   └── chatController.js      # Request handlers
│   ├── models/
│   │   └── chatModel.js           # Database queries
│   ├── tools/
│   │   ├── chatbot.js             # LangGraph agent
│   │   ├── taskTools.js           # CRUD operations
│   │   └── searchTool.js          # Internet search
│   ├── tests/
│   │   └── chatbot.test.js        # Unit tests
│   ├── server. js                  # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js            # Main chat interface
│   │   │   ├── layout.js          # Root layout
│   │   │   ├── globals.css        # Global styles
│   │   │   └── auth/
│   │   │       └── callback/      # OAuth handler
│   │   ├── components/
│   │   │   └── TaskSidebar.js     # Task list component
│   │   └── lib/
│   │       └── supabaseClient.js  # Supabase config
│   └── package.json
│
└── README.md
```

---

## 🧪 Testing

```bash
cd backend
npm test
```

**Test Coverage:**
- ✅ Basic conversation handling
- ✅ Task addition with natural language
- ✅ Multi-task parsing
- ✅ Internet search integration
- ✅ Conditional logic execution

---

## 🚢 Deployment

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `npm start`
5. Add environment variables from `.env`
6. Deploy! 🚀

### Frontend (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod` in the `frontend/` directory
3. Add environment variables in Vercel dashboard
4. Done! ✨

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **LangChain** for the incredible AI framework
- **Google** for Gemini AI API
- **Supabase** for the backend infrastructure
- **Vercel** for Next.js and hosting
- **Serper** for search API

---

<div align="center">

### Made by [yugan243](https://github.com/yugan243)

⭐ **Star this repo** if you find it helpful! 

[⬆ Back to Top](#-jarvis---ai-task-manager-agent)

</div>
