import React from "react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-slate-800 py-6 text-center text-slate-200 z-50">
      &copy; {new Date().getFullYear()} DoseTra. All rights reserved.
    </footer>
  );
};

export default Footer;