// @ts-nocheck

/**
 * 这个文件会被 CRX dev 当作普通 JS 交给 Rollup 2 扫描
 *
 * 因此这里保持 JS 语法，避免 TypeScript 类型语法导致 pnpm run dev 解析失败
 */

/**
 * content script 与页面注入脚本之间的消息来源标识
 *
 * 这里不从共享类型文件导入，是为了避免 CRX dev 阶段的 Rollup 2 解析 import type 语法报错
 */
const PDD_AUTO_MESSAGE_SOURCE = "pdd-auto";
/**
 * 京东商品详情接口响应消息类型
 *
 * 需要和 src/content/types/jdDetailResponse.ts 中的同名常量保持一致
 */
const JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE = "JD_DETAIL_WARE_BUSINESS_RESPONSE";
/**
 * 京东商品页网络响应缓存 key
 */
const PDD_AUTO_JD_NET_DATA_STORAGE_KEY = "pdd_auto_jd_net_data";
/**
 * 京东详情页接口 functionId
 *
 * 京东很多接口都会通过:
 * https://api.m.jd.com/api?functionId=xxx
 *
 * 来区分接口功能
 */
const JD_DETAIL_FUNCTION_ID = "pc_detailpage_wareBusiness"; // 商品详情
/**
 * 京东商品页补充接口关键字
 *
 * pc_detailpage_wareBusiness 缺少详情图和部分价格，这些通常来自价格或详情描述接口
 */
const JD_SUPPLEMENT_REQUEST_PATTERNS = [
    /\/\/p\.3\.cn\/prices\/mgets/i,
    /\/\/cd\.jd\.com\/description\//i,
    /\/\/d\.3\.cn\/desc\//i,
    /\/\/dx\.3\.cn\/desc\//i,
    /\/\/item\.jd\.com\/desc\//i,
    /\/\/item\.jd\.com\/ware\/detail/i,
    /functionId=(?:pc_detailpage_price|pc_detailpage_desc|pc_detailpage_getDesc)/i,
    /(?:skuId|sku|wareId)=\d{5,}.*(?:desc|description)/i,
];
/**
 * JSONP callback 参数名
 *
 * 京东部分接口会使用 JSONP
 */
const JSONP_CALLBACK_PARAMS = ["callback", "jsonp", "jsoncallback", "jsonpcallback", "callbackName"];
/**
 * 判断当前页面是否为拼多多商家后台
 */
function isPddMerchantPage() {
    return window.location.hostname === "mms.pinduoduo.com";
}
/**
 * 安装拼多多图片上传签名调试 Hook
 *
 * 用于定位 upload_sign 是由哪段页面代码写入 FormData 的
 */
