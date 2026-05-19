import type { IParseData } from "../types/jdDetailResponse";

/**
 * 采集后的商品解析数据缓存 key
 */
export const PARSED_PRODUCT_STORAGE_KEY = "pdd_auto_parsed_jd_product";

export type CachedParsedProduct = {
  // parserDataByJD 处理后的商品数据
  data: IParseData;

  // 写入缓存的时间，方便后续判断数据新旧
  cachedAt: string;

  // 当前商品页链接，方便后续确认缓存来源
  sourceUrl: string;
};

/**
 * 保存解析后的商品数据到 chrome.storage.local
 */
export async function saveParsedProductToCache(parseData: IParseData) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("扩展缓存不可用，请确认 manifest 已开启 storage 权限");
  }

  const cachedData: CachedParsedProduct = {
    data: parseData,
    cachedAt: new Date().toISOString(),
    sourceUrl: parseData.goodsUrl,
  };

  await chrome.storage.local.set({
    [PARSED_PRODUCT_STORAGE_KEY]: cachedData,
  });
}

/**
 * 从 chrome.storage.local 读取上一次采集成功的商品数据
 */
export async function getParsedProductFromCache() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("扩展缓存不可用，请确认 manifest 已开启 storage 权限");
  }

  const result = await chrome.storage.local.get(PARSED_PRODUCT_STORAGE_KEY);
  const cachedProduct = result[PARSED_PRODUCT_STORAGE_KEY];

  return isCachedParsedProduct(cachedProduct) ? cachedProduct : null;
}

/**
 * 校验缓存结构，避免脏缓存导致后续自动填写读取异常
 */
export function isCachedParsedProduct(value: unknown): value is CachedParsedProduct {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<CachedParsedProduct>;

  return Boolean(record.data && typeof record.cachedAt === "string" && typeof record.sourceUrl === "string");
}
