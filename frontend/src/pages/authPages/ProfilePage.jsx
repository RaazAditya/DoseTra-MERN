import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, loadUser } from "@/features/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { getTimeZones } from "@vvo/tzdb";

const animatedComponents = makeAnimated();
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const timezoneOptions = getTimeZones()
  .map((tz) => ({ value: tz.name, label: tz.name }))
  .sort((a, b) => a.label.localeCompare(b.label));


const languageCodes = ["en", "hi", "fr", "es", "de", "zh", "ja"];
const languageOptions = languageCodes.map((code) => ({
  value: code,
  label:
    typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames(["en"], { type: "language" }).of(code)
      : code,
}));

const EditProfilePage = () => {
  const { user, loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(null);
  const [language, setLanguage] = useState(null);
  const [notification, setNotification] = useState("both");

  useEffect(() => {
    if (!user) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setName(capitalize(user.name));
      setEmail(user.email || "");
      setTimezone(
        timezoneOptions.find((tz) => tz.value === user.timezone) || null
      );
      setLanguage(
        languageOptions.find((l) => l.value === user.settings?.language) || null
      );
      setNotification(user.settings?.notification || "both");
    }
  }, [user]);

  const handleUpdate = async () => {
    const updatedData = {
      name: capitalize(name),
      timezone: timezone?.value || "",
      settings: {
        notification,
        language: language?.value || "",
      },
    };

    try {
      await dispatch(updateUser(updatedData)).unwrap();
      // Refetch latest user data from backend to update Navbar/avatar
      // await dispatch(loadUser()).unwrap();
      toast.success("Profile updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-slate-50 p-6 pt-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border bg-slate-100 rounded px-3 py-2"
          />
        </div>

        {/* Timezone */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <Select
            value={timezone}
            onChange={setTimezone}
            options={timezoneOptions}
            components={animatedComponents}
            isSearchable
            placeholder="Select your timezone"
          />
        </div>

        {/* Language */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Language</label>
          <Select
            value={language}
            onChange={setLanguage}
            options={languageOptions}
            components={animatedComponents}
            isSearchable
            isClearable
            placeholder="Select language"
          />
        </div>

        {/* Notification */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Notification</label>
          <select
            value={notification}
            onChange={(e) => setNotification(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="email">Email</option>
            <option value="browser">Browser</option>
            <option value="both">Both</option>
          </select>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-700 transition disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;
