# B9 Automation - Frontend

A modern, full-stack automation platform built with **Next.js 15** and **React 19** for the frontend, with a powerful **FastAPI** backend.

## 📋 Project Overview

**B9 Automation** is a comprehensive automation and workflow management system designed to streamline business processes. The frontend provides an intuitive UI for managing automation workflows, monitoring tasks, and visualizing data.

### Key Features
- 🎨 **Modern UI** built with React 19 and Tailwind CSS
- 🔄 **Real-time updates** using WebSockets
- 📊 **Advanced data visualization** with Recharts
- 🎬 **Smooth animations** with Framer Motion & GSAP
- 🔐 **Authentication** with NextAuth.js
- 🧠 **AI Integration** (Anthropic & Google Generative AI)
- 📱 **Responsive design** for all devices
- 🔗 **Node-based workflow builder** with React Flow
- 📈 **3D visualizations** with Three.js

---

## 🛠️ Tech Stack

### Frontend (This Repository)
- **Framework**: Next.js 15.5.18
- **UI Library**: React 19
- **Language**: TypeScript (97.4%)
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: Zustand
- **Data Fetching**: Axios, SWR, TanStack React Query
- **Animations**: Framer Motion, GSAP
- **3D Graphics**: Three.js, React Three Fiber
- **Flow Diagrams**: React Flow
- **Charts**: Recharts
- **Authentication**: NextAuth.js
- **Error Tracking**: Sentry
- **Testing**: Playwright
- **Development**: ESLint, TypeScript

### Backend Repository
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Auth**: JWT with Python-Jose
- **Cache**: Redis
- **Task Queue**: Celery
- **AI Services**: Anthropic, Google Generative AI
- **Payment**: Razorpay Integration
- **Real-time**: WebSockets

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dibyanshu122/B9-Automation--frontend.git
cd B9-Automation--frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development

Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application auto-updates as you edit files in `app/` directory.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 📁 Project Structure

```
B9-Automation--frontend/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Main page
│   └── ...                # Other routes
├── components/            # React components
├── public/                # Static assets
├── styles/                # Global styles & Tailwind config
├── lib/                   # Utility functions
├── types/                 # TypeScript definitions
├── hooks/                 # Custom React hooks
├── services/              # API services (Axios, SWR)
├── store/                 # Zustand state management
└── package.json           # Dependencies & scripts
```

---

## 🔌 Integration with Backend

The frontend communicates with the FastAPI backend for:
- User authentication & authorization
- Workflow management
- Task execution & monitoring
- AI-powered features
- Real-time notifications via WebSockets
- Data persistence & retrieval

### Backend Repository
**Repository**: [B9-Automation---backend](https://github.com/dibyanshu122/B9-Automation---backend)

---

## 🔑 Key Dependencies

### UI & Rendering
- **Next.js**: React framework with file-based routing
- **React**: Component library
- **Tailwind CSS**: Utility-first CSS framework

### Data & State
- **TanStack React Query**: Server state management
- **Zustand**: Client state management
- **SWR**: Data fetching with caching
- **Axios**: HTTP client

### Animations & Interactions
- **Framer Motion**: React animation library
- **GSAP**: Professional animation platform
- **React Flow**: Node-based UI components
- **Lenis**: Smooth scrolling

### Advanced Features
- **Three.js & React Three Fiber**: 3D graphics
- **Recharts**: React charting library
- **NextAuth.js**: Authentication
- **React Markdown**: Markdown rendering
- **Highlight.js**: Code syntax highlighting

### Utilities
- **react-hot-toast**: Toast notifications
- **clsx**: Classname utilities
- **tailwind-merge**: Merge Tailwind classes
- **XLSX**: Excel file handling

### Monitoring
- **Sentry**: Error tracking & monitoring

---

## 🔐 Authentication

The app uses **NextAuth.js** for authentication. Configure providers in the NextAuth configuration file.

---

## 🚀 Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will automatically detect Next.js and optimize settings
4. Set environment variables in Vercel dashboard
5. Deploy!

[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)

### Alternative Deployment
- Docker containerization
- AWS, DigitalOcean, Render, etc.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Support

For issues, questions, or suggestions, please:
- Create an issue on GitHub
- Check existing documentation
- Contact the development team

---

## 🔗 Related Repositories

- **Backend**: [B9-Automation---backend](https://github.com/dibyanshu122/B9-Automation---backend)
- **Documentation**: [Wiki & Docs](https://github.com/dibyanshu122/B9-Automation--frontend/wiki)

---

**Happy coding! 🚀**
