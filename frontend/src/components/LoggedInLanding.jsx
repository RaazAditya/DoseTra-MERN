import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Pill, BarChart3, Brain, Clock } from "lucide-react";
import WorkflowSection from "./WorkflowSection";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoses } from "@/features/doseSlice"; // your doses slice
import {fetchAiPredict, fetchAdherenceInsight} from "@/features/api/aiApi"
import {useNavigate} from "react-router-dom"
import { registerPush } from "@/pushNotification.js";
const LoggedInLanding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { doses, loading } = useSelector((state) => state.doses.doses); // Redux
  const [aiPredict, setAiPredict] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
const [enabled, setEnabled] = useState(
    user?.settings?.smartReminder ?? false
);
  const [nextDose, setNextDose] = useState(null);
  const [weeklyAdherence, setWeeklyAdherence] = useState(0);


  useEffect(() => {
     dispatch(fetchDoses());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
        setEnabled(user.settings?.smartReminder ?? false);
    }
}, [user]);

  // Compute next upcoming dose (any future date)
  useEffect(() => {
    const now = new Date();
    if (doses?.length) {
      const upcoming = doses
        .filter((d) => new Date(d.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      setNextDose(upcoming[0] || null);

      // Weekly adherence calculation
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday

      const thisWeekDoses = doses.filter(
        (d) =>
          new Date(d.scheduledAt) >= startOfWeek &&
          new Date(d.scheduledAt) <= endOfWeek
      );

      const taken = thisWeekDoses.filter((d) => d.status === "taken").length;
      const adherence = thisWeekDoses.length ? Math.round((taken / thisWeekDoses.length) * 100) : 0;
      setWeeklyAdherence(adherence);
    }
  }, [doses]);

  // Fetch adherence insights
  useEffect(() => {
    if (!user) return;

    setAiLoading(true);

    Promise.all([
        fetchAiPredict(),
        fetchAdherenceInsight()
    ])
        .then(([predict, insight]) => {
            setAiPredict(predict);
            setAiInsight(insight);
        })
        .catch(() => {
            setAiPredict(null);
            setAiInsight(null);
        })
        .finally(() => setAiLoading(false));

}, [user]);

  // Push notification registration
  useEffect(() => {
    const getKeyAndRegister = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/push/vapid-public-key`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());

        if (res?.publicKey) await registerPush(res.publicKey);
      } catch (err) {
        console.error("Error fetching VAPID key:", err);
      }
    };
    getKeyAndRegister();
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 md:px-20 py-10 space-y-10">
      {/* Welcome Banner */}
      <motion.section
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-10 rounded-3xl shadow-lg"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-bold">Welcome, {user?.name || "User"} 👋</h2>
        <p className="text-lg opacity-90 mt-2">Stay consistent, stay healthy — here’s your daily summary.</p>
      </motion.section>

      {/* Next Dose + Weekly Adherence */}
      <motion.div className="grid md:grid-cols-2 gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {/* Next Dose */}
        <Card className="rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              Next Dose
            </CardTitle>
            <span className="text-sm text-slate-500">Upcoming</span>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            {nextDose ? (
              <>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {nextDose.scheduleId?.medicineId?.name || "Unnamed Medicine"}
                  </p>
                  <p className="text-slate-600">
                    {new Date(nextDose.scheduledAt).toLocaleDateString([], { day: "2-digit", month: "short" })} •{" "}
                    {new Date(nextDose.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {/* <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4">Mark Taken</Button> */}
              </>
            ) : (
              <p className="text-slate-600">No upcoming doses</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Adherence */}
        <Card className="rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Weekly Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={weeklyAdherence} className="h-3 rounded-full bg-slate-200" />
            <p className="text-slate-600 mt-2 text-sm">
              You’ve taken <span className="font-semibold">{weeklyAdherence}%</span> of doses this week 🎯
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

{/* Today’s Schedule */}
<motion.section className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
    <CalendarDays className="w-6 h-6 text-blue-600" />
    Today’s Schedule
  </h3>

  <div className="flex gap-6 overflow-x-auto pb-4">
    {loading ? (
      <p>Loading...</p>
    ) : doses?.length ? (
      (() => {
        const now = new Date();
        // Use the upcoming doses array that was already filtered in useEffect
        const upcomingTodayDoses = doses
          .filter((dose) => new Date(dose.scheduledAt) > now) // future doses
          .filter((dose) => {
            const doseDate = new Date(dose.scheduledAt);
            return doseDate.toDateString() === now.toDateString(); // only today
          })
          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)); // earliest first

        if (!upcomingTodayDoses.length) {
          return <p className="text-slate-600">No upcoming doses for today.</p>;
        }

        return upcomingTodayDoses.map((dose) => {
          const dateObj = new Date(dose.scheduledAt);
          const date = dateObj.toLocaleDateString([], { day: "2-digit", month: "short" });
          const time = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          return (
            <Card
              key={dose._id}
              className={`min-w-[240px] rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition ${
                dose.status === "taken"
                  ? "bg-green-50"
                  : dose.status === "pending"
                  ? "bg-yellow-50"
                  : "bg-slate-50"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {dose.scheduleId?.medicineId?.name || "Unnamed Medicine"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">{date} • {time}</p>
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
          );
        });
      })()
    ) : (
      <p className="text-slate-600">No upcoming doses for today.</p>
    )}
  </div>
