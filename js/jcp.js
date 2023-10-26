var JCP = {
    setup: {
        download: _GLO_ROOTPATH + "buss/reso/wisprint/wis_printer_setup.exe",
        // download_linux: getBasePath()+"/wis_printer_setup.exe",
        noSetupMessage: "摩尔云打印客户端未安装, 请下载安装之.",
        noSetupHandle: function () {
            window.localStorage.setItem('canPreview', 'true');
            if (top.utilsFp) {
                top.util.closeLoading();
                top.utilsFp.confirmIcon(3, '提示', "downScm", "", "摩尔云打印客户端未安装, 请下载安装!", 0, "300", "");
            } else {
                scmAlert("摩尔云打印客户端未安装, 请下载安装", {
                    status: 3, confirm: function () {
                        downScm();
                    }
                });
            }
        }
    },
    licenseURL: _GLO_PATH + "buss/reso/wisprint/service/lic.jsp",
    jcpd: "https://www.labelchains.com/wisprint/service"
}
var JSON = JSON || {};
var _hmt = _hmt || [];
var jsid2 = "wc";

var $$ = function (a, b, c) {
    b = document, c = 'addEventListener';
    b[c] ? b[c]('DOMContentLoaded', a) : window.attachEvent('onload', a)
}
function downScm() {
    var $a = document.createElement('a');
    var url = JCP.setup.download;
    $a.setAttribute("href", url);
    $a.setAttribute("download", "wis_printer_setup.exe");
    var evObj = document.createEvent('MouseEvents');
    evObj.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, true, false, 0, null);
    $a.dispatchEvent(evObj);
}
$$(function () {

    if (document.location.href.indexOf("print.jatools.com") > -1) {
        var getHelpImage = function () {
            var tmp = document.getElementsByTagName("a");
            var regex = new RegExp("(^|\\s)" + "help" + "(\\s|$)");
            for (var i = 0; i < tmp.length; i++) {
                if (regex.test(tmp[i].className)) {
                    return tmp[i];
                }
            }
            return null;
        };
        var help = getHelpImage();
        if (help) {
            var href = help.getAttribute("href");
            if (href.indexOf("/doc/") == 0) {
                help.href = "/doc/?" + href.substring(5);
            }
            setTimeout(function () {
                var script = document.createElement('script');
                script.onload = function () {
                    showtip(help);
                };
                script.src = "/jcp/0.99/tooltip.js";
                ((isIE && ieVersion < 9) ? document.getElementsByTagName('head')[0] : document.head).appendChild(script);
            }, 5000);
        }
    }
    if ((document.referrer || "").indexOf("print.jatools.com") > -1) {
        (function () {
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?d741f9d5528ec69713548d20a69531cf";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();
    }
});
var ua = window.navigator.userAgent;
var isIE = ua.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
var ieVersion = isIE ? document.documentMode : -1;
var ie89 = isIE && (ieVersion == 8 || ieVersion == 9);
var ie10before = isIE && ieVersion < 10;
var https = location.protocol === "https:";
var SSL = isIE && https && !JCP.NOSSL;
var PROTOCOL = SSL ? "https://" : "http://";
var PORT = SSL ? ":31443" : ":31227";
var LOCALhost = SSL ? "localhost" : "127.0.0.1";
var LOCALhostapi = LOCALhost + PORT;
var EXPORT_HOST = "www.morewis.com";
var newtabforpreview = false;
var jr = "";
var JSONparse =
    JSON.parse
    ||

    function (str) {
        if (str === "")
            str = '""';
        eval("jr=" + str + ";");
        return jr;
    };
var xhrs = [{
    xhr: window.XMLHttpRequest || null,
    type: 1
}, {
    xhr: window.XDomainRequest || null,
    type: 2
}, {
    xhr: window.ActiveXObject || null,
    type: 3,
    args: 'MSXML2.XMLHTTP.3.0'
}, {
    xhr: "",
    type: -1
}];
var currentxhrs = [{
    index: -1
}, {
    index: -1,
    exclude: 2
}];
function getXHR(api) {
    var current = currentxhrs[api ? 0 : 1];
    if (!current.xhr) {
        nextXHR(api);
    }
    return current.xhr;
}

function i18n(msg) {
    return msg;
}

function nextXHR(api) {
    var current = currentxhrs[api ? 0 : 1];
    for (current.index++; true; current.index++) {
        var xhr = xhrs[current.index];
        if (xhr.type == -1) {
            current.xhr = null;
            alert(i18n("ajax错误."));
            break;
        }
        if (xhr.xhr && xhr.type !== (xhr.exclude || -1)) {
            current.xhr = xhr;
            break;
        }
    }
}
var __jsonp__result__ = null;

function jsonp(url, callback) {
    var script = document.createElement('script');
    script.onload = function () {
        callback && callback(__jsonp__result__, 200);
        callback = null;
    };
    script.onerror = function () {
        callback && callback(null, 404);
        callback = null;
    };
    setTimeout(function () {
        callback && callback(null, 404);
        callback = null;
    }, 5000);
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32',
            'Win64', 'Windows', 'WinCE'
        ],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
        os = '_mac';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = '_ios';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "";
    } else if (/Android/.test(userAgent)) {
        os = '_android';
    } else if (!os && /Linux/.test(platform)) {
        os = '_linux';
    }
    return os;
}

