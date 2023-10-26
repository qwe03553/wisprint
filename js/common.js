//获取根目录（域名+工程名）
var getBasePath = function () {
    var curWwwPath = window.document.location.href;
    var pathName = window.document.location.pathname;
    var pos = curWwwPath.indexOf(pathName);
    var localhostPath = curWwwPath.substring(0, pos);
    var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
    var vPath = localhostPath + projectName;
    return vPath;
}

//获取根目录（工程名）
var getProjectName = function () {
    var pathName = window.document.location.pathname;

    var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);

    return 'http://190.160.9.188:5501/wisprint';
}

// 获取url中的参数
function getQueryVariable(variable) {
    //alert( window.location.search)
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}

//获取uuid
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23];

    var uuid = s.join("");
    return uuid;
}

//mc地址
function getMcUrl() {
    return "http://190.160.2.123/ml";
}

//ajax访问异常处理
function ajaxErr(errMsg) {
    if (errMsg != null && errMsg.status != undefined && errMsg.status == 401) {
        top.location.href = getMcUrl();
    } else {
        console.error(errMsg);
        scmAlert("执行异常，详细信息请查看日志！", { status: 2 });
    }
}

/** 
 * @function 节流
 * @description 规定时间内函数只触发一次
 * @param fn {Function} 
 * @param delay {Number} 时间
 */
function throttle(fn, delay) {
    let flag = false;
    return function (...args) {
        if (flag) return;
        flag = true;
        let context = this;
        setTimeout(function () {
            flag = false;
        }, delay);
        fn.call(context, ...args);
    }
}

/**
 * @function 下载
 * @description 通过模拟a标签点击下载
 * @version 1.0.0
 * @param {String} url 下载地址
 * @param {Object} params 需要携带的参数
 * @param {String} fileName 指定下载的文件名
 */
function commDownload(url, params, fileName) {
    if (params) {
        url += '?';
        for (let key in params) {
            url += key + '=' + params[key] + '&';
        }
        url = url.substr(0, url.length - 1);
    }
    $('<a href=' + url + ' ' + (fileName ? 'download=' + fileName : '') + ' />')[0].click();
}

/** 
 * @function 右下角提示
 * @param msg {String} 提示信息
 * @param status {String} 提示状态 可选success  error
 * @param isAutoClose {Boolean} 是否自动关闭 默认true为自动关闭 false为手动关闭
 */
function scmMsg(msg, status = 'success', isAutoClose = true) {
    // 打开弹窗动画名称
    var openAnimateName = 'animate__slideInUp',
        // 关闭弹窗动画名称
        closeAnimateName = 'animate__slideOutDown',
        // 弹窗延时关闭时间
        delay = 3000,
        imgSrc = mcPath + 'buss/reso/wisprint/images/icon/' + status + '.png';
    msgTimer = null;
    // 如果弹窗在动则返回
    if ($('#scm-msg').hasClass(openAnimateName) || $('#scm-msg').hasClass(closeAnimateName)) return;
    // 如果弹窗不存在就生成弹窗
    if (!$('#scm-msg').length) {
        $(document.body).append('<div id="scm-msg" class="scm-msg animate__animated"><div class="msg-hd"><span>提示</span><span class="msg-close">&times;</span></div><div class="msg-body">' +
            '<img src="" alt=""><span>提示：修改成功</span></div></div>');
        // 添加关闭窗口事件
        $('#scm-msg').find('.msg-close').click(function () {
            if ($('#scm-msg').hasClass(closeAnimateName)) return;
            clearTimeout(msgTimer);
            $('#scm-msg').removeClass(openAnimateName).addClass(closeAnimateName);
            setTimeout(function () {
                $('#scm-msg').removeClass(closeAnimateName).hide();
            }, 1000)
        })
    }
    $('#scm-msg').find('.msg-body').children('span').text(msg || '');
    $('#scm-msg').find('.msg-body').children('img').attr('src', imgSrc);
    $('#scm-msg').addClass(openAnimateName).show();
    if (isAutoClose) {
        msgTimer = setTimeout(function () {
            $('#scm-msg').removeClass(openAnimateName).addClass(closeAnimateName);
            setTimeout(function () {
                $('#scm-msg').removeClass(closeAnimateName).hide();
            }, 1000)
        }, delay)
    }
}

/** 
 * @function 弹窗提示
 * @param msg {String} 提示信息
 * @param option {Object} 可选值
 * @param option.status {String} 弹窗状态 1：成功 2：失败 3：警告 默认为成功
 * @param option.animate {Boolean} 是否开启动画
 * @param option.confirm {Function} 确定回调
 * @param option.cancel {Function} 取消回调,有回调才会显示按钮
 * @param option.close {Function} 关闭回调
 * scmAlert(msg, { status: 2 })
 * scmAlert(msg, { status: 3, confirm: function(){})
 */
