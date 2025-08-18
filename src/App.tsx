
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Organizations from "./pages/Organizations";
import Settings from "./pages/Settings";
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
import Dashboard from "./pages/Dashboard";
import TeamMembers from "./pages/TeamMembers";
import Scratchpad from "./pages/Scratchpad";
import TesterZone from "./pages/TesterZone";
import TestRunDetail from "./pages/TestRunDetail";
import BugBoard from "./pages/BugBoard";
import BugDetail from "./pages/BugDetail";
import SalesMarketing from "./pages/SalesMarketing";
import NotFound from "./pages/NotFound";
import PrivateRoute from "@/components/route/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            <Route path="/" element={
              <Navigate to={"/index"} replace />
            } />
            <Route path="/index" element={<Index />} />
            <Route path="/org" element={<PrivateRoute><Organizations /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/team-members" element={<PrivateRoute><TeamMembers /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/tasks_catalog" element={<PrivateRoute><TasksCatalog /></PrivateRoute>} />
            <Route path="/tasks/:taskId" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
            <Route path="/meetings" element={<PrivateRoute><Meetings /></PrivateRoute>} />
            <Route path="/meetings/:id" element={<PrivateRoute><MeetingNotebook /></PrivateRoute>} />
            <Route path="/meetings/status-call/:id" element={<PrivateRoute><StatusCallMeeting /></PrivateRoute>} />
            <Route path="/meetings/retrospective/:id" element={<PrivateRoute><RetrospectiveMeeting /></PrivateRoute>} />
            <Route path="/meetings/knowshare/:id" element={<PrivateRoute><KnowshareMeeting /></PrivateRoute>} />
            <Route path="/meetings/product-call/:id" element={<PrivateRoute><ProductCallMeeting /></PrivateRoute>} />
            <Route path="/meetings/ad-hoc/:id" element={<PrivateRoute><AdHocMeeting /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/sales-marketing" element={<PrivateRoute><SalesMarketing /></PrivateRoute>} />
            <Route path="/tester-zone" element={<PrivateRoute><TesterZone /></PrivateRoute>} />
            <Route path="/tester-zone/runs/:id" element={<PrivateRoute><TestRunDetail /></PrivateRoute>} />
            <Route path="/tester-zone/runs/:id/bugs" element={<PrivateRoute><BugBoard /></PrivateRoute>} />
            <Route path="/tester-zone/runs/:id/bugs/:bugId" element={<PrivateRoute><BugDetail /></PrivateRoute>} />
            <Route path="/scratchpad" element={<PrivateRoute><Scratchpad /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
