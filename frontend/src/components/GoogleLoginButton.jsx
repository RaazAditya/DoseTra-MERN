import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { googleLogin } from "@/features/authSlice";

const GoogleLoginButton = ({ redirectTo = "/dashboard" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="text-xs text-center text-slate-500">
        Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in your frontend env.
      </p>
    );
  }

  const handleSuccess = async (response) => {
    if (!response?.credential) {
      toast.error("Google sign-in did not return a valid credential.");
      return;
    }

    try {
      await dispatch(googleLogin(response.credential)).unwrap();
      toast.success("Logged in with Google!");
      navigate(redirectTo);
    } catch (err) {
      toast.error(err || "Google login failed");
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Google sign-in was cancelled or failed.")}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="350"
      />
    </div>
  );
};

export default GoogleLoginButton;