function ajax_(url, data, callback, done) {
    var api = url.indexOf(LOCALhostapi) > -1;
    try {
        var x = null;
        var xhr = getXHR(api);
        if (xhr.args) {
            x = new xhr.xhr(xhr.args);
        } else {
            x = new xhr.xhr();
        }
        if (SSL && "withCredentials" in x) {
            x.withCredentials = true;
        }
        x.open(data ? 'POST' : 'GET', url, 1);
        if (xhr.type == 2) {
            x.timeout = 3000;
            x.onload = function () {
                done && done(x.responseText, 200);
            }
            x.ontimeout = function () {
                callback && callback(data, x.responseText, 404);
            };
            x.onerror = function () {
                callback && callback(data, x.responseText, 404);
            };
            x.onprogress = function () { }
            x.send(data)
        } else {
            x.onreadystatechange = function () {
                try {
                    x.readyState > 3 && done && done(x.responseText, x.status);
                } catch (e) {
                    e.internal = true;
                    throw e;
                }
            };
            x.send(data)
        }
    } catch (e) {
        if (!e.internal) {
            nextXHR(api);
            ajax_(url, data || null, callback || null, done || null);
        }
    }
};
JCP.lic = null;
function getlic(callback, host) {
    if (JCP.lic == null && JCP.licenseURL) {
        if (window.location.hostname == '127.0.0.1') {
            JCP.lic = {};
            callback();
            return;
        }
        var url = PROTOCOL + (host || LOCALhost) + PORT + "/api?type=salt";
        var saltcallback = function (res, status) {
            if (status == 200) {
                var salt = res.split(":");
                var url = JCP.licenseURL;
                if (JCP.licenseURL.indexOf("!") == 0) {
                    url = url.substring(1);
                } else {
                    url = getAbsoluteUrl(url);
                }
                url = url + "?salt=" + salt[0];
                ajax_(url, null, null, function (res, status) {
                    if (status == 200) {
                        try {
                            res = JSONparse(res || "{}") || {};
                            if (res["digest"]) {
                                if (salt[1]) {
                                    res["salted"] = parseInt(salt[1]);
                                }
                                res["salt"] = salt[0];
                                JCP.lastlic = JCP.lic = res;
                            }
                        } catch (e) { }
                    }
                    callback();
                });
            } else
                callback(status);
        };
        if (https && isIE) {
            url += "&jsonp=1";
            jsonp(url, saltcallback);
        } else
            ajax_(url, null, saltcallback, saltcallback);
    } else {
        callback();
    }
}

