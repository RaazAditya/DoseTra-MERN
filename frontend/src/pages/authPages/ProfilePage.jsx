import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, loadUser } from "@/features/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import TimezoneSelect from "@/components/TimezoneSelect";
import { Button } from "@/components/ui/button";
import {
  disconnectCalendar,
  getCalendarConnectUrl,
  getCalendarStatus,
  setCalendarAutoSync,
  syncCalendarNow,
} from "@/features/api/authApi";

const animatedComponents = makeAnimated();
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

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
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState(null);
  const [notification, setNotification] = useState("both");
  const [calendarStatus, setCalendarStatus] = useState({
    connected: false,
    autoSync: true,
    lastSyncedAt: null,
    syncedEvents: 0,
  });
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(loadUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      setName(capitalize(user.name));
      setEmail(user.email || "");
      setTimezone(user.timezone || "");
      setLanguage(
        languageOptions.find((l) => l.value === user.settings?.language) || null
      );
      setNotification(user.settings?.notificationPreference || "both");
      setCalendarStatus((prev) => ({
        ...prev,
        connected: user.googleCalendar?.connected || false,
        autoSync: user.googleCalendar?.autoSync !== false,
        lastSyncedAt: user.googleCalendar?.lastSyncedAt || null,
      }));
    }
  }, [user]);

  const refreshCalendarStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const status = await getCalendarStatus(token);
      setCalendarStatus(status);
    } catch (err) {
      console.error("Failed to load calendar status", err);
    }
  };

  useEffect(() => {
    refreshCalendarStatus();
  }, [user?.googleCalendar?.connected]);

  const handleUpdate = async () => {
    const updatedData = {
      name: capitalize(name),
      timezone,
      settings: {
        notificationPreference: notification,
        language: language?.value || "en",
      },
    };

    try {
      await dispatch(updateUser(updatedData)).unwrap();
      toast.success("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      toast.error(err || "Failed to update profile");
    }
  };

  const handleConnectCalendar = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setCalendarLoading(true);
    try {
      const authUrl = await getCalendarConnectUrl(token);
      window.location.href = authUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start calendar connection");
      setCalendarLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setCalendarLoading(true);
    try {
      await disconnectCalendar(token);
      toast.success("Google Calendar disconnected");
      await refreshCalendarStatus();
      dispatch(loadUser());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to disconnect calendar");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleToggleAutoSync = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const nextValue = !calendarStatus.autoSync;
    setCalendarLoading(true);
    try {
      await setCalendarAutoSync(token, nextValue);
      setCalendarStatus((prev) => ({ ...prev, autoSync: nextValue }));
      toast.success(`Auto sync ${nextValue ? "enabled" : "disabled"}`);
      dispatch(loadUser());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update auto sync");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleManualSync = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setCalendarLoading(true);
    try {
      const result = await syncCalendarNow(token);
      toast.success(`Synced ${result.eventCount || 0} calendar events`);
      await refreshCalendarStatus();
      dispatch(loadUser());
    } catch (err) {
      toast.error(err.response?.data?.message || "Calendar sync failed");
    } finally {
      setCalendarLoading(false);
    }
  };

  const formatLastSynced = (date) =>
    date ? new Date(date).toLocaleString() : "Never";

  return (
    <div className="min-h-screen flex justify-center items-start bg-slate-50 p-6 pt-12">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border bg-slate-100 rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <TimezoneSelect value={timezone} onChange={setTimezone} />
          </div>

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

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Google Calendar</h3>
          <p className="text-sm text-slate-600 mb-4">
            Sync medicine schedules to your Google Calendar. Events update automatically when schedules change.
          </p>

          <div className="rounded-lg border bg-slate-50 p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Status</span>
              <span className={calendarStatus.connected ? "text-green-600 font-medium" : "text-slate-800"}>
                {calendarStatus.connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Last synced</span>
              <span>{formatLastSynced(calendarStatus.lastSyncedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Synced events</span>
              <span>{calendarStatus.syncedEvents || 0}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {!calendarStatus.connected ? (
              <Button
                onClick={handleConnectCalendar}
                disabled={calendarLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {calendarLoading ? "Connecting..." : "Connect Calendar"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleManualSync}
                  disabled={calendarLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {calendarLoading ? "Syncing..." : "Sync Now"}
                </Button>
                <Button
                  onClick={handleToggleAutoSync}
                  disabled={calendarLoading}
                  variant="outline"
                  className="w-full"
                >
                  Auto Sync: {calendarStatus.autoSync ? "On" : "Off"}
                </Button>
                <Button
                  onClick={handleDisconnectCalendar}
                  disabled={calendarLoading}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disconnect Calendar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
