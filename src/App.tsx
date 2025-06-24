
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import TasksCatalog from "./pages/TasksCatalog";
import TaskDetail from "./pages/TaskDetail";
import Meetings from "./pages/Meetings";
import MeetingNotebook from "./pages/MeetingNotebook";
import StatusCallMeeting from "./pages/StatusCallMeeting";
import RetrospectiveMeeting from "./pages/RetrospectiveMeeting";
import KnowshareMeeting from "./pages/KnowshareMeeting";
import ProductCallMeeting from "./pages/ProductCallMeeting";
import AdHocMeeting from "./pages/AdHocMeeting";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Reports from "./pages/Reports";
import Scratchpad from "./pages/Scratchpad";
import TesterZone from "./pages/TesterZone";
import TestRunDetail from "./pages/TestRunDetail";
import BugBoard from "./pages/BugBoard";
import BugDetail from "./pages/BugDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tasks_catalog" element={<TasksCatalog />} />
            <Route path="/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/meetings/:id" element={<MeetingNotebook />} />
            <Route path="/meetings/status-call/:id" element={<StatusCallMeeting />} />
            <Route path="/meetings/retrospective/:id" element={<RetrospectiveMeeting />} />
            <Route path="/meetings/knowshare/:id" element={<KnowshareMeeting />} />
            <Route path="/meetings/product-call/:id" element={<ProductCallMeeting />} />
            <Route path="/meetings/ad-hoc/:id" element={<AdHocMeeting />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/tester-zone" element={<TesterZone />} />
            <Route path="/tester-zone/runs/:id" element={<TestRunDetail />} />
            <Route path="/tester-zone/runs/:id/bugs" element={<BugBoard />} />
            <Route path="/tester-zone/runs/:id/bugs/:bugId" element={<BugDetail />} />
            <Route path="/scratchpad" element={<Scratchpad />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
