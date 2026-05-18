import type { IParseData, ISkuTitle } from "../types/jdDetailResponse";

type UnknownRecord = Record<string, unknown>;

type JdAttribute = {
  labelName?: unknown;
  labelValue?: unknown;
};

type JdImageItem = {
  imageUrl?: unknown;
  fullImageUrl?: unknown;
  imgUrl?: unknown;
  url?: unknown;
};

type JdSkuButton = {
  fullImageUrl?: unknown;
  imageUrl?: unknown;
  imgUrl?: unknown;
  text?: unknown;
  name?: unknown;
  title?: unknown;
  skuId?: unknown;
  skuList?: unknown;
};

/**
 * 京东主图接口里只有 jfs 路径时使用的图片域名
 */
const JD_MAIN_IMAGE_PREFIX = "https://img30.360buyimg.com/popWareDetail/";

/**
 * 京东 SKU 图接口里只有 jfs 路径时使用的图片域名
 */
const JD_SKU_IMAGE_PREFIX = "https://img13.360buyimg.com/pcpubliccms/s800x800_";

/**
 * 我们注入脚本缓存京东网络响应的 localStorage key
 */
const PDD_AUTO_JD_NET_DATA_STORAGE_KEY = "pdd_auto_jd_net_data";

/**
 * 页面图片常见的懒加载属性
 */
const IMAGE_SOURCE_ATTRIBUTES = ["src", "data-src", "data-original", "data-lazy-img", "data-lazyload", "data-url"];

/**
 * 处理 pc_detailpage_wareBusiness 京东商品详情接口响应
 */
export function parserDataByJD(data: unknown): IParseData {
  const source = toRecord(data);

  if (!source) {
    throw new Error("未获取到京东商品详情接口数据，请刷新商品页后重试");
  }

  const parseData = createEmptyParseData();
  const networkRecords = readJdNetworkCache();
  const pageStateRecords = collectJdPageStateRecords();

  // 接口里稳定存在的基础信息先解析出来
  parseBaseAttributes(parseData, source);
  parseBasicInfo(parseData, source);
  parseMainImages(parseData, source);
  parseSkuData(parseData, source);

  // 商品详情图只从已经渲染的 #detail-main DOM 中读取
  parseData.detailImg = collectDetailImagesFromDom();
  mergeSkuImagesFromPage(parseData);
  fillSkuInfo(parseData, source, pageStateRecords);
  fillSkuPrices(parseData, source, networkRecords, pageStateRecords);
  fillJdSkuImages(parseData);

  return parseData;
}

/**
 * 初始化解析结果，保证下游读取字段时不用判断 undefined
 */
function createEmptyParseData(): IParseData {
  return {
    baseAttr: {},
    batchMoving: false,
    category: "",
    detailImg: [],
    goodsId: "",
    goodsUrl: getCurrentPageUrl(),
    jdSKUImg: {},
    mainImg: [],
    platform: "jd",
    platformEnum: "JD",
    SKUImg: {},
    SKUInfo: {},
    SKUKey: {},
    SKUKeyList: [],
    SKUPrice: {},
    SKUSort: [],
    title: "",
    videoUrl: "",
  };
}

/**
 * 解析商品参数和核心参数
 */
function parseBaseAttributes(parseData: IParseData, source: UnknownRecord) {
  const productAttributeVO = toRecord(source.productAttributeVO);
  const attributes = [...toArray(productAttributeVO?.attributes), ...toArray(productAttributeVO?.coreAttributes)];

  for (const item of attributes) {
    const attribute = toRecord(item) as JdAttribute | null;
    const labelName = toText(attribute?.labelName);
    const labelValue = toText(attribute?.labelValue);

    if (labelName && labelValue) {
      parseData.baseAttr[labelName] = labelValue;
    }
  }
}

/**
 * 解析商品 ID、标题、分类、链接、视频等基础信息
 */
