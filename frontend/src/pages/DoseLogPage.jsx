import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Check, X } from "lucide-react";
import { getDoses, updateMultipleDoses } from "@/features/api/doseApi";

export default function DoseLogPage() {
  const [doseLogs, setDoseLogs] = useState([]);
  const [updatedDoses, setUpdatedDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  // Default last 7 days
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });

  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Fetch doses
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

  // Update missed status
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

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter, fromDate, toDate]);

  // Filtered and paginated doses
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
      to.setHours(23, 59, 59, 999); // include entire "to" day
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
      <div className="flex gap-2">
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
            className={`px-3 py-1 rounded ${
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
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
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
      if (existing) {
        return prev.map((u) => (u._id === id ? { ...u, status: newStatus } : u));
      }
      return [...prev, { _id: id, status: newStatus }];
    });
  };

 const handleSaveDoses = async () => {
  if (updatedDoses.length === 0) {
    alert("No changes to save.");
    navigate(`/`);
  }

  try {
    const { success, updatedDoses: updatedList } = await updateMultipleDoses(updatedDoses);

    if (!success) throw new Error("Failed to update doses");

    // Update frontend state
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
    <div className="min-h-screen p-8 bg-slate-100">
      {/* Top controls */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">Your Dose Logs</h1>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {filteredLogs.length} shown
          </span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white text-gray-800 transition text-sm"
            />
          </div>

          {/* Form filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none"
          >
            <option value="">All forms</option>
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="syrup">Syrup</option>
            <option value="injection">Injection</option>
          </select>

          {/* Date range */}
          <div className="flex gap-2 items-center">
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
      </div>

      {loading ? (
        <p>Loading dose logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p>No dose logs found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded shadow">
              <thead className="bg-slate-200">
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
                {paginatedLogs.map((d) => (
                  <tr
                    key={d._id}
                    className={`border-b transition-all ${
                      d.status !== "pending"
                        ? d.status === "missed"
                          ? "bg-red-50/70 text-red-500"
                          : "bg-green-50/70 text-green-600"
                        : "hover:bg-indigo-50/60"
                    }`}
                  >
                    <td className="p-3">{d.medicineName}</td>
                    <td className="p-3">{d.form}</td>
                    <td className="p-3">{d.dosage}</td>
                    <td className="p-3">
                      {new Date(d.scheduledAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold">
                      {d.status === "taken" ? (
                        <span className="text-green-600">Taken</span>
                      ) : d.status === "missed" ? (
                        <span className="text-red-400">Missed</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      {d.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 hover:bg-green-100"
                            onClick={() => handleStatusChange(d._id, "taken")}
                            aria-label="Mark as taken"
                            title="Mark as taken"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 hover:bg-red-100"
                            onClick={() => handleStatusChange(d._id, "missed")}
                            aria-label="Mark as missed"
                            title="Mark as missed"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <Pagination />
          </div>

          <div className="flex gap-2 flex-wrap justify-end mt-4">
            <button
              onClick={handleSaveDoses}
              disabled={updatedDoses.length === 0}
              className={`px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition ${
                updatedDoses.length === 0
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
              >
                Save Doses
              </button>
            <button
              onClick={() => alert("Export CSV functionality pending")}
              className="px-4 py-2 bg-purple-200 rounded hover:bg-purple-300"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-purple-200 rounded hover:bg-purple-300"
            >
              Print List
            </button>
          </div>
        </>
      )}
    </div>
  );
}
