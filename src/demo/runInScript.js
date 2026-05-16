(function () {
  function mcjRunScriptListener() {
    window.addEventListener("message", (e) => {
      if (e.data.type == "mcjRunScript") {
        const script = document.createElement("script");
        let code = e.data.code;
        if (!/^\(.*\)$/s.test(e.data.code)) {
          code = `(function(){
            ${e.data.code}
          })()`;
        }
        script.innerHTML = code;
        document.body.appendChild(script);
        setTimeout(() => {
          document.body.removeChild(script);
        }, 10000);
      }
    });
  }
  function mcjRunCodeListener() {
    window.addEventListener("message", (e) => {
      if (e.data.type == "mcjRunCode") {
        let res, response;
        try {
          res = eval(e.data.code);
          response = {
            success: true,
            data: res,
          };
        } catch (e) {
          res = e.message;
          response = {
            success: false,
            error: res,
          };
        }
        if (!e.data.needRes) {
          return;
        }
        const div = document.createElement("div");
        div.id = e.data.codeId;
        div.innerHTML = encodeURIComponent(JSON.stringify(response));
        document.body.appendChild(div);
      }
    });
  }
  function runEvalListener() {
    window.addEventListener("message", async (event) => {
      // 验证消息类型
      if (event.data.type === "REQUEST") {
        try {
          const processedData = await eval(event.data.data);
          // 发送响应回A窗口
          event.source.postMessage({
            type: "RESPONSE",
            messageId: event.data.messageId,
            response: processedData,
          });
        } catch (error) {
          // 错误处理
          event.source.postMessage({
            type: "RESPONSE",
            messageId: event.data.messageId,
            error: error.message,
          });
        }
      }
    });
  }
  mcjRunScriptListener();
  mcjRunCodeListener();
  runEvalListener();

  const div = document.createElement("div");
  div.id = "mcjRunCodeFlag";
  document.body.appendChild(div);
})();
