import { SignInModal } from "@/components/auth/SignInModal";
import { SignUpModal } from "@/components/auth/SignUpModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Check, FileText, Github, MessageCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [newPwd, setNewPwd] = useState("");
    const [otp, setOtp] = useState("");       // leave if you use magic-link template
    const [email, setEmail] = useState("");       // keep it in memory
    const [username, setUsername] = useState("");

    const { resetPassword, resetPasswordWithToken, exchangeCodeForSession } = useAuth();

    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Extract access_token from URL params
        const params = new URLSearchParams(window.location.search);
        const accessTokenVal = params.get("code");
        const emailVal = params.get("email");

        // async function exchange(accessToken: string) {
        //     const { user, session } = await exchangeCodeForSession(accessToken);
        //     console.log("Session set successfully", session);
        //     setEmail(user.email);
        //     setUsername(user.user_metadata?.username ?? user.email?.split("@")[0]);
        // }
        if (accessTokenVal) {
            setToken(accessTokenVal);
            // exchange(accessToken);
        } else {
            toast({ title: "Invalid reset link", variant: "destructive" });
            // navigate("/");
        }

        if (emailVal) {
            setEmail(emailVal);
        }
    }, []);

    // useEffect(() => {
    //     const params = new URLSearchParams(window.location.search);
    //     const token = params.get("code");

    //     async function handlePasswordRecovery(code: string) {
    //         const { data, error } = await supabase.auth.verifyOtp({
    //             type: "recovery",
    //             token: code,
    //         });

    //         if (error) {
    //             console.error("Password recovery verification failed:", error);
    //             toast({ title: "Invalid or expired reset link", variant: "destructive" });
    //             return;
    //         }

    //         const { user, session } = data;
    //         console.log("Password reset session:", session);

    //         setEmail(user.email);
    //         setUsername(user.user_metadata?.username ?? user.email?.split("@")[0]);
    //     }

    //     if (token) {
    //         setToken(token);
    //         handlePasswordRecovery(token);
    //     } else {
    //         toast({ title: "Invalid reset link", variant: "destructive" });
    //     }
    // }, []);



    // useEffect(() => {
    //     const params = new URLSearchParams(window.location.search);
    //     const code = params.get('code');

    //     const exchange = async () => {
    //       const { data: { session } } = await supabase.auth.getSession();

    //       if (!session && code) {
    //         const { error } = await supabase.auth.exchangeCodeForSession({ code });
    //         if (error) {
    //           console.error("Code exchange error:", error.message);
    //           // Show user-friendly message
    //         } else {
    //           // Optional: clean up URL
    //           window.history.replaceState({}, document.title, '/reset-password');
    //         }
    //       }
    //     };

    //     exchange();
    //   }, []);

    /** Detect recovery event automatically (magic-link template) */

    // useEffect(() => {
    //     const unsub = onPasswordRecovery((mail) => setEmail(mail));
    //     return unsub;
    // }, []);

    const handleChange = async (e) => {
        e.preventDefault();
        setError(null);
        if (!newPwd || newPwd.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        try {
            // OTP template – first verify code
            await resetPassword({ email, newPassword: newPwd, otp: token });
            // Magic link template – directly reset password
            // await resetPasswordWithToken({ newPassword: newPwd, accessToken: token });
            toast({ title: "Password updated! Please login with your new password", description: "You will be redirected to the login page" });
            navigate("/");
        } catch (err) {
            toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
            setError(err.message);
        }
    };

    const [signUpOpen, setSignUpOpen] = useState(false);
    const [signInOpen, setSignInOpen] = useState(false);


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

                        <button
                            onClick={() => setSignInOpen(true)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => toast({ title: 'Working on it', description: 'This feature is coming soon!' })}
                        >
                            Features
                        </button>
                        <button
                            type="button"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => toast({ title: 'Working on it', description: 'This feature is coming soon!' })}
                        >
                            Docs
                        </button>
                        <button
                            type="button"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => toast({ title: 'Working on it', description: 'This feature is coming soon!' })}
                        >
                            Pricing
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="px-6 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        {/* Left Column */}
                        <div className="w-full animate-fade-in">
                            <div className="w-full">
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
                            <div className="text-sm text-gray-500">
                                Your Sidekick for Every Tick ✓
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center items-center">
                                <form autoComplete="off" autoCorrect="off" autoSave="off" autoFocus={true} onSubmit={handleChange} className="space-y-6 bg-white p-8 rounded shadow-lg w-full max-w-md">
                                    <h2 className="text-2xl font-semibold text-center mb-4">Reset Password</h2>
                                    {username ? <p className="text-md text-gray-500 mb-2">{username}</p> : <></>}
                                    {/* {email ? <p className="text-sm text-gray-500 mb-2">{email}</p> : <></>} */}

                                    <div className="flex flex-col items-start">

                                        <div className="text-sm text-gray-500 mb-2">
                                            Email
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder=""
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoSave="off"
                                            name="resetEmail"
                                        />

                                        <div className="text-sm text-gray-500 mb-2 mt-4">
                                            Password
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder=""
                                            value={newPwd}
                                            onChange={(e) => setNewPwd(e.target.value)}
                                            required
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoSave="off"
                                            name="resetPassword"
                                        />
                                    </div>
                                    <Button className="w-full">Update password</Button>
                                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                </form>
                                {/* <Button
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
                                </Button> */}
                            </div>

                        </div>

                        {/* Right Column - Mock Browser */}
                        {/* <div className="relative">
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
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 py-20 bg-white/30">
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

            {/* Testimonials */}
            <section className="px-6 py-20">
                <div className="max-w-7xl mx-auto">
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
}