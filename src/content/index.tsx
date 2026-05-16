import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE,
  PDD_AUTO_MESSAGE_SOURCE,
  type CapturedJdResponse,
  type JdDetailWareBusinessMessage,
} from "./types/jdDetailResponse";
import App from "./views/App.tsx";
import styles from "./views/index.css?inline";

/**
 * 缓存 sendToPlugin 发送过来的最后一次京东接口响应
 */
let latestJdDetailResponse: CapturedJdResponse | null = null;

/**
 * 给 React 菜单读取最新接口响应，避免组件直接耦合 window message 监听
 */
function getLatestJdDetailResponse() {
  return latestJdDetailResponse;
}

/**
 * 判断 postMessage 是否为京东详情接口响应消息
 */
function isJdDetailWareBusinessMessage(data: unknown): data is JdDetailWareBusinessMessage {
  if (!data || typeof data !== "object") {
    return false;
  }

  const message = data as Partial<JdDetailWareBusinessMessage>;

  return (
    message.source === PDD_AUTO_MESSAGE_SOURCE &&
    message.type === JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE &&
    "payload" in message
  );
}

window.addEventListener("message", (event) => {
  if (event.source !== window || !isJdDetailWareBusinessMessage(event.data)) {
    return;
  }

  // 记录最新接口响应，handleMenuAction 点击时会通过 getter 读取这份数据
  latestJdDetailResponse = event.data.payload;

  console.log("[pdd_auto] content script 收到京东接口数据:", latestJdDetailResponse);
});

function mountApp() {
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
      <App getLatestJdDetailResponse={getLatestJdDetailResponse} />
    </StrictMode>,
  );
}

if (document.body) {
  mountApp();
} else {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
}
