import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { selectAccessToken, selectCurrentActor } from "../app/authSlice";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { baseApi } from "../app/api/baseApi";

export default function RealtimeProvider({ children }) {
  const accessToken = useSelector(selectAccessToken);
  const actor = useSelector(selectCurrentActor);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!accessToken || !actor) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);

    socket.on("notification:new", (notification) => {
      toast(notification.title, { icon: "🔔" });
      dispatch(baseApi.util.invalidateTags(["Notification"]));
    });

    socket.on("complaint:new", () => {
      dispatch(baseApi.util.invalidateTags(["Complaint", "Analytics"]));
    });

    socket.on("complaint:statusChanged", () => {
      dispatch(baseApi.util.invalidateTags(["Complaint", "Analytics"]));
    });

    return () => {
      socket.off("notification:new");
      socket.off("complaint:new");
      socket.off("complaint:statusChanged");
    };
  }, [accessToken, actor, dispatch]);

  return children;
}
