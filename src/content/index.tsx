import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE,
  PDD_AUTO_MESSAGE_SOURCE,
  type CapturedJdResponse,
  type JdDetailWareBusinessMessage,
} from "./types/jdDetailResponse";
import { getParsedProductFromCache } from "./storage/parsedProduct";
import type { IParseData } from "./types/jdDetailResponse";
import App from "./views/App.tsx";
import AutoFillPanel from "./views/AutoFillPanel";
import styles from "./views/index.css?inline";

/**
 * 拼多多商品发布相关页面地址信息
 */
const PDD_MERCHANT_HOST = "mms.pinduoduo.com";
const PDD_GOODS_CATEGORY_PATH = "/goods/category";
const PDD_GOODS_ADD_PATH = "/goods/goods_add/index";

/**
 * 自动填写功能在拼多多页面里挂载业务 DOM 的父容器 ID
 */
const PDD_AUTO_FILL_PARENT_ID = "pdd-auto-fill-parent";
const PDD_CAROUSEL_IMAGE_UPLOAD_VIEW_ID = "carousel_img_localfile_upload";
const PDD_DETAIL_IMAGE_UPLOAD_VIEW_ID = "detail_img_localfile_upload";

/**
 * 进入商品新增页后自动执行上传的状态
 */
let pddGoodsAddAutoUploadRunning = false;
let pddGoodsAddAutoUploadedSignature = "";

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

/**
 * 在自动填写父容器里渲染通用商品数据展示组件
 */
async function renderAutoFillPanel(parent: HTMLElement) {
  const cachedProduct = await getParsedProductFromCache();
  const shadowRoot = parent.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  shadowRoot.appendChild(style);

  const mount = document.createElement("div");
  shadowRoot.appendChild(mount);

  createRoot(mount).render(
    <StrictMode>
      <AutoFillPanel cachedProduct={cachedProduct} onStartFill={() => autoFillPddGoods(cachedProduct?.data)} />
    </StrictMode>,
  );
}

/**
 * 拼多多商品上传页自动填写测试流程
 */
async function autoFillPddGoods(parseData: IParseData | undefined) {
  if (!parseData) {
    throw new Error("未读取到采集商品数据");
  }

  if (isPddGoodsCategoryPage()) {
    await fillPddCategoryInput(parseData.category);
    return "类目已填写，请点击拼多多页面里的“确定发布该类商品”";
  }

  if (isPddGoodsAddPage()) {
    await uploadCollectedMainImagesByFileInput(parseData);
    fillPddGoodsTitle(parseData.title);
    await uploadCollectedDetailImagesByFileInput(parseData);
    await fillPddSkuTypes(parseData);
    return "商品轮播图、标题、详情图和规格类型已处理";
  }

  throw new Error("当前页面不是支持自动填写的拼多多商品发布页面");
}

/**
 * 在拼多多类目页中填写采集到的商品分类
 */
async function fillPddCategoryInput(category: string | undefined) {
  const categoryText = category?.trim();

  if (!categoryText) {
    throw new Error("采集数据中没有分类信息");
  }

  const input = await waitForPddCategoryInput();

  if (!input) {
    throw new Error("未找到拼多多类目输入框");
  }

  // 使用原生 value setter 写入，确保 React/Vue 等受控输入能监听到值变化
  input.focus();
  setNativeInputValue(input, categoryText);
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: categoryText, inputType: "insertText" }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
}

/**
 * 使用拼多多页面原生上传组件上传采集到的轮播主图，最多上传 10 张
 */
