
// export default DashboardPage;
import { useSelector, useDispatch } from "react-redux";
import { fetchMedicines } from "@/features/medicineSlice";
import { fetchNotifications } from "@/features/notificationSlice";
import { fetchSchedules } from "@/features/scheduleSlice";
import { fetchDoses } from "@/features/doseSlice";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pill, Calendar, AlertTriangle, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Helper for adherence color
const getAdherenceColor = (value) => {
  if (value >= 80) return "bg-green-500";
  if (value >= 50) return "bg-yellow-400";
  return "bg-red-500";
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const medicines = useSelector((state) => state.medicine.medicines);
  const notifications = useSelector((state) => state.notifications.items);
  const schedules = useSelector((state) => state.schedules.schedules);
  const doses = useSelector((state) => state.doses.doses);

  const [summary, setSummary] = useState({
    adherence: 0,
    upcoming: [],
    trends: [],
  });

  useEffect(() => {
    dispatch(fetchMedicines());
    // dispatch(fetchNotifications());
    dispatch(fetchSchedules());
    dispatch(fetchDoses());
  }, [dispatch]);

  useEffect(() => {
    // normalize arrays safely (handles shape variations)
    const dosesArray = Array.isArray(doses)
      ? doses
      : Array.isArray(doses?.doses)
      ? doses.doses
      : [];

    const schedulesArray = Array.isArray(schedules)
      ? schedules
      : Array.isArray(schedules?.schedules)
      ? schedules.schedules
      : [];

    if (!schedulesArray.length) return;

    const now = new Date();

    // Pre-parse scheduledAt once to avoid repeated Date construction
    const parsed = dosesArray.map((d) => ({
      ...d,
      _scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
    }));

    // 1) Upcoming: strictly after current time, sorted nearest-first, top 5
    const upcoming = parsed
      .filter((d) => d._scheduledAt && d._scheduledAt.getTime() > now.getTime())
      .sort((a, b) => a._scheduledAt.getTime() - b._scheduledAt.getTime())
      .slice(0, 5)
      .map((d) => ({
        ...d,
        // scheduleId may be the full schedule object or an id string
        schedule:
          d.scheduleId && typeof d.scheduleId === "object"
            ? d.scheduleId
            : schedulesArray.find(
                (s) => s._id === (d.scheduleId?._id || d.scheduleId)
              ),
      }));

    // 2) Trends for last 7 days (oldest -> newest)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayDoses = parsed.filter(
        (d) =>
          d._scheduledAt &&
          d._scheduledAt >= dayStart &&
          d._scheduledAt <= dayEnd
      );

      const taken = dayDoses.filter((d) => d.status === "taken").length;

      // Missed: scheduled in the past and not taken
      const missed = dayDoses.filter(
        (d) => d.status !== "taken" && d._scheduledAt.getTime() < now.getTime()
      ).length;

      return { date: dayStart.toISOString().split("T")[0], taken, missed };
    }).reverse();

    const totalTaken = last7Days.reduce((a, c) => a + c.taken, 0);
    const totalScheduled = last7Days.reduce(
      (a, c) => a + c.taken + c.missed,
      0
    );
    const adherence =
      totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

    setSummary({ adherence, upcoming, trends: last7Days });
  }, [schedules, doses]);

  const adherenceData = summary.trends.map((d) => ({
    date: d.date,
    adherence:
      d.taken + d.missed > 0
        ? Math.round((d.taken / (d.taken + d.missed)) * 100)
        : 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 md:p-8">
      {/* Header */}
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Monitor your medication adherence & trends
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
        {["Adherence", "Upcoming", "Missed"].map((type, idx) => {
          const cardData =
            type === "Adherence"
              ? {
                  value: summary.adherence,
                  icon: <Pill className="w-7 h-7 text-blue-600" />,
                  color: getAdherenceColor(summary.adherence),
                }
              : type === "Upcoming"
              ? {
                  value: summary.upcoming.length,
                  icon: <Calendar className="w-7 h-7 text-green-600" />,
                }
              : {
                  value: summary.trends.reduce((a, c) => a + c.missed, 0),
                  icon: <AlertTriangle className="w-7 h-7 text-red-600" />,
                };

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
            >
              <Card className="rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition">
                <CardHeader className="flex items-center gap-3">
                  {cardData.icon}
                  <CardTitle className="text-lg font-semibold">
                    {type === "Adherence"
                      ? "Adherence"
                      : type === "Upcoming"
                      ? "Upcoming Doses"
                      : "Missed Doses"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {type === "Adherence" && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg md:text-xl">
                          {parseFloat(summary.adherence) || 0}%
                        </span>
                        <span
                          className={`px-3 py-1 text-xs md:text-sm font-semibold rounded-full text-white ${cardData.color}`}
                        >
                          {parseFloat(summary.adherence) >= 80
                            ? "Excellent"
                            : parseFloat(summary.adherence) >= 50
                            ? "Moderate"
                            : "Poor"}
                        </span>
                      </div>
                      <Progress
                        value={parseFloat(summary.adherence) || 0}
                        className="h-5 rounded-full bg-gray-200"
                      />
                    </>
                  )}
                  {type === "Upcoming" && (
                    <div className="flex space-x-4 overflow-x-auto py-1">
                      {summary.upcoming.length > 0 ? (
                        summary.upcoming.map((dose) => {
                          const medName =
                            dose.schedule?.medicineId?.name ||
                            "Unnamed Medicine";
                          const dateObj = new Date(dose.scheduledAt);
                          const time = dateObj.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const date = dateObj.toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                          });
                          return (
                            <div
                              key={dose._id}
                              className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-3 shadow-sm transition transform hover:scale-105 flex flex-col items-start"
                            >
                              <div className="flex items-center mb-1">
                                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block mr-2"></span>
                                <span className="font-semibold text-gray-800">
                                  {medName}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {date} • {time}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-gray-500 italic">
                          No upcoming doses
                        </div>
                      )}
                    </div>
                  )}

                  {type === "Missed" && (
                    <p className="text-3xl md:text-4xl font-bold text-red-500">
                      {cardData.value || 0}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Adherence Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-2xl shadow-lg border border-gray-200 p-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold mb-3">
                Weekly Adherence (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adherenceData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        padding: "8px 12px",
                      }}
                      formatter={(value) => [`${value}%`, "Adherence"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dose Trends Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 80,
            damping: 12,
          }}
        >
          <Card className="rounded-3xl shadow-xl border border-gray-200 p-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold mb-4">
                Dose Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.trends}
                    margin={{ top: 20, right: 20, left: 20, bottom: 12 }}
                    barCategoryGap="20%"
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        navigate(`/doselog?date=${data.activeLabel}`);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="takenGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22c55e"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#86efac"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="missedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#fca5a5"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 13, fill: "#6b7280", fontWeight: 600 }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 13, fill: "#6b7280", fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        padding: "8px 12px",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      dataKey="taken"
                      fill="url(#takenGradient)"
                      radius={[8, 8, 0, 0]}
                      barSize={28}
                    />
                    <Bar
                      dataKey="missed"
                      fill="url(#missedGradient)"
                      radius={[8, 8, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reports Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <Button
          className="bg-slate-900 text-white hover:bg-slate-700 transition px-6 py-3 rounded-full shadow-lg text-lg md:text-xl flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dose-logs")}
        >
          <BarChart2 className="w-5 h-5" /> View Dose Logs
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
