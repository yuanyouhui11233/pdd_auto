import { IParseData } from "../types/jdDetailResponse";

/**
 * 京东商品数据结构
 */
export type JdProduct = {
  // 平台标识
  platform: "jd";

  // 商品 skuId
  skuId: string;

  // 商品标题
  title: string;

  // 商品价格
  price: string;

  // 商品主图
  image: string;

  // 店铺名称
  shopName: string;

  // 商品分类面包屑
  categories: string[];

  // 当前商品链接
  url: string;

  // 采集时间
  collectedAt: string;
};

/**
 * chrome.storage.local 存储 key
 */
const STORAGE_KEY = "pdd_auto_collected_products";

/**
 * 最大保存商品数量
 *
 * 防止 local storage 无限增长
 */
const MAX_STORED_PRODUCTS = 200;

/**
 * JSON-LD 数据结构
 *
 * 页面中的:
 * <script type="application/ld+json">
 */
type JsonLdRecord = Record<string, unknown>;

/**
 * 对外暴露:
 * 采集 + 保存商品
 */
export async function collectAndSaveJdProduct() {
  // 采集当前页面商品
  const product = collectJdProductFromPage();

  // 保存到 chrome.storage.local
  await saveCollectedProduct(product);

  return product;
}
/**
 * 处理数据保存在缓存里
 */
export function parserDataByJD(data: any): IParseData {
  const parseData: IParseData = {
    baseAttr: {},
    batchMoving: false,
    category: "",
    detailImg: [],
    goodsId: "",
    goodsUrl: "",
    jdSKUImg: {},
    mainImg: [],
    platform: "",
    platformEnum: "",
    SKUImg: {},
    SKUInfo: {},
    SKUKey: {},
    SKUKeyList: [],
    SKUPrice: {},
    SKUSort: [],
    title: "",
    videoUrl: "",
  };
  // 待处理 detailImg jdSKUImg SKUImg SKUInfo  SKUPrice
  data?.productAttributeVO.attributes.forEach((item: { labelName: string; labelValue: string }) => {
    parseData.baseAttr[item.labelName] = item.labelValue;
  });
  data?.productAttributeVO.coreAttributes.forEach((item: { labelName: string; labelValue: string }) => {
    parseData.baseAttr[item.labelName] = item.labelValue;
  });
  parseData.category = data?.pageConfigVO?.catName.join("-");
  parseData.goodsId = data?.wareInfoReadMap?.product_id;
  parseData.goodsUrl = window.location.href;
  let baseUrl = "https://img30.360buyimg.com/popWareDetail/";
  let skuBaseUrl = "https://img13.360buyimg.com/pcpubliccms/s800x800_";
  parseData.mainImg = data?.mainImageVO?.carouselArea.map(
    (item: { imageUrl?: String; siteType: String }) => baseUrl + item?.imageUrl,
  );
  data?.colorSizeVO?.colorSizeList.forEach(
    (item: {
      buttons: [
        {
          fullImageUrl?: string;
          imageType?: number;
          no: string;
          skuId: string;
          skuList: [string];
          stock: string;
          text: string;
        },
      ];
      supportCustom: boolean;
      title: string;
    }) => {
      parseData.SKUSort.push(item.title);
      item.buttons.forEach((btn) => {
        const text = btn?.text || "";
        const skuList = btn?.skuList || [];
        if (btn.fullImageUrl) {
          parseData.SKUImg[btn.text] = skuBaseUrl + btn.fullImageUrl;
        }
        for (const skuId of skuList) {
          if (!parseData.SKUKey[skuId]) {
            parseData.SKUKey[skuId] = [];
          }

          parseData.SKUKey[skuId].push(text);
        }
      });
    },
  );
  parseData.SKUKeyList = Object.keys(parseData.SKUKey);
  parseData.title = data?.wareInfoReadMap?.product_name || "【商品名】";
  return parseData;
}

/**
 * 从当前页面采集商品信息
 */
