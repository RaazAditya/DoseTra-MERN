// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useSelector, useDispatch } from "react-redux";
import { loadUser, logout } from "@/features/authSlice";
import { deleteUserProfile } from "@/features/api/authApi";
import {
  fetchNotifications,
  addNotification,
  markNotificationsSeen,
  resetNotificationState,
} from "@/features/notificationSlice.js";
import { resetMedicineState } from "@/features/medicineSlice.js";
import { initSocket } from "@/sockets/socketClient";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const notifications = useSelector((state) => state.notifications.items);
  const unseenCount = useSelector((state) => state.notifications.unseenCount);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  //  useEffect(() => {
  //   const count = notifications.filter((n) => n.status === "sent" && !n.seen).length;
  //   unseenCount=count
  // }, [notifications]);

  // Load user
  useEffect(() => {
    if (!user) dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchNotifications());
  }, [isAuthenticated, dispatch]);

  // Realtime updates via socket
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!socketRef.current) {
      socketRef.current = initSocket(user._id, token, (notification) => {
        dispatch(addNotification(notification));
      });
    }
  }, [user, dispatch]);
  // Fetch notifications on mount
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchNotifications());
  }, [isAuthenticated, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetMedicineState());
    dispatch(resetNotificationState());
    window.dispatchEvent(new Event("logout"));
    navigate("/");
    setDropdownOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await deleteUserProfile(token);
      handleLogout();
      alert("Account deleted successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete account.");
    }
  };

  const handleBellClick = () => {
    // Mark all notifications as seen on click
    dispatch(markNotificationsSeen());
    navigate("/notifications");
  };

  return (
    <nav className="top-0 flex justify-between items-center p-4 bg-slate-900 text-white shadow-md z-50">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="text-2xl font-bold">
          <img
            src="/logo.png"
            alt="DoseTra Logo"
            className="w-50 h-15 object-contain"
          />
        </Link>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}

        {/* User Dropdown */}
        {user && isAuthenticated ? (
          <>
            <button
              className="relative p-2 rounded-full hover:bg-slate-800 transition"
              onClick={handleBellClick}
            >
              <Bell className="w-6 h-6 text-white" />
              {unseenCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full px-1">
                  {unseenCount}
                </span>
              )}
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-slate-700 text-white hover:bg-slate-600">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>

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

                  {/* New items */}
                  <Link
                    to="/medicines"
                    className="block px-4 py-2 hover:bg-slate-100 transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Add Medicine
                  </Link>
                  <Link
                    to="/schedules"
                    className="block px-4 py-2 hover:bg-slate-100 transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Schedules
                  </Link>
                  <Link
                    to="/dose-logs"
                    className="block px-4 py-2 hover:bg-slate-100 transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Dose Logs
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
          </>
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
