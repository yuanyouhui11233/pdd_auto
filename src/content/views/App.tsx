import Logo from "@/assets/crx.svg";
import {
  CheckCircle2,
  ClipboardPenLine,
  GripHorizontal,
  Loader2,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { parserDataByJD } from "../collectors/jdProduct";
import { getParsedProductFromCache, saveParsedProductToCache } from "../storage/parsedProduct";
import type { CapturedJdResponse } from "../types/jdDetailResponse";

type Position = {
  x: number;
  y: number;
};

type DragState = {
  offsetX: number;
  offsetY: number;
};

type MenuAction = "collectProduct" | "autoFill";

type CollectStatus = {
  type: "success" | "error" | "info";
  message: string;
};

type AppProps = {
  // 读取 content script 缓存的最后一次京东接口响应
  getLatestJdDetailResponse: () => CapturedJdResponse | null;
};

const EDGE_PADDING = 8;

/**
 * 拼多多商品发布类目选择页
 */
const PDD_GOODS_CATEGORY_URL = "https://mms.pinduoduo.com/goods/category";

const menuItems = [
  {
    label: "采集商品",
    icon: ShoppingBag,
    action: "collectProduct" as const,
  },
  {
    label: "自动填写",
    icon: ClipboardPenLine,
    action: "autoFill" as const,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function App({ getLatestJdDetailResponse }: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 200 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectStatus, setCollectStatus] = useState<CollectStatus | null>(null);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width ?? 280;
      const height = rect?.height ?? 160;

      setPosition({
        x: clamp(
          event.clientX - dragState.offsetX,
          EDGE_PADDING,
          window.innerWidth - width - EDGE_PADDING,
        ),
        y: clamp(
          event.clientY - dragState.offsetY,
          EDGE_PADDING,
          window.innerHeight - height - EDGE_PADDING,
        ),
      });
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState]);

  const handleMenuAction = async (action: MenuAction) => {
    setCollectStatus(null);

    if (action === "autoFill") {
      try {
        // 自动填写前先读取已采集商品缓存，没有缓存时不跳转
        const cachedProduct = await getParsedProductFromCache();

        if (!cachedProduct) {
          setCollectStatus({
            type: "error",
            message: "请先采集商品信息",
          });
          return;
        }

        // 已经采集到商品信息，跳转到拼多多商品发布类目页
        window.open(PDD_GOODS_CATEGORY_URL, "_blank");
      } catch (error) {
        setCollectStatus({
          type: "error",
          message: error instanceof Error ? error.message : "读取采集缓存失败，请重新采集",
        });
      }

      return;
    }

    setIsCollecting(true);

    // 当前菜单动作可直接使用这份最新京东接口响应数据
    const latestJdDetailResponse = getLatestJdDetailResponse();

    // 打印 sendToPlugin 发送、并由 content script 缓存的接口响应数据
    console.log("[pdd_auto] handleMenuAction 收到京东接口数据:", latestJdDetailResponse);

    try {
      const parseData = parserDataByJD(latestJdDetailResponse?.data);
      console.log("处理好的数据", parseData);

      // 采集成功后把解析完成的数据写入扩展缓存，后续自动填写可直接读取
      await saveParsedProductToCache(parseData);

      setCollectStatus({
        type: "success",
        message: `已采集：${formatTitle(parseData.title)}`,
      });
    } catch (error) {
      setCollectStatus({
        type: "error",
        message: error instanceof Error ? error.message : "采集失败，请稍后重试",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed left-0 top-0 z-[2147483647] flex items-start gap-3"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <button
        className="flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full border-0 bg-[#288cd7] p-0 shadow transition-colors hover:bg-[#1e6aa3]"
        onClick={() => setShow((value) => !value)}
        type="button"
      >
        <img src={Logo} alt="CRXJS logo" className="h-7 w-7 p-1" />
      </button>

      {show && (
        <div className="w-56 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl">
          <div
            className="flex h-10 cursor-move select-none items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-700"
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return;
              }

              event.preventDefault();
              setDragState({
                offsetX: event.clientX - position.x,
                offsetY: event.clientY - position.y,
              });
            }}
          >
            <GripHorizontal className="h-4 w-4 text-slate-400" />
            <span>菜单</span>
          </div>

          <div className="py-1.5">
            {menuItems.map((item) => {
              const Icon = item.action === "collectProduct" && isCollecting ? Loader2 : item.icon;

              return (
                <button
                  className="flex h-10 w-full items-center gap-3 border-0 bg-white px-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={item.action === "collectProduct" && isCollecting}
                  key={item.label}
                  onClick={() => void handleMenuAction(item.action)}
                  type="button"
                >
                  <Icon
                    className={`h-4 w-4 text-[#288cd7] ${item.action === "collectProduct" && isCollecting ? "animate-spin" : ""}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {collectStatus && (
            <div
              className={`mx-3 mb-3 flex items-start gap-2 rounded-md px-2 py-2 text-xs ${
                collectStatus.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : collectStatus.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {collectStatus.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>{collectStatus.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTitle(title: string) {
  return title.length > 18 ? `${title.slice(0, 18)}...` : title;
}

export default App;
