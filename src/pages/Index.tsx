
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, MessageCircle, Zap, Users, ArrowRight, Github, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: <Zap className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Chat-powered summaries",
      description: "AI helps you understand project status at a glance",
      badge: "AI"
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Comment & collaborate",
      description: "Keep everyone in sync with threaded discussions",
      avatars: true
    },
    {
      icon: <Check className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Slack / Teams in one click",
      description: "Seamless integration with your favorite tools",
      integrations: true
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <span className="font-sora font-bold text-xl">TasksMate</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/tasks_catalog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Docs
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
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
                  A simple, intuitive companion that keeps every project ticking.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/tasks_catalog">
                  <Button size="lg" className="bg-tasksmate-gradient hover:scale-105 transition-transform duration-200 shadow-tasksmate">
                    Try the Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="micro-lift">
                  <FileText className="mr-2 h-4 w-4" />
                  Docs
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
      <section className="px-6 py-20 bg-white/30">
        <div className="max-w-6xl mx-auto">
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

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sora font-bold text-3xl mb-4">
              Loved by teams everywhere
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass border-0 shadow-tasksmate micro-lift">
                <CardContent className="p-6 space-y-4">
                  <div className="text-2xl">{testimonial.emoji}</div>
                  <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                  <p className="font-semibold text-tasksmate-green-end">
                    — {testimonial.author}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="font-sora font-semibold">TasksMate</span>
              <span className="text-gray-500 text-sm">Your Sidekick for Every Tick</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Docs</span>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1">
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
