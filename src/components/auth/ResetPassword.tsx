import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [newPwd, setNewPwd] = useState("");
    const [otp, setOtp] = useState("");       // leave if you use magic-link template
    const [email, setEmail] = useState("");       // keep it in memory

    const { onPasswordRecovery, resetPassword } = useAuth();

    /** Detect recovery event automatically (magic-link template) */

    useEffect(() => {
        const unsub = onPasswordRecovery((mail) => setEmail(mail));
        return unsub;
    }, []);

    const handleChange = async (e) => {
        e.preventDefault();
        try {
            // OTP template – first verify code
            await resetPassword({ email, newPassword: newPwd, otp });
            toast({ title: "Password updated" });
            navigate("/org");
        } catch (err) {
            toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleChange} className="space-y-4 bg-white p-8 rounded shadow">
                {otp !== null && (
                    <Input
                        placeholder="OTP code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                )}
                <Input
                    type="password"
                    placeholder="New password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                />
                <Button className="w-full">Update password</Button>
            </form>
        </main>
    );
}