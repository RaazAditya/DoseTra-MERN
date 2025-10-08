import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import { fetchMedicines } from "@/features/medicineSlice";

export default function ScheduleFormPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams(); // Will contain schedule ID if editing

  // Medicines for dropdown
  const { medicines } = useSelector((state) => state.medicine);

  // Form state
  const [form, setForm] = useState({
    scheduleId: uuidv4(), // unique ID for new schedules
    medicineId: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    times: [""],
    active: true,
  });

  const [loading, setLoading] = useState(false);

  // Fetch medicines for dropdown from backend
  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);

  // Fetch schedule if editing (id exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (id) {
      setLoading(true);
      axios
        .get(`http://localhost:7000/api/schedules/${id}`,
          { headers: {Authorization : `Bearer ${token}`}}
        )
        .then((res) => {
          const sch = res.data;
          // Populate form with fetched schedule data
          setForm({
            medicineId: sch.medicineId?._id || "",
            dosage: sch.dosage || "",
            frequency: sch.frequency || "",
            startDate: sch.startDate ? sch.startDate.split("T")[0] : "",
            endDate: sch.endDate ? sch.endDate.split("T")[0] : "",
            times: sch.times && sch.times.length > 0 ? sch.times : [""],
            active: sch.active ?? true,
          });
        })
        .catch((err) => console.error("Failed to fetch schedule:", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Handle basic input change (text, select, date)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle times input change dynamically
  const handleTimeChange = (index, value) => {
    const updatedTimes = [...form.times];
    updatedTimes[index] = value;
    setForm({ ...form, times: updatedTimes });
  };

  // Add a new time input field
  const addTimeField = () => {
    setForm({ ...form, times: [...form.times, ""] });
  };

  // Remove a time input field
  const removeTimeField = (index) => {
    const updatedTimes = form.times.filter((_, i) => i !== index);
    setForm({ ...form, times: updatedTimes });
  };

  // Submit form to backend (create or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // get token from localStorage (or wherever you store it)
    const token = localStorage.getItem("token");

    try {
      if (id) {
        // Edit existing schedule
        await axios.put(`http://localhost:7000/api/schedules/${id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Schedule updated successfully!");
      } else {
        // Create new schedule
        await axios.post("http://localhost:7000/api/schedules", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Schedule created successfully!");
      }

      navigate("/schedules"); // Navigate back to list page
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white/90 shadow-xl rounded-xl p-6 w-full max-w-lg backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">
          {id ? "Edit Schedule" : "Add Schedule"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Medicine */}
          <div>
            <label className="block mb-1 text-slate-700">Select Medicine</label>
            <select
              name="medicineId"
              value={form.medicineId}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Choose medicine --</option>
              {Array.isArray(medicines) &&
                medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.form})
                  </option>
                ))}
            </select>
          </div>

          {/* Dosage */}
          <div>
            <label className="block mb-1 text-slate-700">Dosage</label>
            <input
              type="text"
              name="dosage"
              value={form.dosage}
              onChange={handleChange}
              placeholder="e.g., 500mg"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block mb-1 text-slate-700">Frequency</label>
            <input
              type="text"
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              placeholder="e.g., Twice a day"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block mb-1 text-slate-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block mb-1 text-slate-700">End Date</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Times */}
          <div>
            <label className="block mb-1 text-slate-700">Times</label>
            {form.times.map((t, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="time"
                  value={t}
                  onChange={(e) => handleTimeChange(idx, e.target.value)}
                  required
                  className="flex-1 border rounded px-3 py-2"
                />
                {form.times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeField(idx)}
                    className="bg-red-500 text-white px-2 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTimeField}
              className="bg-gray-200 px-3 py-1 rounded"
            >
              + Add Time
            </button>
          </div>

          {/* Active */}
          <div>
            <label className="block mb-1 text-slate-700">Status</label>
            <select
              name="active"
              value={form.active}
              onChange={(e) =>
                setForm({ ...form, active: e.target.value === "true" })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate("/schedules")}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
