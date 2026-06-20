import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resendOtp, verifyOtp } from "@/features/authSlice";

const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error("Email and OTP are required");
      return;
    }

    try {
      await dispatch(verifyOtp({ email, otp })).unwrap();
      toast.success("Email verified! Welcome to DoseTra.");
      navigate("/");
    } catch (err) {
      toast.error(err || "Verification failed");
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }

    try {
      await dispatch(resendOtp(email)).unwrap();
      toast.success("A new OTP has been sent to your email.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Verify Your Email
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Enter the 6-digit code sent to your email. You only need to do this once.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                className="bg-slate-50 tracking-widest text-center text-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="text-slate-900 underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
            <Link to="/login" className="text-slate-600 hover:text-slate-900">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