function installPddUploadSignDebugHook() {
    if (!isPddMerchantPage() || window.__pddAutoUploadSignDebugHookInstalled) {
        return;
    }

    window.__pddAutoUploadSignDebugHookInstalled = true;

    const originalFormDataAppend = FormData.prototype.append;
    const originalFetchForPddUpload = window.fetch;
    const originalXhrOpenForPddUpload = XMLHttpRequest.prototype.open;
    const originalXhrSendForPddUpload = XMLHttpRequest.prototype.send;
    const xhrUploadRequestMap = new WeakMap();

    /**
     * 记录 FormData.append 写入图片上传字段的调用栈
     */
    FormData.prototype.append = function (name, value, filename) {
        if (name === "upload_sign" || name === "image" || name === "pic_operations") {
            console.group(`[pdd_auto] 捕获到拼多多 FormData 字段: ${name}`);
            if (value instanceof File) {
                console.log("file:", {
                    name: value.name,
                    size: value.size,
                    type: value.type,
                    filename,
                });
            } else {
                console.log(`${name}:`, value);
            }
            console.trace(`[pdd_auto] ${name} append 调用栈`);
            console.groupEnd();
        }

        return originalFormDataAppend.apply(this, arguments);
    };

    /**
     * 打印 store_image 请求里的 FormData 字段
     */
    function debugPddStoreImageRequest(source, url, body) {
        if (!(body instanceof FormData)) {
            return;
        }

        const fields = {};

        body.forEach((value, key) => {
            fields[key] =
                value instanceof File
                    ? {
                          name: value.name,
                          size: value.size,
                          type: value.type,
                      }
                    : value;
        });

        const isStoreImageRequest = String(url).includes("file.pinduoduo.com/v3/store_image");
        const hasUploadSign = Object.prototype.hasOwnProperty.call(fields, "upload_sign");

        if (!isStoreImageRequest && !hasUploadSign) {
            return;
        }

        console.group(`[pdd_auto] 捕获到拼多多图片上传请求: ${source}`);
        console.log("url:", url);
        console.log("isStoreImageRequest:", isStoreImageRequest);
        console.log("formData:", fields);
        console.trace("[pdd_auto] store_image 请求调用栈");
        console.groupEnd();
    }

    /**
     * 打印 store_image 响应，判断图片是否真正上传成功
     */
    function debugPddStoreImageResponse(source, url, responseText, status) {
        if (!String(url).includes("file.pinduoduo.com/v3/store_image")) {
            return;
        }

        console.group(`[pdd_auto] 拼多多图片上传响应: ${source}`);
        console.log("status:", status);
        console.log("url:", url);
        console.log("responseText:", responseText);
        console.groupEnd();
    }

    window.fetch = function (input, init) {
        const url = getFetchUrl(input);
        debugPddStoreImageRequest("fetch", url, init?.body);
        return originalFetchForPddUpload.apply(this, arguments).then((response) => {
            try {
                response.clone().text().then((text) => {
                    debugPddStoreImageResponse("fetch", response.url || url, text, response.status);
                });
            } catch {}

            return response;
        });
    };

    XMLHttpRequest.prototype.open = function (method, url) {
        xhrUploadRequestMap.set(this, {
            method,
            url: String(url),
        });

        return originalXhrOpenForPddUpload.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        const request = xhrUploadRequestMap.get(this);

        if (request) {
            debugPddStoreImageRequest("xhr", request.url, body);
        }

        this.addEventListener("load", function () {
            try {
                const responseText = typeof this.responseText === "string" ? this.responseText : "";
                debugPddStoreImageResponse("xhr", request?.url ?? "", responseText, this.status);
            } catch {}
        });

        return originalXhrSendForPddUpload.apply(this, arguments);
    };

    console.log("[pdd_auto] 已开始监听拼多多图片上传 upload_sign");
}
/**
 * 判断是否为目标京东商品详情接口
 */
function shouldCaptureJdDetailRequest(method, url) {
    // 这里只监听 GET 请求
    if (method.toUpperCase() !== "GET") {
        return false;
    }
    // 简单字符串判断
    if ((url.includes("api.m.jd.com") || url.includes("color.jd.hk")) && url.includes(JD_DETAIL_FUNCTION_ID)) {
        return true;
    }
    /**
     * 更严谨的 URL 解析
     *
     * 防止:
     * - 参数顺序不同
     * - URL 编码
     * - 相对路径
     */
    try {
        const parsedUrl = new URL(url, window.location.href);
        return (
            (parsedUrl.hostname === "api.m.jd.com" || parsedUrl.hostname === "color.jd.hk") &&
            parsedUrl.searchParams.get("functionId") === JD_DETAIL_FUNCTION_ID
        );
    }
    catch {
        return false;
    }
}
/**
 * 判断 request body 中是否包含目标接口
 *
 * 有些请求:
 * - POST
 * - formData
 * - urlencoded
 *
 * 会把 functionId 放到 body 中
 */
function shouldCaptureJdDetailRequestBody(body) {
    if (!body) {
        return false;
    }
    // 字符串 body
    if (typeof body === "string") {
        return body.includes(JD_DETAIL_FUNCTION_ID);
    }
    // URLSearchParams
    if (body instanceof URLSearchParams) {
        return body.get("functionId") === JD_DETAIL_FUNCTION_ID || body.toString().includes(JD_DETAIL_FUNCTION_ID);
    }
    // FormData
    if (body instanceof FormData) {
        return Array.from(body.values()).some((value) => String(value).includes(JD_DETAIL_FUNCTION_ID));
    }
    return false;
}
/**
 * 判断是否为京东商品页补充接口
 */