function parseBasicInfo(parseData: IParseData, source: UnknownRecord) {
  const pageConfigVO = toRecord(source.pageConfigVO);
  const wareInfoReadMap = toRecord(source.wareInfoReadMap);
  const mainImageVO = toRecord(source.mainImageVO);

  parseData.goodsId = firstText([
    wareInfoReadMap?.product_id,
    wareInfoReadMap?.skuId,
    source.skuId,
    pageConfigVO?.skuId,
    getSkuIdFromUrl(),
  ]);

  parseData.title =
    firstText([
      wareInfoReadMap?.product_name,
      wareInfoReadMap?.wname,
      wareInfoReadMap?.name,
      source.title,
      getTitleFromPage(),
    ]) || "【商品名】";

  parseData.category = firstText([
    toTextList(pageConfigVO?.catName).join("-"),
    toTextList(source.crumbs)
      .filter((item) => item !== "京东首页")
      .join("-"),
  ]);

  parseData.videoUrl = firstImageUrl(mainImageVO, ["videoUrl", "video_url", "playUrl"], "");
}

/**
 * 解析商品主图，接口无数据时从页面主图区域兜底
 */
function parseMainImages(parseData: IParseData, source: UnknownRecord) {
  const mainImageVO = toRecord(source.mainImageVO);
  const carouselArea = toArray(mainImageVO?.carouselArea);

  for (const item of carouselArea) {
    const image = firstImageUrl(
      toRecord(item) as JdImageItem | null,
      ["imageUrl", "fullImageUrl", "imgUrl", "url"],
      JD_MAIN_IMAGE_PREFIX,
    );

    pushUnique(parseData.mainImg, image);
  }

  // 部分页面接口没有返回完整主图列表，直接读取页面缩略图作为补充
  for (const image of collectImagesBySelectors(["#spec-list img", "#preview img", "#spec-img", ".spec-list img"])) {
    pushUnique(parseData.mainImg, image);
  }

  // 页面全局对象里有时会保留完整图片列表
  for (const image of collectImagesFromPageState(["mainImageVO", "imageList", "imageListData", "wareImage"])) {
    pushUnique(parseData.mainImg, image);
  }
}

/**
 * 解析规格维度、规格值、SKUKey 和接口内可得到的 SKU 图
 */
function parseSkuData(parseData: IParseData, source: UnknownRecord) {
  const colorSizeVO = toRecord(source.colorSizeVO);
  const colorSizeList = toArray(colorSizeVO?.colorSizeList);

  for (const item of colorSizeList) {
    const group = toRecord(item);
    const title = toText(group?.title);

    pushUnique(parseData.SKUSort, title);

    for (const buttonItem of toArray(group?.buttons)) {
      const button = toRecord(buttonItem) as JdSkuButton | null;
      const skuText = firstText([button?.text, button?.name, button?.title]);
      const skuIds = getSkuIdsFromButton(button);
      const skuImage = firstImageUrl(button, ["fullImageUrl", "imageUrl", "imgUrl"], JD_SKU_IMAGE_PREFIX);

      if (skuText && skuImage) {
        parseData.SKUImg[skuText] = skuImage;
        appendSkuImage(parseData.jdSKUImg, skuText, skuImage);
      }

      for (const skuId of skuIds) {
        parseData.SKUKey[skuId] ??= [];
        pushUnique(parseData.SKUKey[skuId], skuText);
      }
    }
  }

  // 单 SKU 商品可能没有 colorSizeList，这里仍然给下游保留 goodsId
  if (Object.keys(parseData.SKUKey).length === 0 && parseData.goodsId) {
    parseData.SKUKey[parseData.goodsId] = [];
  }

  parseData.SKUKeyList = Object.keys(parseData.SKUKey);
}

/**
 * 从商品详情 DOM 中读取详情图
 *
 * 目标结构:
 * #detail-main > div > div > img
 */
function collectDetailImagesFromDom() {
  const images: string[] = [];

  if (typeof document === "undefined") {
    return images;
  }

  const detailMain = document.querySelector<HTMLElement>("#detail-main");

  if (!detailMain) {
    return images;
  }

  // 详情图只从 #detail-main 容器内采集，避免主图、SKU 图或接口缓存图片混入 detailImg
  for (const image of Array.from(detailMain.querySelectorAll<HTMLImageElement>("img"))) {
    pushUnique(images, normalizeImageUrl(image.currentSrc || image.src));

    for (const attr of IMAGE_SOURCE_ATTRIBUTES) {
      pushUnique(images, normalizeImageUrl(image.getAttribute(attr)));
    }
  }

  // 去重后保持原始顺序，方便后续调试和展示
  return images.filter(isLikelyProductImage);
}

/**
 * 从页面规格区域补充 SKU 图片
 */
