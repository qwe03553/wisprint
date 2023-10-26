var DDDY = (function () {
  //根据apikey取得访问token
  //function(data){
  //     data.error,
  //     data.error_code
  //     data.token
  //});
  var dddy_root = "";
  dddy_root = window.location.origin + getProjectName() + "/";
  // dddy_root = document.URL.substring(0, document.URL.lastIndexOf("/api") + 1);
  var cgi = dddy_root + "/api?";
  var JSONparse =
    JSON.parse ||
    function (str) {
      if (str === "") str = '""';
      eval("var p=" + str + ";");
      return p;
    };

  function ajax(url, data, callback, json) {
    //$.post(url,data,callback,"json");
    //return ;
    try {
      if (typeof data !== "string") data = JSON.stringify(data);
      var x = new (window.XDomainRequest ||
        window.XMLHttpRequest ||
        ActiveXObject)("MSXML2.XMLHTTP.3.0");
      //x.timeout = 1000 * 60;
      //	x = createCORSRequest(data ? 'POST' : 'GET', url);
      x.open(data ? "POST" : "GET", url, 1);
      //x.timeout = 1000 * 60;
      if (window.XDomainRequest) {
        x.onload = function () {
          //$("#console").text($("#console").text() + "\n" + x.responseText);
          var data = JSONparse(x.responseText || "{}");
          callback && callback(data, x.responseText, 200);
        };
        x.ontimeout = function () {
          callback && callback(data, x.responseText, 404);
        };
        x.onerror = function () {
          callback && callback(data, x.responseText, 404);
        };
        //			setTimeout(function() {
        //x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        x.send(data);
        //			}, 0);
      } else {
        x.onreadystatechange = function () {
          //$("#console").text($("#console").text() + "\n" + x.responseText);
          try {
            var data =
              json === false
                ? x.responseText
                : JSONparse(x.responseText || "{}");
            x.readyState > 3 &&
              callback &&
              callback(data, x.responseText, x.status);
          } catch (e) {
            console.log(e);
          }
        };
        x.send(data);
      }
      //	x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      //x.send(data)
    } catch (e) {
      log(e);
    }
  }
  /* 根据 key 取得访问 token
       点点打印的其他所有调用，如设计，打印等，必须使用 token, token 会在没调用的情况下，30分钟后失效
       key: 你申请到的 key
       
       callback(result), 回调， result:
                {
          "error_code": 0, // 0 正常，非0异常
          "error_message": "ok",   // 错误信息，正常恒为 ok
          "token": "81deb34a0891458eb840cdc515552042",  // 取到的 token
            }
            */
  function getToken(key, callback) {
    ajax(
      cgi,
      {
        method: "getToken",
        key: key,
      },
      function (data) {
        callback && callback(data);
      },
      "json"
    );
  }
  /* 新建模板
        即在浏览器中，打开点点打印设计器面板，来创建一个模板
        token: 你用 getToken得到的token
        datasource: 可用字段列表，字段用换行符(\n)分割
        dataset: 用json格式指定的打印测试数据，可以为空
        tid: 拟保存的模板id
        saved: 保存回调函数. 当用户每次点击保存按钮，成功后系统会调用这个函数，并传入已保存的模板 id (tid)
        opened: 设计器打开后，回调，可选
        
        datasource 指定的字段会显示在设计器的字段面板上，
        设计面板中一个打印测试按钮，打页时，dataset用来结合模板，来生成打印测试页。典型的数据集如下：
        [{
              "订单号" : "BD17050911416",
              "订单日期" : "2017-05-09 00:00:00",
              "客户" : "希望集团杭州分公司",
              "运货地址" : "杭州市西湖区XXX广场直营店",
              "业务员" : "林月琴",
              "订单状态" : "确认"
          }, {
              "订单号" : "BD17050911417",
              "订单日期" : "2017-05-11 00:00:00",
              "客户" : "米多科技上海分公司",
              "运货地址" : "上海市浦东新区XXX广场12-3-201",
              "业务员" : "李小龙",
              "订单状态" : "已发货"
          }, {
              "订单号" : "BD17050911418",
              "订单日期" : "2017-05-29 00:00:00",
              "客户" : "中发联科技术有限公司",
              "运货地址" : "武汉市武昌区XXX大厦21-A24",
              "业务员" : "陈明",
              "订单状态" : "完成"
          }]
          用这个数据集打印时，生成的测试页面有三页，1,2,3页中的 ${业务员} 依次被替换为 林月琴，李小龙，陈明
          当dataset不指定时，系统将默认生成一个打印页面，并将字段名作为字段内容，如 页中的 ${业务员}将被替换成 业务员，
        
          saved(result) 回调中的result, 类似：	  
          {
                 "error_code": 0,
                 "error_message": "ok",
                 "tid": "8c3bd9f81ca99a1ccfa14361c3c894a6" // 保存后的模板 id
          }
          opened(result) 回调中的result, 类似：	  
          {
                  "error_code": 0,
                  "error_message": "ok",
                  "did": "2c0471f03f070b9f1158c1ebd5618453",  // 系统使用
                  "pid": "5a4d3c022ef26669ba693f42600f5c76",  // 系统使用
                  "url": "http://121.199.48.244/d?did=2c0471f03f070b9f1158c1ebd5618453&pid=5a4d3c022ef26669ba693f42600f5c76" // 设计器打开 url
          }	  
            */
  function newTemplate(
    token,
    datasource,
    dataset,
    tid,
    saved,
    opened,
    urlParam
  ) {
    if (Array.isArray(dataset)) {
      dataset = JSON.stringify(dataset);
    }
    ajax(
      cgi,
      {
        method: "newTemplate",
        token: token,
        datasource: datasource,
        dataset: dataset || "[]",
      },
      function (data) {
        if (!data["error_code"]) {
          data.url = dddy_root + "d";
        }
        if (!data.error_code) {
          //		if (saved) {
          getJCP().getVersion(function () {
            data.url += "?tab=" + getJCP().tab;
            // data.url += ("&tid=" + tid);
            // 添加url参数
            if (urlParam) {
              for (var item in urlParam) {
                data.url += "&" + item + "=" + urlParam[item];
              }
            }
            try {
              if (top.addTab) {
                if (urlParam.type == 1 || urlParam.type == 5) {
                  top.addTab(data.url, "标签模板新增", "labelEdit", null);
                } else {
                  top.addTab(data.url, "单据模板新增", "billEdit", null);
                }
              } else {
                window.open(data.url);
              }
            } catch (e) {
              console.error(e);
              window.open(data.url);
            }

            if (saved)
              getJCP().getMessage(function (data) {
                saved(data);
              });
          });
          //	} else
          //	window.open(data.url);
        }
        opened && opened(data);
      },
      "json"
    );
  }
  /* 打开模板
        即在浏览器中，打开一个以前的模板，进行再次编辑
        token: 你用 getToken得到的token
        tid: 要打开的模板 id，可以从 newTemplate或者本方法 openTemplate中的 saved 回调函数中获得
        dataset: 用json格式指定的打印测试数据，可以为空，参照 newTemplate
        saved: 保存回调函数. 当用户每次点击保存按钮，成功后系统会调用这个函数，并传入已保存的模板 id (tid)，参照 newTemplate
        opened: 设计器打开后，回调，可选，参照 newTemplate
        urlParam: 往打开的url中添加参数
        templateHtml: 模板的html
            */
  function openTemplate(
    token,
    tid,
    dataset,
    opened,
    saved,
    urlParam,
    templateHtml
  ) {
    if (Array.isArray(dataset)) {
      dataset = JSON.stringify(dataset);
    }
    ajax(
      cgi,
      {
        method: "openTemplate",
        token: token,
        tid: tid,
        dataset: dataset || "[]",
        templateHtml,
      },
      function (data) {
        if (!data["error_code"]) {
          data.url = dddy_root + "d?tid=" + tid;
        }
        if (!data.error_code) {
          //		if (saved) {
          getJCP().getVersion(function () {
            data.url += "&tab=" + getJCP().tab;
            // 添加url参数
            if (urlParam) {
              for (var item in urlParam) {
                data.url += "&" + item + "=" + urlParam[item];
              }
            }

            try {
              if (top.addTab) {
            	var list = JSON.parse(window.localStorage.getItem('labelOpenList') || '[]');
            	if(list.indexOf(tid) === -1) {
                    list.push(tid);
                    window.localStorage.setItem('labelOpenList', JSON.stringify(list));
            	}
                if (urlParam.type == 1 || urlParam.type == 5) {
                  top.addTab(data.url, "标签模板修改", tid, null);
                } else {
                  top.addTab(data.url, "单据模板修改", tid, null);
                }
              } else {
                window.open(data.url);
              }
            } catch (e) {
              console.error(e);
              window.open(data.url);
            }

            if (saved)
              getJCP().getMessage(function (data) {
                saved(data);
              });
          });
          //	} else
          //	window.open(data.url);
        }
        opened && opened(data);
      },
      "json"
    );
  }
  /* 打印
        指定数据和模板来进行打印
        token: 你用 getToken得到的token
        tid: 要打印的模板id, 可以从 newTemplate或者openTemplate中的 saved 回调函数中获得
        dataset: 用json格式指定的打印数据
        prompt: 是否弹出打印机选择对话框，true为弹出，false,不弹出（打印到系统的默认打印机）
        callback(result): 打印回调函数，result 为空表示打印成功，result不为空，表示打印失败
  
        dataset用来结合模板，来生成打印页面。典型的数据集如下：
        [{
              "订单号" : "BD17050911416",
              "订单日期" : "2017-05-09 00:00:00",
              "客户" : "希望集团杭州分公司",
              "运货地址" : "杭州市西湖区XXX广场直营店",
              "业务员" : "林月琴",
              "订单状态" : "确认"
          }, {
              "订单号" : "BD17050911417",
              "订单日期" : "2017-05-11 00:00:00",
              "客户" : "米多科技上海分公司",
              "运货地址" : "上海市浦东新区XXX广场12-3-201",
              "业务员" : "李小龙",
              "订单状态" : "已发货"
          }, {
              "订单号" : "BD17050911418",
              "订单日期" : "2017-05-29 00:00:00",
              "客户" : "中发联科技术有限公司",
              "运货地址" : "武汉市武昌区XXX大厦21-A24",
              "业务员" : "陈明",
              "订单状态" : "完成"
          }]
          用这个数据集打印时，生成的测试页面有三页，1,2,3页中的 ${业务员} 依次被替换为 林月琴，李小龙，陈明
            */
  function print(token, tid, dataset, prompt, callback, printer) {
    //prompt = true;
    var len = dataset.length;
    var type = "print";
    if (Array.isArray(dataset)) {
      dataset = JSON.stringify(dataset);
    }
    ajax(
      cgi,
      {
        method: "registerDataset",
        token: token,
        tid: tid,
        dataset: dataset || "[]",
      },
      function (data) {
        if (!data["error_code"]) {
          var url =
            dddy_root +
            "ddservice/buildPage?tid=" +
            tid +
            "&pid=" +
            data.pid +
            "&num=" +
            len +
            "&type=" +
            type;
          var myDoc = {
            settings: "auto",
            keepURL: false,
            noMargins: true,
            enableScreenOnlyClass: true,
            documents: url,
            settingsId: tid,
            copyrights: "摩尔软件拥有版权  www.morewis.com",
            done: callback || null,
          };
          if (printer) {
            myDoc.printer = printer;
          }
          if (callback) {
            myDoc.done = callback;
          }
          getJCP().print(myDoc, prompt);
        } else callback && callback(data);
      },
      "json"
    );
  }
  /* 打印预览
        指定数据和模板来进行打印预览
        token: 你用 getToken得到的token
        tid: 要预览的模板id, 可以从 newTemplate或者openTemplate中的 saved 回调函数中获得
        dataset: 用json格式指定的打印数据
        prompt: 是否显示页面生成进度条，true为显示，false,不显示
  
        dataset用来结合模板，来生成打印页面。典型的数据集如下：
        [{
              "订单号" : "BD17050911416",
              "订单日期" : "2017-05-09 00:00:00",
              "客户" : "希望集团杭州分公司",
              "运货地址" : "杭州市西湖区XXX广场直营店",
              "业务员" : "林月琴",
              "订单状态" : "确认"
          }, {
              "订单号" : "BD17050911417",
              "订单日期" : "2017-05-11 00:00:00",
              "客户" : "米多科技上海分公司",
              "运货地址" : "上海市浦东新区XXX广场12-3-201",
              "业务员" : "李小龙",
              "订单状态" : "已发货"
          }, {
              "订单号" : "BD17050911418",
              "订单日期" : "2017-05-29 00:00:00",
              "客户" : "中发联科技术有限公司",
              "运货地址" : "武汉市武昌区XXX大厦21-A24",
              "业务员" : "陈明",
              "订单状态" : "完成"
          }]
          用这个数据集打印时，生成的页面有三页，1,2,3页中的 ${业务员} 依次被替换为 林月琴，李小龙，陈明
            */
  function printPreview(
    token,
    tid,
    dataset,
    prompt,
    closed,
    urlParam,
    order,
    printer
  ) {
    if (Array.isArray(dataset)) {
      dataset = JSON.stringify(dataset);
    }
    var type = order ? "" : "printPreview";
    // prompt = true;
    ajax(
      cgi,
      {
        method: "registerDataset",
        token: token,
        tid: tid,
        dataset: dataset || "[]",
      },
      function (data) {
        if (!data["error_code"]) {
          // 打印添加参数
          var url =
            dddy_root +
            "ddservice/buildPage?tid=" +
            tid +
            "&pid=" +
            data.pid +
            "&type=" +
            type;
          if (urlParam) {
            for (var item in urlParam) {
              url += "&" + item + "=" + urlParam[item];
            }
          }
          var myDoc = {
            keepURL: false,
            settings: "auto",
            noMargins: true,
            enableScreenOnlyClass: true,
            documents: url,
            settingsId: tid,
            copyrights: "摩尔软件拥有版权  www.morewis.com",
          };
          if (printer) {
            myDoc.printer = printer;
          }
          if (closed) {
            myDoc.listener = function (e) {
              if (e && e.type == "window-close") {
                closed();
              }
            };
          }
          getJCP().printPreview(myDoc, prompt);
        } else {
          closed && closed(data);
        }
      },
      "json"
    );
  }
  /* 动态创建缩略图
            指定数据和模板来进行打印预览
            token: 你用 getToken得到的token
            tid: 要预览的模板id, 可以从 newTemplate或者openTemplate中的 saved 回调函数中获得
            dataset: 用json格式指定的打印数据,只一条记录
            to:   
           
            */
  function createThumb(token, tid, dataset, to, callback) {
    if (Array.isArray(dataset)) {
      dataset = JSON.stringify(dataset);
    }
    var type = "createThumb";
    ajax(
      cgi,
      {
        method: "registerDataset",
        token: token,
        tid: tid,
        dataset: dataset || "[]",
      },
      function (data) {
        if (!data["error_code"]) {
          var url =
            dddy_root +
            "ddservice/buildPage?tid=" +
            tid +
            "&pid=" +
            data.pid +
            "&type=" +
            type;

          ajax(
            url,
            {
              scope: to,
            },
            function (data) {
              $(to)
                .html(data)
                .find(".jatools-coder")
                .each(function () {
                  $(this).replaceWith(
                    $('<img class="jatools-coder">').attr(
                      "src",
                      $(this).attr("src")
                    )
                  );
                });
              callback && callback();
            },
            false
          );
        }
      },
      "json"
    );
  }

  // 打印预览
  // 取得模板的数据源定义
  function getDatasource(token, template_id, callback) {}
  // 取得打印模板
  function getTemplate(token, template_id, callback) {}
  // 取得打印模板列表
  function getTemplates(token, callback) {}
  // 取得打印页面
  function buildPages(token, template_id, data, options, callback) {}

  function correctOffset(tid) {
    getJCP().setupNormalOffset(tid);
  }
  return {
    getToken: getToken,
    newTemplate: newTemplate,
    openTemplate: openTemplate,
    print: print,
    printPreview: printPreview,
    getDatasource: getDatasource,
    getTemplate: getTemplate,
    getTemplates: getTemplates,
    buildPages: buildPages,
    correctOffset: correctOffset,
    createThumb: createThumb,
  };
})();
