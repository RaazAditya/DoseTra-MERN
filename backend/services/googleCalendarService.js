import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Schedule from "../models/Schedule.js";
import SyncEvent from "../models/SyncEvent.js";

const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const getOAuthClient = () =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

export const createCalendarAuthState = (userId) =>
  jwt.sign({ userId, purpose: "calendar" }, process.env.JWT_SECRET_KEY, {
    expiresIn: "15m",
  });

export const verifyCalendarAuthState = (state) => {
  const decoded = jwt.verify(state, process.env.JWT_SECRET_KEY);
  if (decoded.purpose !== "calendar") {
    throw new Error("Invalid OAuth state");
  }
  return decoded.userId;
};

export const getCalendarAuthUrl = (userId) => {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
    state: createCalendarAuthState(userId),
  });
};

const getAuthenticatedClient = async (user) => {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date: user.googleCalendar.tokenExpiry?.getTime(),
  });

  client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      user.googleCalendar.accessToken = tokens.access_token;
    }
    if (tokens.refresh_token) {
      user.googleCalendar.refreshToken = tokens.refresh_token;
    }
    if (tokens.expiry_date) {
      user.googleCalendar.tokenExpiry = new Date(tokens.expiry_date);
    }
    await user.save();
  });

  return google.calendar({ version: "v3", auth: client });
};

export const handleCalendarCallback = async (code, state) => {
  const userId = verifyCalendarAuthState(state);
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  const user = await User.findById(userId).select(
    "+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.tokenExpiry"
  );
  if (!user) throw new Error("User not found");

  user.googleCalendar = {
    ...user.googleCalendar,
    connected: true,
    autoSync: user.googleCalendar?.autoSync !== false,
    calendarId: user.googleCalendar?.calendarId || "primary",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || user.googleCalendar?.refreshToken,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
  await user.save();

  return user;
};

export const disconnectCalendar = async (userId) => {
  const user = await User.findById(userId).select(
    "+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.tokenExpiry"
  );
  if (!user) throw new Error("User not found");

  if (user.googleCalendar?.connected) {
    try {
      await deleteAllCalendarEventsForUser(user);
    } catch (err) {
      console.error("Failed to delete calendar events on disconnect:", err.message);
    }
  }

  user.googleCalendar = {
    connected: false,
    autoSync: true,
    calendarId: "primary",
    accessToken: undefined,
    refreshToken: undefined,
    tokenExpiry: undefined,
    lastSyncedAt: null,
  };
  await user.save();
  await SyncEvent.deleteMany({ userId });
};

export const setCalendarAutoSync = async (userId, autoSync) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.googleCalendar.autoSync = Boolean(autoSync);
  await user.save();
  return user.googleCalendar;
};

const formatUntilDate = (endDate) => {
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 0);
  return end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
};

const buildEventBody = (schedule, medicine, timeSlot, timezone) => {
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const startDate = new Date(schedule.startDate);
  const pad = (value) => String(value).padStart(2, "0");
  const datePart = startDate.toISOString().split("T")[0];
  const startDateTime = `${datePart}T${pad(hours)}:${pad(minutes)}:00`;

  const endMinutes = hours * 60 + minutes + 15;
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  const endDateTime = `${datePart}T${pad(endHours)}:${pad(endMins)}:00`;

  const until = formatUntilDate(schedule.endDate);

  return {
    summary: `💊 ${medicine?.name || "Medicine"} — ${schedule.dosage || medicine?.dosage || ""}`,
    description: [
      `Medicine: ${medicine?.name || "N/A"}`,
      `Dosage: ${schedule.dosage || medicine?.dosage || "N/A"}`,
      `Frequency: ${schedule.frequency || medicine?.frequency || "N/A"}`,
      medicine?.instructions ? `Instructions: ${medicine.instructions}` : null,
      "Created by DoseTra",
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: startDateTime,
      timeZone: timezone,
    },
    end: {
      dateTime: endDateTime,
      timeZone: timezone,
    },
    recurrence: [`RRULE:FREQ=DAILY;UNTIL=${until}`],
  };
};

const loadCalendarUser = (userId) =>
  User.findById(userId).select(
    "+googleCalendar.accessToken +googleCalendar.refreshToken +googleCalendar.tokenExpiry"
  );

