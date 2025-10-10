import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Check, X } from "lucide-react";
import { getDoses, updateMultipleDoses } from "@/features/api/doseApi";
import { motion } from "framer-motion";


export default function DoseLogPage() {
  const [doseLogs, setDoseLogs] = useState([]);
  const [updatedDoses, setUpdatedDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const fetchDoses = async () => {
      try {
        setLoading(true);
        const data = await getDoses();
        const doses = data.doses || [];
        const normalized = doses.map((d) => ({
          _id: d._id,
          medicineName: d.scheduleId?.medicineId?.name || "Unknown",
          form: d.scheduleId?.medicineId?.form || "N/A",
          dosage: d.scheduleId?.medicineId?.dosage || "—",
          scheduledAt: d.scheduledAt,
          status: d.status,
        }));
        setDoseLogs(normalized);
      } catch (error) {
        console.error("Error fetching doses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoses();
  }, []);

  useEffect(() => {
    const now = new Date();
    setDoseLogs((prev) =>
      prev.map((d) =>
        d.status === "pending" && new Date(d.scheduledAt) < now
          ? { ...d, status: "missed" }
          : d
      )
    );
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter, fromDate, toDate]);

  const filteredLogs = doseLogs
    .filter((d) =>
      d.medicineName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((d) =>
      filter ? d.form?.toLowerCase() === filter.toLowerCase() : true
    )
    .filter((d) => {
      const doseDate = new Date(d.scheduledAt);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      return doseDate >= from && doseDate <= to;
    });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex gap-2 flex-wrap justify-center mt-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, idx) => (
          <button
            key={idx + 1}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === idx + 1
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-gray-200 text-gray-600"
            }`}
            onClick={() => setCurrentPage(idx + 1)}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  const handleStatusChange = (id, newStatus) => {
    setDoseLogs((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status: newStatus } : d))
    );
    setUpdatedDoses((prev) => {
      const existing = prev.find((u) => u._id === id);
      if (existing) return prev.map((u) => (u._id === id ? { ...u, status: newStatus } : u));
      return [...prev, { _id: id, status: newStatus }];
    });
  };

  const handleSaveDoses = async () => {
    if (updatedDoses.length === 0) return alert("No changes to save.");
    try {
      const { success, updatedDoses: updatedList } = await updateMultipleDoses(updatedDoses);
      if (!success) throw new Error("Failed to update doses");
      setDoseLogs((prev) =>
        prev.map((dose) => {
          const updated = updatedList.find((u) => u._id === dose._id);
          return updated ? { ...dose, ...updated } : dose;
        })
      );
      setUpdatedDoses([]);
      alert("All doses updated successfully!");
      navigate(`/`);
    } catch (err) {
      console.error("Error updating doses:", err);
      alert("Failed to save doses. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Dose Logs</h1>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
              {filteredLogs.length} shown
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white text-gray-800 w-full sm:w-56 text-sm"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none w-full sm:w-auto"
            >
              <option value="">All forms</option>
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
            </select>

            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto"
        >
          {loading ? (
            <div className="p-12 text-center text-gray-400 animate-pulse text-lg">Loading dose logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <span className="block text-2xl mb-4">📋</span>
              <span>No dose logs found.</span>
            </div>
          ) : (
            <table className="w-full min-w-max bg-white rounded shadow-sm text-sm sm:text-base">
              <thead className="bg-gray-100/80">
                <tr>
                  <th className="p-3 text-left">Medicine</th>
                  <th className="p-3 text-left">Form</th>
                  <th className="p-3 text-left">Dosage</th>
                  <th className="p-3 text-left">Scheduled At</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((d, i) => (
                  <motion.tr
                    key={d._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b transition-colors ${
                      d.status === "missed"
                        ? "bg-red-50/70 text-red-500"
                        : d.status === "taken"
                        ? "bg-green-50/70 text-green-600"
                        : "hover:bg-indigo-50/60"
                    }`}
                  >
                    <td className="p-2 sm:p-3">{d.medicineName}</td>
                    <td className="p-2 sm:p-3">{d.form}</td>
                    <td className="p-2 sm:p-3">{d.dosage}</td>
                    <td className="p-2 sm:p-3">{new Date(d.scheduledAt).toLocaleString()}</td>
                    <td className="p-2 sm:p-3 font-semibold">
                      {d.status === "taken" ? (
                        <span className="text-green-600">Taken</span>
                      ) : d.status === "missed" ? (
                        <span className="text-red-400">Missed</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 flex flex-wrap gap-2">
                      {d.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 hover:bg-green-100"
                            onClick={() => handleStatusChange(d._id, "taken")}
                            title="Mark as taken"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 hover:bg-red-100"
                            onClick={() => handleStatusChange(d._id, "missed")}
                            title="Mark as missed"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <div className="flex justify-center mt-4">
          <Pagination />
        </div>

        <div className="flex flex-wrap justify-end gap-4 mt-4">
          <Button
            onClick={handleSaveDoses}
            disabled={updatedDoses.length === 0}
            className={`${
              updatedDoses.length === 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800"
            } px-5 py-2 rounded-lg font-semibold w-full sm:w-auto`}
          >
            Save Doses
          </Button>
          <Button
            onClick={() => alert("Export CSV pending")}
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full sm:w-auto"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full sm:w-auto"
          >
            Print List
          </Button>
        </div>
      </div>
    </div>
  );
}