function mergeSkuImagesFromPage(parseData: IParseData) {
  if (typeof document === "undefined") {
    return;
  }

  const skuElements = document.querySelectorAll<HTMLElement>(
    "#choose-attrs .item, .choose-attrs .item, #choose-attr-1 .item, [class*='choose'] li, [class*='choose'] .item",
  );

  for (const element of skuElements) {
    const skuText = normalizeText(element.textContent || element.getAttribute("title") || "");
    const image = collectImagesFromElement(element)[0] ?? "";

    if (skuText && image && !parseData.SKUImg[skuText]) {
      parseData.SKUImg[skuText] = image;
      appendSkuImage(parseData.jdSKUImg, skuText, image);
    }
  }

  for (const [skuText, image] of Object.entries(collectSkuImagesFromPageState())) {
    if (!parseData.SKUImg[skuText]) {
      parseData.SKUImg[skuText] = image;
    }

    appendSkuImage(parseData.jdSKUImg, skuText, image);
  }
}

/**
 * 生成 SKUInfo，接口没有标题结构时使用 SKUKey 和商品标题兜底
 */
function fillSkuInfo(parseData: IParseData, source: UnknownRecord, pageStateRecords: UnknownRecord[]) {
  const skuIds = getResultSkuIds(parseData);
  const sourceSkuInfo = collectSkuInfoFromData([source, ...pageStateRecords], new Set(skuIds));

  for (const skuId of skuIds) {
    const skuValues = parseData.SKUKey[skuId] ?? [];
    const sourceTitle = sourceSkuInfo[skuId];

    parseData.SKUInfo[skuId] = {
      titleList: {
        longTitle: sourceTitle?.longTitle || parseData.title,
        skuName: sourceTitle?.skuName || skuValues.join(" "),
      },
    };
  }
}

/**
 * 生成 SKUPrice，接口没有价格时使用页面当前价格兜底当前 SKU
 */
function fillSkuPrices(
  parseData: IParseData,
  source: UnknownRecord,
  networkRecords: UnknownRecord[],
  pageStateRecords: UnknownRecord[],
) {
  const skuIds = getResultSkuIds(parseData);
  const priceMap = {
    ...collectSkuPricesFromData([source, ...networkRecords, ...pageStateRecords], new Set(skuIds)),
    ...collectSkuPricesFromScripts(new Set(skuIds)),
  };
  const currentDomPrice = getCurrentDomPrice();

  for (const skuId of skuIds) {
    const price = priceMap[skuId] ?? (skuId === parseData.goodsId ? currentDomPrice : "");

    parseData.SKUPrice[skuId] = {
      price,
    };
  }
}

/**
 * 生成 jdSKUImg，当前选中 SKU 的主图归到第一个规格值下
 */
function fillJdSkuImages(parseData: IParseData) {
  for (const [skuText, image] of Object.entries(parseData.SKUImg)) {
    appendSkuImage(parseData.jdSKUImg, skuText, image);
  }

  const selectedSkuValues = parseData.SKUKey[parseData.goodsId] ?? [];
  const selectedImageSku =
    selectedSkuValues.find((value) => Boolean(parseData.SKUImg[value])) || selectedSkuValues[0] || "";

  if (selectedImageSku) {
    for (const image of parseData.mainImg) {
      appendSkuImage(parseData.jdSKUImg, selectedImageSku, image);
    }
  }
}

/**
 * 从规格按钮提取关联的 skuId 列表
 */
function getSkuIdsFromButton(button: JdSkuButton | null) {
  const skuIds: string[] = [];

  for (const value of [button?.skuId, button?.skuList]) {
    if (Array.isArray(value)) {
      for (const item of value) {
        pushUnique(skuIds, normalizeSkuId(item));
      }
    } else {
      for (const skuId of extractSkuIdsFromText(value)) {
        pushUnique(skuIds, skuId);
      }
    }
  }

  return skuIds;
}

/**
 * 从接口响应里递归提取 skuId -> 标题信息
 */
