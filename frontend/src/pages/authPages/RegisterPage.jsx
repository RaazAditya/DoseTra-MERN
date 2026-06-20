import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "@/features/authSlice";
import { toast } from "sonner";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { Separator } from "@/components/ui/separator";
import TimezoneSelect from "@/components/TimezoneSelect";
import { detectBrowserTimezone } from "@/lib/timezones";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    timezone: detectBrowserTimezone(),
  });

  useEffect(() => {
    if (!formData.timezone) {
      setFormData((prev) => ({ ...prev, timezone: detectBrowserTimezone() }));
    }
  }, [formData.timezone]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.timezone) {
      toast.error("Please select your timezone");
      return;
    }

    try {
      const result = await dispatch(register(formData)).unwrap();

      if (result.requiresVerification) {
        toast.success("Check your email for the verification code.");
        navigate("/verify-email", { state: { email: result.email } });
        return;
      }

      toast.success("Registration successful!");
      navigate("/");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Registration failed. Please try again");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-slate-900">
            Create Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-slate-50 border-slate-300 text-slate-900"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-slate-50 border-slate-300 text-slate-900"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-slate-50 border-slate-300 text-slate-900"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <TimezoneSelect
                value={formData.timezone}
                onChange={(timezone) => setFormData({ ...formData, timezone })}
                autoDetect
              />
              <p className="text-xs text-slate-500">
                Auto-detected from your browser. Search by city or country.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <Separator className="flex-1 bg-slate-300" />
            <span className="text-xs text-slate-500 uppercase">or</span>
            <Separator className="flex-1 bg-slate-300" />
          </div>

          <GoogleLoginButton redirectTo="/" />

          <p className="text-sm text-slate-700 text-center mt-2">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-slate-900 underline hover:text-slate-800"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
