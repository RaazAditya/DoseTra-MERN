import React from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Pill, BarChart3, Brain } from "lucide-react";
import WorkflowSection from "./WorkflowSection";

const LoggedInLanding = () => {
  const user = { name: "Aditya" };

  const doses = [
    { id: 1, name: "Paracetamol 500mg", time: "9:00 AM", status: "taken" },
    { id: 2, name: "Amoxicillin 250mg", time: "2:00 PM", status: "pending" },
    { id: 3, name: "Vitamin D", time: "8:00 PM", status: "upcoming" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 md:px-20 py-10 space-y-10">
      {/* 🌅 Welcome Banner */}
      <motion.section
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-10 rounded-3xl shadow-lg"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-bold">Welcome back, {user.name} 👋</h2>
        <p className="text-lg opacity-90 mt-2">
          Stay consistent, stay healthy — here’s your daily summary.
        </p>
      </motion.section>

      {/* 💊 Next Dose Card */}
      <motion.div
        className="grid md:grid-cols-2 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              Next Dose
            </CardTitle>
            <span className="text-sm text-slate-500">Today</span>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Amoxicillin 250mg
              </p>
              <p className="text-slate-600">at 2:00 PM</p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4">
              Mark Taken
            </Button>
          </CardContent>
        </Card>

        {/* 📈 Adherence Summary */}
        <Card className="rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Weekly Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={85} className="h-3 rounded-full bg-slate-200" />
            <p className="text-slate-600 mt-2 text-sm">
              You’ve taken <span className="font-semibold">17 of 20 doses</span> this week 🎯
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* 📅 Today’s Schedule */}
      <motion.section
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Today’s Schedule
        </h3>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {doses.map((dose) => (
            <Card
              key={dose.id}
              className={`min-w-[240px] rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition 
              ${
                dose.status === "taken"
                  ? "bg-green-50"
                  : dose.status === "pending"
                  ? "bg-yellow-50"
                  : "bg-slate-50"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {dose.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">{dose.time}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                    dose.status === "taken"
                      ? "bg-green-100 text-green-700"
                      : dose.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {dose.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>
      <motion.section
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <WorkflowSection/>
      </motion.section>
      

      {/* 💡 AI Insights */}
      <motion.section
        className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start gap-3">
          <Brain className="w-8 h-8 text-indigo-600 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-slate-800">AI Insight 💡</h4>
            <p className="text-slate-700 mt-1">
              You tend to miss your evening doses on weekends. Would you like to
              enable adaptive reminders?
            </p>
          </div>
        </div>
        <Button className="bg-slate-900 text-white rounded-xl px-5 hover:bg-slate-800">
          Enable Smart Reminder
        </Button>
      </motion.section>
      
    </div>
  );
};

export default LoggedInLanding;