function collectSkuInfoFromData(sources: unknown[], skuIds: Set<string>) {
  const result: Record<string, ISkuTitle> = {};

  for (const source of sources) {
    walkRecord(source, (record) => {
      const explicitSkuId = firstText([record.skuId, record.sku_id, record.id, record.wareId, record.productId]);
      const matchedSkuId = normalizeSkuId(explicitSkuId);

      if (matchedSkuId && skuIds.has(matchedSkuId)) {
        const title = readSkuTitle(record);

        if (title) {
          result[matchedSkuId] = title;
        }
      }

      for (const [key, value] of Object.entries(record)) {
        const skuId = normalizeSkuId(key);
        const valueRecord = toRecord(value);

        if (skuId && skuIds.has(skuId) && valueRecord) {
          const title = readSkuTitle(valueRecord);

          if (title) {
            result[skuId] = title;
          }
        }
      }
    });
  }

  return result;
}

/**
 * 从对象里读取 SKU 标题结构
 */
function readSkuTitle(record: UnknownRecord): ISkuTitle | null {
  const titleList = toRecord(record.titleList);
  const longTitle = firstText([
    titleList?.longTitle,
    record.longTitle,
    record.productName,
    record.product_name,
    record.wname,
    record.title,
    record.name,
  ]);
  const skuName = firstText([
    titleList?.skuName,
    record.skuName,
    record.sku_name,
    record.color,
    record.text,
    record.saleAttrValue,
  ]);

  if (!longTitle && !skuName) {
    return null;
  }

  return {
    longTitle,
    skuName,
  };
}

/**
 * 从接口响应里递归提取 skuId -> price
 */
function collectSkuPricesFromData(sources: unknown[], skuIds: Set<string>) {
  const result: Record<string, string> = {};

  for (const source of sources) {
    walkRecord(source, (record) => {
      const explicitSkuId = normalizeSkuId(
        firstText([record.skuId, record.sku_id, record.id, record.wareId, record.productId, record.pid]),
      );
      const explicitPrice = readPrice(record);

      if (explicitSkuId && skuIds.has(explicitSkuId) && explicitPrice) {
        result[explicitSkuId] = explicitPrice;
      }

      for (const [key, value] of Object.entries(record)) {
        const skuId = normalizeSkuId(key);

        if (skuId && skuIds.has(skuId)) {
          const price = readPrice(value);

          if (price) {
            result[skuId] = price;
          }
        }
      }

      const priceList = firstArray([record.priceList, record.prices, record.data, record.result]);

      for (const item of priceList) {
        const itemRecord = toRecord(item);

        if (!itemRecord) {
          continue;
        }

        const skuId = normalizeSkuId(firstText([itemRecord.skuId, itemRecord.sku_id, itemRecord.id, itemRecord.pid]));
        const price = readPrice(itemRecord);

        if (skuId && skuIds.has(skuId) && price) {
          result[skuId] = price;
        }
      }
    });
  }

  return result;
}

/**
 * 从页面脚本里读取常见的 skuId -> price 结构
 */
function collectSkuPricesFromScripts(skuIds: Set<string>) {
  const result: Record<string, string> = {};

  if (typeof document === "undefined") {
    return result;
  }

  for (const script of Array.from(document.scripts)) {
    const text = script.textContent || "";

    if (!/price|jdPrice|sku/i.test(text)) {
      continue;
    }

    for (const skuId of skuIds) {
      const price = findPriceNearSkuId(text, skuId);

      if (price) {
        result[skuId] = price;
      }
    }
  }

  return result;
}

/**
 * 读取注入脚本缓存的京东网络响应
 */
function readJdNetworkCache() {
  const records: UnknownRecord[] = [];

  if (typeof localStorage === "undefined") {
    return records;
  }

  const value = parseJsonLike(localStorage.getItem(PDD_AUTO_JD_NET_DATA_STORAGE_KEY));

  for (const record of normalizeNetworkCacheRecords(value)) {
    pushUniqueRecord(records, record);
  }

  return records;
}

/**
 * 标准化网络缓存结构
 */
function normalizeNetworkCacheRecords(value: unknown) {
  const records = Array.isArray(value) ? value : value ? [value] : [];
  const normalized: UnknownRecord[] = [];

  for (const item of records) {
    const record = toRecord(item);

    if (!record) {
      continue;
    }

    const data = normalizeNetworkResponseData(record);

    normalized.push({
      ...record,
      data,
    });
  }

  return normalized;
}

/**
 * 解析网络缓存中的 responseText/data
 */