function collectJdProductFromPage(): JdProduct {
  // 当前页面 URL
  const currentUrl = new URL(window.location.href);
  console.log("当前页URL", currentUrl);
  // jd商品页 origin:"https://item.jd.com"
  // 尝试读取页面 JSON-LD
  const jsonLdProduct = readJsonLdProduct(document);

  // 获取 skuId
  const skuId = getSkuId(currentUrl);

  /**
   * 判断是否为京东商品详情页
   */
  if (!isJdProductDetailPage(currentUrl, skuId)) {
    throw new Error("请在京东商品详情页使用采集商品");
  }

  /**
   * 获取商品标题
   *
   * 多来源兜底:
   * 1.DOM
   * 2.JSON-LD
   * 3.meta
   * 4.document.title
   */
  const title = firstValue([
    getText(["#name h1", ".sku-name", "[class*='sku-name']", "h1"]),

    getJsonLdString(jsonLdProduct, "name"),

    getMetaContent(["meta[property='og:title']", "meta[name='title']"]),

    cleanupTitle(document.title),
  ]);

  /**
   * 标题不存在说明页面未正常加载
   */
  if (!title) {
    throw new Error("未识别到商品标题，请确认当前页面已加载完成");
  }

  return {
    platform: "jd",

    skuId,

    title,

    /**
     * 获取价格
     *
     * 优先级:
     * 1.DOM
     * 2.JSON-LD
     * 3.script 正则
     */
    price: firstValue([
      getPriceFromDom(),

      getJsonLdPrice(jsonLdProduct),

      findScriptValue(/["']?(?:jdPrice|price|p)["']?\s*[:=]\s*["']?([0-9]+(?:\.[0-9]+)?)/i),
    ]),

    /**
     * 获取商品主图
     */
    image: normalizeUrl(
      firstValue([
        getImageFromDom(),

        getJsonLdImage(jsonLdProduct),

        getMetaContent(["meta[property='og:image']", "meta[name='og:image']"]),

        findScriptValue(/["']?(?:image|imgUrl|mainImage)["']?\s*[:=]\s*["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i),
      ]),
    ),

    /**
     * 获取店铺名称
     */
    shopName: firstValue([
      getText(["#popbox .name a", ".J-hove-wrap .name a", ".shopName", "[class*='shopName']"]),

      findScriptValue(/["']?shopName["']?\s*[:=]\s*["']([^"']+)/i),
    ]),

    /**
     * 获取分类面包屑
     */
    categories: getCategories(),

    // 商品 URL
    url: currentUrl.href,

    // 采集时间
    collectedAt: new Date().toISOString(),
  };
}

/**
 * 判断是否为京东商品详情页
 */
function isJdProductDetailPage(url: URL, skuId: string) {}

/**
 * 获取商品 skuId
 *
 * 多种来源:
 * 1.URL path
 * 2.query 参数
 * 3.meta
 * 4.script
 */
function getSkuId(url: URL) {
  return firstValue([
    // https://item.jd.com/123456.html
    url.pathname.match(/\/(?:product\/)?(\d+)\.html/i)?.[1],

    url.searchParams.get("sku") ?? "",

    url.searchParams.get("skuId") ?? "",

    getMetaContent(["meta[name='sku']", "meta[property='product:retailer_item_id']"]),

    findScriptValue(/["']?skuId["']?\s*[:=]\s*["']?(\d{5,})/i),
  ]);
}

/**
 * 从 DOM 获取价格
 */
function getPriceFromDom() {
  return normalizePrice(
    getText([
      ".summary-price .p-price .price",
      ".summary-price .price",
      ".p-price .price",
      "#jd-price",
      "[class*='summary-price'] [class*='price']",
    ]),
  );
}

/**
 * 从 DOM 获取商品主图
 */
function getImageFromDom() {
  return getImageSource(["#spec-img", "#preview img", ".jqzoom img", "[class*='preview'] img"]);
}

/**
 * 获取分类面包屑
 */
function getCategories() {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("#crumb-wrap a, .crumb a, .breadcrumb a"))
      .map((element) => normalizeText(element.innerText || element.textContent || ""))

      // 去掉空值和“京东首页”
      .filter((value) => value && value !== "京东首页")
  );
}

/**
 * 从多个 selector 获取文本
 */
function getText(selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);

    const value = normalizeText(element?.innerText || element?.textContent || "");

    if (value) {
      return value;
    }
  }

  return "";
}

/**
 * 获取 meta content
 */
function getMetaContent(selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLMetaElement>(selector);

    const value = normalizeText(element?.content || "");

    if (value) {
      return value;
    }
  }

  return "";
}

/**
 * 获取图片 src
 *
 * 支持:
 * - src
 * - currentSrc
 * - lazy load
 */
function getImageSource(selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLImageElement>(selector);

    const value = firstValue([
      element?.currentSrc ?? "",
      element?.src ?? "",
      element?.getAttribute("data-origin") ?? "",
      element?.getAttribute("data-lazy-img") ?? "",
    ]);

    if (value) {
      return value;
    }
  }

  return "";
}

/**
 * 在 script 中通过正则匹配字段
 *
 * 用于读取:
 * window.xxx = {}
 */
function findScriptValue(pattern: RegExp) {
  for (const script of document.scripts) {
    const text = script.textContent || "";

    const value = text.match(pattern)?.[1] ?? "";

    if (value) {
      return normalizeText(value);
    }
  }

  return "";
}

/**
 * 读取页面 JSON-LD
 *
 * SEO 数据通常存在:
 * <script type="application/ld+json">
 */
