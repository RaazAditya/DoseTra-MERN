import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between py-4 px-8 bg-slate-900 text-white shadow-md">
      <div className="flex items-center space-x-3">
        <img
          src="/logo.jpg" // place your logo inside /public folder
          alt="DoseTra Logo"
          className="w-10 h-10 object-contain"
        />
        <h1 className="text-2xl font-bold">DoseTra</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-slate-800 transition">
          <Bell className="w-6 h-6 text-white" />

          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <Link
          to="/register"
          className="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg shadow hover:bg-slate-100 hover:scale-105 transition"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