function normalizeNetworkResponseData(record: UnknownRecord) {
  const data = record.data ?? record.response ?? record.responseText;

  if (typeof data === "string") {
    return parseJsonLike(data);
  }

  return data;
}

/**
 * 从页面全局对象收集京东商品相关状态
 *
 * 很多 SKU、价格、图片数据会挂在 window 全局对象中
 */
function collectJdPageStateRecords() {
  const records: UnknownRecord[] = [];

  if (typeof window === "undefined") {
    return records;
  }

  const windowRecord = window as unknown as UnknownRecord;
  const candidateKeys = [
    "pageConfig",
    "wareBusiness",
    "wareInfo",
    "wareInfoReadMap",
    "colorSizeVO",
    "mainImageVO",
    "skuInfo",
    "skuInfoMap",
    "priceMap",
    "imageList",
    "__INITIAL_STATE__",
    "__NEXT_DATA__",
  ];

  for (const key of candidateKeys) {
    const record = toRecord(windowRecord[key]);

    if (record) {
      records.push(record);
    }
  }

  return records;
}

/**
 * 尝试解析 JSON、JSONP 或普通字符串
 */
function parseJsonLike(value: unknown): unknown {
  const text = toText(value);

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    const jsonpMatch = text.match(/^[\w$.]+\(([\s\S]*)\);?$/);

    if (!jsonpMatch) {
      return text;
    }

    try {
      return JSON.parse(jsonpMatch[1]);
    } catch {
      return text;
    }
  }
}

/**
 * 在脚本文本中查找 SKU 附近的价格字段
 */
function findPriceNearSkuId(text: string, skuId: string) {
  const skuToken = escapeRegExp(skuId);
  const patterns = [
    new RegExp(
      `["'](?:J_)?${skuToken}["']\\s*:\\s*\\{[^}]{0,400}?["'](?:p|price|jdPrice|salePrice)["']\\s*:\\s*["']?([0-9]+(?:\\.[0-9]+)?)`,
      "i",
    ),
    new RegExp(
      `["'](?:skuId|id|wareId)["']\\s*:\\s*["']?(?:J_)?${skuToken}["']?[^}]{0,400}?["'](?:p|price|jdPrice|salePrice)["']\\s*:\\s*["']?([0-9]+(?:\\.[0-9]+)?)`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const price = normalizePrice(pattern.exec(text)?.[1]);

    if (price) {
      return price;
    }
  }

  return "";
}

/**
 * 从对象或基础类型中读取价格
 */
function readPrice(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return normalizePrice(value);
  }

  const record = toRecord(value);

  if (!record) {
    return "";
  }

  return firstText([
    normalizePrice(record.price),
    normalizePrice(record.jdPrice),
    normalizePrice(record.p),
    normalizePrice(record.op),
    normalizePrice(record.m),
    normalizePrice(record.salePrice),
    normalizePrice(record.currentPrice),
    normalizePrice(record.wMaprice),
    normalizePrice(record.discountPrice),
  ]);
}

/**
 * 读取当前页面展示的价格，只能兜底当前选中 SKU
 */
function getCurrentDomPrice() {
  if (typeof document === "undefined") {
    return "";
  }

  return normalizePrice(
    firstText([
      getTextBySelectors([".summary-price .p-price .price", ".summary-price .price", ".p-price .price", "#jd-price"]),
      getTextBySelectors([
        "[class*='summary-price'] [class*='price']",
        "[class*='price'] strong",
        "[class*='price'] .price",
      ]),
    ]),
  );
}

/**
 * 通过 selector 批量收集图片 URL
 */
function collectImagesBySelectors(selectors: string[]) {
  const images: string[] = [];

  if (typeof document === "undefined") {
    return images;
  }

  for (const selector of selectors) {
    for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
      for (const image of collectImagesFromElement(element)) {
        pushUnique(images, image);
      }
    }
  }

  return images;
}

/**
 * 从单个元素的图片属性、子 img 和 background-image 中提取图片
 */
