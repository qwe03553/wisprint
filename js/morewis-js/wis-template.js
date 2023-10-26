// 多少张为一批
const interval = 20;

// 拼接完成的html
function wisPreviewById(id, dataset, close, hasLabelTmp = true) {
	mesAjax({
		id: '191541c42bdc4c939aabbba420f685f8',
		data: {
			id: id,
			dataset: dataset
		},
		success: function(data) {
			var { msg, styleInfo } = data;
			wisPreview(getDocument(styleInfo, msg), close);
		}
	})
	/* var template = wisAjax('/template/content', JSON.stringify({
		id,
		dataset,
        detailId: ''
	}), close);
	template && wisPreview(getDocument(template.styleInfo, template.bodyInfo), close);*/
}

// 记录当前的num为了只执行最后一次功能
// 不加锁的话安装了控件之前所有的操作都会执行
var num = 0;

// 打印传给content参数
var contentReqData = {
	detailId: ''
}

// 判断是否安装打印机
function printBefore(callback) {
	// 添加锁，取消进入之前的回调
	num += 1;
	let key = num;
	getJCP().getVersion(function(result) {
		if(key !== num) return;
		callback && callback();
	})
}

// id: 模板id
// dataset: 数据项
// callbak: 回调
// hasGetPrinter： 是否重新获取打印机
// template: 模板数据
function wisPrintById(id, dataset, callback, hasGetPrinter = false, template={}) {
    if (dataset.length > interval) {
        batchPrint(id, dataset, callback, true, 0,template);
        return;
    }
    
    if(JSON.stringify(template) == "{}"){
	    var template = wisAjax('/template/content', JSON.stringify({
	        id,
	        dataset,
	        detailId: contentReqData.detailId || ''
	    }), callback);
    }
    
    
    template && wisPrint(getDocument(template.styleInfo, template.bodyInfo), callback, hasGetPrinter, id);
}

// 批次打印
function batchPrint(id, dataset, callback, hasGetPrinter, index, template={}) {
    if(Math.ceil(dataset.length / interval) <= index) {
        callback();
        return
    }
    
    
    var template = wisAjax('/template/content', JSON.stringify({
        id,
        dataset: dataset.slice(index * interval, index * interval + interval),
        detailId: contentReqData.detailId || ''
    }), callback);
    
    
    template && wisPrint(getDocument(template.styleInfo, template.bodyInfo), function() {
        batchPrint(id, dataset, callback, false, index + 1);
    }, hasGetPrinter, id);
}

function wisPreview(doc, close) {
	var myDoc = {
		settings: 'auto',
		noMargins: true,
		enableScreenOnlyClass: true,
		documents: doc,
		copyrights: '摩尔软件拥有版权  www.morewis.com'
	}
	myDoc.listener = function (e) {
		if (e && e.type == "window-close") {
			close && close();
		}
	};
	getJCP().printPreview(myDoc, true);
}

var defaultPrinter = null;

/** 
 * @function 调用打印机
 * @version 1.0.0
 * @param {Object} doc
 * @param {Function} callback 打印成功回调
 * @param {Boolean} hasGetPrinter 是否获取打印机
 * @param {String} tid 模板id：获取各等级包装的打印机
 */
function wisPrint(doc, callback, hasGetPrinter, tid) {
	var myDoc = {
		settings: 'auto',
		// keepURL: false,
		noMargins: true,
		enableScreenOnlyClass: true,
		documents: doc,
		// settingsId: tid,
		copyrights: '摩尔软件拥有版权  www.morewis.com',
		done: callback || null
	};
	if (callback) {
		myDoc.done = callback;
	}
	// 如果存在tid则获取对应的打印机
	if(tid && typeof tmpIdPrinter !== 'undefined') {
		myDoc.printer = tmpIdPrinter[tid];
		getJCP().print(myDoc, false);
	} else if(defaultPrinter) {
		myDoc.printer = defaultPrinter;
		getJCP().print(myDoc, false);
	} else{
		// 获取默认打印机
		getJCP().getDefaultPrinter(function(result) {
			myDoc.printer = result;
			defaultPrinter = result;
			getJCP().print(myDoc, false);
		})
	}
}

/** 
 * @function 获取dom
 * @description 通过style和body生成dom
 * @param styleStr {String}
 * @param bodyList {Array}
 */
function getDocument(styleStr, bodyList) {
    const iframeId = 'printViewIframe';
    if (!$('#' + iframeId).length) {
        $(document.body).append("<div style='display:none;'>" +
            "<iframe id='" + iframeId + "' name='" + iframeId + "' frameBorder='0' src='' " +
            " scrolling='auto' style='border-right: 1px;width: 100%;min-height: 550px;' >" +
            "</iframe>" +
            "</div>");
    }
    $($('#' + iframeId)[0].contentWindow.document.head).empty().append(styleStr);
    $($('#' + iframeId)[0].contentWindow.document.body).empty().append(bodyList[0]);
    return $('#' + iframeId)[0].contentWindow.document;
}

function wisAjax(url, data, error) {
	var d = null;
	$.ajax({
	    url: getProjectName()  + url,
		type: "post",
	    dataType: "json",
	    async: false,
	    contentType: "application/json;charset=utf-8",
	    data: data,
	    success:function(data){
	    	if(data.code === '200') {
	    		d = data.data;
	    	} else {
	    		!isLocal && top.utilsFp.confirmIcon(3,'提示',"","",data.message,0,"300","");
	    		/*scmAlert("打印标签已被删除", { status: 2 });
	    		if($('.scm-shade.load').length) {
	    			scmLoad();
	    		}
	    		if(canPrint) {
					canPrint.status = true;
					canPrint.name = '';
	    		}*/
	    		// throw new Error(url + ':' + data.message);
	    	}
	    },
	    error:function(data){
	        ajaxErr(data);
	        error && error();
    		if($('.scm-shade.load').length) {
    			scmLoad();
    		}
	    }
	})
	return d;
}