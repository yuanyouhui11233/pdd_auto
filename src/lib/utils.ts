import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sampleJdProductData = {
  productAttributeVO: {
    attributes: [
      {
        jumpUrl: "//list.jd.com/list.html?cat=9847,9850,30522&ev=exbrand_17873",
        labelName: "品牌",
        labelValue: "西昊（SIHOO）",
      },
      {
        labelName: "商品编号",
        labelValue: "100218320808",
      },
      {
        labelName: "国补备案型号",
        labelValue: "L6D-lite-102",
      },
      {
        labelName: "气压杆级别",
        labelValue: "4级气压杆",
      },
      {
        labelName: "座深",
        labelValue: "57±1cm",
      },
      {
        labelName: "附加组件",
        labelValue: "带可调头枕 带搁脚 带滚轮",
      },
      {
        labelName: "是否需组装",
        labelValue: "需组装",
      },
    ],

    coreAttributes: [
      {
        labelName: "靠背最大角度",
        labelValue: "135度",
      },
      {
        labelName: "扶手类型",
        labelValue: "联动扶手",
      },
      {
        labelName: "面料材质",
        labelValue: "皮革",
      },
      {
        labelName: "升降方式",
        labelValue: "气压升降",
      },
    ],
  },
  pageConfigVO: {
    catName: ["家具", "椅类", "电脑椅"],
  },

  crumbs: [
    {
      text: "家具",
      url: "https://list.jd.com/list.html?cat=9847",
    },
    {
      text: "椅类",
      url: "https://list.jd.com/list.html?cat=9847,9850",
    },
    { text: "电脑椅", url: "https://list.jd.com/list.html?cat=9847,9850,30522" },
    {
      text: "西昊（SIHOO）",
      url: "https://list.jd.com/list.html?cat=9847,9850,30522&ev=exbrand_17873",
    },
  ],
};
