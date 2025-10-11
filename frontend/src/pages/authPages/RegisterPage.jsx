import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Select from "react-select";
import { getTimeZones } from "@vvo/tzdb";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "@/features/authSlice";
import { toast } from "sonner";

const options = getTimeZones()
  .map((tz) => ({ value: tz.name, label: tz.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {loading, error} = useSelector((state)=>state.auth)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    timezone: "",
  });
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(register(formData)).unwrap();

      toast.success("Registration successful!");
      navigate("/");  
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error(err?.message || "Registration failed. Please try again");
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
          {success && <p className="text-green-600 text-sm">{success}</p>}

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
              <Select
                options={options}
                value={options.find((o) => o.value === formData.timezone)}
                onChange={(selected) =>
                  setFormData({ ...formData, timezone: selected.value })
                }
                placeholder="Select your timezone"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>

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