function shouldCaptureJdSupplementRequest(method, url, requestBody) {
    const upperMethod = method.toUpperCase();

    if (shouldCaptureJdDetailRequest(method, url) || shouldCaptureJdDetailRequestBody(requestBody)) {
        return true;
    }

    if (upperMethod !== "GET" && upperMethod !== "POST") {
        return false;
    }

    return JD_SUPPLEMENT_REQUEST_PATTERNS.some((pattern) => pattern.test(url));
}
/**
 * 判断补充接口类型，方便 parserDataByJD 按来源提取详情图或价格
 */
function getJdNetworkKind(url, requestBody) {
    if (shouldCaptureJdDetailRequest("GET", url) || shouldCaptureJdDetailRequestBody(requestBody)) {
        return "wareBusiness";
    }

    if (/prices|price/i.test(url)) {
        return "price";
    }

    if (/description|desc/i.test(url)) {
        return "description";
    }

    return "supplement";
}
/**
 * 缓存京东商品页接口响应
 *
 * 缓存最近接口响应供 parserDataByJD 同步补齐缺失字段
 */
function cacheJdNetworkResponse(payload) {
    try {
        const cacheRecord = {
            kind: getJdNetworkKind(payload.url, payload.requestBody),
            method: payload.method,
            url: payload.url,
            data: payload.data,
            capturedAt: payload.capturedAt,
        };
        const cacheText = localStorage.getItem(PDD_AUTO_JD_NET_DATA_STORAGE_KEY);
        const cachedRecords = cacheText ? JSON.parse(cacheText) : [];
        const records = Array.isArray(cachedRecords) ? cachedRecords : [cachedRecords];
        const nextRecords = [cacheRecord, ...records.filter((record) => record && record.url !== cacheRecord.url)].slice(0, 30);

        localStorage.setItem(PDD_AUTO_JD_NET_DATA_STORAGE_KEY, JSON.stringify(nextRecords));
        window.dispatchEvent(new CustomEvent("pdd-auto-jd-net", { detail: cacheRecord }));
    }
    catch (error) {
        console.warn("[pdd_auto] 缓存京东商品页接口响应失败:", error);
    }
}
/**
 * 发送数据给 content script
 *
 * inject.ts 运行在页面环境
 * content script 运行在插件环境
 *
 * 二者需要通过 postMessage 通信
 */
function sendToPlugin(payload) {
    console.log("[pdd_auto] 京东商品详情接口响应:", payload);
    window.postMessage({
        source: PDD_AUTO_MESSAGE_SOURCE,
        type: JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE,
        payload,
    }, window.location.origin);
}
/**
 * 调试输出
 *
 * 用于观察页面到底发了哪些京东接口
 */
function debugMatchedUrl(source, method, url, requestBody) {
    const bodyMatched = shouldCaptureJdDetailRequestBody(requestBody);
    const supplementMatched = shouldCaptureJdSupplementRequest(method, url, requestBody);

    if (url.includes("api.m.jd.com") || url.includes("color.jd.hk") || url.includes(JD_DETAIL_FUNCTION_ID) || bodyMatched || supplementMatched) {
        console.log("[pdd_auto] 发现京东接口请求:", {
            source,
            method,
            url,
            requestBody,
            // 是否真正命中目标接口
            matched: shouldCaptureJdDetailRequest(method, url) || bodyMatched,
            supplementMatched,
        });
    }
}
/**
 * 解析接口返回文本
 *
 * 支持:
 * - JSON
 * - JSONP
 * - 普通字符串
 */
function parseResponseText(text) {
    const trimmedText = text.trim();
    if (!trimmedText) {
        return null;
    }
    /**
     * 尝试解析 JSON
     */
    try {
        return JSON.parse(trimmedText);
    }
    catch {
        /**
         * JSONP 格式:
         * callback({...})
         */
        const jsonpMatch = trimmedText.match(/^[\w$.]+\(([\s\S]*)\);?$/);
        if (!jsonpMatch) {
            return trimmedText;
        }
        try {
            return JSON.parse(jsonpMatch[1]);
        }
        catch {
            return trimmedText;
        }
    }
}
/**
 * 从 URL 中提取 JSONP callback 名称
 */
function getJsonpCallbackName(url) {
    try {
        const parsedUrl = new URL(url, window.location.href);
        for (const param of JSONP_CALLBACK_PARAMS) {
            const callbackName = parsedUrl.searchParams.get(param);
            if (callbackName) {
                return callbackName;
            }
        }
    }
    catch {
        return "";
    }
    return "";
}
/**
 * 获取 fetch 请求 URL
 */
