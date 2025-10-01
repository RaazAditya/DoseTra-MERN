import React from "react";

const Footer = () => {
  return (
    <footer className="bg-slate-800 py-6 mt-10 text-center text-slate-200">
      &copy; {new Date().getFullYear()} DoseTra. All rights reserved.
    </footer>
  );
};

export default Footer;