async function uploadCollectedMainImagesByFileInput(parseData: IParseData) {
  const uploadedCount = getPddCarouselUploadedCount();
  const remainingCount = Math.max(0, 10 - uploadedCount);

  if (remainingCount === 0) {
    console.log("[pdd_auto] 拼多多轮播图已满 10 张，跳过上传");
    return;
  }

  const imageUrls = getCollectedMainImageUrls(parseData).slice(0, remainingCount);

  if (imageUrls.length === 0) {
    throw new Error("采集数据中没有可上传图片");
  }

  // 新增页会异步加载表单和草稿状态，过早触发上传会被后续渲染清掉
  await sleep(1200);

  const fileInput = await waitForPddImageFileInput(PDD_CAROUSEL_IMAGE_UPLOAD_VIEW_ID, 15000);

  if (!fileInput) {
    throw new Error("未找到拼多多图片上传 input，请进入包含上传图片控件的页面后再试");
  }

  const imageFiles = await createImageFilesFromUrls(imageUrls);
  const dataTransfer = new DataTransfer();

  if (imageFiles.length === 0) {
    throw new Error("采集图片下载或转码失败");
  }

  for (const imageFile of imageFiles) {
    dataTransfer.items.add(imageFile);
  }

  // 把多张 File 写入页面原生 file input，触发拼多多自己的 onChange 批量上传流程
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  fileInput.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
}

/**
 * 读取拼多多轮播图当前已上传数量
 */
function getPddCarouselUploadedCount() {
  const promptElements = Array.from(document.querySelectorAll<HTMLElement>(".moduleIntroduce"));

  for (const element of promptElements) {
    const text = element.textContent || "";

    if (!text.includes("已上传") || !text.includes("/10")) {
      continue;
    }

    const countText = element.querySelector<HTMLElement>(".textPrompt")?.textContent?.trim();
    const count = Number(countText);

    if (Number.isFinite(count)) {
      return count;
    }
  }

  return 0;
}

/**
 * 使用拼多多页面原生上传组件上传采集到的商品详情图
 */
async function uploadCollectedDetailImagesByFileInput(parseData: IParseData) {
  const imageUrls = getCollectedDetailImageUrls(parseData);

  if (imageUrls.length === 0) {
    console.warn("[pdd_auto] 采集数据中没有详情图，跳过详情图上传");
    return;
  }

  const fileInput = await waitForPddImageFileInput(PDD_DETAIL_IMAGE_UPLOAD_VIEW_ID, 15000);

  if (!fileInput) {
    throw new Error("未找到拼多多详情图上传 input");
  }

  const imageFiles = await createImageFilesFromUrls(imageUrls);
  const dataTransfer = new DataTransfer();

  if (imageFiles.length === 0) {
    throw new Error("详情图下载或转码失败");
  }

  for (const imageFile of imageFiles) {
    dataTransfer.items.add(imageFile);
  }

  // 触发拼多多详情图上传组件自己的 onChange 批量上传流程
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  fileInput.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
}

/**
 * 批量下载并转码图片，单张失败不影响其它图片继续上传
 */
async function createImageFilesFromUrls(imageUrls: string[]) {
  const results = await Promise.allSettled(imageUrls.map((imageUrl, index) => createImageFileFromUrl(imageUrl, index)));
  const files: File[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      files.push(result.value);
      return;
    }

    console.warn("[pdd_auto] 采集图片转文件失败:", {
      imageUrl: imageUrls[index],
      reason: result.reason,
    });
  });

  return files;
}

/**
 * 获取要上传到拼多多轮播图区域的主图，拼多多最多支持 10 张
 */
function getCollectedMainImageUrls(parseData: IParseData) {
  return Array.from(new Set(parseData.mainImg.filter(Boolean))).slice(0, 10);
}

/**
 * 获取要上传到拼多多商品详情区域的详情图
 */
function getCollectedDetailImageUrls(parseData: IParseData) {
  return Array.from(new Set(parseData.detailImg.filter(Boolean)));
}

/**
 * 把远程图片下载为 File，供 file input 模拟上传使用
 */
async function createImageFileFromUrl(imageUrl: string, index: number) {
  const response = await fetch(imageUrl, {
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`下载图片失败：${response.status}`);
  }

  const blob = await response.blob();
  const jpegBlob = await convertImageBlobToJpeg(blob);
  const filename = getImageFilename(imageUrl, jpegBlob.type, index);

  return new File([jpegBlob], filename, {
    type: jpegBlob.type,
  });
}

