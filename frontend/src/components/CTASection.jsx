import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="mt-32 bg-slate-900 py-20 text-center text-white rounded-tl-[4rem] rounded-tr-[4rem]">
      <h2 className="text-4xl font-bold mb-6">Start Your Wellness Journey Today</h2>
      <p className="text-lg mb-8">Stay healthy, organized, and worry-free with DoseTra.</p>
      <Link to="/register">
        <Button className="bg-white text-slate-900 hover:bg-slate-100">Sign Up Now</Button>
      </Link>
    </section>
  );
};

export default CTASection;
