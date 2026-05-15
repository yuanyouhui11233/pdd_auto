import Logo from "@/assets/crx.svg";
import { ClipboardPenLine, GripHorizontal, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Position = {
  x: number;
  y: number;
};

type DragState = {
  offsetX: number;
  offsetY: number;
};

const EDGE_PADDING = 8;

const menuItems = [
  {
    label: "采集商品",
    icon: ShoppingBag,
  },
  {
    label: "自动填写",
    icon: ClipboardPenLine,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 200 });
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width ?? 280;
      const height = rect?.height ?? 160;

      setPosition({
        x: clamp(event.clientX - dragState.offsetX, EDGE_PADDING, window.innerWidth - width - EDGE_PADDING),
        y: clamp(event.clientY - dragState.offsetY, EDGE_PADDING, window.innerHeight - height - EDGE_PADDING),
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

  return (
    <div
      ref={containerRef}
      className="fixed left-0 top-0 z-[2147483647] flex items-start gap-3"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <button
        className="flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full border-0 bg-[#288cd7] p-0 shadow transition-colors hover:bg-[#1e6aa3]"
        onClick={() => setShow((value) => !value)}
        type="button">
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
            }}>
            <GripHorizontal className="h-4 w-4 text-slate-400" />
            <span>菜单</span>
          </div>

          <div className="py-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  className="flex h-10 w-full items-center gap-3 border-0 bg-white px-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  key={item.label}
                  type="button">
                  <Icon className="h-4 w-4 text-[#288cd7]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