function collectImagesFromElement(element: HTMLElement) {
  const images: string[] = [];

  if (element instanceof HTMLImageElement) {
    pushUnique(images, normalizeImageUrl(element.currentSrc));
  }

  for (const attr of IMAGE_SOURCE_ATTRIBUTES) {
    pushUnique(images, normalizeImageUrl(element.getAttribute(attr)));
  }

  for (const image of Array.from(element.querySelectorAll("img"))) {
    pushUnique(images, normalizeImageUrl(image.currentSrc || image.src));

    for (const attr of IMAGE_SOURCE_ATTRIBUTES) {
      pushUnique(images, normalizeImageUrl(image.getAttribute(attr)));
    }
  }

  for (const image of extractImagesFromStyle(element.getAttribute("style") || element.style.backgroundImage)) {
    pushUnique(images, image);
  }

  return images.filter(isLikelyProductImage);
}

/**
 * 从页面全局对象中的图片列表补图
 */
function collectImagesFromPageState(keys: string[]) {
  const images: string[] = [];

  for (const record of collectJdPageStateRecords()) {
    walkRecord(record, (item) => {
      for (const key of keys) {
        const value = item[key];

        if (Array.isArray(value)) {
          for (const imageItem of value) {
            const imageRecord = toRecord(imageItem);
            const image = imageRecord
              ? firstImageUrl(
                  imageRecord,
                  ["imageUrl", "fullImageUrl", "imgUrl", "url", "src", "path"],
                  JD_MAIN_IMAGE_PREFIX,
                )
              : normalizeImageUrl(imageItem, JD_MAIN_IMAGE_PREFIX);

            pushUnique(images, image);
          }
        }
      }
    });
  }

  return images.filter(isLikelyProductImage);
}

/**
 * 从页面全局对象中补充 SKU 图
 */
function collectSkuImagesFromPageState() {
  const skuImages: Record<string, string> = {};

  for (const record of collectJdPageStateRecords()) {
    walkRecord(record, (item) => {
      const skuText = firstText([item.text, item.name, item.title, item.skuName, item.color]);
      const image = firstImageUrl(item, ["fullImageUrl", "imageUrl", "imgUrl", "url", "src"], JD_SKU_IMAGE_PREFIX);

      if (skuText && image) {
        skuImages[skuText] = image;
      }
    });
  }

  return skuImages;
}

/**
 * 提取 style 中的 url(...)
 */