function getFetchUrl(input) {
    if (typeof input === "string") {
        return input;
    }
    if (input instanceof URL) {
        return input.href;
    }
    return input.url;
}
/**
 * 获取 fetch 请求 method
 */
function getFetchMethod(input, init) {
    if (init?.method) {
        return init.method;
    }
    if (input instanceof Request) {
        return input.method;
    }
    return "GET";
}
/**
 * 保存原始 fetch
 */
const originalFetch = window.fetch;
/**
 * Hook fetch
 */
window.fetch = async (input, init) => {
    // 发起原始请求
    const response = await originalFetch(input, init);
    const url = getFetchUrl(input);
    const method = getFetchMethod(input, init);
    const requestBody = init?.body;
    // 是否命中目标详情接口
    const matched = shouldCaptureJdDetailRequest(method, url) || shouldCaptureJdDetailRequestBody(requestBody);
    // 是否命中详情图、价格等补充接口
    const supplementMatched = shouldCaptureJdSupplementRequest(method, url, requestBody);
    debugMatchedUrl("fetch", method, url, requestBody);
    if (matched || supplementMatched) {
        response
            .clone()
            .text()
            .then((text) => {
            const payload = {
                method,
                url,
                requestBody,
                // 解析接口数据
                data: parseResponseText(text),
                capturedAt: new Date().toISOString(),
            };

            cacheJdNetworkResponse(payload);

            if (matched) {
                sendToPlugin(payload);
            }
        })
            .catch((error) => {
            console.warn("[pdd_auto] 读取京东商品详情接口响应失败:", error);
        });
    }
    return response;
};
/**
 * 保存原始 XHR 方法
 */
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
/**
 * 保存 xhr 请求信息
 */
const xhrRequestMap = new WeakMap();
const originalOpenFn = originalOpen;
const originalSendFn = originalSend;
/**
 * Hook xhr.open
 *
 * 用于记录请求 method/url
 */
XMLHttpRequest.prototype.open = function (method, url, _async, _username, _password) {
    debugMatchedUrl("xhr.open", method, String(url));
    xhrRequestMap.set(this, {
        method,
        url: String(url),
    });
    return Reflect.apply(originalOpenFn, this, arguments);
};
/**
 * Hook xhr.send
 *
 * 用于:
 * - 获取 requestBody
 * - 获取 response
 */
XMLHttpRequest.prototype.send = function (...args) {
    const pendingRequest = xhrRequestMap.get(this);
    if (pendingRequest) {
        pendingRequest.requestBody = args[0];
        debugMatchedUrl("xhr.send", pendingRequest.method, pendingRequest.url, pendingRequest.requestBody);
    }
    /**
     * 请求完成
     */
    this.addEventListener("load", function () {
        const request = xhrRequestMap.get(this);
        const method = request?.method ?? "GET";
        const url = request?.url ?? "";
        const requestBody = request?.requestBody;
        const matched = shouldCaptureJdDetailRequest(method, url) || shouldCaptureJdDetailRequestBody(requestBody);
        const supplementMatched = shouldCaptureJdSupplementRequest(method, url, requestBody);

        // 不是目标接口和补充接口直接跳过
        if (!matched && !supplementMatched) {
            return;
        }
        try {
            const responseData = this.responseType && this.responseType !== "text"
                ? this.response
                : parseResponseText(typeof this.responseText === "string" ? this.responseText : "");
            const payload = {
                method,
                url,
                requestBody,
                data: responseData,
                capturedAt: new Date().toISOString(),
            };

            cacheJdNetworkResponse(payload);

            if (matched) {
                sendToPlugin(payload);
            }
        }
        catch (error) {
            console.warn("[pdd_auto] 读取京东商品详情 XHR 响应失败:", error);
        }
    });
    return Reflect.apply(originalSendFn, this, args);
};
/**
 * 保存原始 DOM API
 *
 * 用于监听 JSONP script 注入
 */
const originalSetAttribute = Element.prototype.setAttribute;
const originalAppendChild = Node.prototype.appendChild;
const originalInsertBefore = Node.prototype.insertBefore;
/**
 * callbackName -> url
 */
