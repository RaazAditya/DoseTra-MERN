import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchNotifications, markNotificationsSeen ,markAllSeenLocally} from "@/features/notificationSlice";
import NotificationItem from "@/components/NotificationItem";

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notifications);

  useEffect(() => {
    // dispatch(fetchNotifications());
    dispatch(markNotificationsSeen());
    return () => {
    
      dispatch(markAllSeenLocally());
    };
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (!items.length) return <div>No notifications</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {items.map((n) => (
        <NotificationItem key={n._id} notification={n} />
      ))}
    </div>
  );
};

export default NotificationsPage;
