import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import AppRouter from "./routes/AppRouter";
import AuthBootstrap from "./components/AuthBootstrap";
import PartyAuthBootstrap from "./components/PartyAuthBootstrap";
import RealtimeProvider from "./components/RealtimeProvider";
import { selectTheme } from "./app/themeSlice";

export default function App() {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <AuthBootstrap>
      <PartyAuthBootstrap>
        <RealtimeProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: "rgb(30 41 59)", color: "#f1f5f9", border: "1px solid rgb(51 65 85)" },
            }}
          />
        </RealtimeProvider>
      </PartyAuthBootstrap>
    </AuthBootstrap>
  );
}
