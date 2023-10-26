<%@page import="com.more.fw.core.common.method.StringUtilsMc"%>
<%@page import="com.more.fw.core.common.method.CommMethodMc"%>
<%@page import="com.more.fw.core.common.method.ConstantsMc"%>
<%@page import="com.more.fw.core.staticresource.PlfStaticRes"%>
<%@page language="java" errorPage="/plf/error.jsp" pageEncoding="UTF-8"	contentType="text/html;charset=UTF-8"%>
<%@ include file="/plf/common/pub_tag.jsp"%>
<%@ taglib prefix="s" uri="/plf/tld/struts-tags.tld"%>
<%@ taglib prefix="dict" uri="/plf/tld/ldg-dict-tags.tld"%>
<html>

<head>
	<meta http-equiv="Content-Type" content="text/html; charset= UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=10;" />
    <META HTTP-EQUIV="PRAGMA" CONTENT="NO-CACHE">
    <META HTTP-EQUIV="Expires" CONTENT="-1">
    <title><dict:lang value="打印" /></title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style id="layout-style"></style>
    <link rel="stylesheet" href="${path}buss/reso/wisprint/css/d.css?x=4">
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/jqueryui-ruler/css/jquery.ui.ruler.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/jquery/jquery-ui-1.9.2.min.css">
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/bootstrap/css/bootstrap-theme.min.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/bootstrap3-dialog/css/bootstrap-dialog.min.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/bootstrap-select/css/bootstrap-select.min.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/layui/src/css/layui.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/datatable/datatables.min.css" />
    <link rel="stylesheet" href="${path}buss/reso/wisprint/js/spectrum/spectrum.min.css">
    <link rel="stylesheet" href="${path}buss/reso/wisprint/css/morewis-css/iconfont.css?version=2.4.1">
    <link rel="stylesheet" href="${path}buss/reso/wisprint/css/morewis-css/alert.css?version=2.4.3">
    <link rel="stylesheet" href="${path}buss/reso/tinymes/css/animate.min.css">
    <link rel="stylesheet" href="${path}buss/reso/tinymes/css/component-1.1.0.css">
    <!--DEBUG-->
    <script src="${path}buss/reso/wisprint/js/jquery/jquery-1.9.js?version=2.4.1"></script>
    <script src='${path}buss/reso/wisprint/js/common.js?version=2.0.1'></script>
	<script src='${path}buss/reso/tinymes/js/common.js?version=2.0.1.6'></script>
    <script src='${path}buss/reso/wisprint/js/jcp.js?version=1.4.1'></script>
	<script src='${path}buss/reso/wisprint/js/morewis-js/invoices-field.js?version=2.7.23'></script>
    <script>
        JCP.licenseURL = "${path}buss/reso/wisprint/service/lic.jsp";
    </script>



    <!--/DEBUG-->
    <script>
		const mcPath = '${path}';
		const portAddress = mcPath + 'buss/bussModel_exeFunc.ms?funcMId=';
    	// 1产品 2设备 3模具 4生产工单 5采购单 6销售单 7出库单 8入库单 9申购单
        const tmpType = getQueryVariable('type');
        // 用户id
        const mcUserId = getQueryVariable('mcUserId');
        // 组织机构id
        const mcDataAuthId = getQueryVariable('mcDataAuthId');
        // 分类id
        const classId = getQueryVariable('classId');
        // 是否为标签模板
        const isLabelTmp = false; // tmpType === '1' || tmpType === '5';
        // 是否为自定义模板
        const isCustomize = false; // tmpType === '5';
        // 当前是修改还是新增
        var hasEdit = !!getQueryVariable('tid');
        const tmpId = getQueryVariable('tid') || uuid();
     	// 自定义数据项
        var customList = [];
     	// 全局配置
        var globalSetting = {
        	// 批次号格式
        	batchCodeFormat: '',
        	// 批次号是否必填
        	isBatchCodeRequired: false,
        	// 生产日期是否必填
        	isProductionDateRequired: false
        }
        var Global = {
            "request": {
            	how: 'new'
            },
            "config": {
            	"upload-max-size": 2097152,
                "upload-max-size-error": '上传文件太大，文件最大不超过 2M',
                "defaults": {"style":".jp-label,.jp-text,.jp-table{font-family:微软雅黑;font-size:12px;} .jp-table *{box-sizing:border-box;}","paper":{"paperWidth":700,"paperHeight":1400}},
                "default-style": ".jp-label,.jp-text,.jp-table{font-family:微软雅黑;font-size:12px;} .jp-table *{box-sizing:border-box;}"
            },
            "service": {
                "build-page-service": _GLO_ROOTPATH + "buss/bussModel_exeFunc.ms?funcMId=ad8066edad1f4137b4131834e3ebc2f0",//"service/buildPage.jsp",
                "upload-image-service": _GLO_ROOTPATH + "buss/bussModel_exeFunc.ms?funcMId=ad8066edad1f4137b4131834e3ebc2f0",// UploadImageServlet
                "report-service": "service/reportService.jsp",
                "DBSERVICE": "service/dbService.jsp?",
                "DBACTION": "../../db.action"
            },
            "editing": {
                "datasource": {"dataset":{"default":{},"factory":"com.jatools.mireport.SAASDatasetFactory","master":{"name":"发件人信息","path":"jatoolsdata/datasets/ems-master.json"},"detail":{"name":"收件人信息","path":"http://...//jatoolsdata/datasets/ems-detail.json"}},"ui":{"defaults":{"text-editable":true},"fields": FIELD_LIST[tmpType]}},
                // "report": ${report}
            }
        }
        // 模板修改时获取模板数据
        if (hasEdit) {
        	Global.request.how = 'edit';
            // var url = "/template/" + (isLabelTmp ? 'getList' : 'getTemplateDocument') + "?mcDataAuthId=" + mcDataAuthId + "&classId=" + classId + "&id=" + tmpId;
            var url = portAddress + '473690c13da34ebfb14c07a9a83981df';
            mesAjax({
                url: url,
                data: {
                	classId,
                	id: tmpId
                },
                async: false,
                success: function (data) {
                    const info = {};
                    for(const item in data.temp[0]) {
                    	info[item.toLowerCase()] = data.temp[0][item];
                    }
                    Global.editing.report = JSON.parse(info.template);
                    Global.editing.tmpName = info.labelname;
                    Global.editing.tmpInfo = info;
                    Global.editing.tmpInfo.customlist.forEach(v => {
                    	Global.editing.datasource.ui.fields.push({
                            "type": "text",
                            "field": v.customizeCol,
                            "demo": "自定义数据项",
                            "isCustomize": true
                        })
                    })
                },
                error: function (err) {
                    // ajaxErr(err);
                }
            })
            /*$.ajax({
                type: "post",
                // dataType: "json",
                // contentType: "application/json;charset=utf-8",
                async: false,
                data: {
                	classId,
                	id: tmpId
                },
                url: url,
                success: function (data) {
                    if (!data.data.error) {
                    	const { list, temp, isMap } = data.data;
                        Global.editing.report = JSON.parse(temp[0].TEMPLATE);
                        Global.editing.dataItem = list;
                        Global.editing.tmpName = temp[0].labelname;
                        Global.editing.tmpInfo = temp[0];
                        Global.editing.tmpInfo.outsideflag = Global.editing.tmpInfo.outsideflag || '0';
                        customList = Global.editing.tmpInfo.customList;
                        if(tmpType === '1') {
                        	// 类型转换
                            isMap.isBatchCodeRequired = +isMap.isBatchCodeRequired;
                            isMap.isProductionDateRequired = +isMap.isProductionDateRequired;
                            if([0, 1].indexOf(isMap.isBatchCodeRequired) === -1) isMap.isBatchCodeRequired = 0;
                            if([0, 1].indexOf(isMap.isProductionDateRequired) === -1) isMap.isProductionDateRequired = 0;
                            globalSetting = isMap;
                        }
                    } else {
                        scmAlert(data.message, {
                            status: '2'
                        });
                        console.error(data.code + ':' + data.message);
                    }
                },
                error: function (err) {
                    ajaxErr(err);
                }
            })*/
        }
    </script>
    <style>
        .jp-label,
        .jp-text,
        .jp-table {
            font-size: 12px;
        }

        .jp-component.no-padding {
            padding: 0 !important
        }

        .jp-component.no-rotate,
        .jp-table .jp-component {
            transform: none !important
        }

        .no-rotate .svg-selected {
            display: none
        }

        .ui-selected .svg-selected {
            display: block;
        }

        .no-selection .rotate-shadow,
        .no-rotate .rotate-shadow {
            display: none;
        }

        .rotate-shadow {
            position: absolute;
            pointer-events: none;
            z-index: 10000;
        }

        .rotate-shadow .handler {
            pointer-events: auto !important;
            background-image: url(${path}buss/reso/wisprint/images/rotate.svg);
            position: absolute;
            left: 50%;
            top: -15px;
            width: 10px;
            height: 10px;
            margin-left: -5px;
        }

        .range-field {
            position: relative
        }

        .range-field input[type="range"] {
            position: relative;
            width: 100%;
            padding: 0;
            margin: 15px 0;
            cursor: pointer;
            background-color: transparent;
            border: 0;
            border: 1px solid #fff;
            outline: 0;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none
        }

        .range-field input[type="range"]:focus {
            outline: 0
        }

        .range-field input[type="range"]+.thumb {
            position: absolute;
            top: 10px;
            width: 0;
            height: 0;
            background-color: #1266f1;
            border: 0;
            border-radius: 50%;
            -webkit-transform: rotate(-45deg);
            transform: rotate(-45deg);
            -webkit-transform-origin: 50% 50%;
            transform-origin: 50% 50%
        }

        .range-field input[type="range"]+.thumb .value {
            display: block;
            width: 30px;
            font-size: 0;
            color: #1266f1;
            text-align: center;
            -webkit-transform: rotate(45deg);
            transform: rotate(45deg)
        }

        .range-field input[type="range"]+.thumb.active {
            border-radius: 50% 50% 50% 0
        }

        .range-field input[type="range"]+.thumb.active .value {
            margin-top: 8px;
            margin-left: -1px;
            font-size: 10px;
            color: #fff
        }

        .range-field input[type="range"]::-webkit-slider-runnable-track {
            height: 3px;
            background: #c2c0c2;
            border: 0
        }

        .range-field input[type="range"]::-webkit-slider-thumb {
            width: 14px;
            height: 14px;
            margin: -5px 0 0 0;
            background-color: #1266f1;
            border: 0;
            border-radius: 50%;
            -webkit-transition: .3s;
            transition: .3s;
            -webkit-transform-origin: 50% 50%;
            transform-origin: 50% 50%;
            -webkit-appearance: none;
            appearance: none
        }

        .range-field input[type="range"]:focus::-webkit-slider-runnable-track {
            background: #ccc
        }

        .range-field input[type="range"]::-moz-range-track {
            height: 3px;
            background: #c2c0c2;
            border: 0
        }

        .range-field input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            margin-top: -5px;
            background: #1266f1;
            border: 0;
            border-radius: 50%
        }

        .range-field input[type="range"]:-moz-focusring {
            outline: 1px solid #fff;
            outline-offset: -1px
        }

        .range-field input[type="range"]:focus::-moz-range-track {
            background: #c2c0c2
        }

        .range-field input[type="range"]::-ms-track {
            height: 3px;
            color: transparent;
            background: transparent;
            border-color: transparent;
            border-width: 6px 0
        }

        .range-field input[type="range"]::-ms-fill-lower {
            background: #c2c0c2
        }

        .range-field input[type="range"]::-ms-fill-upper {
            background: #c2c0c2
        }

        .range-field input[type="range"]::-ms-thumb {
            width: 14px;
            height: 14px;
            background: #1266f1;
            border: 0;
            border-radius: 50%
        }

        .range-field input[type="range"]:focus::-ms-fill-lower {
            background: #c2c0c2
        }

        .range-field input[type="range"]:focus::-ms-fill-upper {
            background: #c2c0c2
        }

        tr.ex {
            opacity: 0.2;
            background-image: linear-gradient(45deg, rgba(0, 0, 0, 0.5) 25%,
                    transparent 25%, transparent 50%, rgba(0, 0, 0, 0.5) 50%,
                    rgba(0, 0, 0, 0.5) 75%, transparent 75%, transparent);
            background-size: 5px 5px;
        }

        .jp-table-detail-body:before,
        .jp-table-detail-body input {
            content: attr(rows);
            background-color: white;
            color: blue;
            font-size: 12px;
            top: 50%;
            margin-top: -6px;
            margin-left: -7px;
            padding: 0.1em 0.2em;
            border-radius: 3px;
            position: absolute;
        }

        .jp-table-detail-body input {
            width: 3em;
            margin-left: -2em;
        }

        .jp-table * {
            box-sizing: border-box;
        }

        .jp-inplace-editing p.jp-selected-layer,
        .cell-selected p.jp-selected-layer {
            display: none !important;
        }

        .jp-component-list-dlg .ui-dialog-titlebar-close {
            display: none;
        }

        .select-datasource-dialog .modal-dialog {
        	left: calc(50% - 250px);
            width: 500px;
        }

        .jp-inplace-editing {
            outline: solid orange 2px;
        }

        .fakeuploadbutton {
            background: red url('myuploadbutton.png') no-repeat top left;
            width: 100px;
            height: 30px;
        }

        html {
            overflow: hidden;
        }

        #file {
            position: absolute;
            top: 0px;
            left: 0px;
            width: 100px;
            height: 30px;
        }

        #jp-total-menu {
            z-index: 10000;
        }

        .jp-color-chooser .sp-palette-container {
            border-right: none
        }

        .jp-color-chooser .sp-picker-container {
            border-left: none
        }

        tbody1.jp-body-rows tr:first-child td:first-child,
        tbody.jp-body-rows tr:first-child,
        tbody.jp-body-rows,
        table {
            overflow: visible;
        }

        tbody1.jp-body-rows tr:first-child td:first-child span {
            position: relative;
            display: inline-block;
            height: 100%;
            background: url('./${path}buss/reso/wisprint/images/downoff.png') repeat-y;
            overflow: visible;
        }

        .jp-label {
            min-height: 1em;
            width: 10em;
        }

        .jp-shape {
            position: absolute
        }

        .jp-text {
            white-space: normal;
            overflow: hidden;
            position: absolute;
            /* border: solid 1px gray; */
            width: 150px;
            padding: 2px;
        }

        .jp-barcode .jatools-coder {
            width: 100%;
            height: 100%;
        }

        .jp-text-content {
            display: block;
            cursor: default;
            word-wrap: break-word;
            white-space: normal;
        }

        .jp-text,
        .jp-label {
            white-space: normal
        }

        tbody1.jp-body-rows tr:first-child td:first-child span:before {
            content: "";
            display: block;
            position: absolute;
            z-index: 100;
            top: 0;
            left: -20px;
            width: 20px;
            height: 100%;
            border-style: solid;
            border-width: 4px;
            border-color: #DDD;
        }

        html,
        body {
            width: 100%;
            height: 100%;
        }

        body {
            overflow: hidden;
            margin: 0;
            padding: 0;
        }

        .jp-main-tools .jp-button-set {
            display: none
        }

        body .ui-buttonset .ui-button {
            margin-right: -1px;
        }

        .jp-toolbar {
            height2: 74px;
            background: #eee;
            a: url(${path}buss/reso/wisprint/js/jquery/images/ui-bg_gloss-wave_55_5c9ccc_500x100.png) 0 50% repeat-x;
            padding: 4px;
        }

        .jp-content {
            background: #DEDCDE;
            /* zhouh */
            overflow: auto;
            border: inset 1px white;
            top: 38px;
        }

        a.ui-button {
            margin-right: 2px;
            float: left;
        }

        a.ui-spinner-button {
            margin-right: 0 !important;
        }

        .jp-toolbar span,
        .jp-toolbar-transparent span {
            background-position: 50% 50%;
            background-repeat: no-repeat;
        }

        span.ui-icon-triangle-1-s {
            background-position: -64px -16px !important;
        }

        .jp-bold span {
            background-image: url(${path}buss/reso/wisprint/images/edit-bold.png);
        }

        .jp-italic span {
            background-image: url(${path}buss/reso/wisprint/images/edit-italic.png);
        }

        .jp-underline span {
            background-image: url(${path}buss/reso/wisprint/images/edit-underline.png);
        }

        #jp-undo {
            background-image: url(${path}buss/reso/wisprint/images/undo.png);
        }

        #jp-redo {
            background-image: url(${path}buss/reso/wisprint/images/redo.png);
        }

        #jp-copy {
            background-image: url(${path}buss/reso/wisprint/images/copy.gif);
        }

        #jp-cut {
            background-image: url(${path}buss/reso/wisprint/images/cut.gif);
        }

        #jp-paste {
            background-image: url(${path}buss/reso/wisprint/images/paste.gif);
        }

        #jp-delete {
            background-image: url(${path}buss/reso/wisprint/images/cross.png);
        }

        .jp-border-style span.jp-primary-icon {
            background-image: url(${path}buss/reso/wisprint/images/border-style.png);
        }

        .jp-border-width span.jp-primary-icon {
            background-image: url(${path}buss/reso/wisprint/images/border-weight.png);
        }

        .jp-size-up span {
            background-image: url(${path}buss/reso/wisprint/images/edit-size-up.png);
        }

        .jp-size-down span {
            background-image: url(${path}buss/reso/wisprint/images/edit-size-down.png);
        }

        .jp-color span {
            background-image: url(${path}buss/reso/wisprint/images/edit-color.png);
        }

        .jp-background span {
            background-image: url(${path}buss/reso/wisprint/images/edit-background.png);
        }

        .jp-border-color span {
            background-image: url(${path}buss/reso/wisprint/images/border-color.png);
        }

        .jp-border-none span {
            background-image: url(${path}buss/reso/wisprint/images/border-none.png);
        }

        .jp-border-all span {
            background-image: url(${path}buss/reso/wisprint/images/border-all.png);
        }

        .jp-border-left span {
            background-image: url(${path}buss/reso/wisprint/images/border-left.png);
        }

        .jp-border-top span {
            background-image: url(${path}buss/reso/wisprint/images/border-top.png);
        }

        .jp-border-right span {
            background-image: url(${path}buss/reso/wisprint/images/border-right.png);
        }

        .jp-border-bottom span {
            background-image: url(${path}buss/reso/wisprint/images/border-bottom.png);
        }

        .ui-buttonset span.ui-button-text {
            height: 16px;
            width: 6px;
            display: inline-block;
        }

        a.jp-checked:after {
            content: url(${path}buss/reso/wisprint/images/tick.png);
            right: 1em;
            position: absolute;
        }

        .jp-button-set .jp-new-label span {
            background-image: url(${path}buss/reso/wisprint/images/label.png);
        }

        .jp-button-set .jp-new-text span {
            background-image: url(${path}buss/reso/wisprint/images/text.png);
        }

        .jp-button-set .jp-new-image span {
            background-image: url(${path}buss/reso/wisprint/images/image.png);
        }

        .jp-button-set .jp-new-line-vert span {
            background-image: url(${path}buss/reso/wisprint/images/line-vert.png);
        }

        .jp-button-set .jp-new-line-horz span {
            background-image: url(${path}buss/reso/wisprint/images/line-horz.png);
        }

        .jp-button-set .jp-new-table span,
        .jp-button-set .jp-new-barcode span,
        .jp-button-set .jp-layers span,
        .jp-button-set .jp-border span,
        .jp-button-set .jp-border-style span,
        .jp-button-set .jp-border-width span {
            height: 16px;
        }

        .jp-button-set .jp-save span {
            background-image: url(${path}buss/reso/wisprint/images/disk.png);
        }

        .jp-button-set .jp-open span {
            background-image: url(${path}buss/reso/wisprint/images/folder-open-document-text.png);
        }

        .jp-button-set .jp-new span {
            background-image: url(${path}buss/reso/wisprint/images/blue-document--plus.png);
        }

        .jp-button-set .jp-v-offset span {
            background-image: url(${path}buss/reso/wisprint/images/paper-v-offset.png);
        }

        .jp-button-set .jp-h-offset span {
            background-image: url(${path}buss/reso/wisprint/images/paper-h-offset.png);
        }

        .jp-button-set .jp-print span {
            background-image: url(${path}buss/reso/wisprint/images/printer.png);
        }

        a.jp-new-barcode,
        a.jp-layers {
            width: 40px;
        }

        .jp-new-barcode span.jp-primary-icon {
            background-image: url(${path}buss/reso/wisprint/images/barcode.png);
        }

        .jp-new-table span.jp-primary-icon {
            background-image: url(${path}buss/reso/wisprint/images/table.png);
        }

        .jp-layers span.jp-primary-icon {
            background-image: url(${path}buss/reso/wisprint/images/layers-stack.png);
        }

        .jp-align2 span.jp-primary-icon {
            background-image: url(${path}buss/reso/wisprint/images/layers-alignment-left.png);
        }

        div.jp-toolbar .ui-state-default {
            border-color: #79b7e7;
        }

        .ui-buttonset label.jp-italic {
            margin-right: 0;
            border-right-width: 0;
        }

        .jp-page p {
            cursor: default;
            height: 18px;
            margin: 0;
            padding: 0;
        }

        .jp-page p.jp-connector {
            position: absolute;
            line-height: 0;
            width: 7px;
            height: 7px;
            display: none;
            border2: solid 1px #000;
            background-image: url(${path}buss/reso/wisprint/images/connector.png);
            z-index: 20000;
        }

        .jp-page p.jp-h-ruler {
            position: absolute;
            line-height: 0;
            height: 1px;
            border-top: solid 1px #b2db81;
            display: none;
            z-index: 20000;
        }

        .jp-page p.jp-v-ruler {
            position: absolute;
            line-height: 0;
            width: 1px;
            border-left: solid 1px #b2db81;
            display: none;
            z-index: 20000;
        }

        #feedback {
            font-size: 1.4em;
        }

        .jp-page {
            list-style-type: none;
            margin: 0;
            padding: 0;
            overflow: hidden !important;
            transform-origin: left top;
        }

        div.ui-resizable-se {
            right: -4px;
            bottom: -4px;
        }

        .sp-button-container {
            padding: 3px;
        }

        .sp-container:not(.sp-flat) {
            box-shadow: 0 0 13px rgba(0, 0, 0, 0.31);
        }

        /*.dropdown ul.dropdown-menu {
	background-color: #ECECEC;
}*/
        span2 {
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            position: relative;
            width: auto;
            margin: auto;
        }

        .jp-inplace-editor {
            width: 100%;
            border: none;
            margin: 0;
            padding: 0;
            height: auto;
            overflow-y: hidden
        }

        a.jp-creating,
        body.jp-creating,
        body.jp-creating .jp-component,
        body.jp-creating .jp-paper-background {
            cursor: crosshair;
        }

        .jp-component {
            position: absolute;
            border: solid 1px #ddd;
            padding: 0;
            overflow2: hidden;
        }

        .jp-for-layout .jp-component {
            border: none;
        }

        div.sp-replacer {
            width: 36px;
            padding: 3px;
        }

        div.sp-preview {
            width: 13px;
            height: 13px;
            float: left;
        }

        .sp-replacer .ui-icon-triangle-1-s {
            float: right;
        }

        .sp-replacer:hover .ui-icon-triangle-1-s {
            background-image:
                url(${path}buss/reso/wisprint/js/jquery/images/ui-icons_217bc0_256x240.png);
        }

        #jp-pdf417-editor select,
        #jp-qr-editor select {
            width: 100px;
        }

        #jp-bar-1d-editor p {
            margin: 6px 0;
        }

        .jp-expression {
            color: white;
            background: blue;
        }

        .jp-field-label {
            display: inline-block;
            text-align: right;
            padding-right: 10px;
            line-height: 31px;
            width: 100px;
        }
        
        .right-bar .jp-field-label {
		    width: auto;
		}

        .label-short .jp-field-label {
            width: 100px;
        }

        .jp-barcode object,
        .jp-barcode embed,
        td>div,
        td object {
            width: 100%;
            height: 100%;
            z-index: -1;
        }

        .resizing2 td div object {
            height: 1px;
        }

        .jp-auto-stretch,
        .jp-page svg {
            width: 100%;
            height: 100%;
        }

        /* zhouh解决框框拖动，内容大小不变 */
        .jp-page .jp-shape svg {
            width: 100% !important;
            height: 100% !important;
        }

        div.ui-selecting p.jp-selected-layer,
        div.ui-selected p.jp-selected-layer {
            background-color: #0000aa;
            filter: alpha(opacity=3);
            opacity: 0.03;
        }

        div.ui-selected-first p.jp-selected-layer,
        div.ui-selected-first p.jp-selected-layer {
            background-color: #0000aa;
            filter: alpha(opacity=10) !important;
            opacity: 0.1 !important;
        }

        .jp-selected-layer {
            background-color: white;
            filter: alpha(opacity=1);
            opacity: 0.01;
        }

        .jp-component .jp-selected-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: default;
        }

        div.ui-dialog {
            box-shadow: 0 0 13px rgba(0, 0, 0, 0.15);
            padding: 1px;
        }

        div.ui-dialog-titlebar {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }

        div.drop-with-icon.dropdown-menu li>a {
            padding-left: 30px;
            background-repeat: no-repeat;
            background-position: 5px 50%;
        }

        #jp-copy-code span {
            background-image: url(${path}buss/reso/wisprint/images/copy.gif);
        }

        #jp-save-code span {
            background-image: url(${path}buss/reso/wisprint/images/disk.png);
        }

        #jp-grid-settings,
        .ui-dialog *,
        .jp-toolbar * {
            font-size: 12px;
        }

        #jp-grid-settings {
            padding: 20px;
        }

        .jp-new-barcode span.ui-button-icon-secondary,
        .jp-new-table span.ui-button-icon-secondary,
        .jp-layers span.ui-button-icon-secondary,
        .jp-border span.ui-button-icon-secondary,
        .jp-border-style span.ui-button-icon-secondary,
        .jp-border-width span.ui-button-icon-secondary {
            right: 3px;
        }

        .jp-border span.jp-primary-icon,
        .jp-button-set label,
        .jp-button-set {
            float: left;
        }

        .jp-inplace-editing .jp-text-content,
        .jp-dialog {
            display: none;
        }

        .jp-hidden {
            display: none
        }

        #jp-code div.syntaxhighlighter {
            height: 100%;
            margin: 0 !important
        }

        .jp-border-previewer div {
            position: absolute;
            width: 10px;
            height: 10px;
        }

        .jp-border-previewer div.jp-border-line {
            cursor: pointer;
            background2: blue;
        }

        .jp-style-setting a:hover span {
            border-top-color: white
        }

        .jp-style-setting span {
            padding-left: 120px;
            font-size: 1px;
            vertical-align: 1px;
            border-top: solid 1px black;
        }

        .jp-no-src {
            display: none
        }

        .jp-paper-background {
            position: absolute;
            background: white;
        }

        .jp-stretch {
            width: 100%;
            height: 100%;
        }

        .jp-keep-width {
            width: 100%;
        }

        .jp-keep-height {
            height: 100%;
        }

        .jp-orientation {
            line-height: 50px;
            height: 50px;
        }

        .jp-orientation span,
        .jp-orientation input {
            vertical-align: middle;
        }

        .jp-orientation-icon {
            display: inline-block;
            width: 50px;
            height: 100%;
            background: url(${path}buss/reso/wisprint/images/portrait.png) 50% 50% no-repeat
        }

        .jp-landscape-icon .jp-orientation-icon {
            background-image: url(${path}buss/reso/wisprint/images/landscape.png)
        }

        a:focus {
            outline: none;
        }

        .jp-error-dialog .ui-widget-header {
            background-image: url(${path}buss/reso/wisprint/images/ui-bg_cc0000_1x100.png);
            border-color: #cc0000
        }

        .jp-html-loader {
            position: absolute;
            left: 0px;
            top: 0px;
            width: 1px;
            height: 1px;
            z-index: -100;
            overflow: hidden
        }

        #jp-v-offset-dialog {
            background-image: url(${path}buss/reso/wisprint/images/downoff.png);
        }

        #jp-v-offset-dialog.jp-upper-off {
            background-image: url(${path}buss/reso/wisprint/images/upoff.png);
        }

        #jp-h-offset-dialog {
            background-image: url(${path}buss/reso/wisprint/images/leftoff.png);
        }

        #jp-h-offset-dialog.jp-right-off {
            background-image: url(${path}buss/reso/wisprint/images/rightoff.png);
        }

        .jp-remote,
        .jp-with-remote .jp-local {
            display: none
        }

        .jp-with-remote .jp-remote {
            display: inline;
        }

        #jp-comp-list,
        #jp-barcode-comp-list {
            /* border-top: 1px solid rgb(204, 204, 204); zhouh */
            margin: 0;
            padding: 0;
            /* overflow-y: auto; zhouh */
        }

        #jp-customize-comp-list li,
        #jp-comp-list li,
        #jp-barcode-comp-list li {
            /* line-height: 20px; zhouh*/
		    display: flex;
		    align-items: center;
            margin: 0px;
            padding: 0px;
            height: 48px;
            line-height: 46px;
            list-style-type: none;
            border-bottom: 1px solid rgb(204, 204, 204);
            /* background: none repeat scroll 0% 0% rgb(238, 238, 238); zhouh */
        }

        #jp-barcode-comp-list li.jp-active {
            background-color: transparent;
        }

        #jp-customize-comp-list a,
        #jp-comp-list a,
        #jp-barcode-comp-list a {
            display: inline-block;
    		padding-left: 5px;
            margin-left: 8px;
            width: calc(100% - 28px);
    		height: 46px;
            /* zhouh */
            text-decoration: none;
            font-weight: bold;
            font-size: 13px;
            color: rgb(63, 63, 63);
            text-shadow: 1px 1px rgb(255, 255, 255);
            vertical-align: middle;
            /*padding: 2px 4px;zhouh */
            -webkit-user-drag: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #jp-comp-list a {
            width: 100%;
        }
        #jp-comp-list .jp-draggable-field[data-level="1"]::before {
		    margin-right: 10px;
		}
        #jp-comp-list [data-level="1"] a {
    		padding-left: 20px;
            width: calc(100% - 54px);
        }
        #jp-comp-list li[data-level="1"] {
		    display: none;
		}
		
		.jp-table-field .caret {
		    margin: 0 5px 3px 0;
		}

        table {
            border-collapse: collapse;
            background2: white;
            table-layout: fixed
        }

        .jp-table-move-handle {
            display: none;
            position: absolute;
            left: -16px;
            top: -16px;
            width: 50px;
            height: 50px;
            z-index: -100;
            background: url(${path}buss/reso/wisprint/images/arrow-move.png) no-repeat
        }

        .jp-static .jp-table-detail-master,
        .jp-static .jp-table-detail-body,
        .jp-static .jp-table-summary .jp-static .jp-table-page-summary {
            display: none;
        }

        .jp-table-detail-master,
        .jp-table-detail-body,
        .jp-table-page-summary,
        .jp-table-summary {
            position: absolute;
            left: -11px;
            width: 8px;
            opacity: 0.5;
            border-left: solid 2px #77b55a;
            border-top: solid 2px #77b55a;
            border-bottom: solid 2px #77b55a;
        }

        .jp-table-detail-master:hover,
        .jp-table-detail-body:hover,
        .jp-table-page-summary:hover,
        .jp-table-summary:hover {
            opacity: 1;
        }

        div.jp-table-detail-body {
            left: -19px;
            width: 16px;
        }

        .jp-table-summary {
            bottom: 1px;
        }

        .jp-component:hover .jp-table-move-handle {
            display: block;
        }

        .col-separator {
            position: absolute;
            cursor: e-resize;
            background2: blue;
            width: 4px;
            height: 100%;
            border2: solid 1px black;
            top: 0;
            z-index: 1
        }

        .row-separator {
            position: absolute;
            cursor: s-resize;
            background2: blue;
            width: 100%;
            height: 4px;
            border2: solid 1px black;
            left: 0;
            z-index: 1
        }

        .cell-selected .selection-frame {
            display: block;
        }

        .selection-frame,
        div.cell-editing .selection-frame {
            display: none;
        }

        .ui-selected p.jp-selected-layer {
            display: block
        }

        .jp-html.htmlediting p.jp-selected-layer,
        .htmlediting .selection-frame {
            display: none;
        }

        jp-selected-layer .jp-table .jp-selected-layer {
            display: none
        }

        .jp-line-vert .ui-resizable-se {
            cursor: s-resize;
        }

        .jp-line-horz .ui-resizable-se {
            cursor: e-resize;
        }

        .jp-line .ui-resizable-se {
            background: white;
            border: solid 1px black;
            opacity: 0.2;
            width: 7px;
            height: 7px;
            margin-left: auto;
            margin-right: auto;
            text-align: center;
        }

        div.jp-line {
            border: none;
            overflow: visible;
        }

        .jp-line-vert div.ui-resizable-se {
            right: 0;
            margin-left: -5px;
            left: 50%;
        }

        .jp-line-horz div.ui-resizable-se {
            bottom: 0;
            margin-top: -5px;
            top: 50%
        }

        div.ui-selected.jp-line div.ui-resizable-se {
            background: blue;
            opacity: 0.5;
        }

        div.ui-selecting.jp-line div.ui-resizable-se {
            background: blue;
            opacity: 0.5;
        }

        .jp-layouting div.jp-for-layout-outer,
        .jp-layouting div#jp-grid-settings {
            display: block;
        }

        div.jp-visible {
            visibility: visible;
        }

        .jp-bottom-bar {
            /* visibility: hidden; */
            /* line-height: 1.7em; */
            color: gray;
            font-size: 12px;
            margin-top: 3em;
        }

        .jp-bottom-bar input {
            /* height: 1.5em; */
            width: 5em;
        }

        .jp-layouting .jp-page,
        .jp-layouting div.jp-bottom-bar,
        .jp-for-layout-outer,
        .jp-layouting .jp-main-tools {
            display: none;
        }

        .jp-for-layout div.jp-page {
            display: block;
        }

        .jp-layout-dlg .ui-dialog-titlebar-close {
            display: none;
        }

        .jp-layouting .jp-component-list-dlg {
            display: none;
        }

        .jp-layouting .jp-content {
            top: 0;
        }

        .jp-label:before {
            display: none;
            content: '';
            border-radius: 3px;
            position: absolute;
            width: 18px;
            height: 18px;
            bottom: 0;
            right: -22px;
            border: solid 1px gray;
            background-color: white;
            background-image: url(${path}buss/reso/wisprint/images/dropdown.png);
            background-position: center center;
            background-repeat: no-repeat;
        }

        .jp-line-command .sp-container {
            border: none;
            box-shadow: none;
        }

        /*
         .jp-label:hover:before{display:block;}
         div.jp-menu-dropping:before{display:block;}
         div.jp-label:before:hover{background-color:lightgray}
         div.jp-label{overflow:visible;}
         .jp-text-wrapper{display:none;position:absolute;top:0;bottom:0;right:0;left:0;overflow:hidden;}
         // .jp-component:hover .jp-text-wrapper{display:block;}
         */
        .jp-hline-handler {
            opacity: 0.1;
            filter: alpha(opacity=10);
            width: 100%;
            height: 7px;
            margin-top: -4px;
            background: white;
            top: 50%;
            left: 0;
            position: absolute
        }

        .jp-new-table-chooser table,
        .jp-new-table-chooser td {
            border: 1px solid lightgray;
        }

        .jp-new-table-chooser td.selected {
            border: 1px solid blue;
        }

        .jp-new-table-chooser td {
            width: 17px;
            padding: 0
        }

        .jp-new-table-chooser tr {
            height: 18px;
            padding: 0
        }

        .jp-vline-handler {
            opacity: 0.1;
            filter: alpha(opacity=10);
            height: 100%;
            width: 7px;
            margin-left: -4px;
            background: white;
            left: 50%;
            top: 0;
            position: absolute
        }

        /* 可拖放字段纵缩进 */
        .jp-level-1 {
            margin-left: 20px;
        }

        .jp-level-2 {
            margin-left: 40px;
        }

        .jp-level-3 {
            margin-left: 60px;
        }

        .jp-border-transparent,
        .jp-border-black {
            border: solid 1px gray;
            white-space: nowrap;
        }
    </style>
    <!--noexcel中来-->
    <style type="text/css">
        div.ui-dialog {
            box-shadow: 0 0 13px rgba(0, 0, 0, 0.15);
            padding: 1px;
        }

        div.ui-dialog-titlebar {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }

        .borderpattern p {
            margin: 0px;
            padding: 0px;
            height: 0px;
        }

        .borderpattern div {
            padding: 5px 3px;
            height: 0px;
            border: solid 1px F0F1EC;
        }

        .borderpattern div.selected {
            border: dotted 1px blue;
            padding-left: 10px;
            padding-right: 10px;
        }

        .borderthick p {
            margin: 0px;
            padding: 0px;
            background: black;
        }

        .borderthick div {
            border: solid 1px F0F1EC;
            padding: 3px
        }

        .borderthick div.selected {
            border: dotted 1px blue;
            padding-left: 10px;
            padding-right: 10px;
        }

        .separator {
            border-bottom: none;
            border-left: none;
            border-right: none;
        }

        .toggleselect button {
            height: 24px;
            width: 24px;
        }

        .preborder button {
            height: 40px;
            width: 40px;
        }

        .borderselect button {
            display2: block;
            position2: absolute;
        }

        legend {
            margin-left: 10px;
        }

        #mytable td {
            line-height: 1px;
            white-space: nowrap;
        }

        td2 {
            border: solid 1px black
        }

        button {
            margin: 0px;
            padding: 0px;
        }

        .selection-frame {
            position: absolute;
            border: solid 2px #3E63A8;
        }

        .selection-bg {
            background-color: #3E63A8;
            filter: Alpha(Opacity=10);
            position: relative;
            opacity: 0.10;
            width: 100%;
            height: 100%;
        }

        .header-table td,
        #firstcell2 {
            border: #aaaaaa 1px solid;
            font-family: Arial sans;
            font-size: 12px;
            text-align: center;
            background-color: #dddddd;
            padding: 0px;
            margin: 0px;
            overflow2: hidden;
            white-space: nowrap;
        }

        .top-header-table td {
            height: 20px;
            line-height: 20px
        }

        .header-td-wrap {
            position: relative;
            height: 100%;
            width: 100%
        }

        .header-text {
            position: absolute;
            height: 100%;
            width: 100%;
        }

        .top-header-handle {
            position: absolute;
            right: 0px;
            top: 0px;
            cursor: e-resize;
            height: 100%;
            width: 3px;
            z-index: 100;
        }

        .left-header-handle {
            position: absolute;
            left: 0px;
            bottom: 0px;
            cursor: s-resize;
            width: 100%;
            height: 3px;
            z-index: 100;
        }

        .header-table td.focused {
            background-color: #B1BBD8;
        }

        table {
            border-spacing: 0;
        }

        .top-header-div {
            position: relative;
            top: 1px;
            left: 0;
        }

        .jp-page td {
            border-right: #ECE9D8 1px solid;
            border-bottom: #ECE9D8 1px solid;
            /*	font-family: Arial sans;
	font-size: 12px;*/
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
        }

        /*	.jp-page table {
			background: white;
		}*/
        div.jp-black-border td {
            border-right: black 1px solid;
            border-bottom: black 1px solid;
        }

        div.jp-black-border table {
            border-left: black 1px solid;
            border-top: black 1px solid;
        }

        div.jp-no-border table {
            border: none;
        }

        .jp-page td.noleft {
            border-left: none;
        }

        .jp-page td.noright {
            border-right: none;
        }

        .jp-page td.notop {
            border-top: none;
        }

        .jp-page td.nobottom {
            border-bottom: none;
        }

        .sheet-wrapper td {
            padding: 0px;
        }

        .sheet-wrapper,
        table.sheet-wrapper table {
            border-collapse: collapse;
            table-layout: fixed;
        }

        .rubber {
            position: absolute;
            border-left: dotted 1px blue;
            border-top: dotted 1px blue;
            display: none
        }

        .celleditor {
            position: absolute;
            display: none
        }

        .header-row {
            height: 20px
        }

        .sheet-wrapper table {
            padding: 0;
            border-spacing: 0;
            border-collapse: collapse;
        }

        .top-header-div {
            overflow: hidden;
            margin: 0px;
            padding: 0px;
            height: 100%;
            width: 100%
        }

        .left-header-div {
            overflow: hidden;
            width: 100%;
        }

        .content-div {
            overflow: scroll;
            width: 100%;
            height: 100%;
            position: relative;
            top: 0px;
            left: 0;
            padding: 0px;
        }

        .content-div input {
            z-index: 200;
            padding: 0px;
        }

        .left-header-table {
            overflow: hidden;
            width: 100%;
        }

        .top-header-table {
            overflow: hidden;
            height: 100%
        }

        #mytable {
            border: 1px solid black;
        }

        /*  边框对话框*/
        .nx-button-set .nx-clear-border span {
            background-image: url(borderclear.gif);
        }

        .nx-button-set .nx-outline-border span {
            background-image: url(borderoutline.gif);
        }

        .nx-button-set .nx-cross-border span {
            background-image: url(bordercross.gif);
        }

        body .ui-buttonset .ui-button {
            margin-right: -1px;
        }

        .jp-layout-dlg .ui-dialog-buttonset button:first-child {
            margin-right: 100px;
        }

        .jp-total-menu:after {
            content: "";
            width: 0;
            height: 0;
            position: absolute;
            right: 15px;
            top: 50%;
            opacity: .5;
            margin-top: -3px;
            border-width: 6px 6px 0 6px;
            border-style: solid;
            border-color: #8aa8bd transparent;
        }

        .jp-total-menu:hover:after {
            opacity: 1;
        }

        .custom-combobox {
            position: relative;
            display: inline-block;
        }

        .custom-combobox-toggle {
            position: absolute;
            top: 0;
            bottom: 0;
            margin-left: -1px;
            padding: 0;
        }

        .custom-combobox-input {
            margin: 0;
            padding: 2px 10px;
        }

        .jp-static .jp-dynamic-option {
            display: none
        }

        .jp-static-option {
            display: none
        }

        .jp-static .jp-static-option {
            display: inline
        }

        div.modal-backdrop.in {
            background-color: #ddd;
        }

        .modal-body {
            background2: #f5f5f5 !important;
        }

        .bootstrap-dialog-close-button .close:focus,
        .bootstrap-dialog-close-button .close:hover {
            opacity: 1.0
        }

        .bootstrap-dialog-close-button .close {
            color: rgb(255, 255, 255);
            opacity: 0.5
        }

        .bootstrap-dialog-message input[type=checkbox],
        .bootstrap-dialog-message input[type=radio] {
            margin: 0
        }

        .bootstrap-dialog .bootstrap-dialog-message {
            font-size: 12px;
        }

        label {
            font-weight: 400;
        }

        .middle * {
            vertical-align: middle;
        }

		.middle span {
		    display: inline-block;
		}

        .jp-background-settings label {
            width: 5em;
            margin: 0;
        }

        .jp-orientation input,
        .jp-orientation label {
            margin: 0;
            vertical-align: middle
        }

        .dropdown .dropdown-menu,
        .dropdown .dropdown-panel {
            min-width: 160px;
            max-width: 360px;
            list-style: none;
            background: #ECECEC;
            border: solid 1px #DDD;
            border: solid 1px rgba(0, 0, 0, .2);
            border-radius: 6px;
            box-shadow: 0 0 13px rgba(0, 0, 0, 0.31);
            overflow: visible;
            padding: 4px 0;
            margin: 0;
        }

        .dropdown .dropdown-menu .dropdown-divider {
            font-size: 1px;
            border-top: solid 1px #E5E5E5;
            padding: 0;
            margin: 5px 0;
        }

        .dropdown-menu.has-icons LI>A {
            padding-left: 30px;
            background-position: 8px center;
            background-repeat: no-repeat;
        }

        .dropdown-divider-up {
            border-bottom: solid 1px #ccc
        }

        .dropdown-divider-down {
            border-bottom: solid 1px #fff
        }

        .custom-border-dialog .modal-dialog {
        	left: calc(50% - 262.5);
            width: 525px;
            height: 390px;
        }

        .dropdown-menu kbd {
            position: absolute;
            display: block;
            right: 2px;
            top: 1px;
        }

        .dropdown-menu li {
            position: relative;
        }

        .btn-group.btn {
            border: 0;
            padding: 0;
        }

        .btn-group.btn>.btn,
        .bootstrap-select>.btn {
            border-radius: 0
        }

        .bootstrap-select li.divider {
            display: none;
        }

        .btn-group.btn>.dropdown-menu {
            text-align: left;
        }

        .btn-group.btn:first-child>.btn,
        .btn-group.btn:first-child .bootstrap-select>.btn {
            -webkit-border-radius: 4px 0 0 4px;
            -moz-border-radius: 4px 0 0 4px;
            border-radius: 4px 0 0 4px;
        }

        .btn-group.btn:last-child>.btn,
        .btn-group.btn:last-child .bootstrap-select>.btn {
            -webkit-border-radius: 0 4px 4px 0 !important;
            -moz-border-radius: 0 4px 4px 0 !important;
            border-radius: 0 4px 4px 0 !important;
        }

        .bootstrap-select>.btn {
            padding: 0 3px;
    		height: 28px;
        }

        textarea {
            resize: none;
        }

        textarea:focus,
        input:focus {
            outline: 0;
        }

        div.sp-preview {
            margin-right: 0px !important;
        }

        div.sp-replacer {
            width: 43px;
            height: 21px;
        }

        .code-dialog .dropdown-menu {
            font-size: 12px;
        }

        .code-dialog .dropdown-menu>li>a,
        .code-dialog .dropdown-menu>li2 {
            line-height: 1.428 !important;
        }

        ::-ms-clear {
            display: none;
        }

        .alert-dialog .modal-dialog {
        	left: calc(50% - 185px);
            width: 370px;
        }

        .form-control-clear {
            z-index: 10;
            pointer-events: auto;
            cursor: pointer;
        }

        .btn-green {
            background: #3b9b28 !important;
        }

        #jp-table-actions {
            position: absolute;
            display2: none;
        }

        .dropdown.block,
        .block .dropdown-menu {
            display: block;
        }

        #jp-header,
        #jp-body,
        #jp-footer {
            display: none
        }

        .jp-has-header #jp-header,
        .jp-has-header #jp-body,
        .jp-has-footer #jp-footer,
        .jp-has-footer #jp-body {
            display: block
        }

        .tablist {
            display: flex;
            justify-content: space-around;
            height: 40px;
            width: 100%;
            background-color: #fff;
            border: 1px solid #DBE1EF;
            font-size: 0;
        }

        .tab {
            /* display: inline-block; */
            width: 40px;
            text-align: center;
            line-height: 40px;
            font-size: 14px;
            color: #999;
            cursor: pointer;
        }

        .tab-active {
            border-bottom: 2px solid #1051D6;
            font-weight: bolder;
            color: #333;
        }
     
        .tab-container {
            height: calc(100% - 40px);
            background-color: #fff;
            border: 1px solid #DBE1EF;
            border-top: none;
            overflow: auto;
        }
        .tab-container::-webkit-scrollbar {
            display: none;
        }
        .tab-item {
            height: 100%;
        }

        .tab-item:not(:first-child),
        .global-data-item .data-item-tab:not(:first-child) {
            display: none;
        }

        .data-operation-group {
            display: flex;
            justify-content: space-around;
            margin-top: 56px;
            height: 26px;
            font-size: 0;
            user-select: none;
        }

        .jp-comp-container .data-operation-group {
            justify-content: flex-start;
        }

        .jp-comp-container .data-operation-group span:nth-child(-n+2) {
            margin-left: 5px;
        }

        .jp-comp-container .data-operation-group span:nth-child(n+3) {
            display: none;
        }

        .jp-barcode-comp-head {
            padding: 15px 0 14px 15px;
            border-bottom: 1px solid #E8E8E8;
        }

        .jp-barcode-comp-head input {
            width: 124px;
            border: none;
            border-bottom: 1px solid #DBDBDB;
        }

        .jp-barcode-comp-head span {
            vertical-align: middle;
        }

        .jp-barcode-comp-head .switch {
            margin-left: 0;
        }

        .jp-comp-operation>.operation-btn:not(:first-child) {
            background-color: #999;
        }

        .data-operation-group>span {
            display: inline-block;
            height: 26px;
            width: 28px;
            border: 1px solid #DCDEE3;
            cursor: pointer;
        }

        .operation-btn:first-child {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-add.png) center/16px no-repeat;
        }

        .operation-btn:nth-child(2) {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-delete.png) center/16px no-repeat;
        }

        .operation-btn:nth-child(3) {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-up.png) center/16px no-repeat;
        }

        .operation-btn:nth-child(4) {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-down.png) center/16px no-repeat;
        }

        .operation-btn:nth-child(5) {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-top.png) center/16px no-repeat;
        }

        .operation-btn:nth-child(6) {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-bottom.png) center/16px no-repeat;
        }

        .operation-btn:nth-child(7) {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-save.png) center/16px no-repeat;
        }

        /*#jp-barcode-comp-list li::before,
        #jp-comp-list li::before,
        #addDataItem[data-type="add"] #select-data-item p::before*/
        #jp-customize-comp-list .jp-draggable-field::before {
            content: "";
            display: inline-block;
            margin-left: 16px;
            height: 20px;
            width: 20px;
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-no-select.png) center/16px no-repeat;
            vertical-align: middle;
            cursor: pointer;
        }
        
        /* #addDataItem[data-type="add"] #select-data-item p::before {
            margin-left: 0;
        } */
        
        #select-data-item .iconfont {
        	float: right;
        	cursor: pointer;
        }
        
        #addDataItem[data-type="edit"] #select-data-item .iconfont {
    		display: none;    
	    }

        /*#jp-comp-list > :first-child {
			display: none;
		}*/
        .edit-data-item,
        .delete-data-item,
        .reset-serial-num,
        .checkbox-data-item {
            display: inline-block;
            display: inline-block;
            /* margin-left: 16px; */
            height: 20px;
            width: 20px;
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-edit.png) center/16px no-repeat;
            vertical-align: middle;
            cursor: pointer;
        }

        .reset-serial-num {
            background: url(${path}buss/reso/wisprint/images/wisprint/template-design/serial-reset.png) center/16px no-repeat;
        }

        .delete-data-item {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-delete.png) center/16px no-repeat;
        }

        .checkbox-data-item {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-no-select.png) center/16px no-repeat;
        }

        .checkbox-data-item-active {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-select.png) center/16px no-repeat;
        }

        #jp-customize-comp-list .data-item-active::before,
        #jp-barcode-comp-list .data-item-active::before,
        #jp-comp-list .data-item-active::before,
        #addDataItem[data-type="add"] #select-data-item .select-data-item::before {
            background:
                url(${path}buss/reso/wisprint/images/wisprint/template-design/wisprint-data-item-select.png) center/16px no-repeat;
        }

        .modal-dialog {
        	left: calc(50% - 340px);
            width: 680px;
        }

        #saveRule .modal-dialog,
        #tmpSaveDialog .modal-dialog {
        	left: calc(50% - 262.5px);
            width: 525px;
            height: 390px;
        }

        #saveRule .modal-body,
        #tmpSaveDialog .modal-body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            height: 100px;
            width: 100%;
        }

        #saveRule .modal-body input,
        #tmpSaveDialog .modal-body input {
            margin-left: 10px;
            width: 200px;
            height: 30px;
            border: 1px solid #CCCCCC;
        }

        .modal-body {
            padding: 24px;
            height: 390px;
            width: 680px;
        }

        .data-item-container {
            display: flex;
            flex-wrap: wrap;
            height: 100%;
            width: 100%;
            border: 1px solid #DBE1EF;
        }

        .data-item-main {
            display: flex;
            height: 266px;
            width: 100%;
        }

        .data-item-tablist {
            padding: 29px 0 0 25px;
            height: 100%;
            width: 116px;
            background-color: #F0F3F9;
            border-right: 1px solid #DBE1EF;
        }

        .data-item-tab {
            line-height: 13px;
            font-size: 14px;
            color: #666666;
            cursor: pointer;
        }

        .data-item-tab-active {
            font-size: 14px;
            font-weight: bolder;
            color: #004098;
        }

        .data-item-tab:not(:first-child) {
            margin-top: 24px;
        }

        .data-item-tab-container {
            flex: 1;
            height: 100%;
            overflow: hidden;
        }

        .data-item-tab-item {
        	position: relative;
            height: 100%;
        }

        .data-item-data-table,
        .data-item-tab-container .data-item-tab-item.encoding-rules {
            display: flex;
        }

        .encoding-rules .data-item-tablist {
            background: #FFF;
        }

        .data-item-tab-item:not(:first-child),
        .encoding-rules .data-item-tab-item {
            display: none;
        }

        .encoding-rules>.data-item-tablist {
            padding: 0;
            background-color: #fff;
            overflow: auto;
        }

        .encoding-rules>.data-item-tablist>p {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 0;
            padding: 0 10px;
            height: 50px;
            border-bottom: 1px solid #DBE1EF;
            line-height: 50px;
            /* text-align: center; */
        }

        .encoding-rules>.data-item-tablist>p>span {
            width: 70px;
            vertical-align: middle;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .encoding-rules .data-item-list>p:hover {
            background-color: transparent;
            color: #333;
            font-weight: normal;
        }

        .data-item-list {
            padding: 0;
            overflow: auto;
        }

        .data-item-list>p {
            margin: 0 8px;
            padding-left: 16px;
            height: 40px;
            border-bottom: 1px solid #DBE1EF;
            line-height: 40px;
            font-size: 14px;
            color: #333;
        }

        .data-item-list>p:hover,
        .data-item-tab-item .select-data-item {
            background-color: #F0F3F9;
            color: #004098;
            font-weight: bolder;
        }

        .data-item-list>p:last-child {
            border-bottom: none;
        }

        .data-item-text {
            padding: 24px;
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            resize: none;
        }

        .data-item-preview {
            padding: 16px 25px;
            height: 74px;
            width: 100%;
            border-top: 1px solid #DBE1EF;
            font-size: 14px;
            color: #333;
            word-break: break-all;
        }

        .center {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }

        /* 滚动条 */
        .jp-content::-webkit-scrollbar,
        .scroll::-webkit-scrollbar,
        .data-item-scroll::-webkit-scrollbar {
            height: 16px;
            width: 16px;
        }

        /*滚动条的设置*/
        .jp-content::-webkit-scrollbar-thumb,
        .scroll::-webkit-scrollbar-thumb,
        .data-item-scroll::-webkit-scrollbar-thumb {
            border-radius: 2em;
            border-style: dashed;
            background-color: #B3B3B3;
            border-color: transparent;
            border-width: 6px;
            background-clip: padding-box;
        }

        .jp-content::-webkit-scrollbar-track,
        .scroll::-webkit-scrollbar-track,
        .data-item-scroll::-webkit-scrollbar-track {
            background-color: #EEEEEE;
        }

        /* 滚动条 */
        .scroll::-webkit-scrollbar {
            height: 9px;
            width: 9px;
        }

        /*滚动条的设置*/
        .scroll::-webkit-scrollbar-thumb {
            border-radius: 2em;
            border-style: dashed;
            background-color: rgba(157, 165, 183, 0.4);
            border-color: transparent;
            border-width: 2px;
            background-clip: padding-box;
        }

        /*滚动条移上去的背景*/
        .scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(157, 165, 183, 0.4);
        }

        /*.modal.fade.ui-draggable .modal-dialog {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            margin: 0;
        }*/

        .form-control {
            display: inline-block;
            padding: 3px 12px;
            width: 180px;
            height: 30px;
            border-radius: 0;
        }

        .set-date {
            padding: 24px 0 0 32px;
            font-size: 0;
        }

        .set-date>div {
            margin-top: 10px;
        }

        .select-name {
            margin-right: 12px;
            font-size: 14px;
        }

        .row-center {
            display: flex;
            align-items: center;
        }

        .serial-num-btn {
            font-size: 22px;
            line-height: 25px;
            height: 25px;
            width: 25px;
            border-radius: 0;
            outline: none;
            border: 1px solid #CCCCCC;
        }

        .serial-num-input {
            width: 32px;
            border: none;
            font-size: 14px;
            text-align: right;
            padding: 0;
            line-height: 25px;
        }

        .select-name.sequence {
            width: 70px;
            text-align: right;
        }

        .sequence-key {
            font-size: 14px;
        }

        .modal-footer {
            padding: 0 15px;
        }

        .modal-content {
            /*overflow: hidden;*/
            border-radius: 4px;
            box-shadow: none;
        }

        .data-item-preview:not(:nth-child(3)) {
            display: none;
        }

        a.btn-default>img {
            margin-right: 5px;
            height: 26px;
            width: 26px;
        }

        .panel-body {
            padding: 8px;
        }

        .viewport .viewport-body .right-bar .panel-body .btn-default {
            background: #fff;
        }

        /* 刻度颜色 */
        .jp-ruler-view .tick {
            background: none repeat scroll 0% 0% #DCDEE3;
        }

        .jp-ruler-view .top {
            border-bottom: none;
        }

        .jp-ruler-view .left {
            border-right: none;
        }

        .viewport .jp-main-tools .btn-group>.btn {
            box-shadow: none;
            background: #fff;
            border: none;
        }

        #jp-barcode-chooser2 .btn-default>img {
            height: 16px;
            width: 16px;
        }

        /* 弹窗样式 */
        .modal-content {
            border-radius: 6px;
        }

        /*  */
        .modal-header {
            background: transparent !important;
            background-color: #2C3A48 !important;
            border-bottom: none;
            cursor: pointer;
        }

        .modal-title {
            color: #FFFFFF;
            font-size: 14px;
        }

        .modal-footer {
            padding: 11px 15px;
            background: #F6F5F7;
            border-bottom: 1px solid #EAEAEA;
        }

        .close {
            float: right;
            font-size: 21px;
            color: #fff;
            font-weight: normal;
            text-shadow: none;
            opacity: 1;
        }

        .close:focus {
            outline: none;
        }

        .modal-footer button,
        .submit-data-item {
            width: 70px;
            height: 28px;
            background: #FFFFFF;
            border: 1px solid #DBDBDB;
            border-radius: 2px;
        }
        
        .submit-data-item {
        	position: absolute;
		    right: 20px;
		    bottom: 20px;
		    width: 60px;
		    height: 25px;
		    border-radius: 5px;
    		font-size: 14px;
        }

        .bootstrap-dialog-close-button .close {
            opacity: 1;
        }

        .bootstrap-dialog .bootstrap-dialog-title {
            color: #fff;
            font-size: 14px;
            font-weight: normal;
        }

        .jp-layouting .jp-page,
        .jp-layouting div.jp-bottom-bar,
        .jp-for-layout-outer,
        .jp-layouting .jp-main-tools {
            display: none;
        }

        .close:hover,
        .close:focus {
            color: #fff;
            opacity: 1;
        }

        .buttonNormal {
            width: 70px;
            height: 28px;
            background: #FFFFFF;
            border: 1px solid #DBDBDB;
            border-radius: 2px;
            color: #333;
        }

        .buttonNormal:active {
            border: 1px solid #DBDBDB;
            height: 28px;
            background: #fff;
        }

        #jp-registration-mark {
            height: 38px;
            display: flex;
            align-items: center;
        }

        .preview-config {
            display: flex;
            margin-top: 32px;
            padding: 0 12px;
            color: #2B2B2B;
            font-weight: bolder;
            font-size: 14px;
            letter-spacing: 2px;
        }

        .preview-config>div:last-child {
            flex: 1;
            margin-left: 10px;
            height: 120px;
            background: #F2F3F8;
            word-break: break-all;
        }

        .switch {
            display: inline-block;
            margin-left: 10px;
            width: 36px;
            height: 18px;
            cursor: pointer;
        }

        /* 开关 */
        .switch[isOn='true'] {
            background-image:
                url(./${path}buss/reso/wisprint/images/wisprint/label-invoices-template/icon-open.png);
            background-size: cover;
            /*  plf/page/mlabel/img/ico-on.png */
        }

        .switch[isOn='false'] {
            background-image:
                url(./${path}buss/reso/wisprint/images/wisprint/label-invoices-template/icon-shutdown.png);
            background-size: cover;
        }

        .label-tmp>:first-child {
            display: none;
        }

        .modal .modal-dialog {
        	position: absolute;
            top: 15%;
            left: calc(50% - 340px);
            margin: 0;
        }
        
        .modal {
        	z-index: 10001 !important;
        }

        .default-table {
            margin: auto;
            width: 500px;
        }

        .default-table input {
            border: none;
            text-align: center;
        }

        #resetListtable {
            width: 100%;
            border-collapse: collapse;
            text-align: center;
            table-layout: fixed;
        }

        .default-table td,
        .default-table th {
            border: 1px solid #cad9ea;
            color: #666;
            height: 35px;
            cursor: pointer;
            text-align: center;
        }

        .default-table thead td {
            background-color: #E6EAF4;
        }

        /*#resetList tr:nth-child(odd) {
            background: #fff;
        }

        #resetList tr:nth-child(even) {
            background: #F0F4FD;
        }*/
        #resetList tr td:nth-child(1) {
            width: 30px;
        }

        #resetList tr td:nth-child(2) {
            width: 130px;
        }

        #resetList tr td:nth-child(3) {
            width: 30px;
        }

        #thumb-img {
            position: absolute;
            z-index: -1;
            top: 0;
        }

        .template-name {
            display: inline-flex;
    		align-items: center;
    		margin-left: 10px;
            height: 100%;
            line-height: 38px;
        }

        .template-name span {
            font-size: 14px;
        }

        .template-name input {
            padding-left: 5px;
            width: 170px;
            height: 25px;
            border: none;
            border-bottom: 1px solid #dbdbdb;
            outline: none;
            line-height: 25px;
            font-size: 14px;
        }
        
        .template-name .switch {
        	margin-right: 10px;
        }

        .jp-barcode-item .icon-decimals,
        .jp-barcode-item .icon-report,
        .jp-barcode-item .icon-setting,
        .jp-barcode-item .icon-calendar {
            margin-left: 5px;
            vertical-align: middle;
        }

        #decimals-setting .modal-dialog {
        	left: calc(50% - 200px);
            width: 400px;
        }

        #decimals-setting .modal-body {
            display: flex;
            justify-content: center;
            height: 100px;
            width: 100%;
        }
        
        #jp-setting.modal-body {
        	height: auto;
        }
        
        .setting-small-title {
        	padding: 0 0 5px 0;
		    margin: 10px 0;
		    background-color: transparent;
		    border-bottom: 1px solid #ddd;
		    font-size: 16px;
    		color: #333;
        }

        #date-setting .tab-container {
            height: auto;
            border: none;
        }

        #date-setting .tablist {
            width: 500px;
            margin: auto;
            border-bottom: none;
        }

        .required::before {
            content: "*";
            color: #ff4757;
            margin-right: 2px;
        }
        
        .flex-row {
        	display: flex;
        	align-items: center;
        	height: 50px;
        }
        
        .flex-row > div {
        	flex: .5;
        }
        
        .scm-input-container {
            display: flex;
            align-items: center;
            width: 92px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            overflow: hidden;
        }

        .scm-input-container:hover,
        .scm-input-container:focus {
            border: 1px solid #409eff;
        }

        .scm-number-input {
            height: 32px;
            width: 60px;
            outline: none;
            border: none;
            text-align: center;
            color: #606266;
        }

        .scm-number-input::-webkit-outer-spin-button,
        .scm-number-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
        }

        .scm-number-btn {
            display: inline-flex;
            flex-direction: column;
            width: 30px;
            height: 32px;
            border-left: 1px solid #dcdfe6;
        }

        .icon-up:hover,
        .icon-down:hover {
            color: #409eff;
        }

        .scm-number-btn .iconfont {
            height: 50%;
            background-color: #f5f7fa;
            line-height: 16px;
            font-size: 10px;
            text-align: center;
        }

        .scm-number-btn .iconfont.btn-disabled {
            color: #c0c4cc;
            cursor: not-allowed;
        }

        .scm-number-btn .iconfont:first-child {
            border-bottom: 1px solid #dcdfe6;
        }
        
        .scm-number-input:disabled {
		    color: #c0c4cc;
		}
		
		.scm-tooltip {
			position: relative;
			display: flex;
    		align-items: center;
			cursor: pointer;
			background: #fff;
		}
		
		.scm-tooltip::before {
			content: attr(data-tooltip);
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 0;
            display: inline-block;
            width: 0;
            background: rgba(97, 97, 97, .9);
            opacity: 0;
            border-radius: 4px;
            font-size: 14px;
            line-height: 22px;
            color: transparent;
            text-transform: none;
            pointer-events: none;
            white-space: nowrap;
            z-index: 1;
            transition: all .5s;
            box-shadow: 0 0 10px rgba(0, 0, 0, .4);
        }

        .scm-tooltip:hover::before {
            padding: 5px 16px;
            width: auto;
            opacity: 1;
            color: #fff;
        }
        
        .scm-tag {
		    display: inline-block;
		    margin-right: 10px;
		    padding: 0 10px;
		    height: 26px;
        	background-color: rgba(39,115,196,.1);
		    line-height: 24px;
		    font-size: 12px;
		    color: #2773c4;
		    border-radius: 4px;
		    box-sizing: border-box;
		    border: 1px solid rgba(39,115,196,.2);
		    white-space: nowrap;
        }
        
        /*.jp-page .jp-text, 
        .jp-page .jp-text-content, 
        .jp-page .jp-inplace-editor, 
        .jp-page .jp-label {
		    text-align-last: auto;
		}*/
		
		
		.viewport .viewport-body .left-bar {
            overflow: auto;
			width: 17em;
			background: #fff;
		}
		.viewport .viewport-body .right-bar {
			width: 17.5em;
		}
        .left-bar a,
		.right-bar a {
		    color: #333;
		}
		
		.left-bar a:hover,
		.left-bar a:focus,
		.right-bar a:hover,
		.right-bar a:focus {
		    color: #333;
		    text-decoration: none;
		}
		
		.tool-title {
		    display: flex;
    		align-items: center;
		    width: 100%;
		    height: 28px;
		    border: 1px solid #e8e8e8;
		    border-width: 1px 0 1px 0;
		    background: #EEEEEE;
		    font-size: 14px;
		    font-family: Alibaba PuHuiTi;
		    font-weight: bold;
		    color: #333333;
		    line-height: 28px;
		}
		
		.tool-title span {
		    margin: 0 6px;
		}
		
		.tool-content {
		    margin: 4px 12px;
		}
		
		.tool-type {
		    display: flex;
		    height: 34px;
		    font-size: 14px;
		    font-family: Alibaba PuHuiTi;
		    font-weight: 700;
		    color: #333333;
		    align-items: center;
		}
		
		.tool-type img {
		    height: 20px;
		    width: 20px;
		    margin-right: 11px;
		}
		
		.tool-list,
		.tool-group {
		    display: flex;
		    flex-wrap: wrap;
		    justify-content: space-between;
		}
		
		.tool-list {
		    padding-bottom: 14px;
		}
		
		.tool-list li,
		.tool-group li {
		    position: relative;
		    width: 50%;
		    font-size: 14px;
		    font-weight: 400;
		    line-height: 28px;
		    color: #333333;
		    list-style: none;
		}
		
		.tool-list li a,
		.tool-group li a {
			-webkit-user-drag: none;
		}
		
		
		
		.tool-group li {
		    height: 30px;
		}
		
		.tool-group li a {
		    display: flex;
		    align-items: center;
		}
		
		.insert-table {
		    display: none;
		    position: absolute;
		    top: -200px;
		    left: 90px;
		    z-index: 1000;
		    height: 250px;
		    width: 222px;
		    min-width: 160px;
		    border: 1px solid rgba(0, 0, 0, .15);
		    background-color: #ececec;
		    background-clip: padding-box;
		    -webkit-background-clip: padding-box;
		    border-radius: 4px;
		    box-shadow: 0 6px 12px rgb(0 0 0 / 18%);
		    -webkit-box-shadow: 0 6px 12px rgb(0 0 0 / 18%);
		}
		
		
		.table-head {
		    height: 26px;
		    padding: 0 10px;
		    font-size: 12px;
		    line-height: 30px;
		
		}
		
		.table-main {
		    padding: 2px 0;
		    background-color: #fff
		}
		
		.table-main table {
		    margin: auto;
		    border-spacing: 2px;
		    border-collapse: separate;
		}
		
		.tool-size {
		    font-size: 14px;
		    font-family: Alibaba PuHuiTi;
		    font-weight: 400;
		    color: #333333;
		}
		
		.tool-size span {
		    display: inline-block;
		    width: 24px;
		    height: 24px;
		    line-height: 24px;
		}
		
		
		.tool-size input {
		    width: 70px;
		    border: 1px solid #DCDEE3;
		}
		
		.viewport .viewport-body .right-bar a.no-border:not(:first-child) {
		    margin-left: -0;
		}
		
		.tool-font>div {
		    width: 100% !important
		}
		
		/* 自定义数据项样式 */
		#customize-data-item-container input:disabled {
		    background: transparent;
		    color: #999;
		    border-bottom: 1px solid #DBDBDB;
		    cursor: unset;
		}
		
		#customize-data-item-container > div {
		    margin-bottom: 10px;
		    overflow: hidden;
		}
		
		#customize-data-item-container span {
		    display: inline-block;
		    width: 80px;
		    text-align: right;
		}
		
		#customize-data-item-container input {
		    border-bottom: 1px solid #999;
		}
		
		.btn-default {
		    background-image: none;
		}
		.table-tool {
		    margin: 0;
		}
		
		.caret.caret-close {
		    transform: rotate(-90deg);
		}
		.table-tool > li {
		    height: 45px;
		    width: 100%;
		}
		.table-tool > li > .btn-group,
		.table-tool > li #jp-new-table  {
		    height: 100%;
		    width: 100%;
		    border: none;
		    box-shadow: none;
		    border-radius: 0;
		}
		
		.table-tool > li #jp-new-table {
			border-bottom: 1px solid #E8E8E8;
		}
		
		.table-tool .dropdown-menu {
			top: calc(-100% - 215px);
		}
		.tool-content > * > p {
		    margin: 0;
		    display: flex !important;
		    justify-content: space-between;
		    align-items: center;
		    flex-wrap: wrap;
		}
		
		.btn-xs, .btn-group-xs > .btn {
		    font-size: 14px;
		    color: #333;
		}
		
		#jp-image-dialog input[type="radio"], 
		#jp-image-dialog input[type="checkbox"] {
			margin: 0;
		}
		
		#addDataItem .modal-body {
			height: auto;
		}
		
		#addDataItem[data-type="edit"] #sortDataItem,
		#addDataItem[data-type="edit"] .submit-data-item {
			display: none;
		}
		
		.sortable-container {
		    display: flex;
		    flex-wrap: wrap;
		    padding: 5px;
		    margin: 0;
		    height: 135px;
		    width: 100%;
		    border-top: 1px solid #DBE1EF;
		    overflow: auto;
		}
		
		.sortable-container li {
			position: relative;
		    margin: 6px 10px 3px 0;
		    padding: 3px;
		    height: 50px;
		    width: 110px;
		    background: #fff;
		    border: 1px solid #dedede;
		    color: #333;
		    font-weight: 400;
		    list-style: none;
		    cursor: pointer;
		}
		
		.sortable-container .ui-state-highlight {
			border: 1px solid #fcefa1;
		    background: #fbf9ee;
		    color: #363636;
		}
		
		.del-btn {
			position: absolute;
		    right: -6px;
		    top: -6px;
		    display: inline-block;
		    width: 12px;
		    height: 12px;
		    background: rgb(18,150,219);
		    border-radius: 50%;
		    font-size: 12px;
		    line-height: 1;
		    text-align: center;
		    color: #fff;
		}
		
		.del-btn:hover {
		    background: #004098;
		}
		
		#jp-new-image img {
			margin-right: 5px;
		    width: 25px;
		    height: 25px;
		}
    </style>
    <link rel="stylesheet" type="text/css" href="${path}buss/reso/wisprint/css/morewis-css/template-design.css?version=2.0.5">
