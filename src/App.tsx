
import PrivateRoute from "@/components/route/PrivateRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ResetPassword from "./components/auth/ResetPassword";
import AdHocMeeting from "./pages/AdHocMeeting";
import BugBoard from "./pages/BugBoard";
import BugDetail from "./pages/BugDetail";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import KnowshareMeeting from "./pages/KnowshareMeeting";
import MeetingNotebook from "./pages/MeetingNotebook";
import Meetings from "./pages/Meetings";
import NotFound from "./pages/NotFound";
import Organizations from "./pages/Organizations";
import ProductCallMeeting from "./pages/ProductCallMeeting";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import RetrospectiveMeeting from "./pages/RetrospectiveMeeting";
import SalesMarketing from "./pages/SalesMarketing";
import Privacy from "./pages/Privacy.tsx";
import Docs from "./pages/Docs";
import Scratchpad from "./pages/Scratchpad";
import Settings from "./pages/Settings";
import StatusCallMeeting from "./pages/StatusCallMeeting";
import TaskDetail from "./pages/TaskDetail";
import TasksCatalog from "./pages/TasksCatalog";
import TeamMembers from "./pages/TeamMembers";
import TesterZone from "./pages/TesterZone";
import TestRunDetail from "./pages/TestRunDetail";
import UserProfile from "./pages/UserProfile";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/org" element={<PrivateRoute><Organizations /></PrivateRoute>} />
            <Route path="/user-profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute checkOrg><Dashboard /></PrivateRoute>} />
            <Route path="/team-members" element={<PrivateRoute checkOrg><TeamMembers /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute checkOrg><Settings /></PrivateRoute>} />            
            <Route path="/tasks_catalog" element={<PrivateRoute checkOrg><TasksCatalog /></PrivateRoute>} />
            <Route path="/tasks_catalog/:projectId" element={<PrivateRoute checkOrg><TasksCatalog /></PrivateRoute>} />
            <Route path="/tasks/:taskId" element={<PrivateRoute checkOrg><TaskDetail /></PrivateRoute>} />
            <Route path="/meetings" element={<PrivateRoute checkOrg><Meetings /></PrivateRoute>} />
            <Route path="/meetings/:id" element={<PrivateRoute checkOrg><MeetingNotebook /></PrivateRoute>} />
            <Route path="/meetings/status-call/:id" element={<PrivateRoute checkOrg><StatusCallMeeting /></PrivateRoute>} />
            <Route path="/meetings/retrospective/:id" element={<PrivateRoute checkOrg><RetrospectiveMeeting /></PrivateRoute>} />
            <Route path="/meetings/knowshare/:id" element={<PrivateRoute checkOrg><KnowshareMeeting /></PrivateRoute>} />
            <Route path="/meetings/product-call/:id" element={<PrivateRoute checkOrg><ProductCallMeeting /></PrivateRoute>} />
            <Route path="/meetings/ad-hoc/:id" element={<PrivateRoute checkOrg><AdHocMeeting /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute checkOrg><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute checkOrg><ProjectDetail /></PrivateRoute>} />
            <Route path="/sales-marketing" element={<PrivateRoute checkOrg><SalesMarketing /></PrivateRoute>} />
            <Route path="/tester-zone" element={<PrivateRoute checkOrg><TesterZone /></PrivateRoute>} />
            <Route path="/tester-zone/:projectId" element={<PrivateRoute checkOrg><TesterZone /></PrivateRoute>} />
            <Route path="/tester-zone/runs/:id" element={<PrivateRoute checkOrg><BugBoard /></PrivateRoute>} />
            <Route path="/tester-zone/runs/:id/bugs" element={<PrivateRoute checkOrg><BugBoard /></PrivateRoute>} />
            <Route path="/tester-zone/runs/:id/bugs/:bugId" element={<PrivateRoute checkOrg><BugDetail /></PrivateRoute>} />
            <Route path="/scratchpad" element={<PrivateRoute checkOrg><Scratchpad /></PrivateRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
