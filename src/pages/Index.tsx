import { SignInModal } from "@/components/auth/SignInModal";
import { SignUpModal } from "@/components/auth/SignUpModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Check, FileText, MessageCircle, Zap, KanbanSquare, LayoutDashboard, Rocket, Sparkles, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Index = () => {
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const { user } = useAuth();

  const navigate = useNavigate();


  useEffect(() => {
    if (user) {
      navigate("/org");
    }
  }, [user]);

  const features = [
    {
      icon: <LayoutDashboard className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Unified metrics dashboard",
      description: "All your project, task & bug metrics in one powerful view — plus a scratchpad for quick notes.",
      badge: "Insights"
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Comment & collaborate",
      description: "Keep everyone in sync with threaded discussions",
      avatars: true
    },
    {
      icon: <KanbanSquare className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Projects, tasks & bugs united",
      description: "Seamlessly manage your projects, tasks, and bug tracker in a single workspace",
      badge: "Suite",
      integrations: false
    }
  ];

  const testimonials = [
    {
      quote: "TasksMate transformed how our team handles projects. The AI summaries are incredible!",
      author: "Sarah K.",
      emoji: "👩‍💻"
    },
    {
      quote: "Finally, a task manager that doesn't get in the way. Love the clean interface.",
      author: "Mike R.",
      emoji: "🚀"
    },
    {
      quote: "The Slack integration saves us hours every week. Highly recommended!",
      author: "Alex M.",
      emoji: "⚡"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-sora font-bold text-xl">TasksMate</span>
              <a
                href="https://indrasol.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                by Indrasol
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <Link to="/tasks_catalog" className="text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            )}
            <Link to="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="font-sora font-bold text-5xl lg:text-6xl leading-tight">
                  Tame your tasks with{" "}
                  <span className="bg-tasksmate-gradient bg-clip-text text-transparent">
                    TasksMate
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  A simple, intuitive companion that keeps every project ticking
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-tasksmate-gradient hover:scale-105 transition-transform duration-200 shadow-tasksmate"
                  onClick={() => setSignUpOpen(true)}
                >
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="micro-lift"
                  onClick={() => setSignInOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Your Sidekick for Every Tick ✓
              </div>
            </div>

            {/* Right Column - Mock Browser */}
            <div className="relative">
              <div className="glass rounded-tasksmate shadow-tasksmate-hover p-4 space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white/50 rounded-md px-3 py-1 text-xs text-gray-500">
                    tasksmate.app/tasks_catalog
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/60 rounded-xl p-3 space-y-2 micro-lift">
                      <div className="h-2 bg-tasksmate-gradient rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex justify-between items-center">
                        <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-24 overflow-hidden">
        {/* decorative blurred blob */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-tasksmate-gradient opacity-5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tasksmate-gradient opacity-5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sora font-bold text-3xl mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-gray-600 text-lg">
              Powerful features that make task management effortless
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass border-0 shadow-tasksmate micro-lift">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    {feature.icon}
                    {feature.badge && (
                      <Badge className="bg-tasksmate-gradient text-white border-0">
                        {feature.badge}
                      </Badge>
                    )}
                    {feature.avatars && (
                      <div className="flex -space-x-2">
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs">S</AvatarFallback>
                        </Avatar>
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs">M</AvatarFallback>
                        </Avatar>
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs">A</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    {feature.integrations && (
                      <div className="flex space-x-1">
                        <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-sora font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why TasksMate Section */}
      <section className="relative px-6 py-24 bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden">
        {/* Decorative blurred blobs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-tasksmate-gradient opacity-5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tasksmate-gradient opacity-5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-14">
          <div className="space-y-6">
            <h2 className="font-sora font-bold text-4xl md:text-5xl leading-tight">
              Why <span className="bg-tasksmate-gradient bg-clip-text text-transparent">TasksMate?</span>
            </h2>
            <p className="text-gray-700 text-lg max-w-3xl mx-auto">
              Turn chaos into clarity. Empower your team with a unified workspace that keeps projects moving, ideas flowing, and bugs squashed — all in record time
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-left">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Rocket className="h-6 w-6 text-tasksmate-green-end" />
                <h3 className="font-semibold">Launch faster</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Streamlined workflows help you deliver features and fixes quicker.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6 text-tasksmate-green-end" />
                <h3 className="font-semibold">Stay laser-focused</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Smart filters spotlight your top priorities, ensuring nothing slips through the cracks.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-6 w-6 text-tasksmate-green-end" />
                <h3 className="font-semibold">Ideate anywhere</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Built-in scratchpad captures rough thoughts and turns them into actionable tasks.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-tasksmate-gradient hover:scale-105 transition-transform duration-200 shadow-tasksmate"
              onClick={() => setSignUpOpen(true)}
            >
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-sora font-semibold">TasksMate</span>
                <a
                  href="https://indrasol.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  by Indrasol
                </a>
              </div>
              <span className="text-gray-500 text-sm">Your Sidekick for Every Tick</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/docs" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SignUpModal open={signUpOpen} onOpenChange={setSignUpOpen} onSwitch={() => {
        setSignUpOpen(false);
        setSignInOpen(true);
      }} />
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} onSwitch={() => {
        setSignInOpen(false);
        setSignUpOpen(true);
      }} />
    </div>
  );
};

export default Index;
