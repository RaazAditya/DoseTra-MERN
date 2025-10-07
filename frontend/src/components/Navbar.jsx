import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useSelector, useDispatch } from "react-redux";
import { loadUser, logout } from "@/features/authSlice";
import { deleteUserProfile } from "@/features/api/authApi";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) dispatch(loadUser());
  }, [dispatch]);

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setDropdownOpen(false);
  };

  const handleDelete = async() => {
    if (window.confirm("Are you sure you want to delete your account?")){
   try {
    await deleteUserProfile();
    // On success, logout user (clear auth, redux state), and redirect to register
    dispatch(logout());
    navigate("/register");
    setDropdownOpen(false);
    alert("Account deleted successfully.");
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Failed to delete account. Please try again."
    );
  }
  }
}

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className=" top-0 z-50 flex items-center justify-between py-4 px-8 bg-slate-900 text-white shadow-md">
      <div className="flex items-center space-x-3">
        <img
          src="/logo.jpg"
          alt="DoseTra Logo"
          className="w-10 h-10 object-contain"
        />
        <Link to="/">
          <h1 className="text-2xl font-bold">DoseTra</h1>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-slate-800 transition ">
          <Bell className="w-6 h-6 text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {user && isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <Avatar className="w-10 h-10 ">
                <AvatarFallback className="bg-slate-700 text-white hover:bg-slate-600">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-lg shadow-lg border border-gray-200 z-50">
                <Link
                  to="/get"
                  className="block px-4 py-2 hover:bg-slate-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  Edit Profile
                </Link>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 hover:bg-slate-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 transition"
                >
                  Logout
                </button>
                <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 transition"
                >
                  Delete Account
                  </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/register"
            className="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg shadow hover:bg-slate-100 hover:scale-105 transition"
          >
            Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
