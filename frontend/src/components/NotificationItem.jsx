import React from "react";
import { Bell, Dot } from "lucide-react";

const NotificationItem = ({ notification }) => {
  const doseInfo = notification.doseInfo || {};
  const isUnseen = !notification.seen;

  return (
    <div
      className={`relative p-4 mb-3 border-l-4 rounded-lg shadow-sm transition-all duration-200 cursor-pointer 
        ${isUnseen ? "bg-blue-50 border-blue-500 hover:shadow-md" : "bg-white border-gray-200 hover:shadow"}
      `}
    >
      {/* 🔵 Unseen indicator dot */}
      {isUnseen && (
        <div className="absolute top-3 right-3">
          <Dot className="w-6 h-6 text-blue-600" />
        </div>
      )}

      {/* Title + Icon */}
      <div className="flex items-center gap-2 mb-2">
        <Bell className={`w-5 h-5 ${isUnseen ? "text-blue-600" : "text-gray-400"}`} />
        <h3
          className={`font-semibold text-md tracking-wide uppercase ${
            isUnseen ? "text-gray-900" : "text-gray-700"
          }`}
        >
          {notification.title}
        </h3>
      </div>

      {/* Message */}
      <p
        className={`${
          isUnseen ? "text-gray-800 font-medium" : "text-gray-600"
        } mb-3`}
      >
        {notification.message}
      </p>

      {/* Enhanced Dose Info */}
      {doseInfo && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
          {doseInfo.medicineName && (
            <p>
              <span className="font-medium text-gray-800">Medicine:</span>{" "}
              {doseInfo.medicineName}
            </p>
          )}
          {doseInfo.medicineDosage && (
            <p>
              <span className="font-medium text-gray-800">Medicine Dosage:</span>{" "}
              {doseInfo.medicineDosage}
            </p>
          )}
          {doseInfo.form && (
            <p>
              <span className="font-medium text-gray-800">Form:</span>{" "}
              {doseInfo.form}
            </p>
          )}
          {doseInfo.instructions && (
            <p>
              <span className="font-medium text-gray-800">Instructions:</span>{" "}
              {doseInfo.instructions}
            </p>
          )}
          {doseInfo.scheduleDosage && (
            <p>
              <span className="font-medium text-gray-800">Schedule Dosage:</span>{" "}
              {doseInfo.scheduleDosage}
            </p>
          )}
          {doseInfo.scheduleFrequency && (
            <p>
              <span className="font-medium text-gray-800">
                Schedule Frequency:
              </span>{" "}
              {doseInfo.scheduleFrequency} times/day
            </p>
          )}
          {doseInfo.scheduledAt && (
            <p>
              <span className="font-medium text-gray-800">Scheduled At:</span>{" "}
              {new Date(doseInfo.scheduledAt).toLocaleString()}
            </p>
          )}
          {doseInfo.status && (
            <p>
              <span className="font-medium text-gray-800">Dose Status:</span>{" "}
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  doseInfo.status === "taken"
                    ? "bg-green-100 text-green-800"
                    : doseInfo.status === "missed"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {doseInfo.status.toUpperCase()}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Timestamp */}
      <small className="block mt-3 text-gray-400 text-xs">
        Created at: {new Date(notification.createdAt).toLocaleString()}
      </small>
    </div>
  );
};

export default NotificationItem;
