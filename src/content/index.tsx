import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./views/App.tsx";
import styles from "./views/index.css?inline";

const hostId = "pdd-auto-root";
document.getElementById(hostId)?.remove();

const host = document.createElement("div");
host.id = hostId;
document.body.appendChild(host);

const shadowRoot = host.attachShadow({ mode: "open" });
const style = document.createElement("style");
style.textContent = styles;
shadowRoot.appendChild(style);

const mount = document.createElement("div");
shadowRoot.appendChild(mount);

createRoot(mount).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
