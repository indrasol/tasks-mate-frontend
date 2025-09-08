import { Link } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";

const sections = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    img: "/dashboard_.png",
    content: `Get an at-a-glance view of everything that counts. Instantly surface unified insights — project velocity, task progress, member workload, and management KPIs — all in one intuitive dashboard.`
  },
  {
    id: "projects",
    title: "Projects",
    img: "/projects_.png",
    content: `Create projects in seconds, organise them and set clear objectives. Projects act as containers for tasks, resources, and team members.`
  },
  {
    id: "tasks",
    title: "Tasks",
    img: "/tasks_catalog.png",
    content: `Break work into bite-sized tasks. Assign owners, due dates, and track rich status history. Use filters, tags, and dependencies to keep things tidy.`
  },
  {
    id: "bugs",
    title: "Bug Tracker",
    img: "/bug_tracker_.png",
    content: `Create project-specific bug trackers to organize and prioritize issues efficiently. Track conversion rates from reported to resolved, with intuitive evidence galleries and reproduction steps that accelerate fix times and boost team productivity.`
  },
  {
    id: "bug-board",
    title: "Bug Board",
    img: "/bugs_.png",
    content: `Interactive board view for bugs with rich evidence galleries and detailed reproduction steps. Add comments for collaborative debugging, directly convert bugs to actionable tasks, and track resolution workflows seamlessly across your project teams.`
  },
  {
    id: "scratchpad",
    title: "Scratchpad",
    img: "/scratchpad_.png",
    content: `Need to jot down an idea during a meeting? The scratchpad is your lightweight, always-on notepad. Convert rough notes into tasks with one click.`
  }
];

const Docs = () => (
  <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 py-16">
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link to="/index" className="flex items-center text-tasksmate-green-end hover:underline">
          <ChevronLeft className="h-5 w-5" /> Home
        </Link>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-sora font-bold text-3xl">TasksMate Docs</h1>
        </div>
      </header>

      {/* Table of contents */}
      <nav className="bg-white/50 backdrop-blur-md rounded-tasksmate p-4 shadow-tasksmate sticky top-4 z-10 overflow-x-auto">
        <ul className="flex flex-wrap gap-4 text-sm font-medium">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-gray-600 hover:text-tasksmate-green-end transition-colors">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      {sections.map((s, idx) => (
        <section id={s.id} key={s.id} className="grid md:grid-cols-2 gap-10 items-center scroll-mt-20">
          <div className={`space-y-4 ${idx % 2 === 0 ? "order-2 md:order-1" : ""}`}>
            <h2 className="font-sora font-bold text-2xl text-tasksmate-green-end">{s.title}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{s.content}</p>
          </div>
          <img src={s.img} alt={s.title} className="w-full h-auto object-cover rounded-tasksmate shadow-tasksmate order-1 md:order-2" style={{maxHeight: "600px"}} />
        </section>
      ))}

      <footer className="text-center pt-10 text-gray-500 text-sm">
        © {new Date().getFullYear()} TasksMate — All rights reserved.
      </footer>
    </div>
  </div>
);

export default Docs;