function Jcp(ip, forward, password, test_token) {
    function log(e) {
    }

    function ajax(url, data, callback, result) {
        try {
            if (data && typeof (data) === 'object') {
                data.tab = tab_id || "";
                data = JSONstringify(data);
            }
            ajax_(url, data || null, callback || null, function (res, status) {
                var data = JSONparse(res || "{}");
                if (result) {
                    data = typeof (data.result) == "undefined" ? "" : data.result;
                }
                callback && callback(data, res, status);
            });
        } catch (e) {
            log(e);
        }
    };
    function ___(doc, id) {
        return doc.getElementById(id);
    }

    function ___getCSS(d) {
        var b = "";
        var e = d.styleSheets;
        for (var g = 0; g < e.length; g++) {
            var h = e[g];
            try {
                var c = h.cssRules;
                if (c) {
                    for (var a = 0; a < c.length; a++) {
                        b += c[a].cssText || ""
                    }
                } else {
                    if (h.cssText) {
                        b += h.cssText
                    }
                }
            } catch (f) { }
        }
        return (b + "").replace(/[\s]*\n/gm, "");
    }

    function ___outerHTML(doc, node, ins) {
        if (doc.doctype)
            node.setAttribute('_strict', 'true');
        return node.outerHTML || (function (n) {
            var div = doc.createElement('div'),
                h;
            div.appendChild(n.cloneNode(true));
            h = div.innerHTML;
            div = null;
            return h;
        })(node);
    }
    var thisdone;

    function ___getDocumentItem(doc, myDoc) {
        var ins = myDoc.inputs || false;
        if (typeof (doc.getElementById) != 'undefined') {
            if (ins) {
                var noframecheck = ins["no-frame-check"] || false;
                var inps = doc.getElementsByTagName("input");
                for (var i = 0; i < inps.length; i++) {
                    var inp = inps[i];
                    if (inp.type == 'checkbox' || inp.type == 'radio') {
                        if (inp.checked) {
                            inp.setAttribute("checked", inp.checked);
                        } else {
                            inp.removeAttribute("checked");
                        }
                    } else {
                        inp.setAttribute("value", inp.value);
                    }
                }
                inps = doc.getElementsByTagName("textarea");
                for (var i = 0; i < inps.length; i++) {
                    var inp = inps[i];
                    inp.innerHTML = inp.value.replace('\n', '&#13;&#10;');
                }
                inps = doc.getElementsByTagName("select");
                for (var i = 0; i < inps.length; i++) {
                    var inp = inps[i];
                    inp.setAttribute("text", inp.options[inp.selectedIndex].text);
                }
            }
            var html = '';
            var result = {
                style: myDoc["importStyle"] || ___getCSS(doc)
            };
            if (myDoc.pages) {
                for (var i = 0; i < myDoc.pages.length; i++) {
                    var page = myDoc.pages[i];
                    if (typeof (page.substring) != 'undefined') {
                        page = ___(doc, page);
                    }
                    html += ("<div id='page" + (i + 1) + "'>" + ___outerHTML(doc, page, ins) + "</div>");
                }
            } else {
                if (myDoc.jobPages) {
                    if (!myDoc.jobBase) {
                        myDoc.jobBase = 0;
                        thisdone = myDoc.done || null;
                        var i = 0;
                        while (true) {
                            var page = ___(doc, (myDoc.pagePrefix || '') + 'page' + (i + 1));
                            if (!page)
                                break;
                            i++;
                        }
                        myDoc.totalPages = i;
                    }
                    for (var i = 0; i < myDoc.jobPages; i++) {
                        var page = ___(doc, (myDoc.pagePrefix || '') + 'page' + (i + myDoc.jobBase + 1));
                        if (!page)
                            break;
                        html += ___outerHTML(doc, page, ins);
                    }
                    if (myDoc.done) {
                        myDoc.done = function () {
                            var page = ___(doc, (myDoc.pagePrefix || '') + 'page' + (i + myDoc.jobBase + 1));
                            if (!page && thisdone) {
                                thisdone();
                            } else {
                                myDoc.jobBase = myDoc.jobBase + myDoc.jobPages;
                                myDoc.documents = document;
                                self.print(myDoc, false);
                            }
                        }
                    }
                } else {
                    var i = 0;
                    while (true) {
                        var page = ___(doc, (myDoc.pagePrefix || '') + 'page' + (i + 1));
                        if (!page)
                            break;
                        html += ___outerHTML(doc, page, ins);
                        i++;
                    }
                    result.valid = true;
                }
            }
            if (ins)
                result.inputs = html;
            else {
                result.pages = html;
            }
            return result;
        }
        else
            return doc;
    }

    function ___myDoc(myDoc) {
        myDoc.documents = ___getPrintedHTML(myDoc);
        if (myDoc.footer && myDoc.footer.html.innerHTML) {
            __inlineStyle(myDoc.footer.html);
            myDoc.footer.html = myDoc.footer.html.innerHTML;
        }
        if (myDoc.header && myDoc.header.html.innerHTML) {
            __inlineStyle(myDoc.header.html);
            myDoc.header.html = myDoc.header.html.innerHTML;
        }
        if (myDoc.rotatex) {
            myDoc.xuc = 'edge';
            myDoc.styles = document.getElementById("rotatex").innerText;
        }
        return myDoc;
    }

    function ___loadDocuments(myDoc, callback) {
        var docs = myDoc.documents;
        var isurl = false;
        if (docs.substring) {
            isurl = true;
            docs = [docs];
        }
        var needs = 0;
        var wrapper = document.getElementById("_jp_wrapper");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-3000px';
            wrapper.style.width = '2500px';
            wrapper.id = '_jp_wrapper';
            document.body.appendChild(wrapper);
        } else
            wrapper.innerHTML = '';
        var loaded = function () {
            if (true || (event.srcElement.readyState || '') == "complete") {
                docs[event.srcElement.ownerIndex] = event.srcElement.contentWindow.document;
                needs--;
                if (needs == 0) {
                    if (isurl) {
                        myDoc.documents = docs[0];
                    }
                    callback();
                }
            }
        }
        if (typeof (docs.push) != 'undefined') {
            for (var i = 0; i < docs.length; i++) {
                if (docs[i].substring) {
                    needs++;
                    var frame = document.createElement("iframe");
                    frame.ownerIndex = i;
                    if (frame.attachEvent) {
                        frame.attachEvent("onload", loaded);
                    } else {
                        frame.onload = loaded;
                    }
                    frame.src = docs[i];
                    wrapper.appendChild(frame);
                }
            }
        } else {
            if (isurl) {
                myDoc.documents = docs[0];
            }
            callback();
        }
    }

    function __inlineStyle(target) {
        var properties = ['border', 'border-radius', 'box-shadow', 'height', 'margin', 'padding', 'width2', 'max-width', 'min-width', 'border-collapse', 'border-spacing',
            'caption-side', 'empty-cells', 'table-layout', 'direction', 'font', 'font-family', 'font-style', 'font-variant', 'font-size', 'font-weight', 'letter-spacing',
            'line-height', 'text-align', 'text-decoration', 'text-indent', 'text-overflow', 'text-shadow', 'text-transform', 'white-space', 'word-spacing', 'word-wrap',
            'vertical-align', 'color', 'background', 'background-color', 'background-image', 'background-position', 'background-repeat', 'Opacity', 'bottom', 'clear', 'clip',
            'cursor', 'display', 'float', 'left', 'opacity', 'outline ', 'overflow', 'position', 'resize ', 'right', 'top', 'visibility', 'z-index', 'list-style-image',
            'list-style-position', 'list-style-type'
        ];
        var elements = target.getElementsByTagName('*');
        for (var e = 0; e < elements.length; e++) {
            var el = elements.item(e);
            if (el.tagName == 'IMG') {
                el.src = el.src;
            }
            var thisProps = (el.getAttribute("style") || '').split(";");
            for (var p = 0; p < properties.length; p++) {
                var thisProp = properties[p];
                var thisValue = null;
                if (el.currentStyle) {
                    thisValue = el.currentStyle[thisProp];
                } else if (window.getComputedStyle) {
                    if (window.getComputedStyle.getPropertyValue) {
                        thisValue = window.getComputedStyle(el, null).getPropertyValue(thisProp)
                    } else {
                        thisValue = window.getComputedStyle(el)[thisProp]
                    };
                }
                if (thisValue) {
                    el.style[thisProp] = thisValue;
                }
            }
        }
    };

    function ___getPrintedHTML(myDoc) {
        var docs = myDoc.documents,
            result = null;
        if (typeof (docs.push) != 'undefined') {
            result = [];
            for (var i = 0; i < docs.length; i++) {
                result.push(___getDocumentItem(docs[i], myDoc));
            }
            return result;
        } else {
            return ___getDocumentItem(docs, myDoc);
        }
    }

    function ___getDocumentHTML(target) {
        var result = "<html><head><style>" + ___getCSS(target.ownerDocument) + "</style></head><body>" + ___outerHTML(target.ownerDocument, target) + '</body></html>';
        return result;
    }
    var lut = [];
    for (var i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }

    function e7() {
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] +
            lut[d1 >> 24 & 0xff] + '-' + lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] +
            lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    }

    function empty(json) {
        for (p in json) {
            return false;
        }
        return true;
    }

    function registerMyDocListeners(myDoc) {
        var events = ["done", "onState", "listener", "onPagePrinted"];
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (myDoc[e]) {
                myDoc[e] = registerCallback(myDoc[e], false, i > 0);
                myDoc._hasCallback = true;
            }
        }
        if (myDoc.dragDesigner && myDoc.dragDesigner.ok) {
            myDoc.dragDesigner.ok = registerCallback(myDoc.dragDesigner.ok);
            myDoc._hasCallback = true;
        }
    }
    var common_url;
    var private_url;
    var apiurl = PROTOCOL + ip + PORT + "/api?";
    var urls = [];
    urls[3] = PROTOCOL + ip + ":31227/api?type=service&";
    urls[4] = PROTOCOL + ip + ":31227/api?type=admin&";
    urls["new"] = apiurl + "type=NEW&";
    var callbacks = {};
    var eventIndex = 0;
    var tab_id;
    var pulling;
    var pushing;

    function tick() {
        !pushing && setTimeout(function () {
            ajax(urls[1] + 'type=TICK&', {}, function (data, text, status) {
                if (status != 200 || data["api-error"]) {
                    on = false;
                    return;
                }
                tick();
            });
        }, 30000);
    }

    function pull() {
        pulling = true;
        ajax(urls[1] + 'type=PULL&', {}, function (data, text, status) {
            if (status != 200 || data["api-error"]) {
                on = false;
                return;
            }
            try {
                if (data.event) {
                    if (data.string_args) {
                        data.params = JSONparse(data.string_args);
                    }
                    callbacks[data.event].apply(null, data.params || [data.data])
                    if (data.event.indexOf("fixed") != 0) {
                        delete callbacks[data.event];
                    }
                }
            } catch (e) {

                console.log(e);

            }
            if (empty(callbacks)) {
                pulling = false;
            } else {
                pull();
            }
        });
    }
    var on = false;
    var downloading = false;
    var cachedlic = null;
    var delays = [];
    var juststart = false;
    function newtab(getsaltresult, al, success) {
        var newdata = {
            method: "new",
            version: 2,
            jsid: jsid2,
            lic: cachedlic || JCP.lic || {},
            base: document.URL,
            test_token: test_token
        };
        cachedlic = null;
        if (al) {
            newdata.cl = "1";
        }
        if (test_token) {
            newdata.lic["test_token"] = test_token.split("@")[0];
        }
        var forw = ""
        if (forward) {
            newdata.password = password;
            forw = "forward=" + forward + "&";
        }
        var newcallback = function (data, r, status) {
            if (status != 200) {
                JCP.lic = null;
                var error = i18n('摩尔云打印客户端未安装或未运行.');
                if (!opts.silent) {
                    if (ip !== LOCALhost) {
                        alert(error = i18n("无法连接 JCP 站：") + ip);
                        return log(error);
                    }
                    if (JCP.setup) {
                        if (JCP.setup.noSetupHandle) {
                            JCP.setup.noSetupHandle();
                        } else if (!downloading) {
                            if (JCP.setup.noSetupMessage)
                                error = JCP.setup.noSetupMessage;
                            scmAlert(error, { status: 3 });
                            var down = "download" + getOS();
                            if (JCP.setup[down]) {
                                // 1.3 zh downloading = true;
                                document.location.href = JCP.setup[down];
                                juststart = true;
                                var checkverion = function () {
                                    ajax(PROTOCOL + ip + PORT + "/api?type=service", {
                                        method: "getVersion"
                                    }, function (data, r, status) {
                                        if (data.result) {
                                            login(null);
                                        } else
                                            setTimeout(checkverion, 3000);
                                    });
                                }
                                setTimeout(checkverion, 10000);
                            }
                        }
                    } else
                        alert(error);
                }
                return log(error);
            } else {
                if (success) {
                    success();
                    return;
                }
                if (JCP.lic) {
                    JCP.lic = "";
                }
                if (data["api-result"]) {
                    on = true;
                    tab_id = data["api-result"];
                    urls[0] = apiurl + "tab=" + tab_id + "&use=common" + "&" + forw;
                    urls[1] = apiurl + "tab=" + tab_id + "&" + forw;
                    urls[2] = apiurl + "type=UPDATE&";
                    urls[3] = apiurl + "type=service&";
                    self.tab = tab_id;
                    tick();
                    pull();
                    if (JCP.setup.version && JCP.setup.version != data["version"]) {
                        newtabforpreview = true;
                        if (JCP.lastlic) {
                            cachedlic = JCP.lastlic;
                            cachedlic.resalt = true;
                        }
                        var checkverion = function () {
                            ajax(urls[3], {
                                method: "getVersion"
                            }, function (data, r, status) {
                                if (data.result != JCP.setup.version) {
                                    setTimeout(checkverion, 3000);
                                } else {
                                    login(null);
                                }
                            });
                        }
                        getJCP().update(JCP.setup.download, JCP.setup.version);
                        setTimeout(checkverion, 3000);
                    } else {
                        for (var i = 0; i < delays.length; i++) {
                            delays[i]();
                        }
                        juststart = false;
                    }
                } else {
                    delays.length = 0;
                    alert(data["api-error"]);
                    return log(data["api-error"]);
                }
            }
        }
        if (getsaltresult == 404) {
            newcallback({}, 404)
        } else {
            ajax(urls["new"] + forw, newdata, newcallback);
        }
    }

    function login(callback) {
        if (pushing) {
            delays.length = 0;
        }
        callback && delays.push(callback);
        // 1.3 zh 取消只有第一次点击时才提示未安装插件
        // delays.length == 1 || 
        if (delays.length || !callback) {
            if (!JCP.lic && !pushing) {
                getlic(function (status) {
                    newtab(status);
                }, ip);
            } else {
                newtab();
            }
        }
    }

    function registerCallback(callback, json, fixed) {
        if (callback) {
            var index = fixed ? "fixed" : "event-" + eventIndex++;
            callbacks[index] = !json ? callback : function (result) {
                result = eval("(" + result + ")");
                callback(result);
            };
            return tab_id + ":" + index;
        } else
            return "";
    }
    var delays2 = [];

    function _call(callback) {
        if (ie10before && https) {
            alert(i18n("HTTPS 打印时，摩尔云打印客户端不支持版本 10.0 以前的 IE 浏览器."));
            return;
        }
        if (!on) {
            login(callback);
        } else {
            callback && delays.push(callback);
            callback();
        }
    }
    function messagecallback(data, text, status) {
        if (status != 200 || data["api-error"]) {
            if (status == 200 && (data["api-error"] == 1003 || data["api-error"] == 'NO_LICENSED_HOST')) {
                var ec = data["ec"] || 0;
                if (ec == 3)
                    alert(i18n("受限版本，不支持当前浏览器."));
                else if (ec == 4) {
                    alert(i18n("不要以本地文件方式打开页面，请以 HTTP 或 HTTPS 方式打开（即通过web服务器）."));
                } else if (ec == 6) {
                    alert("This JCP supports chinese simplified OS only.");
                } else if (ec == 7) {
                    alert(i18n("引入了不正确的 jcp.js."));
                }
                else if (ec == 500)
                    alert(i18n("未经绑定的主机：") + data["host"]);
                else if (ec == 501) {
                    if (JCP.lastlic && data["host"].indexOf("jatools.com") > -1) {
                        alert(i18n("当前JCP不能查看在线演示，请从 http://print.jatools.com 下载新版本 ."));
                    } else
                        alert(i18n("证书服务配置异常"));
                } else if (ec == 502) {
                    alert(i18n("本版本为试用版，在 127.0.0.1上试用到期，购买请联系手机: (0)18969037811 ."));
                } else if (ec == 503) {
                    alert(i18n("授权到期, ") + data["host"]);
                } else if (ec == 504) {
                    alert(i18n("无效的域名设置, ") + data["host"]);
                } else if (ec == 505) {
                    alert(i18n("本版本为试用版，不支持在 ") + data["host"] + i18n(" 上试用，请在 127.0.0.1 上试用"));
                } else if (ec == 506 || ec == 507) {
                    alert(i18n("服务器节点错误, ") + ec);
                } else if (ec == 901) {
                    if (confirm(i18n("当前安装的是JCP免费版, 与本页面不兼容，是否安装试用版?"))) {
                        ajax_("http://127.0.0.1:31227/api?type=exit", null, null, null);
                        document.location.href = JCP.setup.download;
                        var checkverion = function () {
                            ajax(PROTOCOL + ip + PORT + "/api?type=service&", {
                                method: "getVersion"
                            }, function (data, r, status) {
                                if (data.result) {
                                    login(null);
                                } else
                                    setTimeout(checkverion, 3000);
                            });
                        }
                        setTimeout(checkverion, 10000);
                    }
                }
                callbacks = {};
                TOKEN = "";
            } else if (status == 200 && data["api-error"]) {
                alert(i18n("错误:") + data["api-error"]);
            }
            on = false;
            return;
        }
    }

    function send_message(target, param, data) {
        (!pulling) && pull();
        ajax(urls[target] + (param || ''), data, messagecallback);
    }
    var new_ = true;
    var opts = {};
    var self = null;
    return ((self = {
        "initialize": function () {
            return this;
        },
        "options": function (o) {
            if (o) {
                opts = o;
                return this;
            } else {
                return opts;
            }
        },
        "print": function (myDoc, prompt, params) {
            _call(function () {
                if (!myDoc.keepURL) {
                    ___loadDocuments(myDoc, function () {
                        myDoc = ___myDoc(myDoc);
                        registerMyDocListeners(myDoc);
                        send_message(1, params || null, {
                            method: "print",
                            params: [myDoc, prompt ? true : false]
                        });
                    });
                } else {
                    registerMyDocListeners(myDoc);
                    send_message(1, null, {
                        method: "print",
                        params: [myDoc, prompt ? true : false]
                    });
                }
            })
        },

        "printPreview": function (myDoc, prompt, params) {
            _call(function () {
                myDoc.keepURL = false;
                if (!myDoc.keepURL) {
                    ___loadDocuments(myDoc, function () {
                        myDoc = ___myDoc(myDoc);
                        registerMyDocListeners(myDoc);
                        if (juststart) {
                            myDoc.justStart = true;
                        }
                        send_message(1, params || null, {
                            method: "printPreview",
                            params: [myDoc, prompt ? true : false]
                        });
                    });
                    if (newtabforpreview) {
                        _jcps = {};
                        newtabforpreview = false;
                    }
                } else {
                    registerMyDocListeners(myDoc);
                    if (juststart) {
                        myDoc.justStart = true;
                    }
                    send_message(1, null, {
                        method: "printPreview",
                        params: [myDoc, prompt ? true : false]
                    });
                }
            })
        },

        "getVersion": function (callback) {
            _call(function () {
                send_message(0, "tq=1&", {
                    method: "getVersion",
                    event: registerCallback(callback)
                });
            })
        },
        "getDefaultPrinter": function (callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getDefaultPrinter",
                    event: registerCallback(callback)
                });
            })
        },
        "getPrinterCapability": function (printer, cap, callback) {
            var callback2 = function (result) {
                result = eval("(" + result + ")");
                callback(result.result);
            }
            _call(function () {
                send_message(0, null, {
                    method: "getPrinterCapability",
                    params: [printer, cap],
                    event: registerCallback(callback2)
                });
            })
        },
        "about": function () {
            _call(function () {
                send_message(1, "tq=1&", {
                    method: "about"
                });
            })
        },
        "exit": function () {
            _call(function () {
                send_message(1, null, {
                    method: "exit"
                });
            })
        },
        "emptyCallback": function () { },
        "getPrinters": function (callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getPrinters",
                    event: registerCallback(callback)
                });
            })
        },
        "getPrinterJobs": function (printer, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getPrinterJobs",
                    params: [printer],
                    event: registerCallback(callback)
                });
            })
        },
        "isPrinterError": function (printer, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "isPrinterError",
                    params: [printer],
                    event: registerCallback(callback)
                });
            })
        },
        "getPapers": function (printer, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getPapers",
                    params: [printer],
                    event: registerCallback(callback)
                });
            })
        },

        "isCustomPaperSupported": function (printer, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "isCustomPaperSupported",
                    params: [printer],
                    event: registerCallback(callback)
                });
            })
        },
        "addPaper": function (printer, name, width, height, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "addPaper",
                    params: [printer, name, width, height],
                    event: registerCallback(callback)
                });
            })
        },
        "isImplemented": function (method, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "isImplemented",
                    params: [method],
                    event: registerCallback(callback)
                });
            })
        },

        "isInstalled": function (filetype, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "isInstalled",
                    params: [filetype],
                    event: registerCallback(callback)
                });
            })
        },
        "setDragCSS": function (settingid, styles, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "setDragCSS",
                    params: [settingid, styles],
                    event: registerCallback(callback)
                });
            })
        },
        "clearSettings": function (settingid, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "clearSettings",
                    params: [settingid],
                    event: registerCallback(callback)
                });
            })
        },
        "getSettingsIds": function (callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getSettingsIds",
                    event: registerCallback(callback, true)
                });
            })
        },
        "setupNormalOffset": function (settingid, callback) {
            _call(function () {
                send_message(1, null, {
                    method: "setupNormalOffset",
                    params: [settingid],
                    event: registerCallback(callback)
                });
            })
        },

        "download": function (url, file, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "download",
                    params: [url, file],
                    event: registerCallback(callback)
                });
            })
        },

        "configUpdate": function (config, updateNow, callback) {
            _call(function () {
                send_message(2, null, {
                    method: "configUpdate",
                    params: [config, updateNow],
                    event: registerCallback(callback)
                });
            })
        },
        "update": function (url, version, callback) {
            _call(function () {
                send_message(2, null, {
                    method: "update",
                    params: [url, version],
                    event: registerCallback(callback)
                });
            })
        },
        "getFonts": function (callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getFonts",
                    event: registerCallback(callback)
                });
            })
        },
        "copy": function (data, format, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "copy",
                    params: [data, format],
                    event: registerCallback(callback)
                });
            })
        },
        "copied": function (format, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "copied",
                    params: [format],
                    event: registerCallback(callback)
                });
            })
        },
        "writeString": function (file, encode, data, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "writeString",
                    params: [file, encode, data],
                    event: registerCallback(callback)
                });
            })
        },
        "writeBase64": function (file, data, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "writeBase64",
                    params: [file, data],
                    event: registerCallback(callback)
                });
            })
        },
        "readString": function (file, encode, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "readString",
                    params: [file, encode],
                    event: registerCallback(callback)
                });
            })
        },
        "readBase64": function (file, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "readBase64",
                    params: [file],
                    event: registerCallback(callback)
                });
            })
        },
        "readHTML": function (file, defencode, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "readHTML",
                    params: [file, defencode],
                    event: registerCallback(callback)
                });
            })
        },
        "chooseFile": function (ext, defext, saveselect, callback) {
            _call(function () {
                send_message(1, null, {
                    method: "chooseFile",
                    params: [ext, defext, saveselect],
                    event: registerCallback(callback)
                });
            })
        },
        "showPageSetupDialog": function (callback) {
            var callback2 = function (result) {
                callback(result ? eval("(" + result + ")") : null);
            }
            _call(function () {
                send_message(0, null, {
                    method: "showPageSetupDialog",
                    event: registerCallback(callback2)
                });
            })
        },
        "getLastSettings": function (settingid, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getLastSettings",
                    params: [settingid],
                    event: registerCallback(callback)
                });
            })
        },
        "getAbsoluteURL": function (relative, base, callback) {
            var stack = base.split("/"),
                parts = relative.split("/");
            stack.pop();
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] == ".")
                    continue;
                if (parts[i] == "..")
                    stack.pop();
                else
                    stack.push(parts[i]);
            }
            (callback || this.nothing).call(this, stack.join("/"));
        },
        "setLastSettings": function (settingid, doc, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "setLastSettings",
                    params: [settingid, doc],
                    event: registerCallback(callback)
                });
            })
        },
        "setDefaultPrinter": function (printer, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "setDefaultPrinter",
                    params: [printer],
                    event: registerCallback(callback)
                });
            })
        },
        "openFile": function (file, callback) {
            _call(function () {
                send_message(1, null, {
                    method: "openFile",
                    params: [file],
                    event: registerCallback(callback)
                });
            })
        },
        "getPrinterInfo": function (printer, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getPrinterInfo",
                    params: [printer],
                    event: registerCallback(callback)
                });
            })
        },
        "showHTMLDialog": function (url, width, height, resizable) {
            _call(function () {
                var options = [];
                if (width)
                    options.push("dialogWidth:" + width);
                if (height)
                    options.push("dialogHeight:" + height);
                if (!resizable)
                    options.push("resizable:yes");
                send_message(1, null, {
                    method: "showHTMLDialog",
                    params: [0, url, options.join(";")]
                });
            })
        },
        "getPrinterStatus": function (printer, as_number, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "getPrinterStatus",
                    params: [printer, as_number],
                    event: registerCallback(callback)
                });
            })
        },
        "nothing": function () { },
        "setPrintBackground": function (back, callback) {
            _call(function () {
                send_message(0, null, {
                    method: "setPrintBackground",
                    params: [back],
                    event: registerCallback(callback)
                });
            })
        },
        "getMessage": function (callback) {
            _call(function () {
                callbacks["fixed-message"] = function (result) {
                    result = eval("(" + result + ")");
                    callback(result);
                };
                send_message(3, null, {
                    method: "getMessage"
                });
            });
        },
        "postMessage": function (tab, data) {
            _call(function () {
                data = JSON.stringify({
                    "event": "fixed-message",
                    "data": data
                });
                send_message(3, null, {
                    method: "postMessage",
                    params: [tab, data]
                });
            });
        },


        "dx": function (data, callback) {
            _call(function () {
                ajax(urls[3], {
                    method: "dx",
                    data: data
                }, callback, true);
            });
        }
    })).initialize();
};
var _jcps = {};