</head>

<body class='print-vie3w'>
    <!-- 条形码对话框 -->
    <!-- 表格属性对话框 -->
    <div id="data-table-options-dialog" class='jp-dialog' title='表格属性设置'
        style='height: 200px; background-color2: gray; background-position: 10px 50%; background-repeat: no-repeat;'>
        <p class='jp-dynamic-option'>
            <span class='jp-field-label'>表头行数:</span> <span> <select size="1" id="table-header-rows">
                    <option value="0">无</option>
                    <option value="1" selected>1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </span>
        </p>
        <p>
            <span id="jp-rows-label" class='jp-field-label'>表体最大行数:</span> <span class="ui-widget"> <select size="1"
                    id="table-body-rows">
                    <!--option value="-1" selected>区域内自动扩展</option-->
                    <option value="1" selected>1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                    <option value="50">50</option>
                    <option value="60">60</option>
                    <option value="70">70</option>
                </select>
            </span>
        </p>
        <p class='jp-dynamic-option'>
            <span class='jp-field-label'>表尾行数:</span> <span class="ui-widget">
                <select size="1" id="table-footer-rows">
                    <option value="0" selected>无</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </span>
        </p>
        <p>
            <span class='jp-field-label'>列数:</span> <span class="ui-widget">
                <select size="1" id="table-columns">
                    <option value="0" selected>自动(按字段数自动扩展)</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                </select>
            </span>
        </p>
        <p>
            <span class='jp-field-label'>有边框线:</span> <span> <input type="checkbox" id="table-no-borders" value="true">
            </span>
        </p>
    </div>
    <div id="jp-border-style-actions" class="jp-border-command dropdown dropdown-tip">
        <ul class="dropdown-menu jp-style-setting">
            <li><a href="#" id='jp-border-style-solid'> <span style='border-top-style: solid'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-dotted'> <span style='border-top-style: dotted'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-dashed'> <span style='border-top-style: dashed'></span>
                </a></li>
        </ul>
    </div>
    <div id="jp-border-width-actions" class="jp-border-command dropdown dropdown-tip">
        <ul class="dropdown-menu jp-style-setting">
            <li><a href="#" id='jp-border-style-1px'> <span style='border-top-width: 1px'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-2px'> <span style='border-top-width: 2px'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-3px'> <span style='border-top-width: 3px'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-4px'> <span style='border-top-width: 4px'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-5px'> <span style='border-top-width: 5px'></span>
                </a></li>
            <li><a href="#" id='jp-border-style-6px'> <span style='border-top-width: 6px'></span>
                </a></li>
        </ul>
    </div>
    <div id="jp-table-actions" class="jp-table-command dropdown">
        <ul class="dropdown-menu">
            <li><a href="#" id='jp-table-htmltext'>转成HTML文本</a></li>
            <li><a href="#" id='jp-table-autowrap'>自动换行</a></li>
            <li class="dropdown-divider-up"></li>
            <li class="dropdown-divider-down"></li>
            <li><a href="#" id='jp-table-merge'>合并单元格</a></li>
            <li><a href="#" id='jp-table-unmerge'>撤销合并</a></li>
            <li class="dropdown-divider-up"></li>
            <li class="dropdown-divider-down"></li>
            <li><a href="#" id='jp-table-insert-1-row-before'>向前插入1行</a></li>
            <li><a href="#" id='jp-table-insert-3-row-before'>向前插入3行</a></li>
            <li><a href="#" id='jp-table-insert-1-row-after'>向后插入1行</a></li>
            <li><a href="#" id='jp-table-insert-3-row-after'>向后插入3行</a></li>
            <li><a href="#" id='jp-table-delete-rows'>删除行</a></li>
            <li class="dropdown-divider-up"></li>
            <li class="dropdown-divider-down"></li>
            <li><a href="#" id='jp-table-insert-1-col-before'>向前插入1列</a></li>
            <li><a href="#" id='jp-table-insert-3-col-before'>向前插入3列</a></li>
            <li><a href="#" id='jp-table-insert-1-col-after'>向后插入1列</a></li>
            <li><a href="#" id='jp-table-insert-3-col-after'>向后插入3列</a></li>
            <li><a href="#" id='jp-table-delete-cols'>删除列</a></li>
            <li class="dropdown-divider-up"></li>
            <li class="dropdown-divider-down"></li>
            <li><a href="#" id='jp-table-body'>设为明细行</a></li>
            <li><a href="#" id='jp-table-page-summary'>设为页汇总行</a></li>
            <li><a href="#" id='jp-table-summary'>设为总计行</a></li>
            <!-- li class="dropdown-divider-up"></li>
			<li class="dropdown-divider-down"></li>
			<li>
				<a href="#" id='jp-break-on-rows' title="指定每页明细行最大可显示行数，超过则分页">固定行数分页模式</a>
			</li>
			<li>
				<a href="#" id='jp-break-on-bottom' title="设置当前表格底边位置，为明细行可扩展的最下边位置，超过则分页">留底分页模式</a>
			</li-->
            <li class="dropdown-divider-up"></li>
            <li class="dropdown-divider-down"></li>
            <li><a href="#" id='jp-table-border'>显示边框</a> <!--  href="#" id='jp-header-repeat'>每页显示表头</a-->
            </li>
        </ul>
    </div>
    <div id="jp-detail-section-actions" class="jp-table-command dropdown">
        <ul class="dropdown-menu">
            <li><a href="#" id='jp-reset-details'>重置明细行</a></li>
        </ul>
    </div>
    <!--LINEPROPS-->
    <div id="jp-line-actions" class="jp-line-command dropdown">
        <ul class="dropdown-menu" style="height: 360px; width: 400px; padding: 10px 15px;">
            <ul style="width: 40%; float: left; margin-right: 20px; padding: 0px;">
                <li><a class="jp-style-setting" href="#" id='jp-border-style-1px'> <span
                            style='border-top-width: 1px'></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-2px'> <span
                            style='border-top-width: 2px'></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-3px'> <span
                            style='border-top-width: 3px'></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-4px'> <span
                            style='border-top-width: 4px'></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-5px'> <span
                            style='border-top-width: 5px'></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-6px'> <span
                            style='border-top-width: 6px'></span>
                    </a></li>
                <li class="dropdown-divider-up"></li>
                <li class="dropdown-divider-down"></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-solid'> <span
                            style='border-top-style: solid; border-top-width: 2px'></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-dotted'> <span
                            style='border-top-style: dotted' ;border-top-width: 2px></span>
                    </a></li>
                <li><a class="jp-style-setting" href="#" id='jp-border-style-dashed'> <span
                            style='border-top-style: dashed' ;border-top-width: 2px></span>
                    </a></li>
            </ul>
            <ul class='jp-color-chooser' style="width: 40%; float: left; padding: 0px 10px;">
                <li><a href="#" id='jp-line-color'>颜色</a></li>
            </ul>
        </ul>
    </div>
    <!--/LINEPROPS-->
    <div id="jp-text-actions" class="jp-text-command dropdown">
        <ul class="dropdown-menu">
            <li><a href="#" id='jp-word-wrap'>自动折行</a></li>

        </ul>
    </div>
    <!-- 出错提示对话框 -->
    <div id="jp-error-dialog" title='出错了!' class='jp-dialog'>
        <p class='jp-error-text'></p>
    </div>
    <!-- 新建报表模板 local -->
    <div id="jp-new-dialog" class='jp-dialog' title='设置' >
        <form class='form-inline'>
            <h2 class="setting-small-title">纸张设置</h2>
            <p>
                <span class='jp-field-label'>纸张：</span> <select class='form-control input-sm' id='jp-paper-name'
                    size="1" style='width: 150px'>
                    <option value="420,594" selected>A2</option>
                    <option value="297,420">A3</option>
                    <option value="210,297">A4</option>
                    <option value="148,210">A5</option>
                    <option value="105,148">A6</option>
                    <option value="500,707">B2</option>
                    <option value="353,500">B3</option>
                    <option value="250,353">B4</option>
                    <option value="176,250">B5</option>
                    <option value="125,176">B6</option>
                    <option value="">自定义纸张</option>
                </select>
            </p>
            <p>
                <span class='jp-field-label'></span> <input class='form-control input-sm' id='jp-paper-width'
                    style='width: 60px;' autocomplete="off"></input> mm(宽) X <input class='form-control input-sm' id='jp-paper-height'
                    style='width: 60px;' autocomplete="off"></input> mm(高)
            </p>
            <p id="settingJpOrientation" class='jp-orientation' style='display: none;line-height: 50px; height: 50px;'>
                <span class='jp-field-label'></span> <span class='jp-orientation-icon'></span> <input type='radio'
                    name='jp-paper-orientation' id='jp-paper-portrait' value='|'></input>
                <label for='jp-paper-portrait'>纵向</label> <input type='radio' name='jp-paper-orientation'
                    id='jp-paper-landscape' style='margin-left: 15px;' value='-'></input> <label
                    for='jp-paper-landscape'>横向</label>
            </p>
            <br>
            <div style='position: relative; overflow: hidden'>
                <span class='jp-field-label'>底图：</span>
                <div class='jp-local' style='display: inline;'>
                    <div class="input-group">
                        <div class="form-group has-feedback has-clear">
                            <input class='form-control input-sm' type='text' id='jp-image-src'
                                style='width: 260px;'></input> <span
                                class="form-control-clear glyphicon glyphicon-remove form-control-feedback hidden"></span>
                        </div>
                        <span class="input-group-btn">
                            <button class='btn btn-default btn-sm' id='jp-file-chooser'>浏览...</button>
                        </span>
                    </div>

                </div>
                <input class='jp-remote form-control input-sm' type='file' id='jp-file-input' name='jp-file-input'
                    style='position: absolute; top: 0px; border: solid 1px black; height: 23px; width: 65px; vertical-align: bottom; display: block; right: 40px; display: none;'
                    value='选择文件...'></input>
            </div>
            <p class='jp-background-settings middle' style='margin-top: 5px; line-height: 24px;'>
                <span class='jp-field-label'>透明度：</span> <span id="jp-alpha"
                    style='margin-left: 6px; padding-left: 200px; display: inline-block;'></span>
                <br> <span class='jp-field-label'>比例：</span> <input type='radio' name='jp-background-ratio'
                    id='jp-stretch' value='jp-stretch'> <label for='jp-stretch'>铺满</label> <input type='radio'
                    name='jp-background-ratio' id='jp-keep-width' value='jp-keep-width'> <label
                    for='jp-keep-width'>宽度优先</label>
                <input type='radio' name='jp-background-ratio' id='jp-keep-height' value='jp-keep-height'></input>
                <label for='jp-keep-height'>高度优先</label>
            </p>

            <div style='position: relative; overflow: hidden; display: none;'>
                <span class='jp-field-label'>双面打印：</span> <input type='checkbox' class='jp-duplex'></input>
            </div>
            <div class="label-setting">
		        <h2 class="setting-small-title">标签设置</h2>
	            <div class="flex-row">
		            <span class="jp-field-label">宽(mm)：</span>
		            <div id="jp-label-width"></div>
		            <span class="jp-field-label">高(mm)：</span>
		            <div id="jp-label-height"></div>
	            </div>
	            <div class="flex-row">
		            <span class="jp-field-label">标签行：</span>
		            <div id="jp-label-row"></div>
		            <span class="jp-field-label">标签列：</span>
		            <div id="jp-label-column"></div>
	            </div>
	            <div class="flex-row">
		            <span class="jp-field-label">水平间距(mm)：</span>
		            <div id="jp-label-horizontal"></div>
		            <span class="jp-field-label">垂直间距(mm)：</span>
		            <div id="jp-label-vertical"></div>
	            </div>
            </div>
        </form>
    </div>

    <div id="jp-v-offset-dialog" class='jp-dialog' title='上下偏移调整'
        style='height: 400px; background-color2: gray; background-position: 10px 50%; background-repeat: no-repeat;'>
        <div class='jp-orientation' style='float: right; margin-top: 220px; line-height: 32px; height: 150px;'>
            <p style='padding: 0; margin: 0;'>
                <input type='radio' name='jp-paper-orientation' id='jp-paper-down' checked="checked"></input> <label
                    for='jp-paper-down'>往下偏</label> <input type='radio' name='jp-paper-orientation' id='jp-paper-up'
                    style='margin-left: 15px;' value='-'></input> <label for='jp-paper-up'>往上偏</label>
            </p>
            <label for='jp-paper-landscape'>偏多少(mm):</label> <input id='jp-paper-offset'
                style='width: 50px; margin-left: 5px;' value='0.0'></input>
        </div>
    </div>
    <!-- 左右偏移调整 -->
    <div id="jp-h-offset-dialog" class='jp-dialog' title='左右偏移调整'
        style='height: 100%; background-position: 10px 10px; background-repeat: no-repeat;'>
        <div style='position: absolute; bottom: 0; right: 50px; line-height: 32px;'>
            <p style='padding: 0; margin: 0;'>
                <input type='radio' name='jp-paper-orientation' id='jp-paper-left' checked="checked"></input> <label
                    for='jp-paper-left'>往左偏</label> <input type='radio' name='jp-paper-orientation' id='jp-paper-right'
                    style='margin-left: 15px;' value='-'></input> <label for='jp-paper-right'>往右偏</label> <label
                    for='jp-paper-landscape' style='width: 50px; margin-left: 100px;'>偏多少(mm):</label> <input
                    id='jp-paper-offset' style='width: 50px;' value='0.0'></input>
            </p>
        </div>
    </div>
    <!-- 模板创建代码查看 -->
    <div id="jp-source-code-dialog" title='代码查看' style='overflow: hidden;' class='jp-dialog'>
        <div class='jp-toolbar-transparent' style='margin-bottom: 3px;'>
            <div class="jp-button-set" style='float: right; margin-bottom: 5px;'>
                <a href="#" class='jp-copy-code' id='jp-copy-code' title='复制代码'></a>
                <a href="#" class='jp-save-code' id='jp-save-code' title='保存'></a>
            </div>
            <div style='float: right; padding-top: 3px; margin-right: 25px;'>
                <input type='checkbox' checked id='jp-debug-code' title='生成的代码包含打印预览、提示打印、直接打印按钮代码'> <label
                    for='jp-debug-code' title='生成的代码包含打印预览、提示打印、直接打印按钮代码'>包含测试按钮</label>
                <input type='checkbox' checked id='jp-cross-browser' title='生成的代码支持除 IE 外的浏览器，如firefox,chrome,safari'>
                <label for='jp-cross-browser' title='生成的代码支持除 IE 外的浏览器，如firefox,chrome,safari'>跨浏览器支持</label>
            </div>
        </div>
        <div id='jp-code'
            style='padding: 0; margin: 0; height: 400px; overflow: hidden; position: relative; width: 100%;'></div>
        <textarea id='jp-plain-code' style='display: none'></textarea>
    </div>
    <!-- 组件面板,在新建套打模板时使用 -->
    <div id="jp-comp-list-dialog" title='可用组件' class='jp-dialog'>
        <div class="ui-layout-north center-panel ppms-bk jp-hidden" style='line-height2: 1.8; padding-bottom: 2em;'>
            <span style="width: 4em; display: none;">报表ID</span> <input class='id-input'
                style='display: none; width: 10em; margin-bottom: 2px'></input> <br>
        </div>
        <div class="ui-layout-center center-panel ppms-bk">
            <div id='jp-datasource-name' class="ppms-bk" style='text-align: right; display: none;'></div>
        </div>
    </div>
    <div id="jp-template-save-dialog" class='jp-dialog' title="保存">
        <form class='form-inline xs'>
            <!-- <div>
				<span style='width: 50px;' class='jp-field-label'>ID:</span>
				<span class='id-display'></span>
			</div> -->
            <div style='margin-top: 1em;'>
                <span style='width: 50px;' class='jp-field-label'>名称:</span> <input class="form-control input-sm"
                    type="text" style="width: 300px;" id='name'></input>
            </div>
            <!-- div style='margin-top: 1em;'>
				<span style='width: 50px;' class='jp-field-label'>审批人:</span>
				<span>
					<select size="1" name="font-name" id="auditor">
					</select>
				</span>
			</div-->
        </form>
    </div>
    <div class="viewport">
        <!-- 工具栏 -->
        <div style="z-index: 10000;" class='jp-main-tools jp-toolbar jp-common-command '>
            <div class="btn-group jp-commands">
                <a href="#" data-tooltip="页面设置" class='btn btn-default' id='jp-layout'>
                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/setting.png"></img>
                </a> <a href="#" data-tooltip="预览" class='btn btn-default jp-test-print jp-view111' id='jp-test-print'>
                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/print.png"></img>
                </a> <a href="#" data-tooltip='保存本次设计' class='btn btn-default jp-view111' id='openSaveTmp'>
                    <!-- jp-upload-template --> <img src="${path}buss/reso/wisprint/images/wisprint/template-design/save.png"></img>
                </a> <a href="#" data-tooltip='导出模板' class='btn btn-default  jp-export jp-view111' id='jp-export'> <img
                        src="${path}buss/reso/wisprint/images/wisprint/template-design/output.png"></img>
                </a>
            </div>
            <div class="btn-group">
                <a href="#" data-tooltip='编辑命令' class="btn btn-default" data-toggle="dropdown" role="button"
                    style='border-bottom-right-radius: 4px; border-top-right-radius: 4px;'>
                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit.png"></img>
                    <!-- <span class="glyphicon glyphicon-pencil" style='margin-right: 0.5em'></span> -->
                    <span class="caret"></span>
                </a>
                <ul class="dropdown-menu has-icons" style='left: 0px; right2: 0px;'>
                    <li><a href="#" id='jp-undo'> 撤销 <kbd>Ctrl+z</kbd>
                        </a></li>
                    <li><a href="#" id='jp-redo'> 重做 <kbd>Ctrl+y</kbd>
                        </a></li>
                    <li><a href="#" id='jp-copy'> 复制 <kbd>Ctrl+c</kbd>
                        </a></li>
                    <li><a href="#" id='jp-cut'> 剪切 <kbd>Ctrl+x</kbd>
                        </a></li>
                    <li><a href="#" id='jp-paste'> 粘贴 <kbd>Ctrl+v</kbd>
                        </a></li>
                    <li><a href="#" id='jp-delete'> 删除 <kbd>Del</kbd>
                        </a></li>

                </ul>
            </div>
            <div class="btn-group new" style="display: none;">
                <a href="#" class="btn btn-default" id='jp-new-label' title='新建标签'>
                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/label.png"></img>
                </a>
                <!-- <a href="#" class="btn btn-default" id='jp-new-text' title='新建文本字段'>
                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/text.png"></img>
                </a> -->
                <!-- <a href="#" class="btn btn-default" id='jp-new-html-text' title='新建HTML文本'>
					<img src="${path}buss/reso/wisprint/images/wisprint/template-design/html-text.png"></img>
				</a> -->
                <div class="btn-group">
                    <a href="#bar-type" class="btn btn-default" id='jp-new-barcode2' data-toggle="dropdown"
                        data-target='bar-type' role="button" title='新建条形码'> <img
                            src="${path}buss/reso/wisprint/images/wisprint/template-design/barcode.png"></img> <span class="caret"></span>
                    </a>
                    <ul class="dropdown-menu" id="jp-barcode-chooser">
                        <li><a href="#" code-type='code39'>Code 39</a></li>
                        <li><a href="#" code-type='code93'>Code 93</a></li>
                        <li><a href="#" code-type='2of5'>Code 2 of 5</a></li>
                        <li><a href="#" code-type='code128'>Code 128</a></li>
                        <li><a href="#" code-type='code128a'>Code 128A</a></li>
                        <li><a href="#" code-type='code128b'>Code 128B</a></li>
                        <li><a href="#" code-type='code128c'>Code 128C</a></li>
                        <li><a href="#" code-type='ean13'>Ean 13</a></li>
                        <li><a href="#" code-type='upc'>UPC-A</a></li>
                        <li><a href="#" code-type='upce'>UPC-E</a></li>

                        <li><a href="#" code-type='rm'>Royal Mail CBC</a></li>
                        <li class="dropdown-divider-up"></li>
                        <li class="dropdown-divider-down"></li>
                        <li><a href="#" code-type='pdf417'>PDF 417</a></li>
                        <li><a href="#" code-type='qr'>QR Code</a></li>
                        <li><a href="#" code-type='datamatrix'>DataMatrix</a></li>
                    </ul>
                </div>
                <a href="#" class="btn btn-default" id='jp-new-image' title='新建图像'>
                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/image.png"></img>
                </a>
                <!--EXTLOGO-->
                <!-- 				<a href="#" class="btn btn-default" id='jp-new-logo' title='新建LOGO'>
					<i class="glyphicon glyphicon-send" aria-hidden="true"></i>
				</a> -->

                <a href="#" class="btn btn-default" id='jp-registration-mark' title='商标'> <img
                        src="${path}buss/reso/wisprint/images/icon/registration-mark.svg" style="width: 16px; height: 16px;"></img>
                </a>

                <div class="btn-group">
                    <a href="#bar-type" class="btn btn-default" id='jp-new-barcode2' data-toggle="dropdown"
                        data-target='bar-type' role="button" title='新建图形'> <img
                            src="${path}buss/reso/wisprint/images/wisprint/template-design/line.png"></img> <span class="caret"></span>
                    </a>
                    <ul class="dropdown-menu" id="jp-barcode-chooser2" style="width2: 70px; min-width: 0">

                        <!--SVGSHAPE-->
                        <li style="padding: 2px 5px;"><a
                                style="display: inline-block; width: 30px; padding: 3px 20px 4px 6px;" href="#"
                                class="btn btn-default" id='jp-new-line' title='新建线条'>
                                <img src="${path}buss/reso/wisprint/images/line.png"></img>
                            </a></li>
                        <li style="padding: 2px 5px;"><a
                                style="display: inline-block; width: 30px; padding: 3px 20px 4px 6px;" href="#"
                                class="btn btn-default" id='jp-new-rect' title='新建长方形'>
                                <img src="${path}buss/reso/wisprint/images/rect.png"></img>
                            </a></li>




                        <li style="padding: 2px 5px;"><a
                                style="display: inline-block; width: 30px; padding: 3px 20px 4px 6px;" href="#"
                                class="btn btn-default" id='jp-new-circle' title='新建圆'>
                                <img src="${path}buss/reso/wisprint/images/ellipse.png"></img>
                            </a></li>



                        <!--/SVGSHAPE-->


                    </ul>
                </div>

                <div class="btn-group">
                    <a href="#" id='jp-new-table' title='新建表格' class="btn btn-default" data-toggle="dropdown"
                        role="button" style='border-bottom-right-radius: 4px; border-top-right-radius: 4px;'>
                        <img src="${path}buss/reso/wisprint/images/wisprint/template-design/table.png"></img> <span class="caret"></span>
                    </a>
                    <div class="dropdown-menu" aria-labelledby="jp-new-table"
                        style='left: 0px; width: 222px; height: 250px; background: #ECECEC;'>
                        <div class="jp-new-table-chooser" style="width: 100%; height: 100%; background: #ECECEC;">
                            <div style="height: 25px; line-height: 25px; padding: 2px 10px;" id='jp-table-dim-caption'>
                                插入表格</div>
                            <div class="dropdown-divider-up"></div>
                            <div class="dropdown-divider-down"></div>
                            <div style="height2: 25px; background: white; position: relative; padding: 2px 0;">
                                <table
                                    style="display2: none; position: relative; width: 200px; height: 200px; border-spacing: 2px; border-collapse: separate; margin: auto;">
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </table>
                            </div>
                            <div class="dropdown-divider-up"></div>
                            <div class="dropdown-divider-down"></div>
                        </div>
                    </div>

                </div>


            </div>
            <!-- 放大工具 -->
            <div class="page-magnification-tool">
	            <div class="com-menu">
		            <div id="magnification-num" class="com-menu-input">100%</div>
		            <ul id="select-scale" class="com-menu-list">
		                <li data-value="4">400%</li>
		                <li data-value="2">200%</li>
		                <li data-value="1.5">150%</li>
		                <li data-value="1">100%</li>
		                <li data-value="0.7">70%</li>
		            </ul>
		        </div>
            	<!-- <input id="magnification-num" type="text" readonly /> -->
            	<button type="button" data-type="add" data-tooltip="放大焦距（Alt + Mousewheel）" data-max-width="none">
            		<span class="iconfont icon-zoom-in"></span>
            	</button>
            	<button type="button" data-type="decrease" data-tooltip="减小焦距（Alt + Mousewheel）最小为70%" data-max-width="none">
            		<span class="iconfont icon-zoom-out"></span>
				</button>
            </div>
            <div class="template-name">
            	<!--<span id="save-success" class="scm-tag animate__animated" style="display:none;">保存成功</span>
            	<div class="scm-tooltip" data-tooltip="开启后每分钟保存一次" style="display:none">
                	<span>自动保存</span>
            	</div>  -->
                <span id="autoSaveSwitch" class="switch" ison="true" onclick="upStatus(this, 'autoSave')" style="display:none"></span>
                <span class="required">模板名称</span>
				<input id="tmpName" type="text" placeholder="请输入模板名称" />
            </div>
        </div>

        <div class='viewport-body'>
            <div class="left-bar scroll">
                <ul class="jp-common-command">
                    <li>
                      <a href="#" class="tool-title"><span class="caret"></span>条码</a>
                      <div class="tool-content" style="margin: 0 13px">
                        <div class="tool-type">
                          <img src="${path}buss/reso/wisprint/images/wisprint/template-design/one-code.png" />一维码
                        </div>
                        <ul
                          class="tool-list"
                          id="jp-barcode-chooser"
                          style="border-bottom: 1px solid #e8e8e8"
                        >
                          <li><a href="#" code-type="code39">Code 39</a></li>
                          <li><a href="#" code-type="code93">Code 93</a></li>
                          <li><a href="#" code-type="2of5">Code 2 of 5</a></li>
                          <li><a href="#" code-type="code128">Code 128</a></li>
                          <li><a href="#" code-type="code128a">Code 128A</a></li>
                          <li><a href="#" code-type="code128b">Code 128B</a></li>
                          <li><a href="#" code-type="code128c">Code 128C</a></li>
                          <li><a href="#" code-type="ean13">Ean 13</a></li>
                          <li><a href="#" code-type="upc">UPC-A</a></li>
                          <li><a href="#" code-type="upce">UPC-E</a></li>
                          <li><a href="#" code-type="rm">Royal Mail CBC</a></li>
                        </ul>
              
                        <div class="tool-type">
                          <img src="${path}buss/reso/wisprint/images/wisprint/template-design/QR-code.png" />二维码
                        </div>
                        <ul class="tool-list" id="jp-barcode-chooser">
                          <li><a href="#" code-type="pdf417">PDF 417</a></li>
                          <li><a href="#" code-type="qr">QR Code</a></li>
                          <li><a href="#" code-type="datamatrix">DataMatrix</a></li>
                        </ul>
                      </div>
                    </li>
              
                    <li>
                      <a href="#" class="tool-title"><span class="caret"></span>文本</a>
                      <ul class="tool-content tool-group">
                        <li class="tool-type">
                          <a href="#" id="jp-new-label" title="新建标签"
                            ><img
                              src="${path}buss/reso/wisprint/images/wisprint/template-design/label.png"
                            />普通文本</a
                          >
                        </li>
                        <li class="tool-type">
                          <a href="#" id="jp-new-text" title="新建文本字段"
                            ><img src="${path}buss/reso/wisprint/images/wisprint/template-design/text.png" />数据文本</a
                          >
                        </li>
                      </ul>
                    </li>
              
                    <li>
                      <a href="#" class="tool-title"
                        ><span class="caret"></span>基础图形、线</a
                      >
                      <ul class="tool-content tool-group">
                        <li class="tool-type">
                          <a href="#" id="jp-new-rect" title="新建长方形"
                            ><img src="${path}buss/reso/wisprint/images/rect.png" />矩形</a
                          >
                        </li>
                        <li class="tool-type">
                          <a href="#" id="jp-new-circle" title="新建圆"
                            ><img src="${path}buss/reso/wisprint/images/ellipse.png" />圆</a
                          >
                        </li>
                        <li class="tool-type">
                          <a href="#" id="jp-new-line" title="新建线条"
                            ><img src="${path}buss/reso/wisprint/images/line.png" />线</a
                          >
                        </li>
                      </ul>
                    </li>
              
                    <li>
                      <a href="#" class="tool-title"><span class="caret"></span>图片</a>
                      <ul class="tool-content tool-group">
                        <li class="tool-type">
	                      	<a href="#" id="jp-new-image" title="新建图像">
			                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/image.png">新建图像
			                </a>
                        </li>
                        <li class="tool-type">
                          <a href="#" id="jp-registration-mark" title="商标"
                            ><img
                              src="${path}buss/reso/wisprint/images/icon/registration-mark.svg"
                              style="width: 16px; height: 16px"
                            />R.jpg</a
                          >
                        </li>
                      </ul>
                    </li>
              
                    <li>
                      <a href="#" class="tool-title"><span class="caret"></span>表格</a>
                      <ul class="tool-content tool-group table-tool">
                        <li class="tool-type">
                          <div class="btn-group">
                              <a href="#" id='jp-new-table' title='新建表格' class="btn btn-default" data-toggle="dropdown"
                                  role="button">
                                  <img src="${path}buss/reso/wisprint/images/wisprint/template-design/table.png"></img>
                                  <span>新建表格</span>
                                  <!--  <span class="caret"></span> -->
                              </a>
                              <div class="dropdown-menu" aria-labelledby="jp-new-table"
                                  style='left: 10px; width: 222px; height: 250px; background: #ECECEC;'>
                                  <div class="jp-new-table-chooser" style="width: 100%; height: 100%; background: #ECECEC;">
                                      <div style="height: 25px; line-height: 25px; padding: 2px 10px;" id='jp-table-dim-caption'>
                                          插入表格</div>
                                      <div class="dropdown-divider-up"></div>
                                      <div class="dropdown-divider-down"></div>
                                      <div style="height2: 25px; background: white; position: relative; padding: 2px 0;">
                                          <table
                                              style="display2: none; position: relative; width: 200px; height: 200px; border-spacing: 2px; border-collapse: separate; margin: auto;">
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                              <tr>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                                  <td></td>
                                              </tr>
                                          </table>
                                      </div>
                                      <div class="dropdown-divider-up"></div>
                                      <div class="dropdown-divider-down"></div>
                                  </div>
                              </div>
              
                          </div>
              
                        </li>
                      </ul>
                    </li>
                    
                    <li id="custom-field-container" hidden>
                      <a href="#" class="tool-title"><span class="caret"></span>数据项</a>
                      <ul class="tool-content tool-group">
                        <li class="tool-type">
                			<button class="open-custom-field" type="button">
                				<span class="iconfont icon-setting"></span>
                				<span>自定义数据项</span>
                			</button>  
                        </li>
                      </ul>
                    </li>
                </ul>
			</div>
            	<div class="jp-ruler-view">
	                <div class="top-ruler ef-ruler"></div>
	                <div class="left-ruler ef-ruler"></div>
	                <div class='jp-content'>
	                    <div id="jp-page" class='jp-page jp-portrait jp-hidden content-div'
	                        style='z-index: 1; margin: 5px; position: relative; width: 210mm; height: 297mm; box-shadow: 0 0 13px rgba(0, 0, 0, 0.31);'>
	                        <img class='jp-paper-background jp-stretch screen-only' src='${path}buss/reso/wisprint/images/blank.png'></img>
	                        <div class="jp-bands"
	                            style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; opacity: .3; display: flex; flex-direction: column;"  tabindex = "0">
	                            <div id='jp-header'
	                                style="height: 80px; background-color2: green; border-bottom: 1px gray solid">页眉
	                            </div>
	                            <div id="jp-body" style="flex-grow: 1; height: 1px; background-color2: blue;">
	                                页主体
	                                <div contenteditable style='width: 100%; height: 100%;' class='jp-text-content'>hello;
	                                </div>
	                            </div>
	                            <div id="jp-footer"
	                                style="height: 80px; background-color2: green; border-top: 1px gray solid">页脚</div>
	                        </div>
	                        <p class='jp-h-ruler jp-ruler-element'></p>
	                        <p class='jp-v-ruler jp-ruler-element'></p>
	                    </div>
	
	                    <div class='jp-for-layout-outer'
	                        style='left: 0; top: 0; bottom: 0; right: 0; position: absolute; background: #633737; overflow: hidden; margin: auto auto;'>
	                        <div class='jp-for-layout'
	                            style='overflow: hidden; margin: 0; position: absolute; width: 210mm; height: 297mm; box-shadow: 0 0 13px rgba(0, 0, 0, 0.31); border: solid 1px gray; transform-origin2: 0 0; -ms-transform-origin2: 50% 60%; -webkit-transform-origin2: 50% 50%; background: #fff'>
	                        </div>
	                    </div>
	
	                    <p></p>
	                </div>
	            </div>
            <div class="right-bar ">
                <div class='chizi' style='width: 100mm'></div>
                <div class="tablist">
                    <span class="tab tab-active" data-index="1">属性</span> <span id="label-data-item" class="tab" data-index="2">数据</span>
                </div>
                <div class="tab-container">
                    <div class="tab-item" data-index="1">
                        <ul class="jp-common-command">
                            <li>
                              <a href="#" class="tool-title"><span class="caret"></span>尺寸位置</a>
                              <div class="tool-content jp-bottom-bar" style="margin: 0 12px 16px">
                                <div class="tool-type">尺寸(mm)</div>
                                <div class="tool-group">
                                  <div class="tool-size">
                                    <span>宽:</span><input id="jp-width-input" not=".fixed" />
                                  </div>
                                  <div class="tool-size">
                                    <span>高:</span><input id="jp-height-input" not=".fixed" />
                                  </div>
                                </div>
                                <div class="tool-type">位置(mm)</div>
                                <div class="tool-group">
                                  <div class="tool-size">
                                    <span>X:</span><input id="jp-left-input" />
                                  </div>
                                  <div class="tool-size">
                                    <span>Y:</span><input id="jp-top-input" />
                                  </div>
                                </div>
                              </div>
                            </li>
                      		<!-- 文本设置 -->
                            <li id="jp-text-design" hidden>
	                            <a href="#" class="tool-title"><span class="caret"></span>文本属性</a>
	                            <div class="tool-content">
								    <div id="jp-text-dialog" title='文本属性'>
								        <form class='form-inline'>
								            <p>
								                <span class='jp-field-label'>绑定到:</span> <span class='jp-field-selector xs'></span>
								            </p>
								        </form>
								    </div>
							    </div>
                            </li>
                      		<!-- 一维码设置 -->
                            <li id="jp-bar-1d-design" hidden>
                              <a href="#" class="tool-title"><span class="caret"></span>BAR-1D设置</a>
                              <div class="tool-content">
                                <div id="jp-bar-1d-dialog" title="BAR-1D设置">
						        <p style="flex-wrap: wrap;">
						            <span class='jp-field-label'>绑定到:</span> <span class='jp-field-selector' style="margin-bottom: 8px;"></span>
						        </p>
                                  <p>
                                    <span class="jp-field-label">背景色:</span>
                                    <span>
                                      <input
                                        type="text"
                                        id="jp-bar-background"
                                        name="background"
                                        size="20"
                                        style="vertical-align: middle"
                                        class="jp-code-ui jp-color-chooser jp-with-transparent"
                                      />
                                    </span>
                                  </p>
                                  <p>
                                    <span class="jp-field-label">码条颜色:</span>
                                    <span>
                                      <input
                                        type="text"
                                        id="jp-bar-color"
                                        name="bar-color"
                                        size="20"
                                        style="vertical-align: middle"
                                        class="jp-code-ui jp-color-chooser"
                                      />
                                    </span>
                                  </p>
                                  <p>
                                    <span class="jp-field-label">空码条颜色:</span>
                                    <span>
                                      <input
                                        type="text"
                                        id="jp-space-color"
                                        name="space-color"
                                        size="20"
                                        style="vertical-align: middle"
                                        class="jp-code-ui jp-color-chooser jp-with-transparent"
                                      />
                                    </span>
                                  </p>
                                  <p>
                                    <span class="jp-field-label">显示文字码:</span>
                                    <span>
                                      <input
                                        type="checkbox"
                                        id="jp-show-text"
                                        value="true"
                                        name="show-text"
                                        class="jp-code-ui"
                                      />
                                    </span>
                                  </p>
                                  <p style="height: 31px;">
                                    <span style="display: inline-block; width: 58%" class="tool-font">
                                      <select
                                        size="1"
                                        name="font-name"
                                        id="jp-font-name"
                                        class="jp-code-ui"
                                      >
                                        <option value="" selected></option>
                                      </select>
                                    </span>
                                    <span style="display: inline-block; width: 40%" class="tool-font">
                                      <select size="1" name="font-size" class="jp-code-ui">
                                        <option value="" selected></option>
                                        <option value="11">11</option>
                                        <option value="12">12</option>
                                        <option value="13">13</option>
                                        <option value="14">14</option>
                                        <option value="15">15</option>
                                        <option value="16">16</option>
                                        <option value="17">17</option>
                                        <option value="18">18</option>
                                        <option value="19">19</option>
                                        <option value="20">20</option>
                                      </select>
                                    </span>
                                  </p>
                                  <p>
                                    <span class="jp-field-label">文本颜色:</span>
                                    <span>
                                      <input
                                        type="text"
                                        id="jp-text-color"
                                        name="text-color"
                                        size="20"
                                        style="vertical-align: middle"
                                        class="jp-code-ui jp-color-chooser"
                                      />
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </li>
                            <!--pdf417二维码设置 -->
                      		<li id="jp-pdf417-design" hidden>
                              <a href="#" class="tool-title"><span class="caret"></span>PDF 417 设置</a>
                              	<div class="tool-content">
                      			<div id='jp-pdf417-dialog' title='PDF 417 设置' class='jp-dialog xs'>
							        <p>
							            <span class='jp-field-label'>绑定到:</span> <span class='jp-field-selector'></span>
							        </p>
							        <p>
							            <span class='jp-field-label'>数据列数(1-30):</span> <span> <select size="1" name="data-cols" class='jp-code-ui'>
							                    <option value="" selected></option>
							                    <option value="1">1</option>
							                    <option value="2">2</option>
							                    <option value="3">3</option>
							                    <option value="4">4</option>
							                    <option value="5">5</option>
							                    <option value="6">6</option>
							                    <option value="7">7</option>
							                    <option value="8">8</option>
							                    <option value="9">9</option>
							                    <option value="10">10</option>
							                    <option value="11">11</option>
							                    <option value="12">12</option>
							                    <option value="13">13</option>
							                    <option value="14">14</option>
							                    <option value="15">15</option>
							                    <option value="16">16</option>
							                    <option value="17">17</option>
							                    <option value="18">18</option>
							                    <option value="19">19</option>
							                    <option value="20">20</option>
							                    <option value="21">21</option>
							                    <option value="22">22</option>
							                    <option value="23">23</option>
							                    <option value="24">24</option>
							                    <option value="25">25</option>
							                    <option value="26">26</option>
							                    <option value="27">27</option>
							                    <option value="28">28</option>
							                    <option value="29">29</option>
							                    <option value="30">30</option>
							                </select>
							            </span>
							        </p>
							        <p>
							            <span class='jp-field-label'>数据行数(3-90):</span> <span> <select size="1" name="data-rows" class='jp-code-ui'>
							                    <option value="" selected></option>
							                    <option value="3">3</option>
							                    <option value="4">4</option>
							                    <option value="5">5</option>
							                    <option value="6">6</option>
							                    <option value="7">7</option>
							                    <option value="8">8</option>
							                    <option value="9">9</option>
							                    <option value="10">10</option>
							                    <option value="11">11</option>
							                    <option value="12">12</option>
							                    <option value="13">13</option>
							                    <option value="14">14</option>
							                    <option value="15">15</option>
							                    <option value="16">16</option>
							                    <option value="17">17</option>
							                    <option value="18">18</option>
							                    <option value="19">19</option>
							                    <option value="20">20</option>
							                    <option value="21">21</option>
							                    <option value="22">22</option>
							                    <option value="23">23</option>
							                    <option value="30">30</option>
							                    <option value="40">40</option>
							                    <option value="50">50</option>
							                    <option value="60">60</option>
							                    <option value="70">70</option>
							                    <option value="80">80</option>
							                    <option value="90">90</option>
							                </select>
							            </span>
							        </p>
							        <p>
							            <span class='jp-field-label'>纠错等级(0-7):</span> <span> <select size="1" name="err-level" class='jp-code-ui'>
							                    <option value="" selected></option>
							                    <option value="0">0</option>
							                    <option value="1">1</option>
							                    <option value="2">2</option>
							                    <option value="3">3</option>
							                    <option value="4">4</option>
							                    <option value="5">5</option>
							                    <option value="6">6</option>
							                    <option value="7">7</option>
							                </select>
							            </span>
							        </p>
							        <p>
							            <span class='jp-field-label'>背景色:</span> <span> <input type="text" id="jp-bar-background" name="background"
							                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser jp-with-transparent" />
							            </span>
							        </p>
							        <p>
							            <span class='jp-field-label'>码条颜色:</span> <span> <input type="text" id="jp-bar-color" name="bar-color"
							                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser">
							            </span>
							        </p>
							        <p>
							            <span class='jp-field-label'>空码条颜色:</span> <span> <input type="text" id="jp-space-color" name="space-color"
							                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser jp-with-transparent">
							            </span>
							        </p>
							    </div>
                      			</div>
                      		</li>
                      		<!-- qr二维码设置 -->
                      		<li id="jp-qr-design" hidden>
                              	<a href="#" class="tool-title"><span class="caret"></span>qr 设置</a>
                              	<div class="tool-content">
		                      		<div id='jp-qr-dialog' title='QRCode 设置' class='jp-dialog xs'>
								        <p>
								            <span class='jp-field-label'>绑定到:</span> <span class='jp-field-selector'></span>
								        </p>
								        <p>
								            <span class='jp-field-label'>版本号(1-40)-(l/m/q/h):</span> <span>
								                <select size="1" id='jp-qr-version' name="ver" class='jp-code-ui qr-version'>
								                    <option value="" selected></option>
								                    <option value="1">1</option>
								                    <option value="2">2</option>
								                    <option value="3">3</option>
								                    <option value="4">4</option>
								                    <option value="5">5</option>
								                    <option value="6">6</option>
								                    <option value="7">7</option>
								                    <option value="8">8</option>
								                    <option value="9">9</option>
								                    <option value="10">10</option>
								                    <option value="11">11</option>
								                    <option value="12">12</option>
								                    <option value="13">13</option>
								                    <option value="14">14</option>
								                    <option value="15">15</option>
								                    <option value="16">16</option>
								                    <option value="17">17</option>
								                    <option value="18">18</option>
								                    <option value="19">19</option>
								                    <option value="20">20</option>
								                    <option value="21">21</option>
								                    <option value="22">22</option>
								                    <option value="23">23</option>
								                    <option value="24">24</option>
								                    <option value="25">25</option>
								                    <option value="26">26</option>
								                    <option value="27">27</option>
								                    <option value="28">28</option>
								                    <option value="29">29</option>
								                    <option value="30">30</option>
								                    <option value="21">31</option>
								                    <option value="22">32</option>
								                    <option value="23">33</option>
								                    <option value="24">34</option>
								                    <option value="25">35</option>
								                    <option value="26">36</option>
								                    <option value="27">37</option>
								                    <option value="28">38</option>
								                    <option value="29">39</option>
								                    <option value="30">40</option>
								                </select>
								            </span> <span> <select size="1" id='jp-qr-version-2' name="err-level" class='jp-code-ui'>
								                    <option value="" selected></option>
								                    <option value="l">L</option>
								                    <option value="m">M</option>
								                    <option value="q">Q</option>
								                    <option value="h">H</option>
								                </select>
								            </span>
								        </p>
								        <p>
								            <span class='jp-field-label'>背景色:</span> <span> <input type="text" id="jp-bar-background" name="background"
								                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser jp-with-transparent" />
								            </span>
								        </p>
								        <p>
								            <span class='jp-field-label'>码条颜色:</span> <span> <input type="text" id="jp-bar-color" name="bar-color"
								                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser">
								            </span>
								        </p>
								        <p>
								            <span class='jp-field-label'>空码条颜色:</span> <span> <input type="text" id="jp-space-color" name="space-color"
								                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser jp-with-transparent">
								            </span>
								        </p>
								    </div>
                      			</div>
                      		</li>
                      		<!-- datamatrix二维码设置 -->
                      		<li id="jp-datamatrix-design" hidden>
                              	<a href="#" class="tool-title"><span class="caret"></span>Data Matrix 设置</a>
                      			<div class="tool-content">
                      				<div id='jp-datamatrix-dialog' title='Data Matrix 设置' class='jp-dialog  xs'>
								        <p>
								            <span class='jp-field-label'>绑定到:</span> <span class='jp-field-selector'></span>
								        </p>
								        <p>
								            <span class='jp-field-label'>版本号(1-40)-(l/m/q/h):</span> <span>
								                <select size="1" name="moudles" class='jp-code-ui'>
								                    <option value="" selected></option>
								                    <option value="8x18">8x18</option>
								                    <option value="8x32">8x32</option>
								                    <option value="10x10">10x10</option>
								                    <option value="12x12">12x12</option>
								                    <option value="12x26">12x26</option>
								                    <option value="12x36">12x36</option>
								                    <option value="14x14">14x14</option>
								                    <option value="16x16">16x16</option>
								                    <option value="16x36">16x36</option>
								                    <option value="16x48">16x48</option>
								                    <option value="18x18">18x18</option>
								                    <option value="20x20">20x20</option>
								                    <option value="22x22">22x22</option>
								                    <option value="24x24">24x24</option>
								                    <option value="26x26">26x26</option>
								                    <option value="32x32">32x32</option>
								                    <option value="36x36">36x36</option>
								                    <option value="40x40">40x40</option>
								                    <option value="44x44">44x44</option>
								                    <option value="48x48">48x48</option>
								                    <option value="52x52">52x52</option>
								                    <option value="64x64">64x64</option>
								                    <option value="72x72">72x72</option>
								                    <option value="80x80">80x80</option>
								                    <option value="88x88">88x88</option>
								                    <option value="96x96">96x96</option>
								                    <option value="104x104">104x104</option>
								                    <option value="120x120">120x120</option>
								                    <option value="132x132">132x132</option>
								                </select>
								            </span>
								        </p>
								        <p>
								            <span class='jp-field-label'>背景色:</span> <span> <input type="text" id="jp-bar-background" name="background"
								                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser jp-with-transparent" />
								            </span>
								        </p>
								        <p>
								            <span class='jp-field-label'>码条颜色:</span> <span> <input type="text" id="jp-bar-color" name="bar-color"
								                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser">
								            </span>
								        </p>
								        <p>
								            <span class='jp-field-label'>空码条颜色:</span> <span> <input type="text" id="jp-space-color" name="space-color"
								                    size="20" style='vertical-align: middle;' class="jp-code-ui jp-color-chooser jp-with-transparent">
								            </span>
								        </p>
								    </div>
                      			</div>
                      		</li>
                      		<!-- 图片选择 -->
                      		<li id="jp-image-design" hidden>
                              	<a href="#" class="tool-title"><span class="caret"></span>图片选择</a>
                      			<div class="tool-content">
                      				<div id="jp-image-dialog" title='图片属性' class='jp-dialog xs'>
								        <form class='form-inline'>
								            <p class='field-selector'>
								                <span class='jp-field-label'>绑定到:</span> <span class='jp-field-selector'></span>
								            </p>
								            <div style='position: relative; overflow: hidden; margin-bottom: 1em;'>
								                <span class='jp-field-label'>图片来源:</span>
								                <div class='jp-local' style='display: inline;'>
								                    <div class="input-group">
								                        <div class="form-group has-feedback has-clear">
								                            <input class='form-control input-sm' type='text' id='jp-image-src'
								                                style='width: 140px;' accept="image/png,image/jpeg,image/jpg,image/svg,image/gif"></input> <span
								                                class="form-control-clear glyphicon glyphicon-remove form-control-feedback hidden"></span>
								                        </div>
								                        <span class="input-group-btn">
								                            <button class='btn btn-default btn-sm' id='jp-file-chooser'>选择文件...</button>
								                        </span>
								                    </div>
								                    <!-- 	<input class='form-control input-sm' type='text' id='jp-image-src' style='width: 260px;'></input>
													<button class='btn btn-default btn-sm' id='jp-file-chooser'>浏览...</button> -->
								                </div>
								                <input class='jp-remote form-control input-sm' type='file' id='jp-file-input' name='jp-file-input'
								                    style='position: absolute; top: 0px; border: solid 1px black; height: 23px; width: 65px; vertical-align: bottom; display: block; right: 40px; display: none;'
								                    value='选择文件...' accept="image/png,image/jpeg,image/jpg,image/svg,image/gif"></input>
								            </div>
								            <p class='middle' style="display: flex;justify-content: space-between;">
									            <!-- <input name="source" type="radio" id="field-source" value="field">
												<label for='field-source' style="margin-right: 2em; margin-bottom: 0"> 数据源字段</label> -->
									            <span>
									            	<label class="jp-field-label" for='file-source' style="margin-bottom: 0">图片文件:</label>
									            	<input name="source" type="radio" id="file-source" value="file">
									            </span>
								                <span>
								                	<span class='jp-field-label'>原始大小:</span>
													<input id='jp-original-size' type='checkbox'></input>
								                </span>
								            </p>
								        </form>
								    </div>
                      			</div>
                      		</li>
                      		<!-- 标签设置 -->
                            <li id="label-design">
                              <a href="#" class="tool-title"><span class="caret"></span>标签设置</a>
                              <div class="tool-content">
                                <!-- 字体设置 -->
                                <div class="btn-group jp-font-style" style="margin-top: 7px;">
                                  <select
                                    id="jp-font-chooser"
                                    style="
                                      height: 24px;
                                      float: left;
                                      margin: 2px 5px 2px 2px;
                                      width: 138px;
                                    "
                                  ></select>
                                  <select
                                    id="jp-font-size-chooser"
                                    style="
                                      height: 24px;
                                      float: left;
                                      margin: 2px 5px 2px 2px;
                                      width: 60px;
                                    "
                                  >
                                    <option>3 pt</option>
                                    <option>4 pt</option>
                                    <option>5 pt</option>
                                    <option>6 pt</option>
                                    <option>7 pt</option>
                                    <option>8 pt</option>
                                    <option>9 pt</option>
                                    <option selected>10 pt</option>
                                    <option>11 pt</option>
                                    <option>12 pt</option>
                                    <option>13 pt</option>
                                    <option>14 pt</option>
                                    <option>15 pt</option>
                                    <option>16 pt</option>
                                    <option>17 pt</option>
                                    <option>18 pt</option>
                                    <option>19 pt</option>
                                    <option>20 pt</option>
                                    <option>21 pt</option>
                                    <option>22 pt</option>
                                    <option>24 pt</option>
                                    <option>30 pt</option>
                                    <option>36 pt</option>
                                    <option>40 pt</option>
                                    <option>48 pt</option>
                                    <option>56 pt</option>
                                    <option>72 pt</option>
                                    <option>84 pt</option>
                                  </select>
                                </div>
                                <!-- 字体风格 -->
                                <div style="margin-top: 0.7em">
                                  <a
                                    id="jp-bold"
                                    type="button"
                                    data-toggle="button"
                                    aria-pressed="false"
                                    class="no-border btn btn-default"
                                    title="粗体"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-bold.png" />
                                  </a>
                                  <a
                                    id="jp-italic"
                                    type="button"
                                    data-toggle="button"
                                    aria-pressed="false"
                                    class="no-border btn btn-default"
                                    title="斜体"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-italic.png" />
                                  </a>
                                  <a
                                    id="jp-underline"
                                    type="button"
                                    data-toggle="button"
                                    aria-pressed="false"
                                    class="no-border btn btn-default"
                                    title="下划线"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-underline.png" />
                                  </a>
                                  <div class="btn-group seperator" role="group">|</div>
                                  <a
                                    href="#"
                                    title="字体变大(ctrl+])"
                                    class="no-border btn btn-default"
                                    id="jp-size-up"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-size-up.png" />
                                  </a>
                                  <a
                                    href="#"
                                    title="字体变小(ctrl+[)"
                                    class="no-border btn btn-default"
                                    id="jp-size-down"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-size-down.png" />
                                  </a>
                                  <br />
                                  <a
                                    href="#"
                                    title="居左"
                                    class="no-border btn btn-default"
                                    data-value="left"
                                    id="jp-align-left"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-align-left.png" />
                                  </a>
                                  <a
                                    href="#"
                                    title="居中"
                                    class="no-border btn btn-default"
                                    data-value="center"
                                    id="jp-align-center"
                                  >
                                    <img
                                      src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-align-center.png"
                                    />
                                  </a>
                                  <a
                                    href="#"
                                    title="居右"
                                    class="no-border btn btn-default"
                                    data-value="right"
                                    id="jp-align-right"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-align-right.png" />
                                  </a>
                                  <a
                                    href="#"
                                    title="两边对齐"
                                    class="no-border btn btn-default"
                                    data-value="justify"
                                    id="jp-align-justify"
                                  >
                                    <img
                                      src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-alignment-justify-distribute.png"
                                    />
                                  </a>
                                  <br />
                                  <a
                                    href="#"
                                    title="下标"
                                    class="no-border btn btn-default"
                                    id="jp-subscript"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/subscript.png" />
                                  </a>
                                  <a
                                    href="#"
                                    title="上标"
                                    class="no-border btn btn-default"
                                    id="jp-supscript"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/supscript.png" />
                                  </a>
                                  <div class="btn-group seperator" role="group">|</div>
                                  <a
                                    href="#"
                                    title="字体颜色"
                                    class="no-border btn btn-default"
                                    id="jp-color"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-color.png" />
                                  </a>
                                  <a
                                    href="#"
                                    title="背景颜色"
                                    class="no-border btn btn-default jp-with-transparent"
                                    id="jp-background"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/edit-background.png" />
                                  </a>
                                </div>
                      
                                <!-- 字体粗细 -->
                                <div style="margin-top: 0.2em">
                                  <div
                                    class="dropdown simple-style-drop"
                                    data-func="attr"
                                    data-prop="stroke-width"
                                    data-target="SVG .core"
                                    style="display: inline"
                                  >
                                    <a
                                      data-toggle="dropdown"
                                      href="#"
                                      title="设置线条粗线"
                                      class="no-border btn btn-default"
                                      role="button"
                                      id="jp-stroke-width"
                                    >
                                      <img src="${path}buss/reso/wisprint/images/wisprint/template-design/stroke-width.png" />
                                    </a>
                                    <div
                                      class="dropdown-menu"
                                      style="padding: 1em 1em; margin-top: 1em; margin-left: -5em; left: 65px;"
                                    >
                                      <!-- document.getElementById("range").addEventListener("input",function(){
                                              this.dataset.value=parseInt(this.value.trim());
                                            },0);
                                            *{color:#000;font-family:arial,sans serif;}
                                            input::before{
                                              content:attr(data-value);
                                            } -->
                                      <svg
                                        width="18"
                                        height="18"
                                        class="close"
                                        style="
                                          float: right;
                                          position: absolute;
                                          right: 0.2em;
                                          top: 0.2em;
                                        "
                                      >
                                        <use
                                          xlink:href="${path}buss/reso/wisprint/images/bootstrap-icons-1.0.0/bootstrap-icons.svg#x"
                                        ></use>
                                      </svg>
                                      <input
                                        type="range"
                                        value="1"
                                        min="1"
                                        max="20"
                                        step="1"
                                        style="margin-top: 1em"
                                      />
                                    </div>
                                  </div>
                      
                                  <div class="dropdown" style="display: inline">
                                    <a
                                      data-toggle="dropdown"
                                      href="#"
                                      title="设置线条风格"
                                      class="no-border btn btn-default"
                                      role="button"
                                      id="jp-stroke-dash"
                                    >
                                      <img src="${path}buss/reso/wisprint/images/wisprint/template-design/stroke-dash.png" />
                                    </a>
                                    <ul
                                      id="jp-shape-command"
                                      class="jp-shape-command dash-command dropdown-menu has-icons2"
                                      style="
                                        margin-left: -1em;
                                        margin-top: 0.8em;
                                        padding-top: 1em;
                                        padding-bottom: 1em;
                                      "
                                    >
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                      
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="5,5"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="5,10"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="10,5"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="5,1"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="1,5"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="0.9"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="15,10,5"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="15,10,5,10"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="15,10,5,10,15"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                      <li>
                                        <a class="jp-stroke-width" href="#" id="jp-border-style-2px">
                                          <svg
                                            viewBox="0 0 100 14"
                                            width="100%"
                                            height="100%"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <line
                                              stroke-dasharray="5,5,1,5"
                                              x1="0"
                                              y1="50%"
                                              x2="100%"
                                              y2="50%"
                                              stroke="black"
                                              stroke-width="3"
                                            />
                                          </svg>
                                        </a>
                                      </li>
                                    </ul>
                                  </div>
                      
                                  <div
                                    class="dropdown sp-vertical simple-style-drop"
                                    data-func="attr"
                                    data-prop="stroke"
                                    data-target="SVG .core"
                                    style="display: inline"
                                  >
                                    <a
                                      data-toggle="dropdown"
                                      href="#"
                                      title="设置线条颜色"
                                      class="no-border btn btn-default"
                                      role="button"
                                    >
                                      <img
                                        width="16"
                                        height="16"
                                        src="${path}buss/reso/wisprint/images/wisprint/template-design/stroke-color.png"
                                      />
                                    </a>
                                    <div
                                      class="dropdown-menu drop-dialog"
                                      style="
                                      	left: 100px;
                                        width: 18em;
                                        padding: 1em 1em;
                                        margin-top: 1em;
                                        margin-left: -15em;
                                        font-size: 12px;
                                      "
                                    >
                                      <svg
                                        width="18"
                                        height="18"
                                        class="close"
                                        style="
                                          float: right;
                                          position: absolute;
                                          right: 0.2em;
                                          top: 0.2em;
                                        "
                                      >
                                        <use
                                          xlink:href="${path}buss/reso/wisprint/images/bootstrap-icons-1.0.0/bootstrap-icons.svg#x"
                                        ></use>
                                      </svg>
                      
                                      <div>
                                        <input class="spectrum" type="text" value="rgba(0,0,0,1)" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                      
                            <li>
                              <a href="#" class="tool-title"><span class="caret"></span>对齐方式</a>
                              <div class="tool-content">
                                <a
                                  href="#"
                                  title="左对齐"
                                  class="no-border btn btn-default"
                                  id="jp-align2-left"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-alignment-left.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="水平居中"
                                  class="no-border btn btn-default"
                                  id="jp-align2-center"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-alignment-center.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="右对齐"
                                  class="no-border btn btn-default"
                                  id="jp-align2-right"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-alignment-right.png"
                                  />
                                </a>
                                <br />
                                <a
                                  href="#"
                                  title="上对齐"
                                  class="no-border btn btn-default"
                                  id="jp-align2-top"
                                >
                                  <img src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-alignment.png" />
                                </a>
                                <a
                                  href="#"
                                  title="垂直居中"
                                  class="no-border btn btn-default"
                                  id="jp-align2-middle"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-alignment-middle.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="下对齐"
                                  class="no-border btn btn-default"
                                  id="jp-align2-bottom"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-alignment-bottom.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="等宽"
                                  class="no-border btn btn-default"
                                  id="jp-equal-width"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layer-resize-replicate.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="等高"
                                  class="no-border btn btn-default"
                                  id="jp-equal-height"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layer-resize-replicate-vertical.png"
                                  />
                                </a>
                              </div>
                            </li>
                      
                            <li>
                              <a href="#" class="tool-title"><span class="caret"></span>边框设置</a>
                              <div class="tool-content">
                                <a
                                  href="#"
                                  title="设置边框"
                                  class="no-border btn btn-default"
                                  id="jp-border-1px"
                                >
                                  <img src="${path}buss/reso/wisprint/images/wisprint/template-design/border-all.png" />
                                </a>
                                <a
                                  href="#"
                                  title="清除边框"
                                  class="no-border btn btn-default jp-with-transparent"
                                  id="jp-border-no"
                                >
                                  <img src="${path}buss/reso/wisprint/images/wisprint/template-design/border-none.png" />
                                </a>
                      
                                <div class="dropdown" style="display: inline">
                                  <a
                                    data-toggle="dropdown"
                                    href="#"
                                    title="自定义边框..."
                                    class="no-border btn btn-default jp-with-transparent"
                                    id="jp-border-custom"
                                  >
                                    <img src="${path}buss/reso/wisprint/images/wisprint/template-design/border-draw.png" />
                                  </a>
                      
                                  <div
                                    id="jp-border-dialog"
                                    title="边框属性"
                                    class="jp-dialog dropdown-menu"
                                    style="
                                      top: 20px;
                                      left: -96px;
									  width: 240px;
									  height: 313px;
                                      padding: 4px;
                                      background: #ffffff;
                                      border: 1px solid #f0c49b;
                                      border-radius: 0;
                                      box-shadow: 0px 0px 16px 0px rgb(0 0 0 / 15%);
                                    "
                                  >
                                    <div
                                      style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-content: center;
                                        flex-wrap: wrap;
                                        font-size: 14px;
                                        font-family: Alibaba PuHuiTi;
                                        font-weight: 400;
                                        color: #333333;
                                      "
                                    >
                                      <div style="display: flex">
                                        线型:
                                        <div class="dropdown" style="display: flex; width: 90px">
                                          <a
                                            data-toggle="dropdown"
                                            style="
                                              display: inline-block;
                                              width: 100%;
                                              vertical-align: middle;
                                            "
                                            aria-expanded="true"
                                            ><span
                                              class="style-viewer"
                                              style="
                                                vertical-align: middle;
                                                display: inline-block;
                                                height: 2px;
                                                width: 70%;
                                                margin: auto auto;
                                                top: 15px;
                                                border-top: solid 3px black;
                                              "
                                            ></span
                                            ><span class="bs-caret"><span class="caret"></span></span>
                                          </a>
                                          <ul
                                            class="dropdown-menu border-style"
                                            style="
                                              margin-left: -1em;
                                              font-size: 12px;
                                              margin-top: 0.8em;
                                              padding-top: 1em;
                                              padding-bottom: 1em;
                                            "
                                          >
                                            <li title="实线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: solid 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="点线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: dotted 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="折线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: dashed 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="双实线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: double 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="雕刻线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: groove 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="浮雕线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: ridge 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="陷入线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: inset 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="突出线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    top: 15px;
                                                    border-top: outset 3px black;
                                                  "
                                                ></span>
                                              </a>
                                            </li>
                                            <li title="隐藏线">
                                              <a href="#" style="padding: 3px 10px">
                                                <span
                                                  style="
                                                    vertical-align: middle;
                                                    display: inline-block;
                                                    height2: 2px;
                                                    width: 100%;
                                                    margin: auto auto;
                                                    border-top: hidden 3px black;
                                                  "
                                                  >不可见</span
                                                >
                                              </a>
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                      
                                      <div style="padding-right: 22px; float: left">
                                        <span>线宽:</span
                                        ><input
                                          class="width-input"
                                          type="range"
                                          value="1"
                                          min="1"
                                          max="15"
                                          step="1"
                                          style="
                                            position: relative;
                                            display: inline;
                                            width: 100px;
                                            vertical-align: middle;
                                            margin-left: 0.5em;
                                          "
                                        />
                                      </div>
                      
                                      <div style="display: flex">
                                        颜色:
                                        <div
                                          class="dropdown sp-vertical"
                                          data-func="attr"
                                          data-prop="stroke"
                                          data-target="SVG .core"
                                          style="
                                            display: flex;
                                            margin-left: 0.5em;
                                            align-items: flex-start;
                                          "
                                        >
                                          <div
                                            style="display: flex; align-items: center"
                                            data-toggle="dropdown"
                                            title="设置线条颜色"
                                            class="sp-trigger sp-replacer sp-light"
                                          >
                                            <div class="sp-preview">
                                              <div
                                                class="sp-preview-inner color-viewer"
                                                style="background-color: rgb(91, 93, 38)"
                                              ></div>
                                            </div>
                                            <span
                                              style="display: flex; margin-left: 0.7em"
                                              class="bs-caret"
                                              ><span class="caret"></span
                                            ></span>
                                          </div>
                      
                                          <div
                                            class="dropdown-menu"
                                            style="
                                              width: 18em;
                                              padding: 1em 1em;
                                              margin-top: 1em;
                                              margin-left: 1em;
                                              font-size: 12px;
                                            "
                                          >
                                            <div>
                                              <input
                                                class="spectrum"
                                                type="text"
                                                value="rgba(0,0,0,1)"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                      
                                    <div
                                      class="jp-border-previewer"
                                      style="
                                        position: relative;
                                        height: 100px;
                                        width: 100px;
                                        margin: 20px auto 10px;
                                        background: white;
                                      "
                                    >
                                      <div
                                        style="
                                          left: 0;
                                          top: 0;
                                          border-bottom: solid 1px #ddd;
                                          border-right: solid 1px #ddd;
                                        "
                                      ></div>
                                      <div
                                        style="
                                          left: 0;
                                          bottom: 0;
                                          border-top: solid 1px #ddd;
                                          border-right: solid 1px #ddd;
                                        "
                                      ></div>
                                      <div
                                        style="
                                          right: 0;
                                          top: 0;
                                          border-left: solid 1px #ddd;
                                          border-bottom: solid 1px #ddd;
                                        "
                                      ></div>
                                      <div
                                        style="
                                          right: 0;
                                          bottom: 0;
                                          border-top: solid 1px #ddd;
                                          border-left: solid 1px #ddd;
                                        "
                                      ></div>
                                      <p
                                        id="jp-border-viewer"
                                        style="
                                          background-color: #eee;
                                          position: absolute;
                                          left: 10px;
                                          top: 10px;
                                          right: 10px;
                                          bottom: 10px;
                                          border: solid 1px gray;
                                          padding: 0;
                                          margin: 0;
                                        "
                                      ></p>
                                      <div
                                        class="jp-border-line"
                                        data-border="border-top"
                                        style="left: 15px; top: 0; width: 120px; height: 20px"
                                      ></div>
                                      <div
                                        class="jp-border-line"
                                        data-border="border-bottom"
                                        style="left: 15px; bottom: 0; width: 120px; height: 20px"
                                      ></div>
                                      <div
                                        class="jp-border-line"
                                        data-border="border-left"
                                        style="left: 0; top: 15px; height: 120px; width: 20px"
                                      ></div>
                                      <div
                                        class="jp-border-line"
                                        data-border="border-right"
                                        style="right: 0; top: 15px; height: 120px; width: 20px"
                                      ></div>
                                    </div>
                                    <div
                                      style="
                                        display: flex;
                                        align-content: center;
                                        justify-content: center;
                                        margin-top: 1.2em;
                                      "
                                    >
                                      <a
                                        id="border-all"
                                        type="button"
                                        class="cmd btn-sm btn btn-default"
                                        title="设置所有边框"
                                      >
                                        <img src="${path}buss/reso/wisprint/images/border-all.png" />
                                      </a>
                                      <a
                                        id="border-none"
                                        type="button"
                                        class="cmd btn-sm btn btn-default"
                                        title="清除所有边框"
                                      >
                                        <img src="${path}buss/reso/wisprint/images/border-none.png" />
                                      </a>
                      
                                      <div class="btn-group borders">
                                        <a
                                          id="border-left"
                                          type="button"
                                          data-toggle="button"
                                          aria-pressed="true"
                                          class="btn-sm btn btn-default active"
                                          title="选中左边框"
                                        >
                                          <img src="${path}buss/reso/wisprint/images/border-left.png" />
                                        </a>
                                        <a
                                          id="border-right"
                                          type="button"
                                          data-toggle="button"
                                          aria-pressed="true"
                                          class="btn-sm btn btn-default active"
                                          title="选中右边框"
                                        >
                                          <img src="${path}buss/reso/wisprint/images/border-right.png" />
                                        </a>
                                        <a
                                          id="border-top"
                                          type="button"
                                          data-toggle="button"
                                          aria-pressed="true"
                                          class="btn-sm btn btn-default active"
                                          title="选中上边框"
                                        >
                                          <img src="${path}buss/reso/wisprint/images/border-top.png" />
                                        </a>
                                        <a
                                          id="border-bottom"
                                          type="button"
                                          data-toggle="button"
                                          aria-pressed="true"
                                          class="btn-sm btn btn-default active"
                                          title="选中下边框"
                                        >
                                          <img src="${path}buss/reso/wisprint/images/border-bottom.png" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                      
                            <li>
                              <a href="#" class="tool-title"><span class="caret"></span>层级设置</a>
                              <div class="tool-content">
                                <a
                                  href="#"
                                  title="靠前一层(Ctrl+PgUp)"
                                  class="no-border btn btn-default"
                                  id="jp-front"
                                >
                                  <img src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-arrange.png" />
                                </a>
                                <a
                                  href="#"
                                  title="靠后一层(Ctrl+PgDn)"
                                  class="no-border btn btn-default"
                                  id="jp-back"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-arrange-back.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="最前(Ctrl+Home)"
                                  class="no-border btn btn-default"
                                  id="jp-top"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-stack-arrange.png"
                                  />
                                </a>
                                <a
                                  href="#"
                                  title="最后(Ctrl+End)"
                                  class="no-border btn btn-default"
                                  id="jp-bottom"
                                >
                                  <img
                                    src="${path}buss/reso/wisprint/images/wisprint/template-design/layers-stack-arrange-back.png"
                                  />
                                </a>
                                <br />
                                <a
                                  href="#"
                                  title="最前(Ctrl+Home)"
                                  class="no-border btn btn-default hidden"
                                  id="x"
                                >
                                  <img src="${path}buss/reso/wisprint/images/layers-stack-arrange.png" />
                                </a>
                                <a
                                  href="#"
                                  title="最后(Ctrl+End)"
                                  class="no-border btn btn-default hidden"
                                  id="y"
                                >
                                  <img src="${path}buss/reso/wisprint/images/layers-stack-arrange-back.png" />
                                </a>
                              </div>
                            </li>
                          </ul>
                    </div>
                    <div class="tab-item" data-index="2">
                        <div class="left-bar scroll">
                            <div class="jp-comp-container com-scroll">
                                <ul id='jp-comp-list'></ul>
                            </div>
                            <div class="customize-data-item-container">
                            	<div class="head">
                            		<span class="title">自定义数据项</span>
                            		<p>
                            			<span class="iconfont icon-add"></span>
                            			<span class="iconfont icon-delete"></span>
                            		</p>
                            	</div>
                                <ul id='jp-customize-comp-list' class="com-scroll">
                                </ul>
                            </div>
                            <div id="label-data-item-container" class="jp-barcode-comp-container" hidden>
                                <div class='jp-barcode-comp-head'>
                                    <p style="display: flex;">
                                        <span class="required">数据项名：</span> <input class="data-item-name" type="text">
                                    </p>
                                    <p>
                                        <span>是否条码sn：</span> <span class="switch" id="isOuter" ison="false"
                                            onclick="upStatus(this)"></span>
                                    </p>
                                </div>
                                <ul id='jp-barcode-comp-list'></ul>
                                <div class="data-operation-group">
                                    <span class="operation-btn" onclick="openDataItem()" title="新增"></span>
                                    <span class="operation-btn" onclick="deleteDataItem()" title="删除"></span> <span
                                        class="operation-btn" onclick="moveDataItem('up')" title="上移"></span> <span
                                        class="operation-btn" onclick="moveDataItem('down')" title="下移"></span> <span
                                        class="operation-btn" onclick="moveDataItem('top')" title="置顶"></span> <span
                                        class="operation-btn" onclick="moveDataItem('bottom')" title="置底"></span> <span
                                        class="operation-btn" onclick="openSaveRule()" title="保存规则"></span>
                                </div>
                                <div class="preview-config">
                                    <span>预览:</span>
                                    <div></div>
                                </div>
                            </div>
                            <!-- <div id="customize-data-item-container" class="jp-barcode-comp-head" style="display: none;">
                                <p style="display: flex;">
                                    <span class="required">数据项名：</span> <input class="data-item-name" type="text" />
                                </p>
                                <p style="display: flex;">
                                    <span>实例值：</span> <input type="text" />
                                </p>
                            </div> -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="jp-total-menu" class="dropdown">
        <ul class="dropdown-menu">
            <li><a href="#">总计</a></li>
            <li><a href="#">平均</a></li>
            <li><a href="#">最大</a></li>
            <li><a href="#">最小</a></li>
            <li class="dropdown-divider-up"></li>
            <li class="dropdown-divider-down"></li>
            <li><a href="#">本页合计</a></li>
            <li><a href="#">本页平均</a></li>
            <li><a href="#">本页最大</a></li>
            <li><a href="#">本页最小</a></li>
        </ul>
    </div>
    <!-- 新增数据项 -->
    <div class="modal fade" id="addDataItem" tabindex="-1">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" onclick="closeDataItemDialog()">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title" id="myModalLabel">新增</h4>
                </div>
                <div class="modal-body">
                    <div class="data-item-container">
                        <div class="data-item-main">
                            <div class="data-item-tablist">
                                <p class="data-item-tab data-item-tab-active" data-index="5">编码规则</p>
                                <p class="data-item-tab" data-index="1">数据表</p>
                                <p class="data-item-tab" data-index="2">文本</p>
                                <p class="data-item-tab" data-index="3">日期</p>
                                <p class="data-item-tab" data-index="4">流水号</p>
                            </div>
                            <div class="data-item-tab-container">
                                <div class="data-item-tab-item data-item-data-table" data-index="1">
                                    <div class="data-item-tablist">
                                        <p class="data-item-tab data-item-tab-active" data-index="1">物料档案表</p>
                                        <p class="data-item-tab" data-index="2">订单明细</p>
                                        <p class="data-item-tab" data-index="3" hidden>销售订单表</p>
                                        <p class="data-item-tab" data-index="4" hidden>销售出库表</p>
                                        <p class="data-item-tab" data-index="5">打印数据项</p>
                                        <p class="data-item-tab" data-index="6">自定义数据项</p>
                                    </div>
                                    <div class="data-item-tab-container" id="select-data-item">
                                        <div class="data-item-tab-item data-item-list data-item-scroll" data-index="1">
                                            <p data-index="1-1">
                                            	<span>物料料号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-2">
                                            	<span>物料品名</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-3">
                                            	<span>物料规格</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-4">
                                            	<span>生产分类</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-5">
                                            	<span>物料来源</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-6">
                                            	<span>单价</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-7">
                                            	<span>最小包装量</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-8">
                                            	<span>物料分组</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-9">
                                            	<span>主计量单位</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="1-10">
                                            	<span>辅计量单位</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                        </div>
                                        <div class="data-item-tab-item data-item-list data-item-scroll" data-index="2">
                                            <p data-index="2-1">
                                            	<span>外发单号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-2">
                                            	<span>入库单号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-3">
                                            	<span>送货单号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-4">
                                            	<span>外发类型</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-5">
                                            	<span>外发日期</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-6">
                                            	<span>跟单员</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-7">
                                            	<span>到货日期</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-8">
                                            	<span>供应商</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-9">
                                            	<span>供应商编号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-10">
                                            	<span>供应商简称</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-11" hidden>
                                            	<span>物料名称</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-12" hidden>
                                            	<span>物料料号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-13" hidden>
                                            	<span>物料分组</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-14" hidden>
                                            	<span>物料规格</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-15" hidden>
                                            	<span>单位</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-16" hidden>
                                            	<span>计划数量</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-17" hidden>
                                            	<span>单价</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="2-18">
                                            	<span>备注</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                        </div>
                                        <div class="data-item-tab-item data-item-list data-item-scroll" data-index="3" hidden>
                                            <p data-index="3-1">
                                            	<span>销售单号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="3-2">
                                            	<span>客户</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="3-3">
                                            	<span>销售类型</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="3-4">
                                            	<span>销售员</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="3-5">
                                            	<span>销售时间</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="3-6">
                                            	<span>交货日期</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                        </div>
                                        <div class="data-item-tab-item data-item-list data-item-scroll" data-index="4" hidden>
                                            <p data-index="4-1">
                                            	<span>销售出库单号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-2">
                                            	<span>客户</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-3">
                                            	<span>销售员</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-4">
                                            	<span>交货日期</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-5">
                                            	<span>物料品名</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-6">
                                            	<span>物料料号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-7">
                                            	<span>物料分组</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-8">
                                            	<span>物料规格</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-9">
                                            	<span>单位</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="4-10">
                                            	<span>客户编号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                        </div>
                                        <div class="data-item-tab-item data-item-list data-item-scroll" data-index="5">
                                            <p data-index="5-1">
                                            	<span>物料编号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="5-2">
                                            	<span>数量</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="5-3">
                                            	<span>一级条码规则SN</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="5-4">
                                            	<span>二级条码规则SN</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="5-5">
                                            	<span>三级条码规则SN</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="5-6">
                                            	<span>生产日期</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                            <p data-index="5-7">
                                            	<span>批次号</span>
                                            	<span class="iconfont icon-add"></span>
                                            </p>
                                        </div>
                                        <div class="data-item-tab-item data-item-list data-item-scroll" data-index="6">
                                        	
                                        </div>
                                    </div>
                                </div>
                                <div class="data-item-tab-item" data-index="2">
                                    <textarea class="data-item-text" placeholder="请输入:"></textarea>
                                    <button class="submit-data-item" type="button">提交</button>
                                </div>
                                <div class="data-item-tab-item set-date" data-index="3">
                                    <div>
                                        <span class="select-name">年</span> <select
                                            class="form-control form-control-sm set-date-format" data-type="year">
                                            <option value="0">--请选择--</option>
                                            <option value="2">2位年</option>
                                            <option value="4">4位年</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span class="select-name">月</span> <select
                                            class="form-control form-control-sm set-date-format" data-type="month">
                                            <option value="0">--请选择--</option>
                                            <option value="2">2位月</option>
                                            <option value="1">1位月</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span class="select-name">日</span> <select
                                            class="form-control form-control-sm set-date-format" data-type="day">
                                            <option value="0">--请选择--</option>
                                            <option value="2">2位日</option>
                                            <option value="1">1位日</option>
                                        </select>
                                    </div>
                                    <button class="submit-data-item" type="button">提交</button>
                                </div>
                                <div class="data-item-tab-item set-date" data-index="4">
                                    <div class="row-center">
                                        <span class="select-name">流水号长度</span>
                                        <button class="serial-num-btn" type="button" onclick="changeNum('+')">+</button>
                                        <input class="serial-num-input" type="number" value="1" readonly>
                                        <button class="serial-num-btn" type="button" onclick="changeNum('-')">-</button>
                                    </div>
                                    <div class="row-center">
                                        <span class="select-name">流水号进制</span> <select
                                            class="form-control form-control-sm" id="serial-num-select">
                                            <option value="8">8进制</option>
                                            <option value="10" selected>10进制</option>
                                            <option value="16">16进制</option>
                                        </select>
                                    </div>
                                    <div class="row-center">
                                        <span class="select-name sequence">序列</span> <span
                                            class="sequence-key">0123456789</span>
                                    </div>
                                    <button class="submit-data-item" type="button">提交</button>
                                </div>
                                <div class="data-item-tab-item encoding-rules" data-index="5">
                                    <div id="encoding-rules-tablist" class="data-item-tablist scroll"></div>
                                    <div class="data-item-tab-container"></div>
                                </div>
                            </div>
                        </div>
                        <ul id="sortDataItem" class="sortable-container scroll">
                        	
                        </ul>
                        <div class="data-item-preview" data-index="1">预览：</div>
                        <div class="data-item-preview" data-index="2">预览：</div>
                        <div class="data-item-preview" data-index="3">预览：</div>
                        <div class="data-item-preview" data-index="4">预览：1</div>
                        <div class="data-item-preview" data-index="5">预览：5</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="save-data-item">保存</button>
                </div>
            </div>
        </div>
    </div>
    <!-- 保存规则 -->
    <div class="modal fade" id="saveRule" tabindex="-1">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" onclick="closeSaveRule()">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title">保存规则</h4>
                </div>
                <div class="modal-body">
                    <span>规则名称</span> <input id="rulesName" type="text" />
                </div>
                <div class="modal-footer">
                    <button type="button" class="save-rules">保存</button>
                </div>
            </div>
        </div>
    </div>
    <!-- 包装量小数位配置 -->
    <div class="modal fade" id="decimals-setting" tabindex="-1">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close dialog-close">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title">小数位配置</h4>
                </div>
                <div class="modal-body scroll" style="overflow: auto;">
                    <div class="row-center">
                        <span class="select-name">小数位</span>
                        <button class="serial-num-btn" type="button" onclick="changeNum('+', 'num')">+</button>
                        <input class="serial-num-input" type="number" value="0" readonly>
                        <button class="serial-num-btn" type="button" onclick="changeNum('-', 'num')">-</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="saveDecimals()">保存</button>
                </div>
            </div>
        </div>
    </div>
    <!-- 生产日期配置 -->
    <div class="modal fade" id="product-date" tabindex="-1">
        <div class="modal-dialog product-date-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close dialog-close">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title">生产日期配置</h4>
                </div>
                <div class="modal-body scroll" style="overflow: auto;">
                    <div class="row-center">
                        <span class="select-name">数据类型</span>
						<select class="form-control form-control-sm set-date-format">
                            <option value="yyyy-MM-dd" selected>日期(yyyy-MM-dd)</option>
                            <option value="yyyyMMdd">日期(yyyyMMdd)</option>
                        	<option value="yyyy/MM/dd">日期(yyyy/MM/dd)</option>
                        	<option value="yyyy.MM.dd">日期(yyyy.MM.dd)</option>
                        	<option value="yyyyMMddHHmmss">日期(yyyyMMddHHmmss)</option>
                        	<option value="yyyy-MM-dd HH:mm:ss">日期(yyyy-MM-dd HH:mm:ss)</option>
                     	</select>
                    </div>
                    <div class="row-center">
                        <span class="select-name">是否必填</span>
						<div class="layui-form">
                            <input id="isProductionDateRequired" type="checkbox" checked lay-skin="switch">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="saveProductDate()">保存</button>
                </div>
            </div>
        </div>
    </div>
    <!-- 日期配置 -->
    <div class="modal fade" id="date-setting" tabindex="-1">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close dialog-close">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title">日期配置</h4>
                </div>
                <div class="modal-body scroll date-tab-container" style="overflow: auto;">
                    <div class="tablist">
                        <span class="tab tab-active" data-index="1">月</span> <span class="tab" data-index="2"
                            style="display: block;">日</span>
                    </div>
                    <div class="tab-container">
                        <table class="default-table" data-index="1">
                            <thead>
                                <tr>
                                    <td>月</td>
                                    <td>条码值</td>
                                </tr>
                            </thead>
                            <tbody id="date-setting-month">
                            </tbody>
                        </table>
                        <table class="default-table" data-index="2" hidden>
                            <thead>
                                <tr>
                                    <td>日</td>
                                    <td>条码值</td>
                                </tr>
                            </thead>
                            <tbody id="date-setting-day">
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="saveDateSetting()">保存</button>
                </div>
            </div>
        </div>
    </div>
    <!-- 自定义数据项 -->
    <div class="modal fade" id="custom-field-dialog" tabindex="-1">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close dialog-close">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title">自定义数据项</h4>
                </div>
                <div class="modal-body scroll date-tab-container" style="overflow: auto;">
                    <label for="isOuterBox">是否外箱</label>
                    <input type="checkbox" id="isOuterBox">
                	<button class="custom-field-add">新增</button>
                    <div class="select-material-custom">
                        <span>物料模板</span>
                        <div class="select-material-template"></div>
                        <span>自定义数据项</span>
                        <div class="select-custom-field"></div>
                        <button class="custom-field-add">新增</button>
                    </div>
					<table class="default-table custom-field">
						<thead>
							<tr>
								<td name="field">字段名</td>
								<td name="format">格式</td>
								<td name="required">是否必填</td>
								<td name="operation">操作</td>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
                </div>
            </div>
        </div>
    </div>
    <!-- 批次号设置 -->
    <div class="modal fade" id="batch-code" tabindex="-1">
        <div class="modal-dialog batch-code-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close dialog-close">
                        <span>&times;</span>
                    </button>
                    <h4 class="modal-title">批次号配置</h4>
                </div>
                <div class="modal-body scroll" style="overflow: auto;">
                    <div class="row-center">
                        <span class="select-name">数据格式</span>
						<input id="batchCodeFormat" class="form-control" type="text" />
                    </div>
                    <div class="row-center">
                        <span class="select-name">是否必填</span>
						<div class="layui-form">
                            <input id="isBatchCodeRequired" type="checkbox" checked lay-skin="switch">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" onclick="saveBatchCode()">保存</button>
                </div>
            </div>
        </div>
    </div>
    <div id="thumb-img"></div>
</body>
<!-- 插件 -->
<script src="${path}buss/reso/wisprint/js/jquery/jquery-ui-1.9.2.js?version=2.4.6"></script>
<script src="${path}buss/reso/wisprint/js/layout/jquery.layout.js"></script>
<script src="${path}buss/reso/wisprint/js/jquery.ui.rotatable.js"></script>
<script src="${path}buss/reso/wisprint/js/jqueryui-ruler/js/jquery.ui.ruler.js?version=2.3.4"></script>
<script src="${path}buss/reso/wisprint/js/picture/bluebird.js"></script>
<!-- 截图 -->
<script src="${path}buss/reso/wisprint/js/lib/html2canvas.min.js"></script>
<script src="${path}buss/reso/wisprint/js/lib/svg-inject.min.js"></script>
<script src="${path}buss/reso/wisprint/js/spectrum/spectrum.js"></script>
<script src="${path}buss/reso/wisprint/js/bootstrap/js/bootstrap.js"></script>
<script src="${path}buss/reso/wisprint/js/bootstrap3-dialog/js/bootstrap-dialog.js"></script>
<script src="${path}buss/reso/wisprint/js/datatable/datatables.min.js"></script>
<script src="${path}buss/reso/wisprint/js/bootstrap-select/js/bootstrap-select.js"></script>
<script src="${path}buss/reso/wisprint/js/layui/src/layui.js"></script>
<!-- 计算 -->
<script src="${path}buss/reso/tinymes/js/math.js"></script>
<!-- 下拉框 -->
<script src="${path}buss/reso/tinymes/js/joinjs-lib/xm-select.js"></script>
<!-- jcp -->
<script src="${path}buss/reso/wisprint/js/cookie.js"></script>
<script src='${path}buss/reso/wisprint/js/util-debug.js'></script>
<script src='${path}buss/reso/wisprint/js/noexcel-debug.js?version=1.4.1'></script>
<script src='${path}buss/reso/wisprint/api/dddy.js?version=1.4.1'></script>
<script src='${path}buss/reso/wisprint/js/core-debug.js?version=2.0.1.20'></script>
<!-- scm -->
<script src='${path}buss/reso/tinymes/js/component-1.1.0.js?version=2.0.1'></script>
<script src='${path}buss/reso/wisprint/js/morewis-js/wis-template.js?version=2.0.1'></script>
<script src='${path}buss/reso/wisprint/js/morewis-js/template-design.js?version=2.0.1.23'></script>
<script>
</script>
</html>