</motion.section>



      <motion.section className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <WorkflowSection />
      </motion.section>

      {/* AI Insights */}
      {/* <motion.section className={`from-blue-50 to-indigo-100 p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6 ${getInsightClasses()}`}>
        <div className="flex items-start gap-3">
          <Brain className="w-8 h-8 text-indigo-600 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-slate-800">AI Insight 💡</h4>
            <p className="mt-1">{insight}</p>
          </div>
        </div>

        {riskPeriods.length > 0 && (
          <Button className="bg-slate-900 text-white rounded-xl px-5 hover:bg-slate-800" onClick={handleToggle}>
            {enabled ? "Disable Smart Reminder" : "Enable Smart Reminder"}
          </Button>
        )}
      </motion.section> */}
      {/* AI Health Insights */}
<motion.section
  className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 shadow-lg p-8"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  <div className="flex items-start justify-between flex-col lg:flex-row gap-8">

    {/* Left */}
    <div className="flex-1">

      <div className="flex items-center gap-3 mb-5">
        <Brain className="w-8 h-8 text-indigo-600" />
        <div>
          <h3 className="text-2xl font-bold text-slate-800">
            AI Health Insights
          </h3>
          <p className="text-slate-500 text-sm">
            Personalized medication insights based on your adherence history
          </p>
        </div>
      </div>

      {/* Insight */}
      <div className="bg-white rounded-2xl border p-5 mb-5">
        <h4 className="font-semibold text-slate-800 mb-2">
          💡 Today's Insight
        </h4>

        <p className="text-slate-600">
          {aiInsight?.message ||
            "Keep logging your medicines to unlock personalized AI insights."}
        </p>
      </div>

      {/* Recommendations */}
      {aiInsight?.personalizedRecommendations?.length > 0 && (
        <div className="bg-white rounded-2xl border p-5">

          <h4 className="font-semibold text-slate-800 mb-3">
            Recommended Actions
          </h4>

          <ul className="space-y-2">

            {aiInsight.personalizedRecommendations
              .slice(0, 3)
              .map((item, index) => (

                <li
                  key={index}
                  className="flex items-start gap-2 text-slate-600"
                >
                  <span className="text-green-600 mt-1">✔</span>
                  <span>{item}</span>
                </li>

              ))}

          </ul>

        </div>
      )}

    </div>

    {/* Right */}
    <div className="w-full lg:w-[320px]">

      <div className="bg-white rounded-2xl border shadow-sm p-6">

        <h4 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          ⚠️ High Risk Time
        </h4>

        {aiPredict?.highRiskTime ? (
          <>

            <div className="text-4xl font-bold capitalize text-amber-500">
              {aiPredict.highRiskTime}
            </div>

            <p className="text-slate-500 mt-2">
              Highest probability of missing medicines
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Miss Probability
                </span>

                <span className="font-semibold">
                  {aiPredict.riskPercentage}%
                </span>
              </div>

              {aiInsight?.mostMissedMedicine && (

                <div className="flex justify-between">

                  <span className="text-slate-500">
                    Most Missed
                  </span>

                  <span className="font-semibold text-right">
                    {aiInsight.mostMissedMedicine.name}
                  </span>

                </div>

              )}

            </div>

           <div className="mt-6 text-center">
  <Button
    onClick={() => navigate("/get")}
    className={`w-full rounded-xl ${
      enabled
        ? "bg-green-600 hover:bg-green-700"
        : "bg-indigo-600 hover:bg-indigo-700"
    }`}
  >
    {enabled ? "✓ Smart Reminder Enabled" : "Enable Smart Reminder"}
  </Button>

  <p className="text-xs text-slate-500 mt-2">
    {enabled
      ? "Click to manage reminder settings."
      : "Enable reminders from your profile settings."}
  </p>
</div>

          </>
        ) : (

          <div className="text-center py-8">

            <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />

            <p className="text-slate-500">
              No high-risk period detected yet.
            </p>

          </div>

        )}

      </div>

    </div>

  </div>
</motion.section>
    </div>
  );
};

export default LoggedInLanding;
