/**
 * content script 与页面注入脚本之间的消息来源标识
 */
export const PDD_AUTO_MESSAGE_SOURCE = "pdd-auto";

/**
 * 京东商品详情接口响应消息类型
 */
export const JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE = "JD_DETAIL_WARE_BUSINESS_RESPONSE";

/**
 * 捕获到的京东商品详情接口响应结构
 */
export type CapturedJdResponse = {
  // 请求方法
  method: string;

  // 请求 URL
  url: string;

  // 请求体（POST 时可能存在）
  requestBody?: unknown;

  // 接口返回数据
  data: unknown;

  // 捕获时间
  capturedAt: string;
};

/**
 * 页面注入脚本发送给 content script 的京东详情接口响应消息
 */
export type JdDetailWareBusinessMessage = {
  // 消息来源，用于过滤页面上的其它 postMessage
  source: typeof PDD_AUTO_MESSAGE_SOURCE;

  // 消息类型，用于区分后续可能新增的接口消息
  type: typeof JD_DETAIL_WARE_BUSINESS_RESPONSE_TYPE;

  // sendToPlugin 发送过来的接口响应数据
  payload: CapturedJdResponse;
};

export interface IBaseAttr {
  [key: string]: string | undefined;
}

export interface ISkuTitle {
  longTitle: string;
  skuName: string;
}

export interface IParseData {
  baseAttr: IBaseAttr; // 商品属性
  batchMoving: boolean;
  category: string; // 分类
  detailImg: string[]; // 商品详情页图片
  goodsId: string; // 商品id
  goodsUrl: string; // 商品详情页url
  jdSKUImg: Record<string, string[]>; // sku
  mainImg: string[]; // 轮播图主图
  platform: string; // 平台
  platformEnum: string; // 平台
  SKUImg: Record<string, string>; // sku数组
  SKUInfo: Record<string, { titleList: ISkuTitle }>; // sku信息
  SKUKey: Record<string, string[]>; // sku key
  SKUKeyList: string[]; // sku 数组
  SKUPrice: Record<string, { price: string }>; // sku价格
  SKUSort: string[]; // 排序
  title: string; // 商品名
  videoUrl: string;
}
