import { ClipboardPenLine } from "lucide-react";
import { useState } from "react";
import type { CachedParsedProduct } from "../storage/parsedProduct";

type AutoFillPanelProps = {
  // 当前缓存中的商品采集数据，后续不同平台上传页都可以复用这份数据展示
  cachedProduct: CachedParsedProduct | null;

  // 点击开始填写时执行的外部平台填写逻辑
  onStartFill?: () => Promise<string | void> | string | void;
};

type FillStatus = {
  // 填写状态类型，用于展示成功或错误提示
  type: "success" | "error";

  // 填写状态文案
  message: string;
};

function AutoFillPanel({ cachedProduct, onStartFill }: AutoFillPanelProps) {
  const parseData = cachedProduct?.data ?? null;
  const [isFilling, setIsFilling] = useState(false);
  const [fillStatus, setFillStatus] = useState<FillStatus | null>(null);

  const handleStartFill = async () => {
    if (!parseData || !onStartFill) {
      return;
    }

    setIsFilling(true);
    setFillStatus(null);

    try {
      // 具体填写逻辑由当前平台注入，组件只负责触发和展示状态
      const message = await onStartFill();
      setFillStatus({
        type: "success",
        message: message || "填写完成",
      });
    } catch (error) {
      setFillStatus({
        type: "error",
        message: error instanceof Error ? error.message : "填写失败，请稍后重试",
      });
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <section className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardPenLine className="h-4 w-4 text-[#288cd7]" />
            <span>商品采集数据</span>
          </div>
        </div>

        <button
          className="h-8 shrink-0 rounded-md border border-[#288cd7] bg-[#288cd7] px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          disabled={!parseData || isFilling || !onStartFill}
          onClick={() => void handleStartFill()}
          type="button">
          {isFilling ? "填写中" : "开始填写"}
        </button>
      </div>

      {parseData && (
        <div className="mt-3 flex text-xs">
          <GoodsInfoItem
            url={Object.values(parseData.SKUImg)[0]}
            title={parseData.title}
            category={parseData.category}
          />
          <DataItem label="原价" value={Object.values(parseData.SKUPrice)[0]?.price ?? ""} />
          <DataItem label="券后价" value={Object.values(parseData.SKUPrice)[0]?.price ?? ""} />
          <DataItem label="店铺名" value={""} />
        </div>
      )}

      {fillStatus && (
        <div className={`mt-2 text-xs ${fillStatus.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {fillStatus.message}
        </div>
      )}
    </section>
  );
}

type DataItemProps = {
  // 展示字段名称
  label: string;

  // 展示字段值
  value: string;
};

function DataItem({ label, value }: DataItemProps) {
  return (
    <div className="min-w-0 rounded">
      <div className="bg-neutral-50 text-base py-4 px-6">{label}</div>
      <div className="mt-0.5 truncate font-medium text-slate-700 text-center py-1" title={value}>
        {value}
      </div>
    </div>
  );
}

type GoodsInfoItemProps = {
  url: string;
  title: string;
  category: string;
};
function GoodsInfoItem({ url, title, category }: GoodsInfoItemProps) {
  return (
    <div>
      <div className="bg-neutral-50 text-base py-4 px-6">商品信息</div>
      <div className="flex gap-3 mt-0.5 py-1 px-2">
        <img src={url} alt="" className="w-20 h-20 rounded object-cover" />
        <div className="flex flex-col justify-around">
          <div>{title}</div>
          <div className="text-slate-400">{category}</div>
        </div>
      </div>
    </div>
  );
}

export default AutoFillPanel;
