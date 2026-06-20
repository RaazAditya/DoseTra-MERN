import { asyncHandler } from "../utils/asyncHandler.js";
import {
  disconnectCalendar,
  getCalendarAuthUrl,
  getCalendarStatus,
  handleCalendarCallback,
  setCalendarAutoSync,
  syncAllSchedulesForUser,
} from "../services/googleCalendarService.js";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

export const connectCalendar = asyncHandler(async (req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_CALENDAR_REDIRECT_URI
  ) {
    return res.status(503).json({
      message: "Google Calendar is not configured on the server.",
    });
  }

  const authUrl = getCalendarAuthUrl(req.user._id.toString());
  res.json({ authUrl });
});

export const calendarCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${frontendUrl}/?calendar=error`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/?calendar=error`);
  }

  try {
    await handleCalendarCallback(code, state);
    return res.redirect(`${frontendUrl}/?calendar=connected`);
  } catch (err) {
    console.error("Calendar callback error:", err);
    return res.redirect(`${frontendUrl}/?calendar=error`);
  }
});

export const disconnect = asyncHandler(async (req, res) => {
  await disconnectCalendar(req.user._id);
  res.json({ success: true, message: "Google Calendar disconnected" });
});

export const updateAutoSync = asyncHandler(async (req, res) => {
  const { autoSync } = req.body;
  const calendar = await setCalendarAutoSync(req.user._id, autoSync);
  res.json({ success: true, autoSync: calendar.autoSync });
});

// export const manualSync = asyncHandler(async (req, res) => {
//   const result = await syncAllSchedulesForUser(req.user._id);
//   res.json({
//     success: true,
//     message: "Calendar sync completed",
//     ...result,
//   });
// });

export const manualSync = asyncHandler(async (req, res) => {
  try {
    const result = await syncAllSchedulesForUser(req.user._id);

    res.json({
      success: true,
      message: "Calendar sync completed",
      ...result,
    });
  } catch (error) {
    console.error("SYNC ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

export const status = asyncHandler(async (req, res) => {
  const calendarStatus = await getCalendarStatus(req.user._id);
  res.json(calendarStatus);
});