/**
 * 将浏览器可解码的图片统一转成 JPEG，避免拼多多上传组件拒绝 avif/webp 等格式
 */
async function convertImageBlobToJpeg(blob: Blob) {
  if (blob.type === "image/jpeg") {
    return blob;
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("图片转码失败，无法创建 canvas context");
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (jpegBlob) => {
        if (!jpegBlob) {
          reject(new Error("图片转码失败，无法生成 JPEG"));
          return;
        }

        resolve(jpegBlob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

/**
 * 从图片 URL 或 MIME 类型生成上传文件名
 */
function getImageFilename(imageUrl: string, mimeType: string, index: number) {
  try {
    const url = new URL(imageUrl);
    const pathnameName = url.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/\.(avif|webp|png)$/i, ".jpg");

    if (pathnameName && /\.(jpe?g|png|webp|gif)$/i.test(pathnameName)) {
      return pathnameName.replace(/(\.[^.]+)$/u, `-${index + 1}$1`);
    }
  } catch {
    // 图片 URL 解析失败时使用 MIME 类型兜底生成文件名
  }

  const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";

  return `pdd-auto-${Date.now()}-${index + 1}.${extension}`;
}

/**
 * 等待拼多多图片上传 input 渲染完成
 */
function waitForPddImageFileInput(viewId: string, timeout = 5000) {
  const existingInput = findPddImageFileInput(viewId);

  if (existingInput) {
    return Promise.resolve(existingInput);
  }

  return new Promise<HTMLInputElement | null>((resolve) => {
    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(findPddImageFileInput(viewId));
    }, timeout);

    const observer = new MutationObserver(() => {
      const input = findPddImageFileInput(viewId);

      if (!input) {
        return;
      }

      window.clearTimeout(timer);
      observer.disconnect();
      resolve(input);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * 查找拼多多页面中可用的图片文件上传 input
 */
function findPddImageFileInput(viewId: string) {
  const carouselInput = document.querySelector<HTMLInputElement>(
    `input[type='file'][data-tracking-click-viewid='${viewId}']`,
  );

  if (carouselInput && !carouselInput.disabled) {
    return carouselInput;
  }

  const fileInputs = Array.from(document.querySelectorAll<HTMLInputElement>("input[type='file']"));

  return (
    fileInputs.find((input) => {
      const accept = input.accept.toLowerCase();
      const className = input.className || "";
      const isPddLocalUploadInput =
        className.includes("MmsUiUploadPicVideoButton___origin___3-TdF2-156-0") ||
        input.closest(".MmsUiUploadPicVideoButton___fileButton___2b-vY2-156-0") !== null;

      return (
        !input.disabled &&
        isPddLocalUploadInput &&
        (!accept || accept.includes("image") || accept.includes(".jpg") || accept.includes(".png"))
      );
    }) ?? null
  );
}

/**
 * 填写拼多多商品标题
 */
function fillPddGoodsTitle(title: string) {
  const titleText = title.trim().slice(0, 60);

  if (!titleText) {
    throw new Error("采集数据中没有商品标题");
  }

  const input = findPddTitleInput();

  if (!input) {
    throw new Error("未找到拼多多商品标题输入框");
  }

  input.focus();
  setNativeInputValue(input, titleText);
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: titleText, inputType: "insertText" }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.blur();
}

/**
 * 查找拼多多商品标题输入框
 */
function findPddTitleInput() {
  return (
    document.querySelector<HTMLInputElement>("input[data-tracking-click-viewid='title_input_area']") ??
    document.querySelector<HTMLInputElement>("input[placeholder*='商品标题组成']")
  );
}

/**
 * 添加前两个 SKU 规格类型，并分别填写对应规格值
 */
async function fillPddSkuTypes(parseData: IParseData) {
  const skuDimensions = parseData.SKUSort.map((item) => item.trim()).filter(Boolean).slice(0, 2);

  if (skuDimensions.length === 0) {
    console.warn("[pdd_auto] 采集数据中没有可填写的 SKU 规格类型");
    return;
  }

  for (let dimensionIndex = 0; dimensionIndex < skuDimensions.length; dimensionIndex += 1) {
    const skuType = skuDimensions[dimensionIndex];
    const skuValues = getSkuValuesByDimension(parseData, dimensionIndex);

    if (!skuType || skuValues.length === 0) {
      console.warn("[pdd_auto] 当前规格维度没有可填写的规格类型或规格值", {
        dimensionIndex,
        skuType,
        skuValues,
      });
      continue;
    }

    const specRow = await addAndSelectPddSkuType(skuType);
    await fillPddSkuValueInputs(specRow, skuValues);
    await sleep(400);
  }
}

/**
 * 从 SKUKey 中取指定维度的规格值，并去重
 */
function getSkuValuesByDimension(parseData: IParseData, dimensionIndex: number) {
  return Array.from(
    new Set(
      Object.values(parseData.SKUKey)
        .map((skuValues) => skuValues[dimensionIndex]?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

/**
 * 点击添加规格类型按钮，并在下拉框中选择匹配的规格类型
 */
async function addAndSelectPddSkuType(skuType: string) {
  const addButton = findPddAddSkuTypeButton();
  const beforeRowCount = getPddSpecRows().length;

  if (!addButton) {
    throw new Error("未找到拼多多添加规格类型按钮");
  }

  clickElement(addButton);
  await sleep(300);

  const specRow = await waitForNewPddSpecRow(beforeRowCount);

  if (!specRow) {
    throw new Error("未找到新增的拼多多规格行");
  }

  const selectInput = await waitForPddSkuTypeSelectInput(specRow);

  if (!selectInput) {
    throw new Error("未找到拼多多规格类型下拉输入框");
  }

  clickElement(selectInput);
  await sleep(300);

  const option = await waitForPddSkuTypeOption(skuType);

  if (!option) {
    throw new Error(`未找到拼多多规格类型选项：${skuType}`);
  }

  clickElement(option);
  await sleep(500);

  return specRow;
}

/**
 * 依次填写“请输入规格名称”的输入框，填一个后等待下一个空输入框出现
 */
async function fillPddSkuValueInputs(specRow: HTMLElement, skuValues: string[]) {
  for (const skuValue of skuValues) {
    const input = await waitForNextEmptySkuValueInput(specRow);

    if (!input) {
      throw new Error(`未找到可填写的规格名称输入框：${skuValue}`);
    }

    setPddTextInputValue(input, skuValue);
    await sleep(300);
  }
}

/**
 * 等待下一个空的规格名称输入框
 */
function waitForNextEmptySkuValueInput(specRow: HTMLElement, timeout = 5000) {
  return waitForElement<HTMLInputElement>(
    () =>
      Array.from(
        specRow.querySelectorAll<HTMLInputElement>(
          ".spec-input input[data-testid='beast-core-input-htmlInput'][placeholder='请输入规格名称']",
        ),
      ).find((input) => !input.value.trim()) ?? null,
    timeout,
  );
}

/**
 * 获取当前页面所有规格行
 */
function getPddSpecRows() {
  return Array.from(document.querySelectorAll<HTMLElement>(".goods-sku-box.goods-spec .goods-spec-row"));
}

/**
 * 等待点击添加后新增的规格行出现
 */
function waitForNewPddSpecRow(beforeRowCount: number, timeout = 5000) {
  return waitForElement<HTMLElement>(() => getPddSpecRows()[beforeRowCount] ?? null, timeout);
}

/**
 * 查找“添加规格类型”按钮
 */
function findPddAddSkuTypeButton() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    normalizeText(button.textContent || "").includes("添加规格类型"),
  );
}

/**
 * 等待新增规格类型后的下拉输入框
 */
function waitForPddSkuTypeSelectInput(specRow: HTMLElement, timeout = 5000) {
  return waitForElement<HTMLInputElement>(
    () => {
      const inputs = Array.from(
        specRow.querySelectorAll<HTMLInputElement>("input[data-testid='beast-core-select-htmlInput']"),
      );

      return inputs.find((input) => input.placeholder.includes("规格类型") && !input.value) ?? null;
    },
    timeout,
  );
}

/**
 * 等待规格类型下拉选项出现
 */
function waitForPddSkuTypeOption(skuType: string, timeout = 5000) {
  return waitForElement<HTMLElement>(
    () =>
      Array.from(document.querySelectorAll<HTMLElement>("ul[role='listbox'] li[role='option']")).find(
        (option) => normalizeText(option.textContent || "").replace(/常用$/gu, "") === skuType,
      ) ?? null,
    timeout,
  );
}

/**
 * 模拟真实点击，触发拼多多 Beast 组件内部事件
 */
function clickElement(element: HTMLElement) {
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
  element.click();
}

/**
 * 设置文本输入框并触发拼多多表单监听
 */
function setPddTextInputValue(input: HTMLInputElement, value: string) {
  input.focus();
  setNativeInputValue(input, value);
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.blur();
}

/**
 * 等待一段时间，给页面异步渲染留出间隔
 */
function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * 文本标准化，方便匹配按钮和下拉选项
 */
function normalizeText(value: string) {
  return value.replace(/\s+/g, "").trim();
}

/**
 * 通用等待元素方法
 */
function waitForElement<T extends Element>(finder: () => T | null, timeout = 5000) {
  const existingElement = finder();

  if (existingElement) {
    return Promise.resolve(existingElement);
  }

  return new Promise<T | null>((resolve) => {
    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(finder());
    }, timeout);

    const observer = new MutationObserver(() => {
      const element = finder();

      if (!element) {
        return;
      }

      window.clearTimeout(timer);
      observer.disconnect();
      resolve(element);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * 等待拼多多类目输入框渲染完成
 */
function waitForPddCategoryInput(timeout = 5000) {
  const existingInput = findPddCategoryInput();

  if (existingInput) {
    return Promise.resolve(existingInput);
  }

  return new Promise<HTMLInputElement | null>((resolve) => {
    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(findPddCategoryInput());
    }, timeout);

    const observer = new MutationObserver(() => {
      const input = findPddCategoryInput();

      if (!input) {
        return;
      }

      window.clearTimeout(timer);
      observer.disconnect();
      resolve(input);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * 查找拼多多类目输入框，优先使用已知 class，再用输入框语义兜底
 */
function findPddCategoryInput() {
  const directInput = document.querySelector<HTMLInputElement>("input.IPT_input_5-188-0");

  if (directInput) {
    return directInput;
  }

  const wrapperInput = document.querySelector<HTMLElement>(".IPT_input_5-188-0")?.querySelector<HTMLInputElement>("input");

  if (wrapperInput) {
    return wrapperInput;
  }

  return document.querySelector<HTMLInputElement>(
    "input[placeholder*='类目'], input[placeholder*='分类'], input[placeholder*='搜索']",
  );
}

/**
 * 调用 HTMLInputElement 原型上的 value setter，避免只改 DOM 属性导致页面状态不同步
 */
function setNativeInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(input, "value")?.set;
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value);
    return;
  }

  input.value = value;
}

/**
 * 判断当前页面是否为拼多多商品发布类目页
 */
function isPddGoodsCategoryPage() {
  return window.location.hostname === PDD_MERCHANT_HOST && window.location.pathname.startsWith(PDD_GOODS_CATEGORY_PATH);
}

/**
 * 判断当前页面是否为拼多多商品新增编辑页
 */
function isPddGoodsAddPage() {
  return window.location.hostname === PDD_MERCHANT_HOST && window.location.pathname.startsWith(PDD_GOODS_ADD_PATH);
}

/**
 * 判断当前页面是否需要插入自动填写面板
 */
function shouldMountPddAutoFillPanel() {
  return isPddGoodsCategoryPage();
}

/**
 * 在拼多多页面主内容区域中插入自动填写父容器
 */
function mountPddAutoFillParent() {
  if (!shouldMountPddAutoFillPanel()) {
    return true;
  }

  const mainContentWrapper = document.querySelector<HTMLElement>(".main-content-wrapper");

  if (!mainContentWrapper) {
    return false;
  }

  if (document.getElementById(PDD_AUTO_FILL_PARENT_ID)) {
    return true;
  }

  const parent = document.createElement("div");
  parent.id = PDD_AUTO_FILL_PARENT_ID;
  parent.dataset.source = "pdd-auto";
  mainContentWrapper.prepend(parent);

  // 父容器创建后渲染通用面板，面板内容与具体上传平台解耦
  void renderAutoFillPanel(parent);

  return true;
}

/**
 * 监听拼多多后台 SPA 路由变化，进入商品新增页后重新尝试插入面板
 */
function watchPddRouteChange() {
  let currentUrl = window.location.href;

  const checkRoute = () => {
    if (window.location.href === currentUrl) {
      return;
    }

    currentUrl = window.location.href;

    // 路由切换后页面内容异步渲染，稍后再执行当前页面需要的自动化步骤
    window.setTimeout(handlePddGoodsRouteEffect, 300);
  };

  window.addEventListener("popstate", checkRoute);
  window.addEventListener("hashchange", checkRoute);

  window.setInterval(checkRoute, 500);
}

/**
 * 根据拼多多商品发布路由执行对应步骤
 */
function handlePddGoodsRouteEffect() {
  if (isPddGoodsCategoryPage()) {
    ensurePddAutoFillParent();
    return;
  }

  if (isPddGoodsAddPage()) {
    document.getElementById(PDD_AUTO_FILL_PARENT_ID)?.remove();
    void autoUploadMainImagesOnGoodsAddPage();
  }
}

/**
 * 进入商品新增页后自动上传采集到的轮播主图
 */
async function autoUploadMainImagesOnGoodsAddPage() {
  if (pddGoodsAddAutoUploadRunning) {
    return;
  }

  const cachedProduct = await getParsedProductFromCache();
  const parseData = cachedProduct?.data;
  const imageUrls = parseData ? getCollectedMainImageUrls(parseData) : [];
  const uploadSignature = parseData
    ? [
        imageUrls.join("|"),
        parseData.title,
        getCollectedDetailImageUrls(parseData).join("|"),
        parseData.SKUSort.join("|"),
        String(getPddCarouselUploadedCount()),
      ].join("::")
    : "";

  if (!parseData || imageUrls.length === 0 || pddGoodsAddAutoUploadedSignature === uploadSignature) {
    return;
  }

  pddGoodsAddAutoUploadRunning = true;

  try {
    await autoFillPddGoods(parseData);
    pddGoodsAddAutoUploadedSignature = uploadSignature;
    console.log("[pdd_auto] 商品新增页基础信息自动填写已触发:", {
      mainImg: imageUrls,
      title: parseData.title,
      detailImg: getCollectedDetailImageUrls(parseData),
      skuSort: parseData.SKUSort,
    });
  } catch (error) {
    console.warn("[pdd_auto] 商品新增页基础信息自动填写失败:", error);
  } finally {
    pddGoodsAddAutoUploadRunning = false;
  }
}

/**
 * 拼多多页面是异步渲染，等待 .main-content-wrapper 出现后再插入父容器
 */
function ensurePddAutoFillParent() {
  if (mountPddAutoFillParent()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (mountPddAutoFillParent()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.body) {
  mountApp();
  handlePddGoodsRouteEffect();
  watchPddRouteChange();
} else {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      mountApp();
      handlePddGoodsRouteEffect();
      watchPddRouteChange();
    },
    { once: true },
  );
}