function scmAlert(msg, option = {}) {
    let {
        confirm,
        cancel,
        close,
        status = '1',
        animate = false,
        remark = '注：'
    } = option;
    let imgUrlArr = ['success', 'error', 'warning'],
        imgSrc = mcPath + 'buss/reso/wisprint/images/icon/' + imgUrlArr[+status - 1] + '.png';
    $('#scm-alert').parents('.scm-shade').remove();
    if (!$('#scm-alert').length) {
        $(document.body).append('<div class="scm-shade animate__animated"><div id="scm-alert" class="scm-msg animate__animated" data-status="success">' +
            '<div class="msg-hd"><span>提示</span><span class="msg-close">&times;</span></div><div class="msg-body">' +
            '<img src="' + imgSrc + '" alt=""><span>' + remark + msg + '</span></div><div class="msg-btn-group">' +
            '<button class="msg-btn confirm">确定</button>' +
            (cancel ? '<button class="msg-btn close">取消</button>' : '') +
            '</div></div></div>');
        $('#scm-alert').draggable({
            handle: ".msg-hd"
        });
        // 添加关闭窗口事件
        $('#scm-alert').find('.msg-close').click(function () {
            close && close();
            if (animate) {
                animate && $('#scm-alert').parents('.scm-shade').addClass('animate__fadeOut').removeClass('animate__fadeIn');
                animate && $('#scm-alert').addClass('animate__zoomOut').removeClass('animate__zoomIn');
                setTimeout(function () {
                    $('#scm-alert').parents('.scm-shade').remove();
                }, 1000)
                return;
            }
            $('#scm-alert').parents('.scm-shade').remove();
        })
        $('#scm-alert').find('.confirm').click(function () {
            $('#scm-alert').find('.msg-close').click();
            if (confirm) return confirm();
        })
        $('#scm-alert').find('.close').click(function () {
            cancel && cancel();
        })
    }
    animate && $('#scm-alert').parents('.scm-shade').addClass('animate__fadeIn').removeClass('animate__fadeOut');
    animate && $('#scm-alert').addClass('animate__zoomIn').removeClass('animate__zoomOut');
    $('#scm-alert').parents('.scm-shade').show();
}

/** 
 * @function 加载动画
 * @description 第一次调用为开启，第二次为关闭
 */
function scmLoad() {
    if ($('.scm-shade.load').length) {
        $('.scm-shade.load').remove();
        return;
    }
    let html = '<div class="scm-shade load"><span class="iconfont icon-load"></span><div class="wrapp"><div class="load-6"><div class="k-letter-holder">',
        arr = 'Loading...'.split('');
    arr.forEach((v, i) => {
        html += '<div class="k-letter-' + (i + 1) + ' k-letter">' + v + '</div>';
    })
    html += '</div></div></div></div>';
    $(document.body).append(html);
}

// 日期格式化
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份 
        "d+": this.getDate(),                    //日 
        "h+": this.getHours(),                   //小时 
        "m+": this.getMinutes(),                 //分 
        "s+": this.getSeconds(),                 //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

// 按钮点击效果
function rippleBtns() {
	return
    const buttons = document.getElementsByClassName("ripples-btn");
    for (var i = 0, l = buttons.length; i < l; i++) {
        buttons[i].addEventListener("click", function (e) {
            let x = e.offsetX;
            let y = e.offsetY;
            let ripples = document.createElement("span");
            ripples.className = "ripples";
            ripples.style.left = x + "px";
            ripples.style.top = y + "px";
            this.appendChild(ripples);
            setTimeout(() => {
                ripples.remove();
            }, 1000);
        });
    }
}

/**
 * @function 事件委托
 * @param {Object} element 委托节点
 * @param {String} eventType 事件类型
 * @param {String} selector 被委托的标签名
 * @param {Function} fn 回调函数
 * @param {String} cancel 取消委托的标签
 */
function delegate(element, eventType, selector, fn, cancel) {
    element.addEventListener(eventType, function (e) {
        var el = event.target;
        while (!el.matches(selector)) {
            // 如果冒泡到最顶级跳出循环
            if (element === el || el.matches(cancel)) {
                el = null;
                break;
            }
            el = el.parentNode;
        }
        el && fn && fn.call(el, e, el);
    });
}

/**
 * @function 提示
 * @description 初始化提示
 * @version 1.0.1
 */
function initTooltip() {
    // 添加提示容器
    if (!document.getElementsByClassName('com-tooltip-content').length) {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div class="com-tooltip-content animate__animated animate__zoomIn" style="display: none"></div>'
        );
    }
    // 获取页面上需要提示的节点
    // var dom = document.getElementsByClassName('com-tooltip');
    var dom = document.querySelectorAll('[data-tooltip]');
    for (var i = 0, l = dom.length; i < l; ++i) {
        dom[i].style.cursor = 'pointer';
        dom[i].addEventListener('mousemove', function (e) {
            // 获取当前节点的信息
            var { top, left, width, height } = this.getBoundingClientRect();
            // 获取当前body的位置 防止滚动后提示位置错误
            var { top: bodyTop, left: bodyLeft } = document.body.getBoundingClientRect();
            var tooltip = document.getElementsByClassName('com-tooltip-content')[0];
            var { maxWidth, tooltip: toolText } = this.dataset;
            tooltip.innerText = toolText;
            tooltip.style.opacity = 1;
            tooltip.style.maxWidth = maxWidth || '200px';
            tooltip.style.display = 'block';
            // 获取当前赋值后提示宽度
            var tooltipWidth = parseInt(window.getComputedStyle(tooltip).width);
            tooltip.style.top = top + height - bodyTop + 'px';
            var tooltipLeft = left - (tooltipWidth - width) / 2 - bodyLeft;
            // 如果提示超出屏幕则为0
            tooltipLeft = tooltipLeft < 0 ? 0 : tooltipLeft;
            tooltip.style.left = tooltipLeft + 'px';
        });
        dom[i].addEventListener('mouseleave', function (e) {
            var tooltip = document.getElementsByClassName('com-tooltip-content')[0];
            tooltip.style.display = 'none';
            tooltip.style.opacity = 0;
        });
    }
}