function readJsonLdProduct(doc: Document) {
  for (const script of doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')) {
    const text = script.textContent?.trim();

    if (!text) {
      continue;
    }

    try {
      const parsed = JSON.parse(text) as unknown;

      const product = findJsonLdProduct(parsed);

      if (product) {
        return product;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * 深度查找 JSON-LD Product
 */
function findJsonLdProduct(value: unknown): JsonLdRecord | null {
  // 数组递归
  if (Array.isArray(value)) {
    for (const item of value) {
      const product = findJsonLdProduct(item);

      if (product) {
        return product;
      }
    }
  }

  // 非对象
  if (!isRecord(value)) {
    return null;
  }

  /**
   * 判断:
   * @type === Product
   */
  if (jsonLdTypeIncludes(value["@type"], "Product")) {
    return value;
  }

  /**
   * 部分 JSON-LD 在 @graph 中
   */
  return findJsonLdProduct(value["@graph"]);
}

/**
 * 获取 JSON-LD 字符串字段
 */
function getJsonLdString(product: JsonLdRecord | null, key: string) {
  const value = product?.[key];

  return typeof value === "string" ? normalizeText(value) : "";
}

/**
 * 获取 JSON-LD 图片
 */
function getJsonLdImage(product: JsonLdRecord | null) {
  const value = product?.image;

  if (typeof value === "string") {
    return value;
  }

  // image: []
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return "";
}

/**
 * 获取 JSON-LD 价格
 */
function getJsonLdPrice(product: JsonLdRecord | null) {
  const offers = product?.offers;

  // offers: []
  if (Array.isArray(offers)) {
    return getOfferPrice(offers[0]);
  }

  return getOfferPrice(offers);
}

/**
 * 获取 Offer price
 */
function getOfferPrice(offer: unknown) {
  if (!isRecord(offer)) {
    return "";
  }

  const value = offer.price ?? offer.lowPrice;

  return normalizePrice(typeof value === "number" ? String(value) : typeof value === "string" ? value : "");
}

/**
 * 判断 @type 是否包含目标类型
 */
function jsonLdTypeIncludes(value: unknown, expected: string): boolean {
  if (typeof value === "string") {
    return value.toLowerCase() === expected.toLowerCase();
  }

  return Array.isArray(value) && value.some((item) => jsonLdTypeIncludes(item, expected));
}

/**
 * 清理页面 title
 */
function cleanupTitle(value: string) {
  return normalizeText(
    value
      .replace(/【.*?】-京东$/u, "")
      .replace(/-京东JD\.COM.*$/u, "")
      .replace(/京东.*$/u, ""),
  );
}

/**
 * 文本标准化
 */
function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * 价格标准化
 *
 * 统一:
 * ¥123.00
 */
function normalizePrice(value: string) {
  const match = normalizeText(value)
    .replace(/,/g, "")
    .match(/(?:¥|￥)?\s*([0-9]+(?:\.[0-9]+)?)/u);

  return match ? `¥${match[1]}` : "";
}

/**
 * URL 标准化
 *
 * 支持:
 * //img.jpg
 */
function normalizeUrl(value: string) {
  const source = normalizeText(value);

  if (!source) {
    return "";
  }

  try {
    return new URL(source.startsWith("//") ? `${window.location.protocol}${source}` : source, window.location.href)
      .href;
  } catch {
    return source;
  }
}

/**
 * 获取第一个有效值
 */
function firstValue(values: Array<string | null | undefined>) {
  return values.find((value) => Boolean(value?.trim()))?.trim() ?? "";
}

/**
 * 判断是否为 object
 */
function isRecord(value: unknown): value is JsonLdRecord {
  return typeof value === "object" && value !== null;
}

/**
 * 保存商品到 chrome.storage.local
 */
async function saveCollectedProduct(product: JdProduct) {
  /**
   * 检查 storage 权限
   */
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("扩展存储不可用，请确认 manifest 已开启 storage 权限");
  }

  /**
   * 获取已有商品
   */
  const result = await chrome.storage.local.get(STORAGE_KEY);

  const storedProducts = result[STORAGE_KEY] as unknown;

  /**
   * 过滤非法数据
   */
  const products = Array.isArray(storedProducts) ? storedProducts.filter(isJdProduct) : [];

  /**
   * 去重:
   * 相同 skuId 只保留最新
   */
  const nextProducts = [
    product,

    ...products.filter((item) => item.skuId !== product.skuId || item.platform !== product.platform),
  ].slice(0, MAX_STORED_PRODUCTS);

  /**
   * 保存
   */
  await chrome.storage.local.set({
    [STORAGE_KEY]: nextProducts,
  });
}

/**
 * 判断是否为合法商品结构
 */
function isJdProduct(value: unknown): value is JdProduct {
  return (
    isRecord(value) &&
    value.platform === "jd" &&
    typeof value.skuId === "string" &&
    typeof value.title === "string" &&
    typeof value.url === "string"
  );
}
