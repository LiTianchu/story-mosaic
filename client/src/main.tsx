import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "./Router";
import { SocketProvider } from "./context/SocketProvider";

export const RootApp = () => {
  return <Router />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SocketProvider>
      <RootApp />
    </SocketProvider>
  </StrictMode>,
);