export const syncScheduleToCalendar = async (userId, scheduleId) => {
  const user = await loadCalendarUser(userId);
  if (!user?.googleCalendar?.connected) {
    return { synced: false, reason: "Calendar not connected" };
  }

  const schedule = await Schedule.findById(scheduleId).populate("medicineId");
  if (!schedule || !schedule.active) {
    return { synced: false, reason: "Schedule not found or inactive" };
  }

  const calendar = await getAuthenticatedClient(user);
  const calendarId = user.googleCalendar.calendarId || "primary";
  const timezone = user.timezone || "UTC";

  await deleteScheduleCalendarEvents(userId, scheduleId, user, { includeDeleted: true });

  const times = (schedule.times || []).filter(Boolean);
  for (const timeSlot of times) {
    const eventBody = buildEventBody(schedule, schedule.medicineId, timeSlot, timezone);
    const created = await calendar.events.insert({
      calendarId,
      requestBody: eventBody,
    });

    await SyncEvent.findOneAndUpdate(
      { userId, scheduleId, timeSlot },
      {
        userId,
        scheduleId,
        timeSlot,
        externalEventId: created.data.id,
        status: "synced",
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  user.googleCalendar.lastSyncedAt = new Date();
  await user.save();

  return { synced: true, eventCount: times.length };
};

export const deleteScheduleCalendarEvents = async (
  userId,
  scheduleId,
  existingUser = null,
  { includeDeleted = false } = {}
) => {
  const query = { userId, scheduleId };
  if (!includeDeleted) {
    query.status = { $ne: "deleted" };
  }

  const syncEvents = await SyncEvent.find(query);
  if (!syncEvents.length) return;

  const user = existingUser || (await loadCalendarUser(userId));
  if (user?.googleCalendar?.connected) {
    try {
      const calendar = await getAuthenticatedClient(user);
      const calendarId = user.googleCalendar.calendarId || "primary";

      for (const syncEvent of syncEvents) {
        try {
          await calendar.events.delete({
            calendarId,
            eventId: syncEvent.externalEventId,
          });
        } catch (err) {
          if (err.code !== 404) {
            console.error("Calendar delete error:", err.message);
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete calendar events:", err.message);
    }
  }

  await SyncEvent.updateMany(
    { userId, scheduleId },
    { status: "deleted", lastSyncedAt: new Date() }
  );
};

const deleteAllCalendarEventsForUser = async (user) => {
  const syncEvents = await SyncEvent.find({ userId: user._id, status: { $ne: "deleted" } });
  if (!syncEvents.length) return;

  const calendar = await getAuthenticatedClient(user);
  const calendarId = user.googleCalendar.calendarId || "primary";

  for (const syncEvent of syncEvents) {
    try {
      await calendar.events.delete({
        calendarId,
        eventId: syncEvent.externalEventId,
      });
    } catch (err) {
      if (err.code !== 404) {
        console.error("Calendar delete error:", err.message);
      }
    }
  }
};

export const syncAllSchedulesForUser = async (userId) => {
  const user = await loadCalendarUser(userId);
  if (!user?.googleCalendar?.connected) {
    throw new Error("Google Calendar is not connected");
  }

  const schedules = await Schedule.find({ userId, active: true });
  let totalEvents = 0;

  for (const schedule of schedules) {
    const result = await syncScheduleToCalendar(userId, schedule._id);
    if (result.synced) totalEvents += result.eventCount || 0;
  }

  user.googleCalendar.lastSyncedAt = new Date();
  await user.save();

  return { scheduleCount: schedules.length, eventCount: totalEvents };
};

export const maybeAutoSyncSchedule = async (userId, scheduleId, action = "sync") => {
  const user = await User.findById(userId);
  if (!user?.googleCalendar?.connected || user.googleCalendar.autoSync === false) {
    return;
  }

  if (action === "delete") {
    await deleteScheduleCalendarEvents(userId, scheduleId);
    return;
  }

  await syncScheduleToCalendar(userId, scheduleId);
};

export const getCalendarStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const syncedEvents = await SyncEvent.countDocuments({
    userId,
    status: "synced",
  });

  return {
    connected: user.googleCalendar?.connected || false,
    autoSync: user.googleCalendar?.autoSync !== false,
    lastSyncedAt: user.googleCalendar?.lastSyncedAt || null,
    syncedEvents,
  };
};