function getJCP(ip, forward, password) {
    var test_token = null;
    if (ip != null && typeof ip == 'object') {
        test_token = ip["test_token"] || '';
        ip = null;
    }
    ip = ip || LOCALhost;
    var id = ip + (forward || "");
    if (!_jcps[id]) {
        _jcps[id] = new Jcp(ip, forward || "", password || "", test_token || '');
    }
    return _jcps[id];
}

function jpExit() {
    getJP().exit()
}
var JSONstringify = JSON.stringify || (function () {
    "use strict";
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        return n < 10 ? "0" + n : n;
    }

    function this_value() {
        return this.valueOf();
    }
    if (typeof Date.prototype.toJSON !== "function") {
        Date.prototype.toJSON = function () {
            return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" +
                f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null;
        };
        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }
    var gap;
    var indent;
    var meta;
    var rep;

    function quote(string) {
        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string) ? "\"" + string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + "\"" : "\"" + string + "\"";
    }

    function str(key, holder) {
        var i;
        var k;
        var v;
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];
        if (value && typeof value === "object" && typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }
        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
            case "string":
                return quote(value);
            case "number":
                return isFinite(value) ? String(value) : "null";
            case "boolean":
            case "null":
                return String(value);
            case "object":
                if (!value) {
                    return "null";
                }
                gap += indent;
                partial = [];
                if (Object.prototype.toString.apply(value) === "[object Array]") {
                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || "null";
                    }
                    v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                    gap = mind;
                    return v;
                }
                if (rep && typeof rep === "object") {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === "string") {
                            k = rep[i];
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ": " : ":") + v);
                            }
                        }
                    }
                } else {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ": " : ":") + v);
                            }
                        }
                    }
                }
                v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
                gap = mind;
                return v;
        }
    }
    if (typeof JSON.stringify !== "function") {
        meta = {
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {
            var i;
            gap = "";
            indent = "";
            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }
            } else if (typeof space === "string") {
                indent = space;
            }
            rep = replacer;
            if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }
            return str("", {
                "": value
            });
        };
    }
    return JSON.stringify;
}());
var tmpa;

function getAbsoluteUrl(url, absallowed) {
    if (url.indexOf("//") > -1) {
        return absallowed ? url : "";
    }
    if (!tmpa)
        tmpa = document.createElement('a');
    tmpa.href = url;
    return tmpa.href;
}
var LOADING = null;

function showLoading(by) {
    if (!LOADING) {
        LOADING = document.createElement("img");
        LOADING.src = "http://print.jatools.com/jcp/0.99/image/loading1.gif";
        LOADING.style.verticalAlign = "middle";
    }
    LOADING.style.display = "inline";
    var sitby = document.getElementById(by);
    sitby.parentNode.insertBefore(LOADING, sitby.nextSibling);
}

function hideLoading() {
    if (LOADING) {
        LOADING.style.display = "none";
    }
}