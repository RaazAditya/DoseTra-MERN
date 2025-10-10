import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import { fetchMedicines } from "@/features/medicineSlice";
import { getMedicineById } from "@/features/api/medicineApi";

export default function ScheduleFormPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {scheduleId, medicineId} = useParams(); // Will contain schedule ID if editing

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
  const [isEditing, setIsEditing] = useState(false);

  // Fetch medicines for dropdown from backend
  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);

  // Fetch schedule if editing (id exists)
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const fetchData = async () => {
    setLoading(true);

    try {
      if (scheduleId) {
        // Editing schedule
        const res = await axios.get(
          `http://localhost:7000/api/schedules/${scheduleId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sch = res.data;
        setForm({
          medicineId: sch.medicineId?._id || "",
          medicineName: sch.medicineId?.name || "",
          dosage: sch.dosage || "",
          frequency: sch.frequency || "",
          startDate: sch.startDate?.split("T")[0] || "",
          endDate: sch.endDate?.split("T")[0] || "",
          times: sch.times.length ? sch.times : [""],
          active: sch.active ?? true,
        });
      } else if (medicineId) {
        // New schedule from medicine
        const medRes = await axios.get(
          `http://localhost:7000/api/v1/medicine/${medicineId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const med = medRes.data.medicine || medRes.data;
        setForm((prev) => ({
          ...prev,
          medicineId: med._id,
          medicineName: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [scheduleId, medicineId]);



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
      if (isEditing) {
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
          {isEditing ? "Edit Schedule" : "Add Schedule"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Medicine */}
          <div>
            <label className="block mb-1 text-slate-700">Medicine Name</label>
            <input
            type="text"
            value={form.medicineName}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block mb-1 text-slate-700">Dosage</label>
            <input
              type="text"
              value={form.dosage}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block mb-1 text-slate-700">Frequency</label>
            <input
              type="text"
              value={form.frequency}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
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