function extractImagesFromStyle(styleText: string) {
  const images: string[] = [];
  const regexp = /url\((['"]?)(.*?)\1\)/gi;
  let match = regexp.exec(styleText);

  while (match) {
    pushUnique(images, normalizeImageUrl(match[2]));
    match = regexp.exec(styleText);
  }

  return images;
}

/**
 * 读取对象里的第一个图片字段
 */
function firstImageUrl(record: unknown, keys: string[], prefix: string) {
  const source = toRecord(record);

  if (!source) {
    return "";
  }

  for (const key of keys) {
    const image = normalizeImageUrl(source[key], prefix);

    if (image) {
      return image;
    }
  }

  return "";
}

/**
 * 标准化京东图片 URL，兼容 //、jfs 相对路径和普通相对路径
 */
function normalizeImageUrl(value: unknown, prefix = "") {
  const source = cleanupImageSource(toText(value).replace(/\\\//g, "/"));

  if (!source || source.startsWith("data:") || source === "none") {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  if (source.startsWith("//")) {
    return `https:${source}`;
  }

  if (/^[\w.-]+\.360buyimg\.com\//i.test(source)) {
    return `https://${source}`;
  }

  if (prefix) {
    return `${prefix}${source.replace(/^\/+/, "")}`;
  }

  try {
    return new URL(source, window.location.href).href;
  } catch {
    return source;
  }
}

/**
 * 清理图片字段中混入的 style、空白和引号等无关内容
 */
function cleanupImageSource(value: string) {
  const source = value.trim().replace(/^['"]|['"]$/g, "");
  const imageMatch = source.match(/^(.*?\.(?:jpg|jpeg|png|webp|avif))(?:[?!][^\s"'<>]*)?/i);

  if (!imageMatch) {
    return source;
  }

  return imageMatch[0];
}

/**
 * 判断图片是否像商品图，过滤空图、base64 和明显非图片地址
 */
function isLikelyProductImage(value: string) {
  return (
    Boolean(value) &&
    !value.startsWith("data:") &&
    (/360buyimg\.com/i.test(value) || /\.(jpg|jpeg|png|webp|avif)(?:[?#!].*)?$/i.test(value))
  );
}

/**
 * 获取最终 SKU 列表
 */
function getResultSkuIds(parseData: IParseData) {
  if (parseData.SKUKeyList.length > 0) {
    return parseData.SKUKeyList;
  }

  return parseData.goodsId ? [parseData.goodsId] : [];
}

/**
 * 从当前 URL 提取京东 skuId
 */
function getSkuIdFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const url = new URL(window.location.href);

    return firstText([
      url.pathname.match(/\/(?:product\/)?(\d+)\.html/i)?.[1],
      url.searchParams.get("sku"),
      url.searchParams.get("skuId"),
    ]);
  } catch {
    return "";
  }
}

/**
 * 获取当前页面链接
 */
function getCurrentPageUrl() {
  return typeof window === "undefined" ? "" : window.location.href;
}

/**
 * 从页面标题区域读取商品名兜底
 */
function getTitleFromPage() {
  return getTextBySelectors(["#name h1", ".sku-name", "[class*='sku-name']", "h1"])
    .replace(/-京东.*$/u, "")
    .trim();
}

/**
 * 从多个 selector 中读取第一个文本
 */
function getTextBySelectors(selectors: string[]) {
  if (typeof document === "undefined") {
    return "";
  }

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    const text = normalizeText(element?.innerText || element?.textContent || "");

    if (text) {
      return text;
    }
  }

  return "";
}

/**
 * 将接口中的分类、面包屑等结构转成字符串数组
 */
function toTextList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const record = toRecord(item);

        return firstText([record?.text, record?.name, item]);
      })
      .filter(Boolean);
  }

  const text = toText(value);

  return text ? [text] : [];
}

/**
 * 递归遍历对象，给 SKUInfo 和 SKUPrice 做弱结构兜底
 */
function walkRecord(value: unknown, visitor: (record: UnknownRecord) => void, seen = new WeakSet<object>(), depth = 0) {
  if (depth > 8 || typeof value !== "object" || value === null || seen.has(value)) {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      walkRecord(item, visitor, seen, depth + 1);
    }

    return;
  }

  visitor(value as UnknownRecord);

  for (const nextValue of Object.values(value as UnknownRecord)) {
    walkRecord(nextValue, visitor, seen, depth + 1);
  }
}

/**
 * 从字符串里提取 skuId
 */
function extractSkuIdsFromText(value: unknown) {
  return Array.from(new Set(toText(value).match(/\d{5,}/g) ?? []));
}

/**
 * 标准化 skuId，兼容 J_123456 形式
 */
function normalizeSkuId(value: unknown) {
  return toText(value).replace(/^J_/i, "");
}

/**
 * 标准化价格，结果保持为纯数字字符串
 */
function normalizePrice(value: unknown) {
  const match = toText(value)
    .replace(/,/g, "")
    .match(/(?:¥|￥)?\s*([0-9]+(?:\.[0-9]+)?)/u);

  return match?.[1] ?? "";
}

/**
 * 获取第一个有效文本
 */
function firstText(values: unknown[]) {
  for (const value of values) {
    const text = toText(value);

    if (text) {
      return text;
    }
  }

  return "";
}

/**
 * 文本标准化
 */
function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * unknown 转字符串
 */
function toText(value: unknown) {
  if (typeof value === "string") {
    return normalizeText(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

/**
 * unknown 转对象
 */
function toRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

/**
 * unknown 转数组
 */
function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * 获取第一个数组
 */
function firstArray(values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

/**
 * 向数组追加非空且不重复的值
 */
function pushUnique(target: string[], value: string) {
  if (value && !target.includes(value)) {
    target.push(value);
  }
}

/**
 * 向对象数组追加不重复的记录
 */
function pushUniqueRecord(target: UnknownRecord[], value: UnknownRecord) {
  const signature = JSON.stringify({
    kind: value.kind,
    url: value.url,
    capturedAt: value.capturedAt,
  });

  if (
    !target.some(
      (item) => JSON.stringify({ kind: item.kind, url: item.url, capturedAt: item.capturedAt }) === signature,
    )
  ) {
    target.push(value);
  }
}

/**
 * 追加 SKU 图片并去重
 */
function appendSkuImage(target: Record<string, string[]>, skuText: string, image: string) {
  if (!skuText || !image) {
    return;
  }

  target[skuText] ??= [];
  pushUnique(target[skuText], image);
}

/**
 * 转义动态正则内容
 */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