const jsonpCallbackUrlMap = new Map();
/**
 * 处理可能的 JSONP script URL
 */
function handlePossibleJsonpScriptUrl(url) {
    debugMatchedUrl("script", "GET", url);
    if (!shouldCaptureJdDetailRequest("GET", url) && !shouldCaptureJdSupplementRequest("GET", url)) {
        return;
    }
    const callbackName = getJsonpCallbackName(url);
    if (!callbackName) {
        console.log("[pdd_auto] 命中京东详情 script 请求，但 URL 中没有 JSONP callback 参数:", url);
        return;
    }
    console.log("[pdd_auto] 准备监听京东 JSONP callback:", {
        callbackName,
        url,
    });
    hookJsonpCallback(callbackName, url);
}
/**
 * 检查 appendChild/insertBefore 的节点
 */
function handlePossibleScriptNode(node) {
    if (node instanceof HTMLScriptElement && node.src) {
        handlePossibleJsonpScriptUrl(node.src);
    }
}
/**
 * Hook JSONP callback
 *
 * 例如:
 * window.cb123 = function(data){}
 */
function hookJsonpCallback(callbackName, url) {
    /**
     * 校验 callbackName 合法性
     */
    if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(callbackName)) {
        return;
    }
    const path = callbackName.split(".");
    const propertyName = path.pop();
    if (!propertyName) {
        return;
    }
    let target = window;
    /**
     * 支持:
     * a.b.c
     */
    for (const key of path) {
        const nextTarget = target[key];
        if (typeof nextTarget !== "object" || nextTarget === null) {
            return;
        }
        target = nextTarget;
    }
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
    /**
     * 不可配置属性无法 hook
     */
    if (descriptor && !descriptor.configurable) {
        console.log("[pdd_auto] JSONP callback 不可重写:", callbackName);
        return;
    }
    jsonpCallbackUrlMap.set(callbackName, url);
    let currentValue = wrapJsonpCallback(callbackName, target[propertyName]);
    /**
     * 劫持 callback
     */
    Object.defineProperty(target, propertyName, {
        configurable: true,
        get() {
            return currentValue;
        },
        set(nextValue) {
            console.log("[pdd_auto] JSONP callback 已设置:", callbackName);
            currentValue = wrapJsonpCallback(callbackName, nextValue);
        },
    });
}
/**
 * 包装 JSONP callback
 */
function wrapJsonpCallback(callbackName, callback) {
    // 非函数或已经包装过
    if (typeof callback !== "function" || isJsonpCallbackWrapped(callback)) {
        return callback;
    }
    const wrappedCallback = function (...args) {
        console.log("[pdd_auto] JSONP callback 已执行:", callbackName);
        const payload = {
            method: "GET",
            url: jsonpCallbackUrlMap.get(callbackName) ?? "",
            data: args.length === 1 ? args[0] : args,
            capturedAt: new Date().toISOString(),
        };

        cacheJdNetworkResponse(payload);

        if (shouldCaptureJdDetailRequest(payload.method, payload.url)) {
            sendToPlugin(payload);
        }

        return callback.apply(this, args);
    };
    /**
     * 标记已包装
     */
    Object.defineProperty(wrappedCallback, "__pddAutoJsonpWrapped", {
        value: true,
    });
    return wrappedCallback;
}
/**
 * 判断 callback 是否已包装
 */
function isJsonpCallbackWrapped(callback) {
    return Boolean(callback.__pddAutoJsonpWrapped);
}
/**
 * Hook script.setAttribute
 */
Element.prototype.setAttribute = function (name, value) {
    if (this instanceof HTMLScriptElement && name.toLowerCase() === "src") {
        handlePossibleJsonpScriptUrl(value);
    }
    return originalSetAttribute.call(this, name, value);
};
/**
 * Hook appendChild
 */
Node.prototype.appendChild = function (node) {
    handlePossibleScriptNode(node);
    return originalAppendChild.call(this, node);
};
/**
 * Hook insertBefore
 */
Node.prototype.insertBefore = function (node, child) {
    handlePossibleScriptNode(node);
    return originalInsertBefore.call(this, node, child);
};
installPddUploadSignDebugHook();
console.log("[pdd_auto] 已开始监听京东商品详情接口:", JD_DETAIL_FUNCTION_ID);
