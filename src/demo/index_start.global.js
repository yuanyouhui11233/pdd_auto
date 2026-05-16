(function () {
  "use strict";
  const x = new Map();
  let M = !1;
  const j = [
    /^https:\/\/.*?\.tmall\.com\/search\.htm/,
    /^https:\/\/.*?\.tmall\.com\/category\.htm/,
    /^https:\/\/.*?\.tmall\.com\/shop\/view_shop\.htm/,
    /^https:\/\/.*?\.tmall\.com\/.*\?.*search=y/,
    /^https:\/\/.*?\.tmall\.com\/.*\?.*scene=taobao_shop/,
    /^https:\/\/.*?\.tmall\.hk\/category\.htm/,
  ];
  function Q() {
    const e = window.location.href;
    for (let t = 0; t < j.length; t++) if (j[t].test(e)) return !0;
    return !1;
  }
  function U(e, t) {
    let o = document.querySelector(`.mcj-item-checkbox[data-itemid="${e}"]`);
    o &&
      (!(o.getAttribute("data-itemurl") || "").includes("mi_id=") &&
        t.itemUrl &&
        t.itemUrl.includes("mi_id=") &&
        o.setAttribute("data-itemurl", t.itemUrl),
      t.title && o.setAttribute("data-title", t.title),
      t.vagueSold365 && o.setAttribute("data-sale", t.vagueSold365));
  }
  function Y(e) {
    e.slice(0, 60).forEach((o, r) => {
      const a = String(o.itemId);
      (x.set(a, o), U(a, o));
    });
  }
  function P() {
    const e = document.querySelectorAll(".mcj-item-checkbox[data-itemid]");
    Array.from(e)
      .slice(0, 60)
      .forEach((o) => {
        const r = o.getAttribute("data-itemid");
        r && x.has(r) && U(r, x.get(r));
      });
  }
  function Z(e) {
    var o, r, a;
    let t = [];
    ((r = (o = e == null ? void 0 : e.data) == null ? void 0 : o.itemInfoDTO) != null && r.data
      ? (t = e.data.itemInfoDTO.data)
      : (a = e == null ? void 0 : e.data) != null && a.data && (t = e.data.data),
      t.length > 0 && Y(t));
  }
  function ee() {
    var e = document.createElement("script");
    ((e.text = `
    (function(){
        if (window.__mcjTmallApiHookInjected) {
            return;
        }
        window.__mcjTmallApiHookInjected = true;
        
        // 拦截 fetch
        var originalFetch = window.fetch;
        window.fetch = function(input, init) {
            var url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            
            // 检查是否是天猫店铺API
            var isTmallApi = url.indexOf('mtop.taobao.shop.simple.fetch') !== -1 || 
                           url.indexOf('mtop.taobao.shop.simple.item.fetch') !== -1 ||
                           url.indexOf('mtop.tmall.') !== -1;
            
            if (isTmallApi) {
                return originalFetch.call(window, input, init).then(function(response) {
                    var clonedResponse = response.clone();
                    clonedResponse.json().then(function(data) {
                        window.dispatchEvent(new CustomEvent('mcj-tmall-api-data', { detail: data }));
                    }).catch(function(e) {
                        // 解析失败，忽略
                    });
                    return response;
                });
            }
            return originalFetch.call(window, input, init);
        };
        
        // 拦截 XHR
        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            var urlStr = url.toString();
            
            // 检查是否是天猫店铺API
            var isTmallApi = urlStr.indexOf('mtop.taobao.shop.simple.fetch') !== -1 || 
                           urlStr.indexOf('mtop.taobao.shop.simple.item.fetch') !== -1 ||
                           urlStr.indexOf('mtop.tmall.') !== -1;
            
            if (isTmallApi) {
                this._mcjTmallUrl = urlStr;
            }
            return originalOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            if (this._mcjTmallUrl) {
                var self = this;
                this.addEventListener('load', function() {
                    try {
                        var data = JSON.parse(self.responseText);
                        window.dispatchEvent(new CustomEvent('mcj-tmall-api-data', { detail: data }));
                    } catch (e) {
                        // 解析失败，忽略
                    }
                });
            }
            return originalSend.call(this, body);
        };
    })();
    `),
      (e.async = !1),
      document.documentElement.appendChild(e));
  }
  function te() {
    if (M || !Q()) return;
    ((M = !0),
      ee(),
      window.addEventListener("mcj-tmall-api-data", (t) => {
        Z(t.detail);
      }),
      new MutationObserver(() => P()).observe(document.body || document.documentElement, {
        childList: !0,
        subtree: !0,
      }),
      setInterval(P, 1e3));
  }
  const N = new Map();
  let q = !1;
  const oe = [
    /^https:\/\/.*?\.taobao\.com\/shop\/view_shop\.htm/,
    /^https:\/\/shop\d+\.taobao\.com/,
    /^https:\/\/.*?\.jiyoujia\.com\/shop\/view_shop\.htm/,
  ];
  function ne() {
    return oe.some((e) => e.test(window.location.href));
  }
  function X(e, t) {
    const o = document.querySelector(`.mcj-item-checkbox[data-itemid="${e}"]`);
    o &&
      (!(o.getAttribute("data-itemurl") || "").includes("mi_id=") &&
        t.itemUrl &&
        t.itemUrl.includes("mi_id=") &&
        o.setAttribute("data-itemurl", t.itemUrl),
      t.title && o.setAttribute("data-title", t.title),
      t.vagueSold365 && o.setAttribute("data-sale", t.vagueSold365));
  }
  function se(e) {
    e.forEach((t) => {
      const o = String(t.itemId);
      (N.set(o, t), X(o, t));
    });
  }
  function J() {
    document.querySelectorAll(".mcj-item-checkbox[data-itemid]").forEach((t) => {
      const o = t.getAttribute("data-itemid");
      o && N.has(o) && X(o, N.get(o));
    });
  }
  function ae(e) {
    var o, r, a;
    let t = [];
    ((r = (o = e == null ? void 0 : e.data) == null ? void 0 : o.itemInfoDTO) != null && r.data
      ? (t = e.data.itemInfoDTO.data)
      : (a = e == null ? void 0 : e.data) != null && a.data && (t = e.data.data),
      t.length > 0 && se(t));
  }
  function re() {
    var e = document.createElement("script");
    ((e.text = `
    (function(){
        if (window.__mcjTaobaoApiHookInjected) return;
        window.__mcjTaobaoApiHookInjected = true;
        
        // 拦截 fetch
        var originalFetch = window.fetch;
        window.fetch = function(input, init) {
            var url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            if (url.indexOf('mtop.taobao.shop.simple.fetch') !== -1 || url.indexOf('mtop.taobao.shop.simple.item.fetch') !== -1) {
                return originalFetch.call(window, input, init).then(function(response) {
                    var clonedResponse = response.clone();
                    clonedResponse.json().then(function(data) {
                        window.dispatchEvent(new CustomEvent('mcj-taobao-api-data', { detail: data }));
                    }).catch(function(e) {});
                    return response;
                });
            }
            return originalFetch.call(window, input, init);
        };
        
        // 拦截 XHR
        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            var urlStr = url.toString();
            if (urlStr.indexOf('mtop.taobao.shop.simple.fetch') !== -1 || urlStr.indexOf('mtop.taobao.shop.simple.item.fetch') !== -1) {
                this._mcjTaobaoUrl = urlStr;
            }
            return originalOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            if (this._mcjTaobaoUrl) {
                var self = this;
                this.addEventListener('load', function() {
                    try {
                        var data = JSON.parse(self.responseText);
                        window.dispatchEvent(new CustomEvent('mcj-taobao-api-data', { detail: data }));
                    } catch (e) {}
                });
            }
            return originalSend.call(this, body);
        };
    })();
    `),
      (e.async = !1),
      document.documentElement.appendChild(e));
  }
  function ie() {
    if (q || !ne()) return;
    ((q = !0),
      re(),
      window.addEventListener("mcj-taobao-api-data", (t) => {
        ae(t.detail);
      }),
      new MutationObserver(() => J()).observe(document.body || document.documentElement, {
        childList: !0,
        subtree: !0,
      }),
      setInterval(J, 1e3));
  }
  const R = new Map();
  let F = !1;
  const ce = [
    /^https:\/\/mobile\.yangkeduo\.com\/search_result\.html/,
    /^https:\/\/mobile\.yangkeduo\.com\/search\.html/,
  ];
  function K() {
    return ce.some((e) => e.test(window.location.href));
  }
  function B(e, t) {
    const o = document.querySelector(`.mcj-item-checkbox[data-itemid="${e}"]`);
    if (o) {
      const r = t.linkURL || t.link_url,
        a = t.goodsName || t.goods_name,
        l = t.salesTip || t.sales_tip;
      if (r) {
        const d = `https://mobile.yangkeduo.com/${r}`;
        o.setAttribute("data-itemurl", d);
      }
      (a && o.setAttribute("data-title", a), l && o.setAttribute("data-sale", l));
    }
  }
  function le(e) {
    e.forEach((t) => {
      const o = String(t.goodsID || t.goods_id);
      (R.set(o, t), B(o, t));
    });
  }
  function $() {
    document.querySelectorAll(".mcj-item-checkbox[data-itemid]").forEach((t) => {
      const o = t.getAttribute("data-itemid");
      o && R.has(o) && B(o, R.get(o));
    });
  }
  function de(e) {
    var o, r, a;
    let t = [];
    (e != null && e.list && Array.isArray(e.list) && e.list.length > 0 && e.list[0].goodsID
      ? (t = e.list)
      : e != null && e.items && Array.isArray(e.items)
        ? (t = e.items
            .filter((l) => {
              var d;
              return (d = l.item_data) == null ? void 0 : d.goods_model;
            })
            .map((l) => l.item_data.goods_model))
        : (o = e == null ? void 0 : e.result) != null && o.list && Array.isArray(e.result.list)
          ? (t = e.result.list)
          : (r = e == null ? void 0 : e.data) != null && r.list && Array.isArray(e.data.list)
            ? (t = e.data.list)
            : (a = e == null ? void 0 : e.data) != null &&
              a.items &&
              Array.isArray(e.data.items) &&
              (t = e.data.items
                .filter((l) => {
                  var d;
                  return (d = l.item_data) == null ? void 0 : d.goods_model;
                })
                .map((l) => l.item_data.goods_model)),
      t.length > 0 && le(t));
  }
  function ue() {
    var e = document.createElement("script");
    ((e.text = `
    (function(){
        if (window.__mcjPddSearchHookInjected) return;
        window.__mcjPddSearchHookInjected = true;
        
        // 提取SSR数据的函数
        function extractSSRList() {
            var scripts = document.querySelectorAll('script:not([src])');
            for (var i = 0; i < scripts.length; i++) {
                var text = scripts[i].textContent || '';
                if (text.indexOf('"goodsID"') !== -1 && text.indexOf('"linkURL"') !== -1) {
                    // 方法1: 尝试匹配 "list": [...], "tagNameList"
                    var regex1 = /"list"\\s*:\\s*(\\[\\s*\\{[\\s\\S]*?\\}\\s*\\])\\s*,\\s*"tagNameList"/;
                    var match = text.match(regex1);
                    if (match && match[1]) {
                        try {
                            var list = JSON.parse(match[1]);
                            if (list && list.length > 0 && list[0].goodsID) {
                                return list;
                            }
                        } catch(e) {}
                    }
                    // 方法2: 查找包含goodsID的数组起始位置，手动提取
                    var listStart = text.indexOf('"list":[{');
                    if (listStart === -1) listStart = text.indexOf('"list": [{');
                    if (listStart !== -1) {
                        var arrayStart = text.indexOf('[', listStart);
                        var bracketCount = 0;
                        var arrayEnd = -1;
                        for (var j = arrayStart; j < text.length; j++) {
                            if (text[j] === '[') bracketCount++;
                            else if (text[j] === ']') {
                                bracketCount--;
                                if (bracketCount === 0) {
                                    arrayEnd = j + 1;
                                    break;
                                }
                            }
                        }
                        if (arrayEnd !== -1) {
                            var arrayStr = text.substring(arrayStart, arrayEnd);
                            try {
                                var list = JSON.parse(arrayStr);
                                if (list && list.length > 0 && list[0].goodsID) {
                                    return list;
                                }
                            } catch(e) {}
                        }
                    }
                }
            }
            return null;
        }
        
        // 尝试提取SSR数据（第一页）
        setTimeout(function() {
            var ssrList = extractSSRList();
            if (ssrList && ssrList.length > 0) {
                window.dispatchEvent(new CustomEvent('mcj-pdd-search-data', { detail: { list: ssrList, _isSSR: true } }));
            }
        }, 500);
        
        // 拦截 fetch（第二页及之后）
        var originalFetch = window.fetch;
        window.fetch = function(input, init) {
            var url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            // 拦截搜索相关的API
            if (url.indexOf('proxy/api') !== -1 && (url.indexOf('search') !== -1 || url.indexOf('goods') !== -1)) {
                return originalFetch.call(window, input, init).then(function(response) {
                    var clonedResponse = response.clone();
                    clonedResponse.json().then(function(data) {
                        window.dispatchEvent(new CustomEvent('mcj-pdd-search-data', { detail: data }));
                    }).catch(function(e) {});
                    return response;
                });
            }
            return originalFetch.call(window, input, init);
        };
        
        // 拦截 XHR
        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            var urlStr = url.toString();
            if (urlStr.indexOf('proxy/api') !== -1 && (urlStr.indexOf('search') !== -1 || urlStr.indexOf('goods') !== -1)) {
                this._mcjPddSearchUrl = urlStr;
            }
            return originalOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            if (this._mcjPddSearchUrl) {
                var self = this;
                this.addEventListener('load', function() {
                    try {
                        var data = JSON.parse(self.responseText);
                        window.dispatchEvent(new CustomEvent('mcj-pdd-search-data', { detail: data }));
                    } catch (e) {}
                });
            }
            return originalSend.call(this, body);
        };
    })();
    `),
      (e.async = !1),
      document.documentElement.appendChild(e));
  }
  function G() {
    if (F || !K()) return;
    ((F = !0),
      ue(),
      window.addEventListener("mcj-pdd-search-data", (t) => {
        de(t.detail);
      }),
      new MutationObserver(() => $()).observe(document.body || document.documentElement, {
        childList: !0,
        subtree: !0,
      }),
      setInterval($, 1e3));
  }
  K() && G();
  const H = new Map();
  let V = !1;
  const pe = [/^https:\/\/mobile\.yangkeduo\.com\/mall_page\.html.*?mall_id=\d+/];
  function me() {
    return pe.some((e) => e.test(window.location.href));
  }
  function z(e, t) {
    const o = document.querySelector(`.mcj-item-checkbox[data-itemid="${e}"]`);
    if (o) {
      const r = t.link_url,
        a = t.goods_name,
        l = t.sales_tip,
        d = t.thumb_url || t.hd_thumb_url,
        h = t.price;
      if (r) {
        const y = r.startsWith("http") ? r : `https://mobile.yangkeduo.com/${r}`;
        o.setAttribute("data-itemurl", y);
      }
      if (
        (a && o.setAttribute("data-title", a),
        l && o.setAttribute("data-sale", l),
        d && o.setAttribute("data-thumb", d),
        h !== void 0)
      ) {
        const y = (h / 100).toFixed(2);
        o.setAttribute("data-price", y);
      }
    }
  }
  function he(e) {
    e.forEach((t) => {
      const o = String(t.goods_id);
      o && (H.set(o, t), z(o, t));
    });
  }
  function W() {
    document.querySelectorAll(".mcj-item-checkbox[data-itemid]").forEach((t) => {
      const o = t.getAttribute("data-itemid");
      o && H.has(o) && z(o, H.get(o));
    });
  }
  function fe(e) {
    let t = [];
    (e != null && e.goods_list && Array.isArray(e.goods_list) && (t = e.goods_list), t.length > 0 && he(t));
  }
  function ge() {
    var e = document.createElement("script");
    ((e.text = `
    (function(){
        if (window.__mcjPddStoreHookInjected) return;
        window.__mcjPddStoreHookInjected = true;
        
        // 拦截 fetch
        var originalFetch = window.fetch;
        window.fetch = function(input, init) {
            var url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            // 拦截店铺商品列表API
            if (url.indexOf('query_cat_goods') !== -1) {
                return originalFetch.call(window, input, init).then(function(response) {
                    var clonedResponse = response.clone();
                    clonedResponse.json().then(function(data) {
                        window.dispatchEvent(new CustomEvent('mcj-pdd-store-data', { detail: data }));
                    }).catch(function(e) {});
                    return response;
                });
            }
            return originalFetch.call(window, input, init);
        };
        
        // 拦截 XHR
        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            var urlStr = url.toString();
            if (urlStr.indexOf('query_cat_goods') !== -1) {
                this._mcjPddStoreUrl = urlStr;
            }
            return originalOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function(body) {
            if (this._mcjPddStoreUrl) {
                var self = this;
                this.addEventListener('load', function() {
                    try {
                        var data = JSON.parse(self.responseText);
                        window.dispatchEvent(new CustomEvent('mcj-pdd-store-data', { detail: data }));
                    } catch (e) {}
                });
            }
            return originalSend.call(this, body);
        };
    })();
    `),
      (e.async = !1),
      document.documentElement.appendChild(e));
  }
  function ye() {
    if (V || !me()) return;
    ((V = !0),
      ge(),
      window.addEventListener("mcj-pdd-store-data", (t) => {
        fe(t.detail);
      }),
      new MutationObserver(() => W()).observe(document.body || document.documentElement, {
        childList: !0,
        subtree: !0,
      }),
      setInterval(W, 1e3));
  }
  let we = 0;
  function _e(e) {
    const { pagePatterns: t, apis: o, storagePrefix: r = "mcj_" } = e,
      a = `__mcjStoreHook_${++we}`,
      l = `mcj-store-hook-${a}`,
      d = new Map();
    o.forEach((p) => d.set(p.storageKey, new Map()));
    let h = !1,
      y = null;
    function b() {
      return t.some((p) => p.test(window.location.href));
    }
    function i(p) {
      return r + p;
    }
    function u(p, _) {
      const v = i(p);
      try {
        sessionStorage.setItem(v, JSON.stringify(_));
      } catch {}
    }
    function n(p, _) {
      if (p < 0 || p >= o.length) return;
      const v = o[p],
        L = v.extractItems(_);
      if (!L.length) return;
      const E = d.get(v.storageKey);
      (L.forEach((k) => {
        const T = String(k.id ?? k.goods_id ?? k.itemId ?? "");
        T && E.set(T, k);
      }),
        u(v.storageKey, L));
    }
    function c() {
      const p = [],
        _ = [];
      o.forEach((k, T) => {
        const A = k.method || "both";
        ((A === "fetch" || A === "both") && p.push({ idx: T, keyword: k.urlKeyword }),
          (A === "xhr" || A === "both") && _.push({ idx: T, keyword: k.urlKeyword }));
      });
      const v = `(function(apiIndex,data){window.dispatchEvent(new CustomEvent('${l}',{detail:{__apiIndex:apiIndex,data:data}}));})`,
        L = p.length
          ? `
  var of=window.fetch;
  window.fetch=function(input,init){
    var url=typeof input==='string'?input:input instanceof URL?input.toString():input.url;
    var _fk=[${p.map((k) => `{i:${k.idx},k:'${k.keyword}'}`).join(",")}];
    var matched=null;
    for(var fi=0;fi<_fk.length;fi++){if(url.includes(_fk[fi].k)){matched=_fk[fi];break;}}
    if(matched){
      return of.call(window,input,init).then(function(r){
        var c=r.clone();
        c.json().then(function(d){${v}(matched.i,d);}).catch(function(){});
        return r;
      });
    }
    return of.call(window,input,init);
  };`
          : "",
        E = _.length
          ? `
  var oo=XMLHttpRequest.prototype.open;
  var os=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,url){
    var urlStr=url.toString();
    var _xk=[${_.map((k) => `{i:${k.idx},k:'${k.keyword}'}`).join(",")}];
    var matched=null;
    for(var xi=0;xi<_xk.length;xi++){if(urlStr.includes(_xk[xi].k)){matched=_xk[xi];break;}}
    if(matched)this['_${a}']=matched;
    return oo.apply(this,arguments);
  };
  XMLHttpRequest.prototype.send=function(body){
    var matched=this['_${a}'];
    if(matched){
      var self=this;
      this.addEventListener('load',function(){
        try{var d=JSON.parse(self.responseText);${v}(matched.i,d);}catch(e){}
      });
    }
    return os.call(this,body);
  };`
          : "";
      return `
(function(){
  if(window['${a}'])return;
  window['${a}']=true;
${L}
${E}
})();`;
    }
    function f() {
      const p = document.createElement("script");
      ((p.text = c()), (p.async = !1), document.documentElement.appendChild(p));
    }
    function g() {
      h ||
        (b() &&
          ((h = !0),
          f(),
          (y = (p) => {
            const { __apiIndex: _, data: v } = p.detail;
            n(_, v);
          }),
          window.addEventListener(l, y)));
    }
    function m(p, _) {
      var v;
      if (_) return (v = d.get(_)) == null ? void 0 : v.get(p);
      for (const L of d.values()) {
        const E = L.get(p);
        if (E) return E;
      }
    }
    function S(p) {
      if (p) return d.get(p) || new Map();
      const _ = new Map();
      return (d.forEach((v) => v.forEach((L, E) => _.set(E, L))), _);
    }
    function w() {
      (y && (window.removeEventListener(l, y), (y = null)), d.forEach((p) => p.clear()), (h = !1));
    }
    return { init: g, getCachedItem: m, getAllCached: S, destroy: w };
  }
  function ve() {
    _e({
      pagePatterns: [/mms\.pinduoduo\.com\/goods\/goods_list/],
      apis: [
        {
          urlKeyword: "mms/query/commit/list",
          storageKey: "goods",
          extractItems: (o) => (o == null ? void 0 : o.result.list) || [],
          method: "fetch",
        },
      ],
      storagePrefix: "mcj_",
    }).init();
  }
  (function () {
    let e = !1;
    const t = new WeakMap();
    function o(n) {
      return n ? n === "jd.com" || n.endsWith(".jd.com") || n.endsWith(".jd.hk") || n.endsWith("npcitem.jd.hk") : !1;
    }
    function r(n) {
      try {
        if (typeof n == "string") return new URL(n, window.location.href).toString();
        if (n && typeof n == "object") {
          if (n instanceof URL) return n.toString();
          if (typeof n.url == "string") return new URL(n.url, window.location.href).toString();
          if (typeof n.toString == "function") return new URL(n.toString(), window.location.href).toString();
        }
      } catch {}
      return "";
    }
    function a(n) {
      try {
        return new URL(n, window.location.href).searchParams.get("functionId") || "";
      } catch {
        const c = String(n).match(/[?&]functionId=([^&]+)/);
        return c ? decodeURIComponent(c[1]) : "";
      }
    }
    const l = new Set(["pc_detailpage_wareBusiness"]);
    function d(n) {
      if (!n || (!n.includes("api.m.jd.com") && !n.includes("color.jd.hk"))) return !1;
      const c = a(n);
      return c ? l.has(c) : !1;
    }
    function h(n) {
      try {
        (localStorage.setItem("mcj-jd-net-data", JSON.stringify(n)),
          window.dispatchEvent(new CustomEvent("mcj-jd-net", { detail: n })));
      } catch {}
    }
    function y(n) {
      try {
        const c = n.responseType;
        return c && c !== "text" && c !== "" ? null : typeof n.responseText == "string" ? n.responseText : null;
      } catch {
        return null;
      }
    }
    function b(n, c) {
      (Object.defineProperty(n, "toString", {
        value: () => `function ${c.name}() { [native code] }`,
        enumerable: !1,
        configurable: !0,
        writable: !0,
      }),
        Object.defineProperty(n, "name", { value: c.name, enumerable: !1, configurable: !0, writable: !1 }),
        Object.defineProperty(n, "length", { value: c.length, enumerable: !1, configurable: !0, writable: !1 }));
    }
    function i() {
      const n = window.XMLHttpRequest;
      if (!n || !n.prototype) return;
      const c = n.prototype,
        f = c.open,
        g = c.send;
      typeof f != "function" ||
        typeof g != "function" ||
        ((c.open = function (m, S) {
          if (!(this instanceof n)) return f.apply(this, arguments);
          const w = t.get(this) || {};
          return ((w.method = m), (w.url = r(S)), t.set(this, w), f.apply(this, arguments));
        }),
        b(c.open, f),
        (c.send = function (m) {
          if (!(this instanceof n)) return g.apply(this, arguments);
          const S = t.get(this) || {};
          return (
            (S.body = m),
            t.set(this, S),
            this.addEventListener(
              "loadend",
              function () {
                try {
                  const w = t.get(this);
                  if (!w || w.emitted || !d(w.url)) return;
                  const p = y(this);
                  (h({ transport: "xhr", url: w.url, method: w.method, status: this.status, responseText: p }),
                    (w.emitted = !0),
                    t.set(this, w));
                } catch {}
              },
              { once: !0 },
            ),
            g.apply(this, arguments)
          );
        }),
        b(c.send, g));
    }
    function u() {
      const n = window.fetch;
      typeof n == "function" &&
        ((window.fetch = function (c, f) {
          const g = r(c);
          return n.apply(window, arguments).then(function (m) {
            try {
              if (!d(g)) return m;
              m.clone()
                .text()
                .then(function (w) {
                  h({
                    transport: "fetch",
                    url: g,
                    method: f && f.method ? f.method : "GET",
                    status: m.status,
                    responseText: w,
                  });
                })
                .catch((w) => {});
            } catch {}
            return m;
          });
        }),
        b(window.fetch, n));
    }
    window.initJdGoodsHook = function () {
      if (e) return;
      const c = window.location.hostname;
      if (o(c)) {
        e = !0;
        try {
          i();
        } catch {}
        try {
          u();
        } catch {}
      }
    };
  })();
  const ke = window.initJdGoodsHook;
  (function () {
    let e = !1;
    const t = new WeakMap();
    function o(i) {
      return i === "wares-jdm.jd.com";
    }
    function r(i) {
      try {
        if (typeof i == "string") return new URL(i, window.location.href).toString();
        if (i && typeof i == "object") {
          if (i instanceof URL) return i.toString();
          if (typeof i.url == "string") return new URL(i.url, window.location.href).toString();
        }
      } catch {}
      return String(i);
    }
    function a(i, u) {
      const n = "dsm.product.manage.DraftViewService.searchDraftList",
        c = i && i.includes(n);
      let f = !1;
      return (typeof u == "string" && (f = u.includes(n)), c || f);
    }
    function l(i) {
      try {
        if (!i.responseText) return;
        const u = JSON.parse(i.responseText),
          n = u.data && u.data.data ? u.data.data : [];
        sessionStorage.setItem("jdCommitList", JSON.stringify(n));
      } catch {}
    }
    function d(i) {
      try {
        const u = i.responseType;
        return u && u !== "text" && u !== "" ? null : typeof i.responseText == "string" ? i.responseText : null;
      } catch {
        return null;
      }
    }
    function h(i, u) {
      (Object.defineProperty(i, "toString", {
        value: () => `function ${u.name}() { [native code] }`,
        enumerable: !1,
        configurable: !0,
        writable: !0,
      }),
        ["name", "length"].forEach((n) => {
          Object.defineProperty(i, n, { value: u[n], enumerable: !1, configurable: !0, writable: !1 });
        }));
    }
    function y() {
      const i = window.XMLHttpRequest;
      if (!i || !i.prototype) return;
      const u = i.prototype,
        n = u.open,
        c = u.send;
      ((u.open = function (f, g) {
        if (!(this instanceof i)) return n.apply(this, arguments);
        const m = t.get(this) || {};
        return ((m.method = f), (m.url = r(g)), t.set(this, m), n.apply(this, arguments));
      }),
        h(u.open, n),
        (u.send = function (f) {
          if (!(this instanceof i)) return c.apply(this, arguments);
          const g = t.get(this) || {};
          return (
            (g.body = f),
            t.set(this, g),
            this.addEventListener(
              "loadend",
              function () {
                try {
                  const m = t.get(this);
                  if (!m || m.emitted || !a(m.url, m.body)) return;
                  const S = d(this);
                  (l({ transport: "xhr", url: m.url, method: m.method, status: this.status, responseText: S }),
                    (m.emitted = !0),
                    t.set(this, m));
                } catch {}
              },
              { once: !0 },
            ),
            c.apply(this, arguments)
          );
        }),
        h(u.send, c));
    }
    function b() {
      const i = window.fetch;
      typeof i == "function" &&
        ((window.fetch = function (u, n) {
          const c = r(u),
            f = n && n.body ? n.body : null;
          return i.apply(window, arguments).then(function (g) {
            try {
              if (!a(c, f)) return g;
              g.clone()
                .text()
                .then(function (S) {
                  l({
                    transport: "fetch",
                    url: c,
                    method: (n && n.method) || "GET",
                    status: g.status,
                    responseText: S,
                  });
                });
            } catch {}
            return g;
          });
        }),
        h(window.fetch, i));
    }
    window.initJdStoreDraftList = function () {
      if (!(e || !o(window.location.hostname))) {
        e = !0;
        try {
          y();
        } catch {}
        try {
          b();
        } catch {}
      }
    };
  })();
  const be = window.initJdStoreDraftList;
  if (
    (te(),
    ie(),
    G(),
    ye(),
    ve(),
    ke(),
    be(),
    window.location.href.includes("item.upload.taobao.com/sell") ||
      window.location.href.includes("sell.publish.tmall.com/tmall/publish.htm") ||
      window.location.href.includes("fxg.jinritemai.com/ffa/g/create?"))
  ) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        (function(w){
            w.originalAdd = w.addEventListener;
            var myAdd = function() {
                if(arguments[0] == 'beforeunload'){
                    return
                }
                return w.originalAdd.apply(this, arguments);
            }
            myAdd.toString = function(){
                return w.originalAdd.toString();
            }
            Object.defineProperty(w, 'addEventListener', {
                value: myAdd
            });
        })(window);
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s),
      (s = document.createElement("script")),
      (s.text = `
    (function () {
        let custom_value_list = localStorage.getItem("custom_value_list");
        let custom_Json = localStorage.getItem("Json");
        let detail_text_load = localStorage.getItem('detail_text_load');
        if (custom_value_list && !custom_Json) {
            custom_value_list = JSON.parse(custom_value_list)
            let _Json = window.Json || {}, _Json2 = window.Json2 || {};
            Object.defineProperty(window, 'Json', {
                configurable: true,
                enumerable: true,
                get: function () {
                    for(let item of custom_value_list){
                        _Json.models.formValues[item.key] = item.value;
                        if(_Json.components[item.key]){
                            _Json.components[item.key].props.value = item.value;
                        }
                    }
                    if(!detail_text_load){
                        localStorage.removeItem('custom_value_list');
                    }
                    return _Json;
                },
                set: function (val) {
                    _Json = val;
                }
            })
            Object.defineProperty(window, 'Json2', {
                configurable: true,
                enumerable: true,
                get: function () {
                    return _Json2;
                },
                set: function (val) {
                    for(let item of custom_value_list){
                        if(val.components[item.key]){
                            val.components[item.key].props.value = item.value;
                        }
                    }
                    if(!detail_text_load){
                        localStorage.removeItem('custom_value_list');
                    }
                    _Json2 = val;
                }
            })
        }
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s),
      (s = document.createElement("script")),
      (s.text = `
    (function(){
        let custom_Json = localStorage.getItem("Json");
        if (custom_Json) {
            custom_Json = JSON.parse(custom_Json)
            let _Json = custom_Json
            Object.defineProperty(window, 'Json', {
                configurable: true,
                enumerable: true,
                get: function () {
                    return _Json;
                },
                set: function (val) {
                    _Json = custom_Json;
                }
            })
            Object.defineProperty(window, 'Json2', {
                configurable: true,
                enumerable: true,
                get: function () {
                    return _Json;
                },
                set: function (val) {
                    for(let key of Object.keys(val.components)){
                        if(custom_Json.components[key]){
                            val.components[key] = custom_Json.components[key]
                        }
                    }
                    // val.models.formValues = custom_Json.models.formValues;
                    _Json = val;
                }
            })
        }
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (location.href.includes("passport.taobao.com/iv")) {
    let e = document.createElement("script");
    ((e.src = "https://a.alipayobjects.com/jquery/jquery/1.9.1/jquery.js"), document.documentElement.appendChild(e));
  }
  if (
    window.location.href.includes("haohuo.jinritemai.com/ecommerce/trade/detail") ||
    window.location.href.includes("douyin.com/")
  ) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        function XMLADD() {
            window.hook_data = [];
            window.hook_pc = [];
            console.log('注入代码>1...');
            const on_send = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function (send_data) {  //this
            this.addEventListener('load', function () {
                let zs = 'mcj_xml_send'
                var class_name = ''
                if (this.responseURL.includes('haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/h5/') || this.responseURL.includes('v2/shop/promotion/pack/detail/')  || this.responseURL.includes('www.douyin.com/aweme/v1/web/general/search/single/') || this.responseURL.includes('ecom/product/detail/saas/pc')){
                    class_name = 'hook_data'
                }
                if (this.responseURL.includes('www.douyin.com/ecom/product/detail/saas/pc/')){
                    class_name = 'hook_pc'
                }
                if (this.responseURL.includes('www.douyin.com/aweme/v2/shop/promotion/pack/detail/')){
                    class_name = 'hook_detail'
                }
                if (this.responseURL.includes('www.douyin.com/aweme/v1/web/ecom/order/confirm/')){
                    class_name = 'hook_confirm'
                }
                if (this.responseURL.includes('product/sku/list/')){
                    class_name = 'hook_skulist'
                }
                if (class_name.length > 0){
                    let response = JSON.parse(this.responseText);
                    if (class_name === 'hook_data'){
                        window.hook_data.push(response);
                    } else if (class_name === 'hook_pc'){
                        window.hook_pc.push(response);
                    }
                    let div = document.createElement('div');
                    div.innerHTML = encodeURIComponent(this.responseText);
                    div.className = class_name + ' hook'
                    div.style.display = 'none';
                    div.setAttribute('data-url', this.responseURL)
                    document.body.appendChild(div);
                }
            });
            return on_send.apply(this, arguments);
            };
        }
        XMLADD()
        setInterval(() => {
            if(!XMLHttpRequest.prototype.send.toString().includes('mcj_xml_send')){
                XMLADD()
            }    
        }, 1000)
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("shopee.sg") || window.location.href.includes("shopee.com")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        function SHOPEE_HOOK_INIT() {
            window.shopee_hook_data = [];
            window.shopee_hook_pc = [];
            window.shopee_hook_detail = [];
            // console.log('🪝 注入Shopee Hook拦截器 (XMLHttpRequest + Fetch)...');
            
            // 处理响应的通用函数
            function processResponse(url, responseText, status, method) {
                // 去除控制台打印，仅分类存储
                if (url.includes('get_pc')) {
                }
                
                var class_name = '';
                // 优先匹配具体的API
                if (url.includes('shopee.sg/api/pc') || url.includes('shopee.com/api/pc')){
                    class_name = 'shopee_hook_pc'
                }
                else if (url.includes('shopee.sg/api/v4/pdp/get_pc') || url.includes('shopee.com/api/v4/pdp/get_pc')){
                    class_name = 'shopee_hook_pc'
                }
                else if (url.includes('shopee.sg/api/v4/pdp/get_detail') || url.includes('shopee.com/api/v4/pdp/get_detail')){
                    class_name = 'shopee_hook_detail'
                }
                // 排除seller.shopee.sg的API，只匹配商品相关的API
                else if ((url.includes('shopee.sg/api/') || url.includes('shopee.com/api/')) && 
                         !url.includes('seller.shopee.sg') && 
                         !url.includes('shopee.sg/api/tsp/') &&
                         !url.includes('shopee.com/api/tsp/')){
                    class_name = 'shopee_hook_data'
                }
                
                if (class_name.length > 0){
                    try {
                        let response = JSON.parse(responseText);
                        if (class_name === 'shopee_hook_data'){
                            window.shopee_hook_data.push(response);
                        } else if (class_name === 'shopee_hook_pc'){
                            window.shopee_hook_pc.push(response);
                        } else if (class_name === 'shopee_hook_detail'){
                            window.shopee_hook_detail.push(response);
                        }
                        // 参考抖音Hook实现，创建隐藏div存储数据
                        let div = document.createElement('div');
                        div.innerHTML = encodeURIComponent(responseText);
                        div.className = class_name + ' hook'
                        div.style.display = 'none';
                        div.setAttribute('data-url', url)
                        div.setAttribute('data-timestamp', Date.now())
                        document.body.appendChild(div);
                        
                        // 同时存储到window对象，确保TypeScript代码能访问
                        if (!window[class_name]) {
                            window[class_name] = [];
                        }
                        window[class_name].push({
                            url: url,
                            data: response,
                            timestamp: Date.now(),
                            status: status
                        });
                    } catch (parseError) {
                        // 解析失败，静默处理
                    }
                }
            }
            
            // 拦截XMLHttpRequest
            const on_send = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function (send_data) {
                this.addEventListener('load', function () {
                    processResponse(this.responseURL, this.responseText, this.status, 'XMLHttpRequest');
                });
                return on_send.apply(this, arguments);
            };
            
            // 拦截Fetch请求
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    // 克隆响应以便读取
                    const clonedResponse = response.clone();
                    clonedResponse.text().then(responseText => {
                        const url = response.url || args[0];
                        processResponse(url, responseText, response.status, 'Fetch');
                    }).catch(err => {
                        console.warn('⚠️ 读取Fetch响应失败:', err);
                    });
                    return response;
                });
            };
        }
        
        SHOPEE_HOOK_INIT()
        
        // 保持Hook，检查频率
        setInterval(() => {
            if(!XMLHttpRequest.prototype.send.toString().includes('shopee_mcj_xml_send')){
                // console.log('🔄 检测到XMLHttpRequest Hook被重置，重新注入...');
                SHOPEE_HOOK_INIT()
            }    
        }, 500)
        
        // Hook状态监控 - 静默运行，不打印状态信息
        setInterval(() => {
            const hookPcCount = window.shopee_hook_pc?.length || 0;
            // 静默监控，不打印状态
        }, 5000)
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("agentseller.temu.com/goods/create/category")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        function TEMU_CATEGORY_HOOK_INIT() {
            // 初始化或恢复数据：如果已存在则不重置，否则从隐藏div中恢复
            if (!window.temu_category_hook_data || !Array.isArray(window.temu_category_hook_data)) {
                window.temu_category_hook_data = [];
            }
            
            // 从隐藏div中恢复之前存储的数据
            const existingDivs = document.querySelectorAll('.temu_category_hook');
            if (existingDivs.length > 0 && window.temu_category_hook_data.length === 0) {
                existingDivs.forEach(div => {
                    try {
                        const responseText = decodeURIComponent(div.innerHTML);
                        const response = JSON.parse(responseText);
                        if (response && response.success && response.result && 
                            response.result.categoryNodeVOS && 
                            Array.isArray(response.result.categoryNodeVOS) && 
                            response.result.categoryNodeVOS.length > 0) {
                            
                            const categories = response.result.categoryNodeVOS;
                            const parentCatId = categories.length > 0 ? categories[0].parentCatId : null;
                            
                            const hookData = {
                                url: div.getAttribute('data-url') || '',
                                data: response,
                                categories: categories.map(c => ({
                                    catId: c.catId || c.id,
                                    catName: c.catName || c.name,
                                    catEnName: c.catEnName || c.enName,
                                    name: c.name || c.catName,
                                    enName: c.enName || c.catEnName,
                                    catLevel: c.catLevel,
                                    catType: c.catType,
                                    parentCatId: c.parentCatId,
                                    isLeaf: c.isLeaf,
                                    isHidden: c.isHidden,
                                    hiddenType: c.hiddenType,
                                    isSemiManagedHidden: c.isSemiManagedHidden,
                                    semiManagedHiddenType: c.semiManagedHiddenType
                                })),
                                parentCatId: parentCatId,
                                categoryCount: categories.length,
                                timestamp: parseInt(div.getAttribute('data-timestamp')) || Date.now(),
                                status: 200,
                                method: 'Restored'
                            };
                            
                            window.temu_category_hook_data.push(hookData);
                        }
                    } catch (e) {
                    }
                });
                if (window.temu_category_hook_data.length > 0) {
                }
            }
            
            
            // 处理响应的通用函数
            function processCategoryResponse(url, responseText, status, method) {
                // 检查是否是品类列表API
                if (url.includes('anniston-agent-seller/category/children/list')) {
                    try {
                        let response = JSON.parse(responseText);
                        
                        // 检查响应格式和categoryNodeVOS是否有值
                        if (response && response.success && response.result && 
                            response.result.categoryNodeVOS && 
                            Array.isArray(response.result.categoryNodeVOS) && 
                            response.result.categoryNodeVOS.length > 0) {
                            
                            const categories = response.result.categoryNodeVOS;
                            const parentCatId = categories.length > 0 ? categories[0].parentCatId : null;
                            
                            // 生成基于品类ID列表的唯一标识符（用于去重）
                            const categoryIds = categories.map(c => c.catId).sort((a, b) => a - b).join(',');
                            
                            // 去重：检查是否已存在完全相同内容的数据（基于品类ID列表）
                            const existingData = window.temu_category_hook_data.find(item => {
                                if (item.parentCatId !== parentCatId || !item.categories) return false;
                                const existingIds = item.categories.map(c => c.catId).sort((a, b) => a - b).join(',');
                                return existingIds === categoryIds;
                            });
                            
                            if (existingData) {
                                // 如果已存在完全相同内容的数据，跳过存储（不打印日志）
                                return;
                            }
                            
                            // 如果不存在完全相同的数据，移除相同 parentCatId 的旧数据（保留最新的）
                            if (parentCatId !== null) {
                                // 从 window.temu_category_hook_data 中移除相同 parentCatId 的旧数据
                                window.temu_category_hook_data = window.temu_category_hook_data.filter(item => 
                                    item.parentCatId !== parentCatId
                                );
                                
                                // 从 DOM 中移除相同 parentCatId 的旧 div
                                const oldDivs = document.querySelectorAll('.temu_category_hook[data-parent-cat-id="' + parentCatId + '"]');
                                oldDivs.forEach(oldDiv => {
                                    oldDiv.remove();
                                });
                            }
                            
                            // 存储到window对象（包含 catType 和 isLeaf）
                            // 兼容不同的字段名：API可能返回 catName/name, catEnName/enName
                            const hookData = {
                                url: url,
                                data: response,
                                categories: categories.map(c => ({
                                    catId: c.catId || c.id,
                                    catName: c.catName || c.name,  // 兼容两种字段名
                                    catEnName: c.catEnName || c.enName,  // 兼容两种字段名
                                    name: c.name || c.catName,  // 同时保存两种字段名，确保匹配时能找到
                                    enName: c.enName || c.catEnName,  // 同时保存两种字段名
                                    catLevel: c.catLevel,
                                    catType: c.catType,
                                    parentCatId: c.parentCatId,
                                    isLeaf: c.isLeaf,
                                    isHidden: c.isHidden,
                                    hiddenType: c.hiddenType,
                                    isSemiManagedHidden: c.isSemiManagedHidden,
                                    semiManagedHiddenType: c.semiManagedHiddenType
                                })),
                                parentCatId: parentCatId,
                                categoryCount: categories.length,
                                timestamp: Date.now(),
                                status: status,
                                method: method
                            };
                            
                            window.temu_category_hook_data.push(hookData);
                            
                            // 创建隐藏div存储数据
                            let div = document.createElement('div');
                            div.innerHTML = encodeURIComponent(responseText);
                            div.className = 'temu_category_hook hook';
                            div.style.display = 'none';
                            div.setAttribute('data-url', url);
                            div.setAttribute('data-timestamp', Date.now());
                            div.setAttribute('data-parent-cat-id', parentCatId || '');
                            div.setAttribute('data-category-count', categories.length);
                            document.body.appendChild(div);
                            
                        }
                    } catch (parseError) {
                    }
                }
            }
            
            // 拦截XMLHttpRequest
            const on_send = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function (send_data) {
                this.addEventListener('load', function () {
                    processCategoryResponse(this.responseURL, this.responseText, this.status, 'XMLHttpRequest');
                });
                return on_send.apply(this, arguments);
            };
            
            // 拦截Fetch请求
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    // 克隆响应以便读取
                    const clonedResponse = response.clone();
                    clonedResponse.text().then(responseText => {
                        const url = response.url || args[0];
                        processCategoryResponse(url, responseText, response.status, 'Fetch');
                    }).catch(err => {
                        console.warn('⚠️ 读取Fetch响应失败:', err);
                    });
                    return response;
                });
            };
        }
        
        TEMU_CATEGORY_HOOK_INIT();
        
        // 保存原始方法引用，用于页面跳转时恢复
        let originalXHRSend = XMLHttpRequest.prototype.send;
        let originalFetch = window.fetch;
        let hookIntervalId = null;
        
        // 启动品类选择监听器（直接在hook中实现）
        function startCategorySelectionListener() {
            
            let lastSpanCount = 0;
            let observer = null;
            
            // 获取品类路径容器
            const getCategoryContainer = () => {
                // 尝试多种选择器
                let container = document.querySelector('.category-wrap_catLinkContainer__VwEDe');
                if (container) {
                    return container;
                }
                
                // 尝试部分匹配类名
                container = document.querySelector('[class*="catLinkContainer"]');
                if (container) {
                    return container;
                }
                
                // 尝试查找包含品类路径的元素
                const allDivs = document.querySelectorAll('div');
                for (let div of allDivs) {
                    if (div.className && div.className.includes('catLinkContainer')) {
                        return div;
                    }
                }
                
                return null;
            };
            
            // 获取品类信息并匹配
            const getCategoryInfo = () => {
                const categoryContainer = getCategoryContainer();
                if (!categoryContainer) {
                    return;
                }
                
                // 尝试多种选择器查找品类链接
                let categoryLinks = categoryContainer.querySelectorAll('.category-wrap_catLink__v\\+GmF');
                
                if (categoryLinks.length === 0) {
                    categoryLinks = categoryContainer.querySelectorAll('[class^="category-wrap_catLink__"]');
                }
                
                if (categoryLinks.length === 0) {
                    categoryLinks = categoryContainer.querySelectorAll('span[class*="catLink"]');
                }
                
                if (categoryLinks.length === 0) {
                    categoryLinks = categoryContainer.querySelectorAll('span');
                }
                
                
                const currentSpanCount = categoryLinks.length;
                
                if (currentSpanCount === lastSpanCount) {
                    return;
                }
                
                lastSpanCount = currentSpanCount;
                
                if (currentSpanCount === 1) {
                    const firstLinkText = categoryLinks[0].textContent?.trim();
                    if (firstLinkText === '全部分类' || firstLinkText === 'All Categories') {
                        return;
                    }
                }
                
                if (currentSpanCount > 0) {
                    const lastSpan = categoryLinks[currentSpanCount - 1];
                    let leafCategoryName = lastSpan.textContent ? lastSpan.textContent.trim() : '';
                    
                    // 清理品类名称：去掉开头的 > 符号和多余空格
                    leafCategoryName = leafCategoryName.replace(/^>s*/, '').trim();
                    
                    const allCategoryNames = Array.from(categoryLinks).map((link, index) => {
                        let text = link.textContent ? link.textContent.trim() : '';
                        text = text.replace(/^>s*/, '').trim(); // 清理每个路径段
                        return (index + 1) + '. ' + text;
                    });
                    
                    if (!leafCategoryName || leafCategoryName === '全部分类' || leafCategoryName === 'All Categories') {
                        return;
                    }
                    
                    // 从拦截数据中查找匹配的品类
                    // 优先从 window.temu_category_hook_data 获取，如果为空则从隐藏div中读取
                    let hookData = window.temu_category_hook_data;
                    
                    // 如果 window 中的数据为空，尝试从隐藏div中恢复
                    if (!hookData || !Array.isArray(hookData) || hookData.length === 0) {
                        const existingDivs = document.querySelectorAll('.temu_category_hook');
                        if (existingDivs.length > 0) {
                            hookData = [];
                            existingDivs.forEach(div => {
                                try {
                                    const responseText = decodeURIComponent(div.innerHTML);
                                    const response = JSON.parse(responseText);
                                    if (response && response.success && response.result && 
                                        response.result.categoryNodeVOS && 
                                        Array.isArray(response.result.categoryNodeVOS) && 
                                        response.result.categoryNodeVOS.length > 0) {
                                        
                                        const categories = response.result.categoryNodeVOS;
                                        const parentCatId = categories.length > 0 ? categories[0].parentCatId : null;
                                        
                                        const hookDataItem = {
                                            url: div.getAttribute('data-url') || '',
                                            data: response,
                                            categories: categories.map(c => ({
                                                catId: c.catId || c.id,
                                                catName: c.catName || c.name,
                                                catEnName: c.catEnName || c.enName,
                                                name: c.name || c.catName,
                                                enName: c.enName || c.catEnName,
                                                catLevel: c.catLevel,
                                                catType: c.catType,
                                                parentCatId: c.parentCatId,
                                                isLeaf: c.isLeaf,
                                                isHidden: c.isHidden,
                                                hiddenType: c.hiddenType,
                                                isSemiManagedHidden: c.isSemiManagedHidden,
                                                semiManagedHiddenType: c.semiManagedHiddenType
                                            })),
                                            parentCatId: parentCatId,
                                            categoryCount: categories.length,
                                            timestamp: parseInt(div.getAttribute('data-timestamp')) || Date.now(),
                                            status: 200,
                                            method: 'Restored'
                                        };
                                        
                                        hookData.push(hookDataItem);
                                    }
                                } catch (e) {
                                }
                            });
                            
                            // 恢复后更新 window.temu_category_hook_data
                            if (hookData.length > 0) {
                                window.temu_category_hook_data = hookData;
                            }
                        }
                    }
                    
                    if (!hookData || !Array.isArray(hookData) || hookData.length === 0) {
                        // 尝试多次重试
                        let retryCount = 0;
                        const maxRetries = 3;
                        const retryCheck = () => {
                            retryCount++;
                            // 重试时也尝试从div恢复
                            let retryHookData = window.temu_category_hook_data;
                            if (!retryHookData || !Array.isArray(retryHookData) || retryHookData.length === 0) {
                                const retryDivs = document.querySelectorAll('.temu_category_hook');
                                if (retryDivs.length > 0) {
                                    retryHookData = [];
                                    retryDivs.forEach(div => {
                                        try {
                                            const responseText = decodeURIComponent(div.innerHTML);
                                            const response = JSON.parse(responseText);
                                            if (response && response.success && response.result && 
                                                response.result.categoryNodeVOS && 
                                                Array.isArray(response.result.categoryNodeVOS) && 
                                                response.result.categoryNodeVOS.length > 0) {
                                                const categories = response.result.categoryNodeVOS;
                                                const parentCatId = categories.length > 0 ? categories[0].parentCatId : null;
                                                retryHookData.push({
                                                    url: div.getAttribute('data-url') || '',
                                                    data: response,
                                                    categories: categories.map(c => ({
                                                        catId: c.catId || c.id,
                                                        catName: c.catName || c.name,
                                                        catEnName: c.catEnName || c.enName,
                                                        name: c.name || c.catName,
                                                        enName: c.enName || c.catEnName,
                                                        catLevel: c.catLevel,
                                                        catType: c.catType,
                                                        parentCatId: c.parentCatId,
                                                        isLeaf: c.isLeaf
                                                    })),
                                                    parentCatId: parentCatId,
                                                    categoryCount: categories.length,
                                                    timestamp: parseInt(div.getAttribute('data-timestamp')) || Date.now(),
                                                    status: 200,
                                                    method: 'Restored'
                                                });
                                            }
                                        } catch (e) {
                                            // 忽略错误
                                        }
                                    });
                                    if (retryHookData.length > 0) {
                                        window.temu_category_hook_data = retryHookData;
                                    }
                                }
                            }
                            
                            if (retryHookData && Array.isArray(retryHookData) && retryHookData.length > 0) {
                                matchCategoryInData(retryHookData, leafCategoryName);
                            } else if (retryCount < maxRetries) {
                                setTimeout(retryCheck, 500);
                            }
                        };
                        setTimeout(retryCheck, 500);
                        return;
                    }
                    
                    matchCategoryInData(hookData, leafCategoryName);
                }
            };
            
            // 匹配品类信息的函数
            const matchCategoryInData = (hookData, leafCategoryName) => {
                
                let matchedCategory = null;
                
                // 优先在最后一个拦截数据中查找（通常用户最后选择的品类在最后加载的列表中）
                const lastHookData = hookData[hookData.length - 1];
                
                if (lastHookData && lastHookData.categories && Array.isArray(lastHookData.categories)) {
                    
                    // 在最后一个列表中精确匹配
                    matchedCategory = lastHookData.categories.find(cat => {
                        const catName = cat.catName || cat.name || '';
                        const catEnName = cat.catEnName || cat.enName || '';
                        const exactMatch = catName === leafCategoryName || catEnName === leafCategoryName;
                        const includesMatch = catName.includes(leafCategoryName) || catEnName.includes(leafCategoryName);
                        return exactMatch || includesMatch;
                    });
                    
                    if (!matchedCategory) {
                        // 在最后一个列表中模糊匹配
                        matchedCategory = lastHookData.categories.find(cat => {
                            const catName = cat.catName || cat.name;
                            const catEnName = cat.catEnName || cat.enName;
                            const catNameLower = catName.toLowerCase();
                            const catEnNameLower = catEnName.toLowerCase();
                            const leafNameLower = leafCategoryName.toLowerCase();
                            return catNameLower.includes(leafNameLower) || 
                                   leafNameLower.includes(catNameLower) ||
                                   catEnNameLower.includes(leafNameLower) ||
                                   leafNameLower.includes(catEnNameLower);
                        });
                    }
                }
                
                // 如果最后一个列表中没有找到，再从所有历史数据中查找（从后往前）
                if (!matchedCategory) {
                    for (let i = hookData.length - 1; i >= 0; i--) {
                        const data = hookData[i];
                        if (!data.categories || !Array.isArray(data.categories)) {
                            continue;
                        }
                        
                        // 精确匹配
                        matchedCategory = data.categories.find(cat => {
                            const catName = cat.catName || cat.name;
                            const catEnName = cat.catEnName || cat.enName;
                            return catName === leafCategoryName || 
                                   catEnName === leafCategoryName ||
                                   catName.includes(leafCategoryName) ||
                                   catEnName.includes(leafCategoryName);
                        });
                        
                        if (matchedCategory) {
                            break;
                        }
                    }
                    
                    // 如果精确匹配失败，尝试模糊匹配（从后往前）
                    if (!matchedCategory) {
                        for (let i = hookData.length - 1; i >= 0; i--) {
                            const data = hookData[i];
                            if (!data.categories || !Array.isArray(data.categories)) {
                                continue;
                            }
                            
                            matchedCategory = data.categories.find(cat => {
                                const catName = cat.catName || cat.name;
                                const catEnName = cat.catEnName || cat.enName;
                                const catNameLower = catName.toLowerCase();
                                const catEnNameLower = catEnName.toLowerCase();
                                const leafNameLower = leafCategoryName.toLowerCase();
                                return catNameLower.includes(leafNameLower) || 
                                       leafNameLower.includes(catNameLower) ||
                                       catEnNameLower.includes(leafNameLower) ||
                                       leafNameLower.includes(catEnNameLower);
                            });
                            
                            if (matchedCategory) {
                                break;
                            }
                        }
                    }
                }
                    
                if (matchedCategory) {
                    // 兼容不同的字段名
                    const catId = matchedCategory.catId || matchedCategory.id;
                    const catName = matchedCategory.catName || matchedCategory.name;
                    const catEnName = matchedCategory.catEnName || matchedCategory.enName;
                    const catType = matchedCategory.catType;
                    const isLeaf = matchedCategory.isLeaf;
                    
                    const categoryType = catType === 1 ? 'clothing' : 'default';
                    const selectedCategory = {
                        catId: catId,
                        catName: catName,
                        catEnName: catEnName,
                        catType: catType,
                        isLeaf: isLeaf,
                        categoryType: categoryType
                    };
                    
                    window.temu_selected_category = selectedCategory;
                    localStorage.setItem('temu_selected_category', JSON.stringify(selectedCategory));
                    
                    // 创建隐藏div
                    let categoryInfoDiv = document.getElementById('temu-category-info');
                    if (!categoryInfoDiv) {
                        categoryInfoDiv = document.createElement('div');
                        categoryInfoDiv.id = 'temu-category-info';
                        categoryInfoDiv.style.display = 'none';
                        document.body.appendChild(categoryInfoDiv);
                    }
                    categoryInfoDiv.setAttribute('data-cat-id', catId);
                    categoryInfoDiv.setAttribute('data-cat-name', catName);
                    categoryInfoDiv.setAttribute('data-cat-type', catType);
                    categoryInfoDiv.setAttribute('data-is-leaf', isLeaf);
                    categoryInfoDiv.setAttribute('data-category-type', categoryType);
                    categoryInfoDiv.textContent = JSON.stringify(selectedCategory);
                }
            };
            
            // 初始化
            const initListener = () => {
                const categoryContainer = getCategoryContainer();
                if (categoryContainer) {
                    
                    // 尝试多种选择器
                    // 优先使用精确类名（需要转义+号）
                    let categoryLinks = categoryContainer.querySelectorAll('.category-wrap_catLink__v\\+GmF');
                    
                    // 通配 class 前缀（hash 可能变化）
                    if (categoryLinks.length === 0) {
                        categoryLinks = categoryContainer.querySelectorAll('[class^="category-wrap_catLink__"]');
                    }
                    
                    // 兜底：匹配包含 catLink 的 span
                    if (categoryLinks.length === 0) {
                        categoryLinks = categoryContainer.querySelectorAll('span[class*="catLink"]');
                    }
                    
                    if (categoryLinks.length === 0) {
                        // 最后兜底：容器下所有 span
                        categoryLinks = categoryContainer.querySelectorAll('span');
                    }
                                        
                    // 打印容器内的所有元素信息用于调试
                    const allChildren = categoryContainer.children;
                    for (let i = 0; i < Math.min(allChildren.length, 5); i++) {
                        const child = allChildren[i];
                    }
                    
                    lastSpanCount = categoryLinks.length;
                    
                    // 创建MutationObserver
                    observer = new MutationObserver((mutations) => {
                        const hasChange = mutations.some(mutation => 
                            mutation.type === 'childList' && 
                            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
                        );
                        if (hasChange) {
                            setTimeout(getCategoryInfo, 100);
                        }
                    });
                    
                    observer.observe(categoryContainer, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                    
                    
                    if (lastSpanCount > 1) {
                        getCategoryInfo();
                    } 
                } else {
                    setTimeout(initListener, 500);
                }
            };
            
            // 开始初始化
            if (document.readyState === 'complete') {
                initListener();
            } else {
                window.addEventListener('load', initListener);
                setTimeout(initListener, 1000);
            }
        }
        
        // 启动品类监听器
        startCategorySelectionListener();
        
        // 保持Hook，定期检查是否被覆盖
        hookIntervalId = setInterval(() => {
            // 检查是否还在品类选择页面
            if (!window.location.href.includes('agentseller.temu.com/goods/create/category')) {
                // 页面已跳转，取消hook
                clearInterval(hookIntervalId);
                // 恢复原始方法
                if (originalXHRSend) {
                    XMLHttpRequest.prototype.send = originalXHRSend;
                }
                if (originalFetch) {
                    window.fetch = originalFetch;
                }
                return;
            }
            
            // 检查hook是否被覆盖，如果被覆盖则重新注入
            if(!XMLHttpRequest.prototype.send.toString().includes('TEMU_CATEGORY_HOOK_INIT')){
                // console.log('🔄 检测到TEMU Hook被重置，重新注入...');
                TEMU_CATEGORY_HOOK_INIT();
            }    
        }, 500);
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  function I() {
    var e = document.createElement("script");
    ((e.text = `
    (function(){
        // ========== 禁用 beforeunload 弹窗（增强版）==========
        
        // 1. 立即清空 onbeforeunload
        window.onbeforeunload = null;
        
        // 2. 使用 Object.defineProperty 拦截 onbeforeunload 的设置
        let originalOnBeforeUnload = null;
        Object.defineProperty(window, 'onbeforeunload', {
            get: function() {
                return null; // 总是返回 null
            },
            set: function(value) {
                // 不做任何事，阻止设置
            },
            configurable: true
        });
        
        // 3. 拦截 addEventListener('beforeunload')
        const originalAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
            if (type === 'beforeunload') {
                return; // 不添加监听器
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        // 4. 移除所有已存在的 beforeunload 监听器
        function removeAllBeforeUnloadListeners() {
            try {
                // 尝试移除所有可能的 beforeunload 监听器
                const events = window.getEventListeners ? window.getEventListeners(window) : null;
                if (events && events.beforeunload) {
                    events.beforeunload.forEach(event => {
                        window.removeEventListener('beforeunload', event.listener, event.useCapture);
                    });
                }
            } catch (e) {
                // getEventListeners 可能不可用
            }
        }
        
        // 5. 持续监控并清除（作为后备方案）
        if (!window.__temu_beforeunload_monitor_installed) {
            window.__temu_beforeunload_monitor_installed = true;
            setInterval(function() {
                removeAllBeforeUnloadListeners();
            }, 200);
        }
        
        // ========== beforeunload 禁用结束 ==========
    })();
    `),
      (e.async = !1),
      document.documentElement.appendChild(e),
      e.remove());
  }
  if (window.location.href.includes("agentseller.temu.com/goods/edit")) {
    I();
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        
        function TEMU_DETAIL_IMAGES_HOOK_INIT() {
            if (window.__temu_detail_images_hook_installed) return;
            window.__temu_detail_images_hook_installed = true;
            
            // console.log('[TEMU Detail Images Hook] ========== 开始注入 ==========');
            // console.log('[TEMU Detail Images Hook] 当前时间:', new Date().toISOString());
            // console.log('[TEMU Detail Images Hook] 页面 URL:', window.location.href);
            
            // 处理响应的通用函数
            function processDetailImageResponse(url, responseText, status, method, requestBody) {
                // 打印所有 API 请求（用于调试）
                // if (url.indexOf('/api/') !== -1 || url.indexOf('/phoenix-') !== -1 || url.indexOf('/visage-') !== -1) {
                //     const apiPath = url.substring(url.indexOf('agentseller.temu.com') + 20);
                //     console.log('[TEMU Detail Images Hook] API 请求:', method, apiPath);
                // }
                
                // 拦截上传接口
                if (url.indexOf('/api/galerie/v3/store_image') !== -1) {
                    // console.log('[TEMU Detail Images Hook] ✓✓✓ 拦截到上传接口');
                    // console.log('[TEMU Detail Images Hook] 请求方法:', method);
                    // console.log('[TEMU Detail Images Hook] 响应状态:', status);
                    // console.log('[TEMU Detail Images Hook] 响应内容长度:', responseText.length);
                    
                    try {
                        const response = JSON.parse(responseText);
                        // console.log('[TEMU Detail Images Hook] 上传响应:', response);
                        
                        if (response && response.url) {
                            // console.log('[TEMU Detail Images Hook] ✓✓✓ 上传成功，URL:', response.url);
                            
                            // 创建隐藏 div 存储数据
                            const div = document.createElement('div');
                            div.innerHTML = encodeURIComponent(responseText);
                            div.className = 'temu_detail_upload_hook hook';
                            div.style.display = 'none';
                            div.setAttribute('data-url', url);
                            div.setAttribute('data-timestamp', Date.now());
                            document.body.appendChild(div);
                            
                            // console.log('[TEMU Detail Images Hook] ✓✓✓ 上传数据已存储到 DOM');
                            // console.log('[TEMU Detail Images Hook] 当前上传 div 数量:', document.querySelectorAll('.temu_detail_upload_hook').length);
                        } else {
                            // console.warn('[TEMU Detail Images Hook] 上传响应中没有 url 字段');
                        }
                    } catch(e){
                        // 解析上传响应失败，静默处理
                    }
                }
                
                // 拦截查询接口
                if (url.indexOf('/phoenix-mms/material/pageQuery') !== -1) {
                    // console.log('[TEMU Detail Images Hook] ✓✓✓ 拦截到查询接口');
                    // console.log('[TEMU Detail Images Hook] 请求方法:', method);
                    // console.log('[TEMU Detail Images Hook] 响应状态:', status);
                    // console.log('[TEMU Detail Images Hook] 响应内容长度:', responseText.length);
                    
                    try {
                        const response = JSON.parse(responseText);
                        // console.log('[TEMU Detail Images Hook] 查询响应结构:', {
                        //     success: response.success,
                        //     hasResult: !!response.result,
                        //     hasMaterialList: !!(response.result && response.result.materialList),
                        //     materialCount: response.result && response.result.materialList ? response.result.materialList.length : 0
                        // });
                        
                        if (response && response.success && response.result && response.result.materialList) {
                            // console.log('[TEMU Detail Images Hook] ✓✓✓ 查询成功，图片数量:', response.result.materialList.length);
                            // if (response.result.materialList.length > 0) {
                            //     console.log('[TEMU Detail Images Hook] 图片列表前3个:', response.result.materialList.slice(0, 3));
                            // }
                            
                            // 创建隐藏 div 存储数据
                            const div = document.createElement('div');
                            div.innerHTML = encodeURIComponent(responseText);
                            div.className = 'temu_detail_query_hook hook';
                            div.style.display = 'none';
                            div.setAttribute('data-url', url);
                            div.setAttribute('data-timestamp', Date.now());
                            div.setAttribute('data-count', response.result.materialList.length);
                            document.body.appendChild(div);
                            
                            // console.log('[TEMU Detail Images Hook] ✓✓✓ 查询数据已存储到 DOM');
                            // console.log('[TEMU Detail Images Hook] 当前查询 div 数量:', document.querySelectorAll('.temu_detail_query_hook').length);
                        } else {
                            // console.warn('[TEMU Detail Images Hook] 查询响应格式不正确或没有数据');
                        }
                    } catch(e){
                        // 解析查询响应失败，静默处理
                    }
                }
                
                // 拦截草稿查询接口
                if (url.indexOf('/visage-agent-seller/product/draft/query') !== -1) {
                    // console.log('[TEMU Detail Images Hook] ✓✓✓ 拦截到草稿查询接口');
                    // console.log('[TEMU Detail Images Hook] 请求方法:', method);
                    // console.log('[TEMU Detail Images Hook] 请求体:', requestBody);
                    // console.log('[TEMU Detail Images Hook] 响应状态:', status);
                    // console.log('[TEMU Detail Images Hook] 响应内容长度:', responseText.length);
                    
                    try {
                        const response = JSON.parse(responseText);
                        // console.log('[TEMU Detail Images Hook] 草稿查询响应结构:', {
                        //     success: response.success,
                        //     hasResult: !!response.result,
                        //     productName: response.result?.productName,
                        //     detailImageCount: response.result?.goodsLayerDecorationVOList?.length || 0
                        // });
                        
                        if (response && response.success && response.result) {
                            // console.log('[TEMU Detail Images Hook] ✓✓✓ 草稿查询成功');
                            
                            // 创建隐藏 div 存储数据
                            const div = document.createElement('div');
                            div.innerHTML = encodeURIComponent(responseText);
                            div.className = 'temu_draft_query_hook hook';
                            div.style.display = 'none';
                            div.setAttribute('data-url', url);
                            div.setAttribute('data-timestamp', Date.now());
                            div.setAttribute('data-product-draft-id', response.result.productDraftId || '');
                            document.body.appendChild(div);
                            
                            // console.log('[TEMU Detail Images Hook] ✓✓✓ 草稿数据已存储到 DOM');
                            // console.log('[TEMU Detail Images Hook] 当前草稿 div 数量:', document.querySelectorAll('.temu_draft_query_hook').length);
                        } else {
                            // console.warn('[TEMU Detail Images Hook] 草稿查询响应格式不正确或没有数据');
                        }
                    } catch(e){
                        // 解析草稿查询响应失败，静默处理
                    }
                }
            }
            
            // hook XHR
            // console.log('[TEMU Detail Images Hook] 开始 Hook XMLHttpRequest');
            const on_send = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function(send_data){
                const requestBody = send_data;
                this.addEventListener('load', function(){
                    processDetailImageResponse(this.responseURL, this.responseText, this.status, 'XMLHttpRequest', requestBody);
                });
                return on_send.apply(this, arguments);
            };
            // console.log('[TEMU Detail Images Hook] XMLHttpRequest Hook 完成');
            
            // hook fetch
            // console.log('[TEMU Detail Images Hook] 开始 Hook Fetch');
            const originalFetch = window.fetch;
            window.fetch = function(){
                const args = arguments;
                let requestBody = null;
                if (args[1] && args[1].body) {
                    requestBody = args[1].body;
                }
                return originalFetch.apply(this, arguments).then(res=>{
                    try {
                        const clone = res.clone();
                        clone.text().then(txt=>{
                            const url = res.url || args[0];
                            processDetailImageResponse(url, txt, res.status, 'Fetch', requestBody);
                        }).catch((err)=>{
                            // 读取 Fetch 响应失败，静默处理
                        });
                    } catch(e){
                        // 克隆 Fetch 响应失败，静默处理
                    }
                    return res;
                });
            };
            // console.log('[TEMU Detail Images Hook] Fetch Hook 完成');
            
            // console.log('[TEMU Detail Images Hook] ========== 注入完成 ==========');
        }
        
        TEMU_DETAIL_IMAGES_HOOK_INIT();
        
        // 保持Hook，检查频率
        setInterval(() => {
            if(!XMLHttpRequest.prototype.send.toString().includes('TEMU_DETAIL_IMAGES_HOOK_INIT')){
                // console.log('[TEMU Detail Images Hook] 🔄 检测到 Hook 被重置，重新注入...');
                TEMU_DETAIL_IMAGES_HOOK_INIT();
            }    
        }, 500);
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("action=captcha&pureCaptcha=")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        const on_send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (send_data) {
          this.addEventListener('load', function () {
            if (this.responseURL.includes('/_____tmd_____/slide')){
                window.parent.postMessage('close_the_pop_wait', '*')
            }
          });
          return on_send.apply(this, arguments);
        };
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("ark.xiaohongshu.com/app-item/good/create")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        window.hook_data = {}
        const on_send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (send_data) {
          this.addEventListener('load', function () {
            if (this.responseURL.includes('ark.xiaohongshu.com/api/edith/product/create_product_drafts')){
                window.hook_data.create_product_drafts = JSON.parse(this.responseText)
                let div = document.createElement('div');
                div.innerHTML = encodeURIComponent(this.responseText);
                div.classList.value = 'hook_data create_product_drafts'
                div.style.display = 'none';
                document.body.appendChild(div);
            }
            if (this.responseURL.includes('ark.xiaohongshu.com/api/edith/product/get_category_property')){
                if(JSON.parse(this.responseText).data.productCategoryProperties.length > 0){
                    window.hook_data.productCategoryProperties = JSON.parse(this.responseText)
                    let div = document.createElement('div');
                    div.innerHTML = encodeURIComponent(this.responseText);
                    div.classList.value = 'hook_data productCategoryProperties'
                    div.style.display = 'none';
                    document.body.appendChild(div);
                }
            }
          });
          return on_send.apply(this, arguments);
        };
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (
    window.location.href.includes("wares-jdm.jd.com/newPublish") ||
    window.location.href.includes("wares-jdm.jd.com/popPublish")
  ) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        (function(w){
            w.originalAdd = w.addEventListener;
            var myAdd = function() {
                if(arguments[0] == 'beforeunload'){
                    return
                }
                return w.originalAdd.apply(this, arguments);
            }
            myAdd.toString = function(){
                return w.originalAdd.toString();
            }
            Object.defineProperty(w, 'addEventListener', {
                value: myAdd
            });
        })(window);
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("post.alibaba.com/product/publish")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        // 尝试拦截 EventTarget.prototype.addEventListener
        try {
            const originalAdd = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (type === 'beforeunload') {
                    return;
                }
                return originalAdd.call(this, type, listener, options);
            };
        } catch (e) {
            console.error('MCJ-Plugin: Failed to hook EventTarget.prototype.addEventListener', e);
        }

        // 尝试拦截 window.onbeforeunload
        try {
            Object.defineProperty(window, 'onbeforeunload', {
                configurable: true,
                enumerable: true,
                get: function() { return null; },
                set: function(val) { return; }
            });
        } catch (e) {
            // console.error('MCJ-Plugin: Failed to hook window.onbeforeunload', e);
        }

        // 兼容旧的逻辑 (针对 JD 等平台可能需要的 window.addEventListener 覆盖)
        // 使用 try-catch 包裹以防止报错阻塞页面
        try {
            (function(w){
                w.originalAdd = w.addEventListener;
                var myAdd = function() {
                    if(arguments[0] == 'beforeunload'){
                        return
                    }
                    return w.originalAdd.apply(this, arguments);
                }
                myAdd.toString = function(){
                    return w.originalAdd.toString();
                }
                // 只有当 addEventListener 可配置时才覆盖
                const descriptor = Object.getOwnPropertyDescriptor(w, 'addEventListener');
                if (!descriptor || descriptor.configurable) {
                    Object.defineProperty(w, 'addEventListener', {
                        value: myAdd,
                        configurable: true,
                        writable: true
                    });
                }
            })(window);
        } catch (e) {
            // 忽略错误，避免阻塞页面
        }
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("aliexpress.us/item") || window.location.href.includes("aliexpress.com/item")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        function XMLADD() {
            const on_send = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function (send_data) {  //this
            this.addEventListener('load', function () {
                let zs = 'mcj_xml_send'
                var SMT_HOOK_DESC = false;
                if (this.responseURL.includes('aeproductsourcesite.alicdn.com/product/description/pc/v2')){
                    SMT_HOOK_DESC = true;
                    // console.log('详情接口拦截成功');
                }
                if (SMT_HOOK_DESC){
                    let response = this.responseText;
                    let div = document.createElement('div');
                    div.innerHTML = this.responseText;
                    div.className = 'SMT_HOOK_DESC'
                    div.style.display = 'none';
                    div.setAttribute('data-url', this.responseURL)
                    document.body.appendChild(div);
                }
            });
            return on_send.apply(this, arguments);
            };
        }
        XMLADD()
        setInterval(() => {
            if(!XMLHttpRequest.prototype.send.toString().includes('mcj_xml_send')){
                XMLADD()
            }    
        }, 1000)
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("wares-jdm.jd.com/ware/wareList")) {
    var D = document.createElement("script");
    ((D.text = `
    (function(){
        // 京麦API拦截器实现
        class JdMallApiInterceptor {
            constructor() {
                this.hookKey = '_mcj_jdmall_xml_hook';
                this.isHooked = false;
                this.originalSend = null;
                this.observer = null;
                this.isLoading = false;
                this.intervalId = null;
            }
            
            // 初始化拦截器
            init() {
                // console.log('初始化京麦API拦截器');
                this.hookXhr();
                this.setupTableObserver();
                this.setupPeriodicChecker();
            }
            
            // 钩子XMLHttpRequest.send方法
            hookXhr() {
                if (this.isHooked) {
                    // console.log('京麦API钩子已经激活');
                    return;
                }
                
                try {
                    // 保存原始方法
                    if (!this.originalSend) {
                        this.originalSend = XMLHttpRequest.prototype.send;
                    }
                    
                    const self = this;
                    const originalSend = this.originalSend;
                    
                    // 创建带标识符的新函数
                    const hookedSend = function(send_data) {
                        // 添加标识属性
                        Object.defineProperty(XMLHttpRequest.prototype, self.hookKey, {
                            value: true,
                            enumerable: false,
                            configurable: true
                        });
                        
                        this.addEventListener('load', function() {
                            let JDMALL_HOOK_FLAG = false;
                            // 检查是否为目标API请求
                            if (this.responseURL.includes('dsm.product.manage.ProductInfoReadViewService.queryValidProductList') || 
                                this.responseURL.includes('dsm.wareshopv2.ware.wareListService.queryWareList')) {
                                JDMALL_HOOK_FLAG = true;
                            }
                            
                            if (JDMALL_HOOK_FLAG) {
                                try {
                                    // 将响应数据存储到隐藏div中
                                    let div = document.createElement('div');
                                    div.textContent = this.responseText;
                                    div.className = 'JDMALL_HOOK_DATA';
                                    div.style.display = 'none';
                                    div.setAttribute('data-url', this.responseURL);
                                    div.setAttribute('data-method', this.method || 'GET');
                                    
                                    // 避免重复添加
                                    let existing = document.querySelector('.JDMALL_HOOK_DATA[data-url="' + this.responseURL + '"]');
                                    if (existing) {
                                        existing.parentNode.removeChild(existing);
                                    }
                                    
                                    document.body.appendChild(div);
                                    // console.log('存储的JSON响应数据长度:', this.responseText.length);
                                } catch (e) {
                                    console.error('京麦接口数据处理失败:', e);
                                }
                            }
                        });
                        return originalSend.apply(this, arguments);
                    };
                    
                    // 添加标识
                    Object.defineProperty(hookedSend, self.hookKey, {
                        value: true,
                        enumerable: false,
                        configurable: true
                    });
                    
                    XMLHttpRequest.prototype.send = hookedSend;
                    this.isHooked = true;
                    // console.log('京麦API拦截器初始化成功');
                } catch (error) {
                    console.error('京麦API拦截器初始化失败:', error);
                }
            }
            
            // 清除现有API数据
            clearExistingApiData() {
                try {
                    const existingDataElements = document.querySelectorAll('.JDMALL_HOOK_DATA');
                    existingDataElements.forEach(element => {
                        element.parentNode?.removeChild(element);
                    });
                    // console.log('已清除现有API数据');
                } catch (error) {
                    console.error('清除API数据失败:', error);
                }
            }
            
            // 重置钩子
            resetHook() {
                if (this.originalSend) {
                    try {
                        XMLHttpRequest.prototype.send = this.originalSend;
                        this.isHooked = false;
                        // console.log('钩子已重置');
                    } catch (error) {
                        console.error('重置钩子失败:', error);
                    }
                }
            }
            
            // 设置表格变化监听器
            setupTableObserver() {
                const tableContainerId = 'js-ware-table';
                
                // 配置MutationObserver
                this.observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const target = mutation.target;
                            const className = target.className;
                            
                            // 检测表格开始加载
                            if (className.includes('jd-loading-parent--relative') && !this.isLoading) {
                                // console.log('检测到表格开始加载，清除之前的API数据');
                                this.isLoading = true;
                                this.clearExistingApiData();
                                
                                // 确保钩子是活动的
                                if (!this.isHooked || !XMLHttpRequest.prototype.send.toString().includes(this.hookKey)) {
                                    // console.log('表格加载时重新初始化钩子');
                                    this.resetHook();
                                    this.hookXhr();
                                }
                            }
                            
                            // 检测表格加载完成
                            if (className === 'table-container-wrapper' && this.isLoading) {
                                // console.log('检测到表格加载完成，准备获取新数据');
                                this.isLoading = false;
                                
                                // 添加延时，确保API响应已经完成
                                setTimeout(() => {
                                    // console.log('表格更新完成后检查新的API数据');
                                }, 500);
                            }
                        }
                    });
                });
                
                // 启动观察者
                const startObserving = () => {
                    const tableContainer = document.getElementById(tableContainerId);
                    if (tableContainer) {
                        this.observer.observe(tableContainer, {
                            attributes: true,
                            attributeFilter: ['class']
                        });
                        // console.log('表格变化监听器已启动');
                    } else {
                        // 如果表格不存在，等待一段时间后重试
                        // console.log('表格容器未找到，等待重试...');
                        setTimeout(startObserving, 1000);
                    }
                };
                
                startObserving();
            }
            
            // 设置定期检查器
            setupPeriodicChecker() {
                // 清除之前的定时器
                if (this.intervalId !== null) {
                    clearInterval(this.intervalId);
                }
                
                // 定期检查钩子状态，防止被覆盖
                this.intervalId = window.setInterval(() => {
                    try {
                        // 检查钩子状态
                        const isHooked = XMLHttpRequest.prototype[this.hookKey] || 
                                       (XMLHttpRequest.prototype.send[this.hookKey]);
                        
                        // 只有当钩子确实未被激活时才重新初始化
                        if (!isHooked && !this.isHooked) {
                            // console.log('检测到京麦API钩子需要重新初始化...');
                            this.hookXhr();
                        }
                        // 更新内部状态
                        this.isHooked = !!isHooked;
                    } catch (error) {
                        console.error('京麦API钩子检查失败:', error);
                    }
                }, 10000); // 10秒检查一次
            }
        }
        
        // 初始化并启动拦截器
        const interceptor = new JdMallApiInterceptor();
        interceptor.init();
        
        // 暴露到全局，供其他脚本访问
        window.jdMallApiInterceptor = interceptor;
    })()
    `),
      (D.async = !1),
      document.documentElement.appendChild(D));
  }
  if (window.location.href.includes("fxg.jinritemai.com/ffa/g/create?")) {
    var O = document.createElement("script");
    ((O.text = `
    (function(){
        function API_HOOK_INIT() {
            console.log('🪝 注入API拦截器 (VOD视频 & 运费模板)...');
            
            // 处理 VOD 视频API响应的函数
            function processVodResponse(url, responseText) {
                if (url.includes('vod.bytedanceapi.com') && url.includes('GetPlayInfo')) {
                    try {
                        // 清除旧的数据，只保留最新的
                        const oldDiv = document.querySelector('.vod_play_info_hook');
                        if (oldDiv) {
                            oldDiv.remove();
                        }

                        // 创建新的div来存储数据
                        let div = document.createElement('div');
                        // 使用 encodeURIComponent 编码，防止特殊字符导致DOM解析问题
                        div.innerHTML = encodeURIComponent(responseText); 
                        div.className = 'vod_play_info_hook';
                        div.style.display = 'none';
                        div.setAttribute('data-url', url);
                        div.setAttribute('data-timestamp', Date.now());
                        document.body.appendChild(div);
                        
                        console.log('📦 VOD数据已存储到隐藏div。');

                        // 【新增】提取并存储AWS签名参数，用于后续复用
                        try {
                            const urlObj = new URL(url);
                            const params = urlObj.searchParams;
                            const credential = params.get('X-Amz-Credential');
                            const signature = params.get('X-Amz-Signature');
                            const date = params.get('X-Amz-Date');
                            const signedQueries = params.get('X-Amz-SignedQueries');
                            
                            if (credential && signature && date) {
                                // 清除旧的签名数据
                                const oldSigDiv = document.querySelector('.vod_signature_hook');
                                if (oldSigDiv) {
                                    oldSigDiv.remove();
                                }
                                
                                // 存储签名参数
                                const sigDiv = document.createElement('div');
                                sigDiv.innerHTML = encodeURIComponent(JSON.stringify({
                                    credential: credential,
                                    signature: signature,
                                    date: date,
                                    signedQueries: signedQueries || 'Action;Version;X-Amz-Algorithm;X-Amz-Credential;X-Amz-Date;X-Amz-Expires;X-Amz-NotSignBody;X-Amz-SignedHeaders;X-Amz-SignedQueries;video_id'
                                }));
                                sigDiv.className = 'vod_signature_hook';
                                sigDiv.style.display = 'none';
                                sigDiv.setAttribute('data-timestamp', Date.now());
                                document.body.appendChild(sigDiv);
                                
                                console.log('🔐 AWS签名参数已存储，可复用1小时。');
                            }
                        } catch (sigError) {
                            console.error('⚠️ 提取签名参数失败:', sigError);
                        }

                    } catch (parseError) {
                        console.error('⚠️ 解析VOD响应数据失败:', parseError);
                    }
                }
            }

            // 【新增】处理运费模板API响应的函数
            function processFreightResponse(url, responseText) {
                if (url.includes('refetchSchema') && url.includes('freight_template_options_load')) {
                    try {
                        // 清除旧的数据，只保留最新的
                        const oldDiv = document.querySelector('.freight_schema_hook');
                        if (oldDiv) {
                            oldDiv.remove();
                        }

                        // 创建新的div来存储数据
                        let div = document.createElement('div');
                        div.innerHTML = encodeURIComponent(responseText);
                        div.className = 'freight_schema_hook'; // 使用新的类名
                        div.style.display = 'none';
                        div.setAttribute('data-url', url);
                        div.setAttribute('data-timestamp', Date.now());
                        document.body.appendChild(div);
                        
                        console.log('📦 运费模板数据已存储到隐藏div。');

                    } catch (parseError) {
                        console.error('⚠️ 解析运费模板响应数据失败:', parseError);
                    }
                }
            }
            
            // 拦截XMLHttpRequest
            const originalXHRSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function (send_data) {
                this.addEventListener('load', function () {
                    // 调用两个处理函数
                    processVodResponse(this.responseURL, this.responseText);
                    processFreightResponse(this.responseURL, this.responseText);
                });
                return originalXHRSend.apply(this, arguments);
            };
            
            // 拦截Fetch请求
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    // 克隆响应以便读取
                    const clonedResponse = response.clone();
                    clonedResponse.text().then(responseText => {
                        const url = response.url || args[0];
                        // 调用两个处理函数
                        processVodResponse(url, responseText);
                        processFreightResponse(url, responseText);
                    }).catch(err => {
                        console.warn('⚠️ 读取Fetch响应失败:', err);
                    });
                    return response;
                });
            };
        }
        
        API_HOOK_INIT();
        
        // 定期检查钩子是否被覆盖，如果被覆盖则重新注入
        setInterval(() => {
            // 检查我们的自定义逻辑是否还在 fetch 钩子里
            // 检查任意一个新加入的函数名即可，因为它们是一起被注入的
            if(!window.fetch.toString().includes('processFreightResponse')){
                //console.log('🔄 检测到API Hook被重置，重新注入...');
                API_HOOK_INIT();
            }    
        }, 60000) // 每60秒检查一次
    })()
    `),
      (O.async = !1),
      document.documentElement.appendChild(O));
  }
  if (window.location.href.includes("ark.xiaohongshu.com/app-item/good/edit")) {
    var s = document.createElement("script");
    ((s.text = `
    (function(){
        window.hook_data = [];
        const on_send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (send_data) {
            this.addEventListener('load', function () {
                if (this.responseURL.includes('ark.xiaohongshu.com/api/edith/product/publish_render')) {
                    let response = JSON.parse(this.responseText);
                    window.hook_data.push(response);
                    
                    // 检查数据大小，如果太大则分段存储
                    const responseText = this.responseText;
                    const maxChunkSize = 100000; // 每段100KB
                    const chunks = [];
                    
                    if (responseText.length > maxChunkSize) {
                        // 分段存储
                        for (let i = 0; i < responseText.length; i += maxChunkSize) {
                            const chunk = responseText.substring(i, i + maxChunkSize);
                            chunks.push(chunk);
                        }
                        
                        // 存储段数和每段数据
                        let div = document.createElement('div');
                        div.className = 'mcj_xhs_publish_render_chunks'
                        div.style.display = 'none';
                        div.setAttribute('data-chunks', chunks.length);
                        div.setAttribute('data-url', this.responseURL);
                        
                        // 存储每段数据到子div
                        chunks.forEach((chunk, index) => {
                            let chunkDiv = document.createElement('div');
                            chunkDiv.className = 'mcj_xhs_chunk_' + index;
                            chunkDiv.textContent = chunk;
                            div.appendChild(chunkDiv);
                        });
                        
                        document.body.appendChild(div);
                    } else {
                        // 小数据直接存储
                        let div = document.createElement('div');
                        div.textContent = responseText;
                        div.className = 'mcj_xhs_publish_render'
                        div.style.display = 'none';
                        div.setAttribute('data-url', this.responseURL)
                        document.body.appendChild(div);
                    }
                }
            });
            return on_send.apply(this, arguments);
        };
    })()
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (
    window.location.href.includes("sell.publish.tmall.com/tmall/publish.htm") &&
    !document.querySelector('script[data-tmall-hook-injected="true"]')
  ) {
    var C = document.createElement("script");
    (C.setAttribute("data-tmall-hook-injected", "true"),
      (C.text = `
    (function(){
        // 防止在同一页面多次初始化
        if (window.__TMALL_BATCH_HOOK_INITIALIZED__) {
            return;
        }
        window.__TMALL_BATCH_HOOK_INITIALIZED__ = true;
        
        function TMALL_BATCH_HOOK_INIT() {
            
            // 初始化数据存储
            if (!window.tmall_sku_template_data) {
                window.tmall_sku_template_data = null;
            }
            
            // 初始化上传文件路径存储
            if (!window.tmall_uploaded_file_path) {
                window.tmall_uploaded_file_path = null;
            }
            
            // 处理SKU模板下载响应
            function processSkuTemplateResponse(url, responseText, status, method) {
                // 检查是否是SKU模板下载API
                if (url.includes('sell.publish.tmall.com/excel/sku/exportSkuTemplate') && 
                    url.includes('templateType=excel') && 
                    url.includes('catId=')) {
                    
                    try {
                        // 提取catId参数
                        const urlObj = new URL(url);
                        const catId = urlObj.searchParams.get('catId');
                        
                        // 清除旧数据
                        const oldDiv = document.querySelector('.tmall_sku_template_hook');
                        if (oldDiv) {
                            oldDiv.remove();
                        }
                        
                        // 存储到window对象
                        window.tmall_sku_template_data = {
                            url: url,
                            catId: catId,
                            data: responseText,
                            timestamp: Date.now(),
                            status: status,
                            method: method
                        };
                        
                        // 创建隐藏div存储数据
                        let div = document.createElement('div');
                        div.innerHTML = encodeURIComponent(responseText);
                        div.className = 'tmall_sku_template_hook';
                        div.style.display = 'none';
                        div.setAttribute('data-url', url);
                        div.setAttribute('data-cat-id', catId || '');
                        div.setAttribute('data-timestamp', Date.now());
                        div.setAttribute('data-status', status);
                        document.body.appendChild(div);
                        
                    } catch (parseError) {
                        console.error('⚠️ 解析天猫SKU模板响应失败:', parseError);
                    }
                }
                
                // 检查是否是文件上传响应，捕获 filePath
                if (url.includes('/upload') || url.includes('/file')) {
                    try {
                        const data = JSON.parse(responseText);
                        let filePath = data?.data?.filePath || data?.filePath || data?.result?.filePath;
                        if (filePath) {
                            window.tmall_uploaded_file_path = filePath;
                        }
                    } catch (e) {
                        // 不是JSON响应，忽略
                    }
                }
            }
            
            // 修改 importSkuTemplate 请求的 filePath
            function modifyImportSkuTemplateRequest(body) {
                try {
                    if (!body) return body;
                    
                    const bodyStr = body.toString();
                    const params = new URLSearchParams(bodyStr);
                    const jsonBodyStr = params.get('jsonBody');
                    
                    if (!jsonBodyStr) return body;
                    
                    // 解析 jsonBody
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(jsonBodyStr);
                    } catch {
                        jsonBody = JSON.parse(decodeURIComponent(jsonBodyStr));
                    }
                    
                    // 检查 filePath 是否为空
                    if (!jsonBody.filePath || jsonBody.filePath === '') {
                        // 如果有上传的文件路径，使用它
                        if (window.tmall_uploaded_file_path) {
                            console.log('� 检测到 filePath 为空，自动填充:', window.tmall_uploaded_file_path);
                            jsonBody.filePath = window.tmall_uploaded_file_path;
                            
                            // 重新编码
                            params.set('jsonBody', JSON.stringify(jsonBody));
                            const modifiedBody = params.toString();
                            
                            console.log('✅ 已自动填充 filePath');
                            return modifiedBody;
                        } else {
                            console.warn('⚠️ filePath 为空，但未找到上传的文件路径');
                        }
                    } else {
                        console.log('ℹ️ filePath 已存在:', jsonBody.filePath);
                    }
                    
                    return body;
                } catch (e) {
                    console.error('❌ 修改 importSkuTemplate 请求失败:', e);
                    return body;
                }
            }
            
            // 检查是否已经 Hook 过（防止重复 Hook）
            if (window.__TMALL_XHR_HOOKED__) {
                return;
            }
            window.__TMALL_XHR_HOOKED__ = true;
            
            // 拦截XMLHttpRequest
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._url = url;
                this._method = method;
                return originalXHROpen.apply(this, [method, url, ...rest]);
            };
            
            XMLHttpRequest.prototype.send = function (send_data) {
                const url = this._url || '';
                
                // 拦截 importSkuTemplate 请求并修改 filePath
                if (url.includes('importSkuTemplate')) {
                    send_data = modifyImportSkuTemplateRequest(send_data);
                }
                
                // 监听响应
                this.addEventListener('load', function () {
                    try {
                        // 根据responseType获取正确的响应数据
                        let responseText;
                        if (this.responseType === '' || this.responseType === 'text') {
                            responseText = this.responseText;
                        } else if (this.responseType === 'json') {
                            responseText = JSON.stringify(this.response);
                        } else {
                            responseText = this.response;
                        }
                        processSkuTemplateResponse(this.responseURL, responseText, this.status, 'XMLHttpRequest');
                    } catch (e) {
                        console.warn('⚠️ 读取XMLHttpRequest响应失败:', e);
                    }
                });
                
                return originalXHRSend.apply(this, [send_data]);
            };
            
            // 拦截Fetch请求
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                
                // 拦截 importSkuTemplate 请求并修改 filePath
                if (url.includes('importSkuTemplate')) {
                    
                    if (args[1] && args[1].body) {
                        args[1].body = modifyImportSkuTemplateRequest(args[1].body);
                    }
                }
                
                return originalFetch.apply(this, args).then(response => {
                    // 克隆响应以便读取
                    const clonedResponse = response.clone();
                    clonedResponse.text().then(responseText => {
                        const responseUrl = response.url || url;
                        processSkuTemplateResponse(responseUrl, responseText, response.status, 'Fetch');
                    }).catch(err => {
                        console.warn('⚠️ 读取Fetch响应失败:', err);
                    });
                    return response;
                });
            };
            
        }
        
        TMALL_BATCH_HOOK_INIT();
        
        // 定期检查钩子是否被覆盖
        setInterval(() => {
            if(!window.fetch.toString().includes('processSkuTemplateResponse')){
                TMALL_BATCH_HOOK_INIT();
            }    
        }, 5000);
    })()
    `),
      (C.async = !1),
      document.documentElement.appendChild(C));
  }
  if (window.location.href.includes("fxg.jinritemai.com/ffa/g/list")) {
    var s = document.createElement("script");
    ((s.text = `
        (function(){
            
            // 独立的选中状态存储（不受DOM变化影响）
            let selectedRowsSet = new Set();
            let isInitialized = false;
            
            // 创建状态同步div（用于与TypeScript通信）
            function createSyncDiv() {
                let syncDiv = document.getElementById('mcj-selected-rows-sync');
                if (!syncDiv) {
                    syncDiv = document.createElement('div');
                    syncDiv.id = 'mcj-selected-rows-sync';
                    syncDiv.style.display = 'none';
                    document.body.appendChild(syncDiv);
                }
                return syncDiv;
            }

            // 同步状态到div
            function syncToDiv() {
                const syncDiv = document.getElementById('mcj-selected-rows-sync');
                if (syncDiv) {
                    const selectedArray = Array.from(selectedRowsSet);
                    syncDiv.setAttribute('data-selected-rows', JSON.stringify(selectedArray));
                    syncDiv.setAttribute('data-last-update', Date.now().toString());
                } else {
                    console.error('❌ 找不到同步div');
                }
            }

            // 处理行的选中状态（将存储的状态同步到DOM）
            function syncRowState(row) {
                const rowKey = row.getAttribute('data-row-key');
                if (!rowKey) {
                    return;
                }

                const checkbox = row.querySelector('.ecom-g-checkbox-wrapper');
                if (!checkbox) {
                    return;
                }

                const shouldBeSelected = selectedRowsSet.has(rowKey);
                const isSelected = checkbox.classList.contains('ecom-g-checkbox-wrapper-checked');

                // 修复：直接设置DOM状态，不触发点击事件
                if (shouldBeSelected && !isSelected) {
                    checkbox.classList.add('ecom-g-checkbox-wrapper-checked');
                    const input = checkbox.querySelector('input[type="checkbox"]');
                    if (input) {
                        input.checked = true;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                } else if (!shouldBeSelected && isSelected) {
                    checkbox.classList.remove('ecom-g-checkbox-wrapper-checked');
                    const input = checkbox.querySelector('input[type="checkbox"]');
                    if (input) {
                        input.checked = false;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }

            // 处理用户点击（DOM -> 存储）- 修复版本
            function handleUserClick(e) {
                
                // 使用更精确的选择器
                const checkbox = e.target.closest('.ecom-g-checkbox-wrapper') || 
                                 e.target.closest('input[type="checkbox"]')?.parentElement;
                

                const row = checkbox.closest('tr');

                const rowKey = row.getAttribute('data-row-key');

                // 防抖处理：避免重复触发
                if (checkbox.dataset.processing === 'true') return;
                checkbox.dataset.processing = 'true';

                // 延迟执行，等待DOM更新
                setTimeout(() => {
                    const isSelected = checkbox.classList.contains('ecom-g-checkbox-wrapper-checked');
                    
                    if (isSelected) {
                        selectedRowsSet.add(rowKey);
                    } else {
                        selectedRowsSet.delete(rowKey);
                    }
                    
                    syncToDiv();
                    
                    // 清除处理标记
                    delete checkbox.dataset.processing;
                }, 100);
            }

            // 处理新加载的行（双向同步：存储 <-> DOM）
            function handleNewRows(container) {
                const rows = container.querySelectorAll('tr[data-row-key]');
                rows.forEach(row => {
                    const rowKey = row.getAttribute('data-row-key');
                    if (!rowKey) return;
                    
                    const checkbox = row.querySelector('.ecom-g-checkbox-wrapper');
                    if (!checkbox) return;
                    
                    // 检查DOM中的选中状态
                    const isDomSelected = checkbox.classList.contains('ecom-g-checkbox-wrapper-checked');
                    // 检查存储中的选中状态
                    const isStoredSelected = selectedRowsSet.has(rowKey);
                    
                    // 如果DOM选中但存储未选中，更新存储（处理新加载的行被全选的情况）
                    if (isDomSelected && !isStoredSelected) {
                        selectedRowsSet.add(rowKey);
                    }
                    // 如果存储选中但DOM未选中，更新DOM（恢复之前的选中状态）
                    else if (!isDomSelected && isStoredSelected) {
                        checkbox.classList.add('ecom-g-checkbox-wrapper-checked');
                        const input = checkbox.querySelector('input[type="checkbox"]');
                        if (input) {
                            input.checked = true;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                });
                
                // 同步到div
                if (rows.length > 0) {
                    syncToDiv();
                }
            }

            // 等待表格加载完成
            function waitForTableLoad(callback, maxAttempts = 50) {
                let attempts = 0;
                
                function checkTable() {
                    attempts++;
                    const tableContainer = document.querySelector('.ant-table-body') || 
                                         document.querySelector('table');
                    
                    if (tableContainer && tableContainer.querySelector('tr[data-row-key]')) {
                        callback(tableContainer);
                    } else if (attempts < maxAttempts) {
                        setTimeout(checkTable, 200);
                    } else {
                        console.error('❌ 表格加载超时');
                    }
                }
                
                checkTable();
            }

            // 初始化监听器 - 修复版本
            function initListeners(tableContainer) {
                if (isInitialized) {
                    return;
                }
                
                // 使用事件委托监听整个表格容器
                tableContainer.addEventListener('click', handleUserClick, true);

                // 同时监听document作为备选方案
                document.addEventListener('click', handleUserClick, true);

                // 监听表格变化（处理新加载的行）
                const tableObserver = new MutationObserver(function(mutations) {
                    let hasNewRows = false;
                    
                    mutations.forEach(function(mutation) {
                        // 处理子节点变化（新增行或替换tbody）
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    // 如果是表格或tbody被替换，处理所有行
                                    if (node.tagName === 'TABLE' || node.tagName === 'TBODY') {
                                        handleNewRows(node);
                                        hasNewRows = true;
                                    }
                                    // 处理新增的单行
                                    else if (node.tagName === 'TR' && node.hasAttribute('data-row-key')) {
                                        handleNewRows(node);
                                        hasNewRows = true;
                                    }
                                    // 处理新增的容器（包含多行）
                                    else if (node.querySelector && node.querySelector('tr[data-row-key]')) {
                                        handleNewRows(node);
                                        hasNewRows = true;
                                    }
                                }
                            });
                        }
                    });
                    
                    // 如果有新行被处理，同步到div
                    if (hasNewRows) {
                        syncToDiv();
                    }
                });

                // 监听表格容器及其父容器（捕获表格完全替换的情况）
                const observerTarget = tableContainer.parentElement || tableContainer;
                tableObserver.observe(observerTarget, {
                    childList: true,
                    subtree: true
                });

                // 初始化现有行的状态
                handleNewRows(tableContainer);
                
                // 初始同步到div
                syncToDiv();
                
                isInitialized = true;
            }

            // 主初始化流程
            function initialize() {
                createSyncDiv();
                waitForTableLoad(function(tableContainer) {
                    initListeners(tableContainer);
                });
            }

            // 如果页面已经加载完成，立即初始化
            if (document.readyState === 'complete') {
                initialize();
            } else {
                // 否则等待页面加载完成
                window.addEventListener('load', initialize);
            }

            // 定期检查表格是否重新加载
            setInterval(() => {
                const tableContainer = document.querySelector('.ant-table-body') || 
                                     document.querySelector('table');
                if (tableContainer && tableContainer.querySelector('tr[data-row-key]')) {
                    if (!isInitialized) {
                        initListeners(tableContainer);
                    }
                } else {
                    isInitialized = false;
                }
            }, 2000);
        })();
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
  if (window.location.href.includes("agentseller.temu.com")) {
    let e = function () {
      if (!document.body) {
        setTimeout(e, 100);
        return;
      }
      let t = window.location.href,
        o = window.location.pathname;
      (new MutationObserver(() => {
        const a = window.location.href,
          l = window.location.pathname;
        if (a !== t || l !== o) {
          const d = t.includes("/goods/create/category"),
            h = a.includes("/goods/edit");
          (d &&
            h &&
            setTimeout(() => {
              typeof I == "function" && I();
            }, 500),
            (t = a),
            (o = l));
        }
      }).observe(document.body, { childList: !0, subtree: !0 }),
        window.addEventListener("popstate", () => {
          const a = window.location.href;
          (a.includes("/goods/edit") &&
            t.includes("/goods/create/category") &&
            setTimeout(() => {
              typeof I == "function" && I();
            }, 500),
            (t = a),
            (o = window.location.pathname));
        }),
        setInterval(() => {
          const a = window.location.href,
            l = window.location.pathname;
          if (a !== t || l !== o) {
            const d = t.includes("/goods/create/category"),
              h = a.includes("/goods/edit");
            (d && h && typeof I == "function" && I(), (t = a), (o = l));
          }
        }, 500));
    };
    e();
  }
  if (window.location.hostname && window.location.hostname.includes("shein.com")) {
    let e = function () {
        try {
          if (!window.chrome || !chrome.runtime || !chrome.runtime.getURL) return;
          var r = function (a, l) {
            try {
              if (document.getElementById(a)) return;
              var d = document.createElement("script");
              ((d.id = a),
                (d.type = "text/javascript"),
                (d.src = l),
                (document.head || document.documentElement).appendChild(d));
            } catch {}
          };
          (r(
            "__mcj_shein_gwauth__",
            chrome.runtime.getURL("contentScripts/web/panel_shein/Common_Function/shein_gwauth.js"),
          ),
            r(
              "__mcj_shein_csrandom__",
              chrome.runtime.getURL("contentScripts/web/panel_shein/Common_Function/shein_csRandom.js"),
            ),
            r(
              "__mcj_shein_decrypt__",
              chrome.runtime.getURL("contentScripts/web/panel_shein/Common_Function/shein_decrypt.js"),
            ));
        } catch {}
      },
      t = function () {
        try {
          var r = window.gbCommonInfo || null,
            a = "";
          if (window.AntiIn)
            try {
              a = window.AntiIn.syncGetAllEncrypted(window.AntiIn.Channel.PC) || "";
            } catch {}
          r &&
            window.postMessage(
              {
                type: "__MCJ_SHEIN_PAGE_DATA__",
                gbCommonInfo: {
                  csrf_token: r.csrf_token || "",
                  appLanguage: r.appLanguage || "en",
                  langPath: r.langPath || "",
                  SiteUID: r.SiteUID || "",
                  xAdFlag: r.xAdFlag || "",
                  OPEN_SIGNATURE: r.OPEN_SIGNATURE || !1,
                  CS_RANDOM_URLS: r.CS_RANDOM_URLS || [],
                  WEB_VERSION: r.WEB_VERSION || "",
                  NODE_SERVER_ENV: r.NODE_SERVER_ENV || "",
                  RISK_SDK_DOWNGRADE: r.RISK_SDK_DOWNGRADE || {},
                  PUBLIC_CDN: r.PUBLIC_CDN || "",
                },
                antiIn: a,
              },
              "*",
            );
        } catch {}
      };
    ((function () {
      window.addEventListener("message", function (r) {
        if (r.source === window) {
          var a = r.data;
          if (a.type === "__MCJ_GET_PAGE_WINDOW__" && a.target === "shein")
            try {
              var l = { type: "__MCJ_PAGE_WINDOW_RESPONSE__", requestId: a.requestId, data: null },
                d = a.propertyPath;
              if (d) {
                for (var h = window, y = d.replace(/^window\./, "").split("."), b = 0; b < y.length; b++)
                  if (h && y[b]) h = h[y[b]];
                  else {
                    h = void 0;
                    break;
                  }
                typeof h == "function" ? (l.data = { __isFunction: !0, __functionName: d }) : (l.data = h);
              }
              if (a.functionCall) {
                var i = a.functionCall.name,
                  u = a.functionCall.args || [];
                if (i === "_SHEIN_CALC_SIGNATURE_" && window._SHEIN_CALC_SIGNATURE_) {
                  Promise.resolve(window._SHEIN_CALC_SIGNATURE_.apply(window, u))
                    .then(function (c) {
                      window.postMessage(
                        { type: "__MCJ_PAGE_WINDOW_RESPONSE__", requestId: a.requestId, data: c },
                        "*",
                      );
                    })
                    .catch(function (c) {
                      window.postMessage(
                        {
                          type: "__MCJ_PAGE_WINDOW_RESPONSE__",
                          requestId: a.requestId,
                          error: c.message || "Function call failed",
                        },
                        "*",
                      );
                    });
                  return;
                }
                if (i === "CSRandom.rand" && window.CSRandom && window.CSRandom.rand) {
                  var n = window.CSRandom.rand.apply(window.CSRandom, u);
                  l.data = n;
                }
                if (i === "GLOBAL_SN_OEST.getValue" && window.GLOBAL_SN_OEST && window.GLOBAL_SN_OEST.getValue) {
                  var n = window.GLOBAL_SN_OEST.getValue.apply(window.GLOBAL_SN_OEST, u);
                  l.data = n;
                }
                if (i === "AntiIn.syncGetAllEncrypted" && window.AntiIn && window.AntiIn.syncGetAllEncrypted) {
                  var n = window.AntiIn.syncGetAllEncrypted.apply(window.AntiIn, u);
                  l.data = n;
                }
              }
              window.postMessage(l, "*");
            } catch (c) {
              window.postMessage(
                { type: "__MCJ_PAGE_WINDOW_RESPONSE__", requestId: a.requestId, error: c.message || "Unknown error" },
                "*",
              );
            }
        }
      });
    })(),
      document.readyState === "complete"
        ? (e(), setTimeout(t, 1e3))
        : window.addEventListener("load", function () {
            (e(), setTimeout(t, 1e3));
          }));
  }
  if (window.location.href.includes("aliexpress.")) {
    var s = document.createElement("script");
    ((s.text = `
    (function() {
        // 通过 React Fiber 找到并调用组件的 onMouseEnter handler
        function getReactFiberHandler(el, eventName) {
            if (!el) return null;
            // React 17+ 用 __reactFiber$xxx，React 16 用 __reactInternalInstance$xxx
            const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
            if (!fiberKey) return null;
            let fiber = el[fiberKey];
            // 向上遍历 fiber 树找到有 onMouseEnter 的节点
            while (fiber) {
                const props = fiber.memoizedProps || fiber.pendingProps;
                if (props && typeof props[eventName] === 'function') {
                    return props[eventName];
                }
                fiber = fiber.return;
            }
            return null;
        }

        // 触发指定元素的 React onMouseEnter
        function triggerReactMouseEnter(el) {
            if (!el) return false;
            const handler = getReactFiberHandler(el, 'onMouseEnter');
            if (!handler) return false;
            handler({
                type: 'mouseenter',
                bubbles: false,
                preventDefault: function() {},
                stopPropagation: function() {},
                nativeEvent: new MouseEvent('mouseenter', { bubbles: false }),
                currentTarget: el,
                target: el
            });
            return true;
        }

        // 采集所有类目（lv1 hover -> 读取 lv2/lv3）
        async function collectSmtCategories() {
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            const nav = document.getElementById('main');
            if (!nav) return null;

            const lv1Items = nav.querySelectorAll("nav div[class^='Categoey--lv1Container--'] a");
            if (!lv1Items.length) return null;

            const result = [];
            for (const lv1El of lv1Items) {
                const lv1Label = lv1El.textContent?.trim();
                if (!lv1Label) continue;

                triggerReactMouseEnter(lv1El);
                await sleep(800);

                const lv2Items = nav.querySelectorAll("nav div[class^='Categoey--lv2CategoryItem']");
                const children = [];
                for (const lv2Item of lv2Items) {
                    const lv2Title = lv2Item.querySelector("[class^='Categoey--lv2CategoryItemTitle']")?.textContent?.trim();
                    if (!lv2Title) continue;
                    const lv3Links = Array.from(lv2Item.querySelectorAll('a'))
                        .map(a => ({ label: a.textContent?.trim(), value: a.textContent?.trim(), children: [] }))
                        .filter(item => item.label);
                    children.push({ label: lv2Title, value: lv2Title, children: lv3Links });
                }
                result.push({ label: lv1Label, value: lv1Label, children });
            }
            return result;
        }

        // 监听来自 content script 的采集指令
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === '__MCJ_SMT_COLLECT_CATEGORIES__') {
                collectSmtCategories().then(function(result) {
                    window.postMessage({ type: '__MCJ_SMT_CATEGORIES_RESULT__', data: result }, '*');
                });
            }
        });

        // 也暴露为全局函数，供直接调用
        window.mcj_smt_collectCategories = collectSmtCategories;
        window.mcj_smt_triggerMouseEnter = triggerReactMouseEnter;
    })();
    `),
      (s.async = !1),
      document.documentElement.appendChild(s));
  }
})();
