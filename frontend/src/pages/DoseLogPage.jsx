import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Check, X } from "lucide-react";
// import axios from "axios"; // Uncomment for backend

export default function DoseLogPage() {
  const [doseLogs, setDoseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dummy dose logs
  const dummyDoseLogs = [
    {
      _id: "d1",
      medicineName: "Paracetamol",
      dosage: "500mg",
      scheduledAt: "2025-10-07T08:00:00.000Z",
      status: "pending",
    },
    {
      _id: "d2",
      medicineName: "Amoxicillin",
      dosage: "250mg",
      scheduledAt: "2025-10-07T14:00:00.000Z",
      status: "taken",
    },
    {
      _id: "d3",
      medicineName: "Ibuprofen",
      dosage: "400mg",
      scheduledAt: "2025-10-07T09:00:00.000Z",
      status: "pending",
    },
    {
      _id: "d4",
      medicineName: "Cough Syrup",
      dosage: "10ml",
      scheduledAt: "2025-10-07T21:00:00.000Z",
      status: "pending",
    },
    {
      _id: "d4",
      medicineName: "Cough Syrup",
      dosage: "10ml",
      scheduledAt: "2025-10-07T21:00:00.000Z",
      status: "pending",
    },
    {
      _id: "d4",
      medicineName: "Cough Syrup",
      dosage: "10ml",
      scheduledAt: "2025-10-07T21:00:00.000Z",
      status: "pending",
    },
    {
      _id: "d3",
      medicineName: "Ibuprofen",
      dosage: "400mg",
      scheduledAt: "2025-10-07T09:00:00.000Z",
      status: "pending",
    },
    // Add more dummy data for testing pagination
  ];

  const fetchDoseLogs = async () => {
    try {
      setLoading(true);
      // Uncomment to fetch from backend
      // const res = await axios.get("/api/doselogs");
      // setDoseLogs(res.data);

      setDoseLogs(dummyDoseLogs); // dummy mode
    } catch (err) {
      console.error(err);
      setDoseLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoseLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically mark past pending doses as "missed"
  useEffect(() => {
    const now = new Date();
    setDoseLogs((prev) =>
      prev.map((d) => {
        if (d.status === "pending" && new Date(d.scheduledAt) < now) {
          return { ...d, status: "missed" };
        }
        return d;
      })
    );
  }, [doseLogs]);

  const handleMarkTaken = (id) => {
    setDoseLogs((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status: "taken" } : d))
    );
  };

  const handleMarkMissed = (id) => {
    setDoseLogs((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status: "missed" } : d))
    );
  };

  // Search filter
  const filteredLogs = doseLogs.filter((d) =>
    d.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen p-8 bg-slate-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search medicine..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border rounded shadow w-64"
        />

        <div className="flex gap-2">
          <Button onClick={() => alert("Export CSV pending")} className="bg-purple-200 hover:bg-purple-300">
            Export CSV
          </Button>
          <Button onClick={() => window.print()} className="bg-purple-200 hover:bg-purple-300">
            Print List
          </Button>
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
                  <th className="p-3 text-left">Dosage</th>
                  <th className="p-3 text-left">Scheduled At</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((d) => (
                  <tr key={d._id} className="border-b hover:bg-indigo-50/60">
                    <td className="p-3">{d.medicineName}</td>
                    <td className="p-3">{d.dosage}</td>
                    <td className="p-3">{new Date(d.scheduledAt).toLocaleString()}</td>
                    <td className="p-3">
                      {d.status === "taken" ? (
                        <span className="text-green-600 font-semibold">{d.status}</span>
                      ) : d.status === "missed" ? (
                        <span className="text-red-600 font-semibold">{d.status}</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">{d.status}</span>
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      {d.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 hover:bg-green-100"
                            onClick={() => handleMarkTaken(d._id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 hover:bg-red-100"
                            onClick={() => handleMarkMissed(d._id)}
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

          {/* Pagination */}
          <div className="mt-4 flex justify-center gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

