import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { appStore } from "./app/store.js";
import { Toaster } from "sonner";
import ScrollToTop from "./components/ScrollToTop";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const appTree = (
  <Provider store={appStore}>
    <BrowserRouter>
      <ScrollToTop />
      <App />
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  </Provider>
);

createRoot(document.getElementById("root")).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
  ) : (
    appTree
  )
);
