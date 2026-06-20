import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { login } from "@/features/authSlice";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { Separator } from "@/components/ui/separator";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(login(formData)).unwrap();
      toast.success("Logged in successfully!");
      navigate("/");
    } catch (err) {
      if (err?.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Please verify your email first.");
        navigate("/verify-email", { state: { email: err.email || formData.email } });
        return;
      }
      toast.error(err?.message || err || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 text-center">
            Welcome Back
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-slate-50 border-slate-300 text-slate-900"
            />

            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="bg-slate-50 border-slate-300 text-slate-900"
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <Separator className="flex-1 bg-slate-300" />
            <span className="text-xs text-slate-500 uppercase">or</span>
            <Separator className="flex-1 bg-slate-300" />
          </div>

          <GoogleLoginButton redirectTo="/" />

          <p className="text-center text-sm text-slate-600 mt-3">
            Don’t have an account?{" "}
            <Link to="/register" className="text-slate-900 underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
