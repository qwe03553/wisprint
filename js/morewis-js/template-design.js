const key = '55c2e4491648465d8a6e967f905f2269';

// 模板放大倍数
var magnification = 1;
var _rulerThis = null;
var renderCustomField = null;

var isType = type => arg => Object.prototype.toString.call(arg) === '[object ' + type + ']';

var isArray = isType('Array');

// 规则数据
var codingRuleData = [];

// 自动保存定时器
var saveTimer = null;

// 流水号序号
var sequenceKey = {
    8: '01234567',
    10: '0123456789',
    16: '0123456789ABCDEF'
};

const getOutsideFlag = () => !!getQueryVariable('tid') ? Global.editing.tmpInfo.outsideflag : +$('#isOuterBox').prop('checked');

// 需要设置小数位的表名+字段名
const decimalsTableField = ['T_ML_MATERIAL_MIN_PACKAGE', 'T_ML_LABEL_PRINT_TASK_DETAIL_NUM'];

// 需要设置日期格式的表名+字段名
const productDateTableField = ['T_ML_LABEL_PRINT_TASK_DETAIL_PRODUCT_DATE'];

// 批次号的表名+字段名
const batchCodeTableField = ['T_ML_LABEL_PRINT_TASK_DETAIL_BATCH_CODE'];

// 不需要重置流水号的字段
const notResetTableField = ['T_ML_MATERIAL_MIN_PACKAGE', 'T_ML_PURCHASE_DETAIL_PLAN_NUMBER', 'T_ML_LABEL_PRINT_TASK_DETAIL_NUM'];

const fieldIndexObj = {
    T_ML_PURCHASE_IN: {
        IN_CODE: '2-2'
    },
    T_ML_MATERIAL_DETAIL: {
        PRICE: '1-6'
    },
    T_ML_PURCHASE_DETAIL: {
        MATERIAL_NAME: '2-8',
        MATERIAL_CODE: '2-9',
        MATERIAL_GROUP: '2-10',
        MATERIAL_SPEC: '2-11',
        UNIT: '2-12',
        PLAN_NUMBER: '2-13',
        PRICE: '2-14',
        MEMO: '2-18'
    },
    T_ML_SALES_OUT_DETAIL: {
        MATERIAL_NAME: '4-5',
        MATERIAL_CODE: '4-6',
        MATERIAL_GROUP: '4-7',
        MATERIAL_SPEC: '4-8',
        UNIT: '4-9'
    }
};

const tablenNamesObj = ['物料档案表', '订单明细', '销售订单表', '销售出库表', '打印数据项'];

// 表名与字段名
const dataItemName = [
    {
        // 物料档案表
        tableName: 'T_ML_MATERIAL',
        fieldName: [
            // 物料料号
            'MATERIAL_CODE',
            // 物料品名
            'MATERIAL_NAME',
            // 物料规格
            'MATERIAL_SPEC',
            // 生产分类
            'PRODUCT_TYPE',
            // 物料来源
            'SOURCE',
            // 单价
            ['T_ML_MATERIAL_DETAIL', 'PRICE'],
            // 最小包装量
            'MIN_PACKAGE',
            // 物料分组
            'MATERIAL_GROUP',
            // 主计量单位
            'MEASUREMENT_UNIT',
            // 辅计量单位
            'SUPPLEMENTARY_UNIT'
        ]
    },
    {
        // 采购订单表
        tableName: 'T_ML_PURCHASE',
        fieldName: [
            // 采购单号
            'PURCHASE_CODE',
            // 入库单号
            ['T_ML_PURCHASE_IN', 'IN_CODE'],
            // 送货单号
            ['T_ML_SALES_OUT', 'OUT_CODE'],
            // 采购类型
            'PURCHASE_STYLE',
            // 采购日期
            'PURCHASE_DATE',
            // 采购员
            'PURCHASER',
            // 到货日期
            'RECEIVE_DATE',
            // 供应商
            'SUPPLIER_ID',
            // 供应商编号
            'SUPPLIER_CODE',
            // 供应商简称
            'SHORT_NAME',
            ['T_ML_PURCHASE_DETAIL', 'MATERIAL_NAME'],
            ['T_ML_PURCHASE_DETAIL', 'MATERIAL_CODE'],
            ['T_ML_PURCHASE_DETAIL', 'MATERIAL_GROUP'],
            ['T_ML_PURCHASE_DETAIL', 'MATERIAL_SPEC'],
            ['T_ML_PURCHASE_DETAIL', 'UNIT'],
            ['T_ML_PURCHASE_DETAIL', 'PLAN_NUMBER'],
            ['T_ML_PURCHASE_DETAIL', 'PRICE'],
            ['T_ML_PURCHASE_DETAIL', 'MEMO']
        ]
    },
    {
        // 销售订单表
        tableName: 'T_ML_SALES',
        fieldName: [
            // 销售单号
            'SALES_CODE',
            // 客户
            'CUSTOMER_ID',
            // 销售类型
            'SALES_STYLE',
            // 销售员
            'SALER',
            // 销售时间
            'SALE_DATE',
            // 交货日期
            'SEND_DATE'
        ]
    },
    {
        // 销售出库表
        tableName: 'T_ML_SALES_OUT',
        fieldName: [
            // 销售出库单号
            'OUT_CODE',
            // 客户
            'CUSTOMER_ID',
            // 销售员
            'SALES_USER',
            // 交货日期
            'SEND_DATE',
            ['T_ML_SALES_OUT_DETAIL', 'MATERIAL_NAME'],
            ['T_ML_SALES_OUT_DETAIL', 'MATERIAL_CODE'],
            ['T_ML_SALES_OUT_DETAIL', 'MATERIAL_GROUP'],
            ['T_ML_SALES_OUT_DETAIL', 'MATERIAL_SPEC'],
            ['T_ML_SALES_OUT_DETAIL', 'UNIT'],
            'CUSTOMER_CODE'
        ]
    },
    {
        // 打印数据项
        tableName: 'T_ML_LABEL_PRINT_TASK_DETAIL',
        fieldName: [
            // 物料料号
            'MATERIAL_CODE',
            // 最小包装量
            'NUM',
            // 一级条码规则SN
            'FIRST_ID',
            // 二级条码规则SN
            'SECOND_ID',
            // 三级条码规则SN
            'THIRD_ID',
            'PRODUCT_DATE',
            'BATCH_CODE'
        ]
    }
];

const configTypeName = {
    2: '文本',
    3: '日期',
    4: '流水号'
};

// 状态码
const statusCode = {
    100: '查询数据为null',
    101: '该名称已存在',
    102: '新增失败',
    103: '删除失败',
    104: '修改失败',
    105: '传值null'
};

// 当前修改的条码
var nowBarCodeDom = '';

// layuiform用于render 开关
var layForm = null;

// 切换工具栏下拉显示隐藏
$(function () {
    $('.tool-title').click(function () {
        $(this).siblings('.tool-content').toggle();
        $(this).find('.caret').toggleClass('caret-close');
    });
});

window.onload = function () {
    // 提示
    initTooltip();
    scmLoad();
    $('#tmpName').val(Global.editing.tmpName);
    $('.data-item-data-table').hide();
    refreshDialogDate();
    getCodingRuleData();

    $('.modal-dialog').draggable({
        handle: '.modal-header',
        containment: 'parent'
    });
    $('#sortDataItem')
        .sortable({
            placeholder: 'ui-state-highlight',
            stop: function () {
                newPreview();
            }
        })
        .disableSelection();

    // 属性和数据切换tab页
    tabClickEvent($('.right-bar'), $('.tablist')[0], 'span', '', function () {
        renderCustomizeDataItem();
    });
    tabClickEvent($('.date-tab-container'), $('.tablist')[1], 'span');

    // 数据项新增 第一级tab页(数据表、文本、日期...切换)
    tabClickEvent($('.data-item-main'), $('.data-item-tablist')[0], 'p', 'data-item-', function () {
        if ($('.jp-barcode-comp-container').css('display') === 'none') return true;
        if ($('#myModalLabel').text() === '新增') {
            $('.data-item-preview').hide();
            $('.data-item-preview').eq(0).show();
            // 当数据项新增选择规则时，取消选中
            if (+this.dataset.index === 1) {
                $('.encoding-rules')
                    .children('.data-item-tablist')
                    .children()
                    .removeClass('data-item-tab-active');
                $('.encoding-rules').children('.data-item-tab-container').children().hide();
            }
            return;
        }
        $('.data-item-preview').hide();
        $('.data-item-preview')
            .eq(this.dataset.index - 1)
            .show();
    });

    // 数据项新增 数据表tab页切换
    tabClickEvent($('.data-item-data-table'), $('.data-item-tablist')[1], 'p', 'data-item-');

    // 数据项新增 规则切换
    tabClickEvent(
        $('.encoding-rules'),
        $('.encoding-rules').children('.data-item-tablist')[0],
        'p',
        'data-item-',
        function () {
            // 如果规则中存在自定义数据项则不能添加  因为外箱标签只能选择物料模板中的自定义数据项 不然没有意义
            var data = codingRuleData[this.dataset.index - 1].list;
            if (getOutsideFlag() == 1 && !data.every(v => v.configType != 5)) {
                scmAlert('外箱标签不允许使用存在自定义数据项的规则！', { status: 2 });
                return;
            }
            addSortDataItem('', data);
            $('.data-item-preview')
                .eq(4)
                .text('预览：' + this.innerText);
        },
        'i'
    );

    // 自动保存
    /* var autoSaveStatus = (window.localStorage.getItem(mcUserId + 'autoSave') || 'true') === 'true';
    $('#autoSaveSwitch').attr('ison', autoSaveStatus);
    if(getQueryVariable('tid')) {
        autoSave(autoSaveStatus);
        $('.template-name').find('.scm-tooltip').add('#autoSaveSwitch').show();
    } */

    if (isLabelTmp) {
        // 标签模板
        // 隐藏标签绑定
        $('#jp-qr-dialog').children().eq(0).remove();
        $('#jp-bar-1d-dialog').children().eq(0).remove();
        $('#jp-pdf417-dialog').children().eq(0).remove();
        $('#jp-datamatrix-dialog').children().eq(0).remove();
        $('#jp-text-dialog').children('.form-inline').remove();
        $('#jp-comp-list').addClass('label-tmp');
        $('.right-bar').children('.tablist').children().eq(1).hide();
        $('#jp-image-dialog').find('.field-selector').hide();
        $('#field-source').hide();
        $("[for='field-source']").hide();
        if (isCustomize) {
            $('#label-data-item-container').remove();
            $('#label-data-item').show();
            $('#customize-data-item-container').show();
        } else {
            // 只有为标签模板才显示自定义数据项
            $('#custom-field-container').show();
            $('#customize-data-item-container').remove();
        }
    } else {
        // 单据模板
        // $('#label-data-item').remove();
        $('#settingJpOrientation').show();
        $('#jp-barcode-comp-container').hide();
        $('#jp-barcode-comp-container').hide();
        $('#jp-new-text').hide();
        $('.label-setting').hide();
    }
    $(document).click(function () {
        if (
            $(event.target).attr('id') === 'jp-border-dialog' ||
            $(event.target).parents('#jp-border-dialog').length
        )
            return;
        $('#jp-border-dialog').hide();
    });

    // 初始标签设置
    labelSetting = hasEdit
        ? {
            'jp-label-width': Global.editing.tmpInfo.lwidth,
            'jp-label-height': Global.editing.tmpInfo.llength,
            'jp-label-row': Global.editing.tmpInfo.labelrow,
            'jp-label-column': Global.editing.tmpInfo.labelcol,
            'jp-label-horizontal': Global.editing.tmpInfo.horizontalspacing,
            'jp-label-vertical': Global.editing.tmpInfo.verticalspacing
        }
        : {
            'jp-label-width': parseInt(getStyleValue('jp-page', 'width')),
            'jp-label-height': parseInt(getStyleValue('jp-page', 'height')),
            'jp-label-row': 1,
            'jp-label-column': 1,
            'jp-label-horizontal': 0,
            'jp-label-vertical': 0
        };
    renderInput('jp-label-height', {
        defaultValue: labelSetting['jp-label-height'],
        decimal: true,
        callback: calcLabelWidth
    });
    renderInput('jp-label-width', {
        defaultValue: labelSetting['jp-label-width'],
        decimal: true,
        callback: calcLabelWidth
    });
    renderInput('jp-label-row', {
        defaultValue: labelSetting['jp-label-row'],
        min: 1,
        callback: calcLabelWidth
    });
    renderInput('jp-label-column', {
        defaultValue: labelSetting['jp-label-column'],
        min: 1,
        callback: calcLabelWidth
    });
    renderInput('jp-label-horizontal', {
        defaultValue: labelSetting['jp-label-horizontal'],
        decimal: true,
        callback: calcLabelWidth
    });
    renderInput('jp-label-vertical', {
        defaultValue: labelSetting['jp-label-vertical'],
        decimal: true,
        callback: calcLabelWidth
    });
    if (+labelSetting['jp-label-row'] === 1) {
        $('#jp-label-vertical').find('.iconfont').addClass('btn-disabled');
        $('#jp-label-vertical').find('input').attr('disabled', 'disabled');
    } else {
        $('#jp-label-vertical').find('.iconfont').removeClass('btn-disabled');
        $('#jp-label-vertical').find('input').removeAttr('disabled');
    }
    if (+labelSetting['jp-label-column'] === 1) {
        $('#jp-label-horizontal').find('.iconfont').addClass('btn-disabled');
        $('#jp-label-horizontal').find('input').attr('disabled', 'disabled');
    } else {
        $('#jp-label-horizontal').find('.iconfont').removeClass('btn-disabled');
        $('#jp-label-horizontal').find('input').removeAttr('disabled');
    }

    $('#tmpName').focus();
    $('#tmpName').blur();
    // $(document).focus();
    // 监听是否在当前页，并置为已读
    /*document.addEventListener("visibilitychange", function () {
        if (!document.hidden) { //处于当前页面
            $('#tmpName').focus();
            $('#tmpName').blur();
        }
    });*/
};

if (!hasEdit) {
    $('#jp-export').hide();
    // $('#jp-export').attr('disabled', 'disabled');
}

// 点击数据项列表，选中
/*delegate(
    $('#jp-barcode-comp-list')[0],
    'click',
    'li',
    function () {
        // $(this).siblings().removeClass('data-item-active');
        $(this).toggleClass('data-item-active');
    },
    'span'
);*/

/*delegate(
    $('#jp-comp-list')[0],
    'click',
    'li',
    function () {
        $(this).siblings().removeClass('data-item-active');
        $(this).toggleClass('data-item-active');
    },
    'span'
);*/

// 数据项弹窗 选择数据表
delegate($('#select-data-item')[0], 'click', 'p', function () {
    if ($('#myModalLabel').text() === '新增') {
        if ($(this).hasClass('select-data-item')) {
            $('#sortDataItem')
                .find('[data-index="' + this.dataset.index + '"]')
                .remove();
            newPreview();
        } else {
            addSortDataItem($(this));
        }
        $(this).toggleClass('select-data-item');
        return;
    }
    $('.data-item-preview')
        .eq(0)
        .text('预览：' + 123456);
    $('#select-data-item').find('p').removeClass('select-data-item');
    $(this).addClass('select-data-item');
});

// 数据项数据表点击+号按钮
$('#select-data-item')
    .find('.icon-add')
    .click(function () {
        event.stopPropagation();
        addSortDataItem($(this).parent().addClass('select-data-item'));
    });

// 数据项弹窗 文本输入框改变后修改预览
$('.data-item-text').bind('input propertychange', function () {
    $('.data-item-preview')
        .eq(1)
        .text('预览：' + $(this).val());
});

// 数据项弹窗 日期格式改变
$('.set-date-format').change(function () {
    refreshDialogDate();
});

// 数据项弹窗 数据项保存
$('.save-data-item').click(function () {
    var isClose = true;
    if (nowBarCodeDom) {
        var arr = (nowBarCodeDom.dataset.info && JSON.parse(nowBarCodeDom.dataset.info)) || [];
        if ($('#myModalLabel').text() === '新增') {
            isClose = editDataItem(arr, arr.length);
        } else {
            isClose = editDataItem(arr, $('#myModalLabel').attr('data-edit-index'));
        }
        renderBarCodeDataItem(JSON.parse(nowBarCodeDom.dataset.info));
    } else {
        if ($('#myModalLabel').text() === '新增') {
            // if(!Global.editing.datasource.ui.fields) Global.editing.datasource.ui = []
            isClose = editDataItem(
                Global.editing.datasource.ui.fields,
                Global.editing.datasource.ui.fields.length
            );
        } else {
            isClose = editDataItem(
                Global.editing.datasource.ui.fields,
                $('#myModalLabel').attr('data-edit-index')
            );
        }
    }
    if (!isClose) return;
    $('#addDataItem').modal('hide');
    resetAddDialog();
    $('.data-item-tablist').children().eq(0).click();
});

// 条码info数组转field字符串
$('.data-item-name').on('input', dataNameverify).blur(dataNameverify);

// 流水号进制修改改变序列
$('#serial-num-select').change(function () {
    $('.sequence-key').text(sequenceKey[this.value]);
});

// 数据项新增提交
$('.submit-data-item').click(function () {
    addSortDataItem();
});

$('.dialog-close').click(function () {
    $(this).parents('.modal').modal('hide');
});

// 单据模板自定义数据项
(function() {
	$('.customize-data-item-container .icon-add').click(function() {
		if($('.new-customize-data-item').length) {
			layer.tips('请输入自定义数据项名称！', $('.new-customize-data-item').find('input'), {
                tips: [3, '#2c3a48']
            });
			return;
		}
		$('#jp-customize-comp-list').prepend('<li class="new-customize-data-item" style="position:relative;"><input type="text"  /><span class="iconfont icon-tick"></span><span class="iconfont icon-delete"></span></li>');
	})
	$('.customize-data-item-container .icon-delete').click(function() {
		var deleteNames = [];
		$('.customize-data-item-container .data-item-active').each((i, v) => {
			deleteNames.push($(v).children('a').text());
			$(v).remove();
		});
		Global.editing.datasource.ui.fields = Global.editing.datasource.ui.fields.filter(v => {
			return deleteNames.indexOf(v.field) == -1;
		})
	})
	$('.customize-data-item-container').on('click', '.icon-tick', function() {
		const input = $(this).parents('li').find('input');
		const value = input.val();
		if(!value.length) {
			layer.tips('请输入自定义数据项名称！', input, {
                tips: [3, '#2c3a48']
            });
			return;
		}
		// 判断名称不能与已有的名称重复
		if(Global.editing.datasource.ui.fields.findIndex(v => v.field === value) !== -1) {
			layer.tips('输入的名称不能与已配置的名称重复！', input, {
                tips: [3, '#2c3a48']
            });
			return;
		}
		$(this).parents('li').add($('#jp-customize-comp-list .jp-draggable-field')).remove();
		Global.editing.datasource.ui.fields.push({
            "type": "text",
            "field": value,
            "demo": "自定义数据项",
            "isCustomize": true
        })
        refresh();
	})
	$('.customize-data-item-container').on('click', '.icon-delete', function() {
		$(this).parents('li').remove();
	})
	$('.customize-data-item-container').on('click', 'li', function() {
		$(this).toggleClass('data-item-active');
	})
})();

// 放大镜功能
(function () {
    // 把值填到输入框内
    const setMagnificationNum = () =>
        $('#magnification-num').text(calculate(magnification, '*', 100) + '%');
    // 页面初始化赋值
    setMagnificationNum();
    $('.page-magnification-tool button').click(function () {
        var type = this.dataset.type;
        throttleUpdatePageSize(type);
    });

    $('.jp-content')[0].onmousewheel = function (e) {
        if (e.altKey) {
            e = e || window.event;
            if (e.stopPropagation) e.stopPropagation();
            else e.cancelBubble = true;
            if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
            let type = e.wheelDelta == 120 ? 'add' : 'decrease';
            throttleUpdatePageSize(type);
        }
    };

    $('#select-scale li').click(function () {
        throttleUpdatePageSize('', this.dataset.value);
    })

    let throttleUpdatePageSize = throttle(updatePageSize, 200);

    /**
     * @function 更新大小
     * @version 1.0.0
     * @param {String} type
     * @param {Number} num 放大为多少倍
     */
    function updatePageSize(type, num = 1) {
        // 当为直接设置倍数时如果倍数相同则返回
        if (!type && num === magnification) return;
        let scale = 1;
        if (type === 'add' || type === 'decrease') {
            scale = calculate(magnification, type === 'add' ? '+' : '-', 0.1);
        } else {
            scale = num;
        }
        if (scale < 0.7) return;
        magnification = scale;
        viewscale = scale;
        setMagnificationNum();
        $('.jp-page').css('transform', 'scale(' + magnification + ')');
        _rulerThis.refresh(true);
    }
})();

// 自定义数据项方法
(function () {
    if (tmpType != 1) return;
    layui.use(['form'], function () {
        layForm = layui.form;
        renderCustomField();
    });
    $('#isOuterBox').prop('checked', +getOutsideFlag());
    getTemplateInfo(1);
    // 自定义数据项打开弹窗
    $('.open-custom-field').click(function () {
        $('#custom-field-dialog').modal('show');
    });

    // 自定义数据项新增
    $('.custom-field-add').click(function () {
        if (getOutsideFlag() == 0) {
            $('.custom-field tbody').prepend(getCustomFieldTr());
            layForm.render();
            $('.custom-field input[type="text"]')
                .focus(function () {
                    gEditing = true;
                })
                .blur(function () {
                    gEditing = false;
                });
            $('.custom-field tbody tr:first-child [type="text"]').focus();
        } else {
            var data = xmSelect.get('.select-custom-field')[0].getValue();
            if (data.length) {
                // 判断自定义数据项名称是否重复
                if (customList.findIndex(v => v.customizeCol === data[0].customizeCol) !== -1) {
                    return scmAlert('不能重复添加相同数据项！', {
                        status: 3
                    });
                }
                customList.push(data[0]);
                renderCustomField();
            } else {
                scmAlert('请选择自定义数据项！', { status: 2 });
            }
        }
    });

    // 自定义数据项删除
    $('.custom-field').delegate('.icon-delete', 'click', function () {
        var tr = $(this).parents('tr');
        var index = $(this).parents('tbody').find('tr').index(tr);
        if (tr.find('input[type="text"]').length) {
            tr.remove();
        } else {
            var customizeCol = customList[index].customizeCol;
            // 删除已配置的该数据
            scmAlert('是否确认删除？<br />注：删除会影响内外箱模板中已配置数据项', {
                status: 3,
                remark: '',
                confirm: function () {
                    customList.splice(index, 1);
                    tr.remove();
                    $('#jp-page .jatools-coder')
                        .add('#jp-page .jp-text .jp-text-content')
                        .each((i, v) => {
                            var info = JSON.parse(v.dataset.info);
                            info = info.filter((v1, i) => v1.customizeCol !== customizeCol);
                            v.dataset.info = JSON.stringify(info);
                        });
                    renderCustomField();
                    nowBarCodeDom && renderBarCodeDataItem(JSON.parse(nowBarCodeDom.dataset.info) || []);
                },
                cancel: function () {
                    $('#scm-alert').find('.msg-close').click();
                }
            });
        }
    });

    // 自定义数据项保存
    $('.custom-field').delegate('.icon-tick', 'click', function () {
        var tr = $(this).parents('tr');
        var customizeCol = tr.find('input[type="text"]').val();
        var style = tr.find('select[name="selectFormat"]').val();
        if (!customizeCol.length)
            return scmAlert('数据项名称不能为空', {
                status: 3
            });
        if (customizeCol.length > 50)
            return scmAlert('数据项名称不能超过50个字符', {
                status: 3
            });
        // 判断自定义数据项名称是否重复
        if (customList.findIndex(v => v.customizeCol === customizeCol) !== -1)
            return scmAlert('数据项名称不能重复', {
                status: 3
            });
        tr.find('td')
            .eq(0)
            .empty()
            .append(`<span class="custom-field-name">${xssStrReplace(customizeCol)}</span>`);
        tr.find('input[type="checkbox"]').prop('disabled', true);
        layForm.render();
        tr.find('.icon-tick').remove();
        customList.unshift({
            customizeCol,
            style,
            isRequired: +tr.find('input[type="checkbox"]').prop('checked')
        });
        renderCustomField(2);
    });

    $('#isOuterBox').click(function () {
        let dom = $(this);
        let status = !!getQueryVariable('tid') ? Global.editing.tmpInfo.isOuterBox : 1;
        if (dom.prop('checked')) {
            if (!!getQueryVariable('tid') && (status == 2 || status == 3)) {
                scmAlert(status == 2 ? '标签无法同时为外箱标签和默认标签' : '该标签已配置包装规则,无法开启外箱标签', {
                    status: 3,
                    close() {
                        dom.prop('checked', false);
                    }
                })
                return;
            }
            // 选中时如果有自定义数据项则提示会清空
            scmAlert('是否确定，这会清空已添加的自定义数据项？', {
                status: 3,
                confirm() {
                    customFieldEmpty();
                    renderOuterCustomSelect(2, []);
                    if (!!getQueryVariable('tid')) Global.editing.tmpInfo.outsideflag = "1";
                },
                cancel() {
                    // dom.prop('checked', false);
                    $('#scm-alert').find('.msg-close').click();
                },
                close() {
                    if (!$(event.target).hasClass('confirm')) {
                        dom.prop('checked', false);
                        $('#scm-alert').parents('.scm-shade').remove();
                    }
                }
            });
        } else {
            if (!!getQueryVariable('tid') && status == 4) {
                scmAlert('该标签已被其他标签使用成包装规则,无法关闭外箱标签', {
                    status: 3,
                    close() {
                        dom.prop('checked', true);
                    }
                })
                return;
            }
            // 选中时如果有自定义数据项则提示会清空
            scmAlert('是否确定，这会清空已添加的自定义数据项？', {
                status: 3,
                confirm() {
                    customFieldEmpty();
                    if (!!getQueryVariable('tid')) Global.editing.tmpInfo.outsideflag = "0";
                    xmSelect.get('.select-material-template')[0].setValue([]);
                    xmSelect.get('.select-custom-field')[0].setValue([]);
                },
                cancel() {
                    // dom.prop('checked', false);
                    $('#scm-alert').find('.msg-close').click();
                },
                close() {
                    if (!$(event.target).hasClass('confirm')) {
                        dom.prop('checked', true);
                        $('#scm-alert').parents('.scm-shade').remove();
                    }
                }
            });
        }
    });

    /**
     * @function 获取模板信息
     * @param {Number} type 为1时获取物料模板 为2时获取模板的自定义数据项需要传递模板id
     * @param {String} templateId
     */
    function getTemplateInfo(type, templateId) {
        $.ajax({
            url:
                getProjectName() +
                '/template/templateData?mcUserId=' +
                mcUserId +
                '&mcDataAuthId=' +
                mcDataAuthId +
                '&type=' +
                type +
                '&id=' +
                templateId,
            type: 'get',
            success(data) {
                if (data.code == 200) {
                    if (type === 2) {
                        let list = [];
                        for (let i = 0, l = data.list.length; i < l; i++) {
                            list.push({
                                sourceTemplateId: templateId,
                                customizeCol: data.list[i].customizecol,
                                isRequired: data.list[i].isrequired,
                                style: data.list[i].style
                            });
                        }
                        data.list = list;
                    } else if (type === 1 && hasEdit) {
                        data.list = data.list.filter(v => v.id !== tmpId);
                    }
                    renderOuterCustomSelect(type, data.list);
                } else {
                    console.error(data);
                }
            },
            error(data) {
                ajaxErr(data);
            }
        });
    }

    /**
     * @function 渲染外箱自定义数据到下拉框
     */
    function renderOuterCustomSelect(type, data) {
        // 物料模板下拉框与自定义数据项下拉框参数不同的地方
        const param = [
            {
                el: '.select-material-template',
                prop: {
                    name: 'label_name',
                    value: 'id'
                },
                template: ['label_name', 'class_name'],
                callback(arr, isAdd) {
                    if (isAdd) {
                        customFieldEmpty();
                        // 获取当前模板的自定义数据项
                        getTemplateInfo(2, arr[0].id);
                    } else {
                        // 删除的话则直接清空自定义数据项的下拉框
                    }
                }
            },
            {
                el: '.select-custom-field',
                prop: {
                    name: 'customizeCol',
                    value: 'customizeCol'
                },
                template: ['customizeCol', '']
            }
        ];
        const { el, prop, template, callback } = param[type - 1];
        xmSelect.render({
            el,
            prop,
            filterable: true,
            height: '150px',
            radio: true,
            clickClose: true,
            theme: {
                color: '#1051D6'
            },
            model: {
                icon: 'hidden',
                label: {
                    type: 'xxxx',
                    xxxx: {
                        template(data, sels) {
                            return xssStrReplace(sels[0][prop.name]);
                        }
                    }
                }
            },
            template({ item, sels, name, value }) {
                return (
                    '<span class="' + (template[1]
                        ? 'xm-option-content-code' : '') + ' text-over-ellipsis" title="' +
                    item[template[0]] +
                    '">' +
                    xssStrReplace(item[template[0]] + '') +
                    '</span>' +
                    (template[1]
                        ? '<span class="xm-option-content-name text-over-ellipsis" style="position: absolute; right: 10px; color: #8799a3" title="分类名称：' +
                        item[template[1]] +
                        '">' +
                        xssStrReplace(item[template[1]] + '') +
                        '</span>'
                        : '')
                );
            },
            on: function (data) {
                //arr:  当前多选已选中的数据
                var arr = data.arr;
                //change, 此次选择变化的数据,数组
                var change = data.change;
                //isAdd, 此次操作是新增还是删除
                var isAdd = data.isAdd;

                callback && callback.call(this, arr, isAdd);
            },
            data
        });
        // 给下拉框赋值 已选择的物料模板
        if (type === 1 && getOutsideFlag() == 1 && customList.length && customList[0].sourceTemplateId) {
            let materialTemplateId = customList[0].sourceTemplateId;
            xmSelect.get('.select-material-template')[0].setValue([materialTemplateId]);
            getTemplateInfo(2, materialTemplateId);
        }
    }

    /**
     * @function 渲染自定义数据项到数据表
     * @version 1.0.0
     * @param {Number} type 1全部渲染 2渲染到数据表 3渲染自定义数据项弹窗列表
     */
    renderCustomField = function (type = 1) {
        if (type == 1 || type == 2) {
            var html = customList.reduce((pre, cur, i) => {
                return (
                    pre +
                    `
                    <p data-index="6-${i + 1}">
                        <span class="field-name">${xssStrReplace(cur.customizeCol)}</span>
                        <span class="iconfont icon-add"></span>
                    </p>
                `
                );
            }, '');
            $('#select-data-item').children().eq(5).empty().append(html);
            $('#select-data-item').children().eq(5)
                .find('.icon-add')
                .click(function () {
                    event.stopPropagation();
                    addSortDataItem($(this).parent().addClass('select-data-item'));
                });
        }
        if (type == 1 || type == 3) {
            $('.custom-field tbody').html(
                customList.reduce((pre, cur) => {
                    return (
                        pre + getCustomFieldTr(cur)
                    );
                }, '')
            );
            layForm.render();
        }
    };

    function getCustomFieldTr(data = {}) {
        console.log(data)
        var formatData = [{
            text: '常规',
            value: 'string'
        }, {
            text: '数字',
            value: 'number'
        }, {
            text: '日期(yyyy-MM-dd)',
            value: 'yyyy-MM-dd'
        }, {
            text: '日期(yyyyMMdd)',
            value: 'yyyyMMdd'
        }, {
            text: '日期(yyyy/MM/dd)',
            value: 'yyyy/MM/dd'
        }, {
            text: '日期(yyyy.MM.dd)',
            value: 'yyyy.MM.dd'
        }, {
            text: '日期(yyyyMMddHHmmss)',
            value: 'yyyyMMddHHmmss'
        }, {
            text: '日期(yyyy-MM-dd HH:mm:ss)',
            value: 'yyyy-MM-dd HH:mm:ss'
        }]
        data.style = data.style || 'string'
        var optionHtml = formatData.reduce((pre, cur) => {
            var isSelect = data.style === cur.value ? 'selected' : '';
            return pre + `<option value="${cur.value}" ${isSelect}>${cur.text}</option>`;
        }, '');
        return `
    		<tr>
			    <td name="field">
			    	${data.customizeCol ? `
			    		<span class="custom-field-name">${xssStrReplace(
            data.customizeCol
        )}</span>
			    	` : '<input type="text" placeholder="请输入自定义数据项名称">'}
			    </td>
			    <td name="format">
			        <select name="selectFormat" class="form-control form-control-sm" value="${data.style || 'string'}" ${data.customizeCol ? 'disabled' : ''}>
			        	${optionHtml}
			        </select>
			    </td>
			    <td name="required">
			        <div class="layui-form">
			            <input type="checkbox" ${data.isRequired ? 'checked' : ''
            } lay-skin="switch" ${data.customizeCol ? 'disabled' : ''}>
			        </div>
			    </td>
			    <td name="operation">
			    	${data.customizeCol ? '' : '<span class="iconfont icon-tick"></span>'}
			        <span class="iconfont icon-delete"></span>
			    </td>
			</tr>
    	`;
    }

    /**
     * @function 自定义数据项置空
     * @version 1.0.0
     */
    function customFieldEmpty() {
        customList = [];
        renderCustomField();
        $('.custom-field tbody').empty();
        $('#jp-page .jatools-coder')
            .add('#jp-page .jp-text .jp-text-content')
            .each((i, v) => {
                var info = JSON.parse(v.dataset.info);
                info = info.filter((v1, i) => v1.configType != 5);
                v.dataset.info = JSON.stringify(info);
            });
        nowBarCodeDom && renderBarCodeDataItem(JSON.parse(nowBarCodeDom.dataset.info) || []);
    }
})();

/**
 * @function 添加拖拽数据项
 * @version 1.0.0
 * @param {Object} firstItem 节点
 * @param {Array} d 数据
 */
function addSortDataItem(firstItem, d) {
    if (d) {
        $('#sortDataItem')
            .children()
            .each((i, v) => {
                var index = v.dataset.index;
                if (index.startsWith('1'))
                    $('#select-data-item')
                        .find('p[data-index="' + v.dataset.index + '"]')
                        .removeClass('select-data-item');
                v.remove();
            });
    }
    var data = d || [getDataItemObj([], 0, firstItem)];
    if (!data) return;
    data.forEach((v, i) => {
        if (+v.configType === 1 && data.length > 1)
            $('#select-data-item')
                .find('p[data-index="' + v.fieldIndex + '"]')
                .addClass('select-data-item');
        let li = document.createElement('li');
        let name = xssStrReplace(getDataItemName(v));
        li.className = 'ui-state-default';
        li.dataset.info = JSON.stringify(v);
        li.dataset.index = v.fieldIndex;
        li.innerHTML = '<span class="del-btn" onclick="delDom()">x</span><span class="text-over-ellipsis" title="' + name + '">' + name + '</span>';
        $('#sortDataItem').append(li);
    });
    newPreview();
}

// 新增数据项弹窗预览
function newPreview() {
    var arr = [];
    $('#sortDataItem')
        .children('.ui-state-default')
        .each((i, v) => {
            arr.push(JSON.parse(v.dataset.info));
        });
    $('.data-item-preview').text('预览：' + previewConfig(arr));
}

// 删除节点
function delDom() {
    event.stopPropagation();
    var index = event.target.parentNode.dataset.index;
    var attr = '[data-index="' + index + '"]';
    if ($('#sortDataItem').find(attr).length === 1) {
        $('#select-data-item')
            .find('p' + attr)
            .removeClass('select-data-item');
    }
    event.target.parentNode.remove();
    newPreview();
}

// 保存规则
$('.save-rules').click(function () {
    var data = JSON.parse(nowBarCodeDom.dataset.info);
    var ruleName = $('#rulesName').val();
    if (!ruleName)
        return scmAlert('规则名称不能为空', {
            status: 3
        });
    var obj = {};
    data = data.map((v, i) => {
        v.snReset = v.snReset;
        v.sort = i + 1;
        v.dateFormat =
            productDateTableField.indexOf(v.tableName + '_' + v.fieldName) !== -1
                ? v.dateFormat || 'yyyy-MM-dd'
                : '';
        return v;
    });
    obj.list = data;
    obj.rulesName = ruleName;
    $.ajax({
        type: 'post',
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify({
            data: obj
        }),
        url:
            getProjectName() +
            '/dataitemrule/mldataitemsrules/add?mcUserId=' +
            mcUserId +
            '&mcDataAuthId=' +
            mcDataAuthId +
            '&type=' +
            tmpType,
        success: function (data) {
            if (data.code == 200) {
                scmAlert('新增成功');
                getCodingRuleData();
                $('#saveRule').modal('hide');
                $('#rulesName').val('');
            } else {
                scmAlert(statusCode[data.message], {
                    status: '2'
                });
            }
        },
        error: function (data) {
            ajaxErr(data);
        }
    });
});

// 删除规则
delegate($('#encoding-rules-tablist')[0], 'click', 'i', function () {
    let ruleThis = this;
    scmAlert('是否删除?', {
        status: '3',
        cancel: function () {
            $('#scm-alert').find('.msg-close').click();
        },
        confirm: function () {
            $.ajax({
                type: 'post',
                dataType: 'json',
                //contentType:"application/json;charset=utf-8",
                data:
                    'mcUserId=' +
                    mcUserId +
                    '&mcDataAuthId=' +
                    mcDataAuthId +
                    '&type=1&id=' +
                    ruleThis.dataset.id,
                url: getProjectName() + '/dataitemrule/mldataitemsrules/deleteItemById',
                success: function (data) {
                    if (data.code == 200) {
                        scmAlert('删除成功');
                        getCodingRuleData();
                    } else {
                        scmAlert(data.msg, {
                            status: '2'
                        });
                    }
                },
                error: function (data) {
                    ajaxErr(data);
                }
            });
        }
    });
});

// 保存模板
$('#openSaveTmp').click(function () {
    printBefore(function () {
        if (!isNext()) return;
        createLitimg();
    });
});

// 点击数据项列表，修改
delegate($('#jp-barcode-comp-list')[0], 'click', 'span', function () {
    var index = $('.jp-barcode-item').index($(this).parent('li'));
    var data = JSON.parse(nowBarCodeDom.dataset.info)[index];
    resetAddDialog();
    $('#myModalLabel').text('修改');
    $('#myModalLabel').attr('data-edit-index', index);
    if (+data.fieldIndex === 5) {
        var customListIndex = customList.findIndex(v => v.customizeCol === data.customizeCol) + 1;
        data.fieldIndex = '6-' + customListIndex;
    }
    data.fieldIndex ? resetAddDialog(data) : resetAddDialog();
    $('#addDataItem').attr('data-type', 'edit');
    $('#addDataItem').modal('show');
});

// 获取规则数据
function getCodingRuleData() {
    return
    $.ajax({
        type: 'post',
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        // data:JSON.stringify({"id":dataId}),
        url:
            getProjectName() +
            '/dataitemrule/mldataitemsrules/list?mcUserId=' +
            mcUserId +
            '&mcDataAuthId=' +
            mcDataAuthId +
            '&type=' +
            tmpType,
        success: function ({ data }) {
            var tabHtml = '',
                itemHtml = '';
            if (isArray(data) && data.length) {
                codingRuleData = data;
                $('.data-item-preview')
                    .eq(4)
                    .text('预览：' + data[0].rulesName);
                data &&
                    data.length &&
                    data.forEach((v, i) => {
                        itemHtml +=
                            '<div class="data-item-tab-item data-item-list data-item-scroll" data-index="' +
                            (i + 1) +
                            '">';
                        v.list.forEach((v2, i2) => {
                            v2.fieldIndex = configTypeToFieldIndex(v2);
                            itemHtml +=
                                '<p data-index="' +
                                i +
                                '-' +
                                i2 +
                                '">' +
                                xssStrReplace(getDataItemName(v2)) +
                                '</p>';
                        });
                        itemHtml += '</div>';
                        tabHtml +=
                            '<p class="data-item-tab" data-index="' +
                            (i + 1) +
                            '"><span title="' +
                            v.rulesName +
                            '">' +
                            v.rulesName +
                            '</span><i class="delete-data-item" data-id="' +
                            v.id +
                            '"></i></p>';
                    });
            }
            $('.encoding-rules').children('.data-item-tablist').html(tabHtml);
            $('.encoding-rules').children('.data-item-tab-container').html(itemHtml);
        },
        error: function (data) {
            ajaxErr(data);
        }
    });
}

// 显示提示
function showTag() {
    const interval = 5000;
    $('#save-success').removeClass('animate__fadeOutRight').addClass('animate__fadeInRight').show();
    setTimeout(function () {
        $('#save-success').removeClass('animate__fadeInRight').addClass('animate__fadeOutRight');
    }, interval);
}

// 标签打印预览
function labelPrintPreview() {
    if (!isNext()) return;
    // $('#jp-test-print').attr('disabled', 'disabled');
    var html = getPageHtml(2);
    wisPreview(getDocument(html.styleInfo, html.bodyInfo), function () {
        $('#jp-test-print').removeAttr('disabled');
    });
}

// 获取纸张的毫米宽高,
function getPaperSize() {
    var paperWidth, paperHeight;
    if (getQueryVariable('tid')) {
        var { labelwidth, labellength } = Global.editing.tmpInfo;
        paperWidth = $('#jp-paper-width').val() || parseFloat(labelwidth);
        paperHeight = $('#jp-paper-height').val() || parseFloat(labellength);
    } else {
        paperWidth = $('#jp-paper-width').val() || '210';
        paperHeight = $('#jp-paper-height').val() || '297';
    }
    return {
        paperWidth,
        paperHeight
    };
}

/**
 * @function 获取页面的数据项信息
 * @version 2.3.0
 * @param {String} type 'toService'
 * @return {String}
 */
function getPageDataItem(type) {
    applyUClass();
    var arr = [];
    $('#jp-page .jatools-coder')
        .add('#jp-page .jp-text .jp-text-content')
        .each((i, v) => {
            let dataItemsName =
                v.dataset.field && v.dataset.field.replace('${', '').replace('}', '');
            let dataItemsId = v.dataset.id || '';
            let domCompName = getDomCompName($(v).parents('.jp-component')[0]);
            let dataItemsAlias = 'F' + (arr.length + 1);
            if (isCustomize) {
                arr.push({
                    dataItemsName,
                    dataItemsId,
                    domCompName,
                    dataItemsAlias,
                    snFlag: null,
                    list: [],
                    testData: v.dataset.code || ''
                });
            } else {
                var info = JSON.parse(v.dataset.info);
                var list = [];
                var testData = null;
                testData = previewConfig(info);
                info.forEach((v1, i) => {
                    if (type === 'toService' && v1.configType == '3') {
                        list = list.concat(dateFormatTransition(v1, list.length + 1));
                        return;
                    }
                    if (productDateTableField.indexOf(v1.tableName + '_' + v1.fieldName) !== -1) {
                        v1.dateFormat = v1.dateFormat || 'yyyy-MM-dd';
                        v1.isRequired = globalSetting.isProductionDateRequired;
                    }
                    if (batchCodeTableField.indexOf(v1.tableName + '_' + v1.fieldName) !== -1) {
                        v1.dateFormat = globalSetting.batchCodeFormat;
                        v1.isRequired = globalSetting.isBatchCodeRequired;
                    }
                    v1.sort = list.length + 1;
                    v1.decimalPlace = v1.decimalPlace || '0';
                    v1.dateFormat = v1.dateFormat || '';
                    list.push(v1);
                });
                arr.push({
                    dataItemsName,
                    dataItemsId,
                    domCompName,
                    testData,
                    dataItemsAlias,
                    list,
                    snFlag: v.dataset.issn
                });
            }
        });
    return arr;
}

/**
 * @function 获取节点组件名
 * @version 2.3.0
 * @param {Object} dom
 * @return {String}
 */
function getDomCompName(dom) {
    let classList = Array.from(dom.classList);
    return classList[classList.findIndex(v => v.startsWith('jp-comp-'))];
}

// 通过表名和字段名，返回fieldIndex
function configTypeToFieldIndex(v) {
    if (v.configType !== '1') return v.configType;
    if (fieldIndexObj[v.tableName]) {
        return fieldIndexObj[v.tableName][v.fieldName];
    }
    // 表index
    var i1 = dataItemName.findIndex(v2 => v.tableName === v2.tableName);
    // 字段index.
    var i2 = dataItemName[i1].fieldName.findIndex(v2 => v.fieldName === v2) + 1;
    return i1 + 1 + '-' + i2;
}

// 数据项名称校验
function dataNameverify() {
    // 只能包含中文字母数字以及下划线
    var regs = /^([\u4e00-\u9fa5\da-zA-Z]|_(?!_))+$/;
    // 开头不为数字
    var reg = /^[\u4E00-\u9FA5A-Za-z]/;
    if (!nowBarCodeDom) return;
    if (this.value.length === 0 && event.type === 'blur') {
        nowBarCodeDom.dataset.field = '';
        return scmAlert('请输入数据项名称', {
            status: '3'
        });
    }
    if (!(reg.test(this.value) && regs.test(this.value)) && event.type === 'blur') {
        scmAlert('请输入开头不为数字且只包含中文字母数字以及下划线的数据项名', {
            status: '3'
        });
        return;
    }
    nowBarCodeDom.dataset.field = '${' + this.value + '}';
    $(nowBarCodeDom).hasClass('jp-text-content') && $(nowBarCodeDom).text('${' + this.value + '}');
}

// 二维码数据项
function barCodeDataItem() {
    nowBarCodeDom = this.children('.jatools-coder')[0] || this.children('.jp-text-content')[0];
    if (!isLabelTmp) return;
    var data = nowBarCodeDom.dataset.info ? JSON.parse(nowBarCodeDom.dataset.info) : [];
    if (isCustomize) {
        var selectDiv = $('#customize-data-item-container').find(
            'div[data-index="' + nowBarCodeDom.dataset.index + '"]'
        );
        selectDiv.find('input').removeAttr('disabled');
    } else {
        $('.jp-comp-container').hide();
        $('.jp-barcode-comp-container').show();
        $('.data-item-name').val(
            nowBarCodeDom.dataset.field
                ? nowBarCodeDom.dataset.field.replace('${', '').replace('}', '')
                : ''
        );
        renderBarCodeDataItem(data);
        refreshBarCodeData(data);
        if (nowBarCodeDom.dataset.issn === undefined) nowBarCodeDom.dataset.issn = 0;
        // $(nowBarCodeDom).hasClass('jp-text-content') ? $('#isOuter').parent().hide() : $('#isOuter').parent().show();
        $('#isOuter').attr('ison', +nowBarCodeDom.dataset.issn ? true : false);
        // 选择二维码显示数据项
        $('.right-bar').children('.tablist').children().eq(1).show();
    }
}

// 显示全局数据项
function globalDataItem() {
    if ($(nowBarCodeDom).hasClass('jatools-coder')) {
        $('#jp-bar-1d-design').hide();
        $('#jp-pdf417-design').hide();
        $('#jp-qr-design').hide();
        $('#jp-datamatrix-design').hide();
        $('#label-design').show();
    }
    $('#jp-image-design').add('#jp-image-dialog').hide();
    $(nowBarCodeDom).hasClass('jp-text-content') && $('#jp-text-design').hide();
    nowBarCodeDom = '';
    $('.jp-comp-container').show();
    if (isCustomize) {
        $('#customize-data-item-container').find('input').attr('disabled', 'disabled');
    }
    if (tmpType !== '5') {
        $('.jp-barcode-comp-container').hide();
    }
    if (isLabelTmp && tmpType !== '5') {
        $('.right-bar').children('.tablist').children().eq(0).click();
        $('.right-bar').children('.tablist').children().eq(1).hide();
    }
}

function getDataItemName(v) {
    var fn = [
        () => v.tablenNames + '_' + v.fieldNames,
        () => configTypeName[v.configType],
        () => getDateFieldName(v),
        () => configTypeName[v.configType],
        () => '自定义数据项_' + v.customizeCol
    ];
    return fn[v.configType - 1]();
}

/**
 * @function 获取已配置数据项的预览
 * @version 2.3.0
 * @param {Array} data
 * @return {String}
 */
function previewConfig(data) {
    var fn = [
        () => '123456',
        cur => cur.textVal,
        cur => getDateStr([cur.year, cur.month, cur.day]),
        cur => numPreview(cur.snLen),
        () => '123456'
    ];
    return data.reduce((pre, cur) => pre + fn[cur.configType - 1](cur), '');
}

/**
 * @function 获取数据项日期
 * @version 2.3.0
 * @param {Array} lenList
 * @example getDateStr([4, 2, 2]) = '20210610'
 * @example getDateStr([2, 1, 2]) = '21610'
 * @example getDateStr([0, 1, 2]) = '610'
 */
function getDateStr(lenList) {
    var date = new Date();
    var dateArr = [date.getFullYear() + '', '0' + (date.getMonth() + 1), '0' + date.getDate()];
    return dateArr.reduce((pre, cur, i) => pre + (+lenList[i] ? cur.slice(-lenList[i]) : ''), '');
}

/**
 * @function 获取流水号
 * @version 2.3.0
 * @param {Number} length 流水号长度
 * @return {String} 返回一个长度为length的字符串
 * @example numPreview(5) = '00001'
 */
function numPreview(length = 1) {
    return (
        Array(length - 1)
            .fill(0)
            .join('') + 1
    );
}

// 数据项弹窗 刷新日期
function refreshDialogDate() {
    var yearLen = $('.set-date-format')[0].value;
    var monthLen = $('.set-date-format')[1].value;
    var dayLen = $('.set-date-format')[2].value;
    $('.data-item-preview')
        .eq(2)
        .text('预览：' + getDateStr([yearLen, monthLen, dayLen]));
}

// 通过长度获取默认日期配置
let defaultDateArr = (len, isHexadecimal) =>
    Array.from({
        length: len
    }).map((v, i) => {
        var num = i + 1;
        return {
            time: num,
            value:
                num >= 10 && isHexadecimal
                    ? String.fromCharCode(65 + i - 9)
                    : !isHexadecimal && num < 10
                        ? '0' + num
                        : num
        };
    });

// 获取当前在窗口中选择的数据项
function getDataItemObj(data, index, dataItem) {
    // 数据项弹窗 一级选项卡
    var firstItem = $('.data-item-tablist').eq(0).find('.data-item-tab-active');
    var firstIndex = firstItem[0].dataset.index;
    // 数据表选择的数据
    dataItem = dataItem || $('.select-data-item');
    // 如果选择的是数据表，且未选中字段
    if (firstItem[0].dataset.index === '1' && !dataItem.length) return false;
    var isChangeType = +data[index]?.configType === +firstIndex;
    var dataItemObj = {
        // field: firstItem[0].dataset.index === '1' ? dataItem.text() : firstItem.text(),
        fieldIndex:
            firstItem[0].dataset.index === '1'
                ? dataItem[0].dataset.index
                : firstItem[0].dataset.index,
        configType: firstIndex,
        snReset: 1,
        decimalPlace: data[index]?.decimalPlace ?? '0',
        dayList: firstIndex == 3 ? data[index]?.dayList ?? undefined : undefined,
        monthList: firstIndex == 3 ? data[index]?.monthList ?? undefined : undefined,
        configId: isChangeType ? data[index]?.configId ?? '' : '',
        dateFormat: firstIndex == 3 ? 'yyyy-MM-dd' : ''
    };
    if (firstIndex === '2') {
        // 文本
        dataItemObj.textVal = $('.data-item-text').val();
        dataItemObj.configType = '2';
    } else if (firstIndex === '3') {
        // 日期
        dataItemObj.year = $('.set-date-format').eq(0).val();
        dataItemObj.month = $('.set-date-format').eq(1).val();
        dataItemObj.day = $('.set-date-format').eq(2).val();
        dataItemObj.configType = '3';
        dataItemObj.monthList =
            dataItemObj.monthList && $('#myModalLabel').text() === '修改'
                ? dataItemObj.monthList
                : defaultDateArr(12, $('.set-date-format').eq(1).val() === '1');
        dataItemObj.dayList =
            dataItemObj.dayList && $('#myModalLabel').text() === '修改'
                ? dataItemObj.dayList
                : defaultDateArr(31, $('.set-date-format').eq(2).val() === '1');
    } else if (firstIndex === '4') {
        // 流水号
        dataItemObj.snLen = $('.serial-num-input').val();
        dataItemObj.snSystem = $('#serial-num-select').val();
    } else if (firstIndex === '5') {
        // 规则
        var index = $('.encoding-rules')
            .children('.data-item-tablist')
            .children('.data-item-tab-active')[0].dataset.index;
        dataItemObj = codingRuleData[index - 1].list;
    } else if (firstIndex.startsWith('1')) {
        // 数据表
        var itemIndexArr = dataItem[0].dataset.index.split('-');
        if (+itemIndexArr[0] === 6) {
            // 自定义数据项
            dataItemObj.configType = 5;
            dataItemObj.customizeCol = dataItem.find('span:first-child').text();
            dataItemObj.isRequired = customList[itemIndexArr[1] - 1].isRequired;
            dataItemObj.sourceTemplateId = customList[itemIndexArr[1] - 1].sourceTemplateId;
            dataItemObj.style = customList[itemIndexArr[1] - 1].style;
        } else {
            // 固定数据项
            var tableName = dataItemName[itemIndexArr[0] - 1].tableName;
            var fieldName = dataItemName[itemIndexArr[0] - 1].fieldName[itemIndexArr[1] - 1];
            if (isArray(fieldName)) {
                tableName = fieldName[0];
                fieldName = fieldName[1];
            }
            dataItemObj.fieldName = fieldName;
            dataItemObj.fieldNames = dataItem.children('span').eq(0).text();
            dataItemObj.tableName = tableName;
            dataItemObj.tablenNames = tablenNamesObj[itemIndexArr[0] - 1];
            // 需要设置小数位的
            if (decimalsTableField.indexOf(tableName + '_' + fieldName) !== -1) {
                for (let i = 0, l = data.length; i < l; i++) {
                    if (
                        data[i].tableName + '_' + data[i].fieldName ===
                        tableName + '_' + fieldName
                    ) {
                        dataItemObj.decimalPlace = data[i].decimalPlace;
                        break;
                    }
                }
            }
            // 流水号不重置的字段 
            if (notResetTableField.indexOf(tableName + '_' + fieldName) !== -1) {
                dataItemObj.snReset = 0;
            }
        }
    }
    return dataItemObj;
}

// 数据项列表 修改添加数据项
function editDataItem(data, index) {
    var dataItemObj = [];
    if (data.length === +index) {
        $('#sortDataItem')
            .children()
            .each((i, v) => {
                dataItemObj.push(JSON.parse(v.dataset.info));
            });
    } else {
        dataItemObj = getDataItemObj(data, index);
    }
    if (!dataItemObj) return false;
    if (Array.isArray(dataItemObj)) {
        var notNext = dataItemObj.some((v, i) => {
            if (v.fieldIndex.length > 1 || +v.configType !== 5) return false;
            var index = customList.findIndex(v1 => v1.customizeCol === v.customizeCol);
            // 如果不存在
            if (index === -1) {
                customList.unshift(v);
            } else {
                // 如果存在判断当前是否为外箱
                dataItemObj[i].isRequired = customList[index].isRequired;
            }
            return false;
        });
        if (notNext) return false;
        data =
            $('#myModalLabel').text() !== '新增'
                ? dataItemObj
                : [...data.slice(0, index), ...dataItemObj, ...data.slice(index + 1)];
    } else {
        data[index] = dataItemObj;
    }
    renderCustomField();
    refreshBarCodeData(data);
    // 刷新数据项列表
    return true;
}

// 打开数据项弹窗 新增
function openDataItem() {
    if ($('.data-item-name').val().length === 0)
        return scmAlert('请输入数据项名称后在配置数据项', {
            status: '3'
        });
    $('.encoding-rules')
        .children('.data-item-tablist')
        .children()
        .removeClass('data-item-tab-active');
    $('.encoding-rules').children('.data-item-tab-container').children().hide();
    $('#myModalLabel').text('新增');
    $('#sortDataItem').empty();
    resetAddDialog();
    if (nowBarCodeDom) {
        $('.data-item-main').children('.data-item-tablist').removeClass('global-data-item');
    } else {
        $('.data-item-main').children('.data-item-tablist').addClass('global-data-item');
    }
    $('#addDataItem').attr('data-type', 'add');
    $('#addDataItem').modal('show');
}

// 重置数据项弹窗
function resetAddDialog(
    data = {
        field: '',
        fieldIndex: '',
        textVal: '',
        year: '0',
        month: '0',
        snLen: '1',
        snSystem: '10'
    }
) {
    $('.select-data-item').removeClass('select-data-item');
    $('.data-item-tablist').eq(0).children().eq(0).click();
    if (data.fieldIndex.length > 1) {
        var dataItemIndex = data.fieldIndex.split('-');
        $('.data-item-tablist').eq(0).children().eq(1).click();
        $('#select-data-item')
            .find("[data-index='" + dataItemIndex[0] + "']")
            .find("[data-index='" + data.fieldIndex + "']")
            .addClass('select-data-item');
        $('.data-item-tablist')
            .eq(1)
            .find("[data-index='" + (dataItemIndex ? dataItemIndex[0] : 0) + "']")
            .click();
    } else if (data.fieldIndex.length == 1) {
        $('.data-item-tablist')
            .eq(0)
            .find("[data-index='" + data.fieldIndex + "']")
            .click();
    }
    $('.data-item-preview')
        .eq(0)
        .text('预览：' + (data.fieldIndex.length > 1 ? 123456 : ''));
    // 刷新数据项文本
    $('.data-item-text').val(data.textVal || '');
    $('.data-item-preview')
        .eq(1)
        .text('预览：' + (data.textVal || ''));
    // 刷新数据项日期
    $('.set-date-format')
        .eq(0)
        .val(data.year || 0);
    $('.set-date-format')
        .eq(1)
        .val(data.month || 0);
    $('.set-date-format')
        .eq(2)
        .val(data.day || 0);
    refreshDialogDate();
    // 刷新数据项流水号
    $('#addDataItem')
        .find('.serial-num-input')
        .val(data.snLen || 1);
    $('#serial-num-select').val(data.snSystem || 10);
    $('.sequence-key').text(sequenceKey[data.snSystem]);
    $('.data-item-preview')
        .eq(3)
        .text('预览：' + numPreview(data.snLen));
}

// 关闭数据项弹窗
function closeDataItemDialog() {
    // 关闭弹窗
    $('#addDataItem').modal('hide');
    // 重置弹窗数据
    resetAddDialog();
    // tab页切换到数据表
    $('.data-item-tablist').children().eq(0).click();
}

// 更新条码数据项及预览
function refreshBarCodeData(data) {
    nowBarCodeDom.dataset.info = JSON.stringify(data);
    $('.preview-config').find('div').text(previewConfig(data));
}

// 删除数据项
function deleteDataItem() {
    if (nowBarCodeDom) {
        var data = JSON.parse(nowBarCodeDom.dataset.info);
        data = data.filter((v, i) => !$('.jp-barcode-item').eq(i).hasClass('data-item-active'));
        refreshBarCodeData(data);
        renderBarCodeDataItem(data);
    } else {
        var index = $('.jp-draggable-field').index($('.data-item-active'));
        if (index === -1) return;
        var data = Global.editing.datasource.ui.fields;
        data.splice(index, 1);
        refresh();
    }
}

// 移动数据项
function moveDataItem(orientation) {
    var i = $('.jp-barcode-item').index($('.data-item-active'));
    var data = JSON.parse(nowBarCodeDom.dataset.info);
    if (i === -1) return;
    var fn = {
        up: function () {
            $('.data-item-active').each((i, v) => {
                var index = $('.jp-barcode-item').index($(v));
                if (
                    index === -1 ||
                    index === 0 ||
                    $('.jp-barcode-item')
                        .eq(index - 1)
                        .hasClass('data-item-active')
                )
                    return;
                this.exchange(0, index, index - 1, index);
            });
        },
        down: function () {
            $($('.data-item-active').toArray().reverse()).each((i, v) => {
                var index = $('.jp-barcode-item').index($(v));
                if (
                    index === -1 ||
                    $('.jp-barcode-item')
                        .eq(index + 1)
                        .hasClass('data-item-active')
                )
                    return;
                this.exchange(data.length - 1, index + 1, index, index);
            });
        },
        top: function () {
            $($('.data-item-active').toArray().reverse()).each((i, v) => {
                var index = $('.jp-barcode-item').index($(v));
                if (index === -1) return;
                this.insert(0, index);
            });
        },
        bottom: function () {
            $('.data-item-active').each((i, v) => {
                var index = $('.jp-barcode-item').index($(v));
                if (index === -1) return;
                this.insert(data.length - 1, index);
            });
        },
        exchange: function (limit, beforeIndex, afterIndex, index) {
            if (index === limit) return;
            var tmp = data[beforeIndex];
            $('.jp-barcode-item')
                .eq(beforeIndex)
                .insertBefore($('.jp-barcode-item').eq(afterIndex));
            data[beforeIndex] = data[afterIndex];
            data[afterIndex] = tmp;
        },
        insert: function (limit, index) {
            if (index === limit) return;
            var dom = $('.jp-barcode-item').eq(index)[0];
            var tmp = data[index];
            dom.remove();
            orientation === 'bottom'
                ? $('#jp-barcode-comp-list')[0].append(dom)
                : $('#jp-barcode-comp-list')[0].insertBefore(dom, $('.jp-barcode-item')[0]);
            data.splice(index, 1);
            orientation === 'bottom' ? data.push(tmp) : data.unshift(tmp);
        }
    };
    fn[orientation]();
    refreshBarCodeData(data);
}

// 标签页切换
function tabClickEvent(parent, tablist, selector, className = '', fn, cancel) {
    delegate(
        tablist,
        'click',
        selector,
        function () {
            if ($(this).hasClass(className + 'tab-active')) return;
            if (fn && fn.call(this)) return;
            $(this)
                .addClass(className + 'tab-active')
                .siblings()
                .removeClass(className + 'tab-active');
            parent
                .children('.' + className + 'tab-container')
                .children()
                .hide();
            parent
                .children('.' + className + 'tab-container')
                .children()
                .eq(this.dataset.index - 1)
                .show();
        },
        cancel
    );
}

// 更新开关状态
function upStatus(ele, type) {
    if ($(ele).attr('isOn') == 'true') {
        $(ele).attr('isOn', 'false');
        if (type === 'autoSave') {
            autoSave(false);
            window.localStorage.setItem(mcUserId + 'autoSave', 'false');
        } else {
            // $(ele).css('background-image', 'url(' + offUrl + ')');
            nowBarCodeDom.dataset.issn = 0;
        }
    } else {
        $(ele).attr('isOn', 'true');
        if (type === 'autoSave') {
            autoSave(true);
            window.localStorage.setItem(mcUserId + 'autoSave', 'true');
        } else {
            // $(ele).css('background-image', 'url(' + onUrl + ')');
            nowBarCodeDom.dataset.issn = 1;
            // 解决条码sn唯一
            $('#jp-page').find('.jatools-coder').attr('data-issn', '0');
            $('#jp-page').find('.jp-text').children('.jp-text-content').attr('data-issn', '0');
            $(nowBarCodeDom).attr('data-issn', '1');
        }
    }
}

// 数据项弹窗 流水号长度修改
function changeNum(type, obj) {
    var input = $(event.target).siblings('.serial-num-input');
    if (obj) {
        if (+input.val() === 0 && type === '-') return;
    } else {
        if (+input.val() === 1 && type === '-') return;
    }
    input.val(+input.val() + (type === '+' ? 1 : -1));
    !obj &&
        $('.data-item-preview')
            .eq(3)
            .text('预览：' + numPreview(input.val()));
}

// 渲染条码的数据项
function renderBarCodeDataItem(data) {
    var html = '';
    var arr = isArray(data) ? data : data.list;
    arr.forEach((v, i) => {
        let dateHtml =
            v.configType === '3'
                ? '<i class="iconfont icon-calendar" onclick="openDateSetting()"></i>'
                : '';
        let isMinPackage = decimalsTableField.indexOf(v.tableName + '_' + v.fieldName) !== -1;
        let isProductDate = productDateTableField.indexOf(v.tableName + '_' + v.fieldName) !== -1;
        let isBatchCode = v.tableName + '_' + v.fieldName === 'T_ML_LABEL_PRINT_TASK_DETAIL_BATCH_CODE';
        // 因为是从订单明细选出来的 所以回填之后这几个表也需要显示未订单明细
        let isOrderDetail = ['T_ML_PURCHASE', 'T_ML_PURCHASE_DETAIL', 'T_ML_PURCHASE_IN', 'T_ML_SALES_OUT'];
        if (isOrderDetail.indexOf(v.tableName) !== -1) {
            v.tablenNames = '订单明细';
        }
        let name = xssStrReplace(getDataItemName(v));
        isMinPackage = isMinPackage
            ? '<i class="iconfont icon-report" onclick="openDecimals()"></i>'
            : '';
        isProductDate = isProductDate
            ? '<i class="iconfont icon-calendar" onclick="openProductDate()"></i>'
            : '';
        isBatchCode = isBatchCode
            ? '<i class="iconfont icon-setting" onclick="openBatchCode()"></i>'
            : '';
        html +=
            '<li class="jp-barcode-item" style="position:relative;" data-index="' +
            i +
            '" data-num="' +
            (v.decimalPlace || 0) +
            '"><a href="#">' +
            name +
            isMinPackage +
            isProductDate +
            dateHtml +
            isBatchCode +
            '</a><span class="edit-data-item"></span></li>';
    });
    $('#jp-barcode-comp-list').empty().html(html);
}

// 打开批次号弹窗
function openBatchCode() {
    const { batchCodeFormat, isBatchCodeRequired } = globalSetting;
    $('#batchCodeFormat').val(batchCodeFormat);
    $('#isBatchCodeRequired').prop('checked', isBatchCodeRequired);
    layForm.render();
    $('#batch-code').modal('show');
}

// 保存批次号设置
function saveBatchCode() {
    globalSetting.batchCodeFormat = $('#batchCodeFormat').val();
    globalSetting.isBatchCodeRequired = +$('#isBatchCodeRequired').prop('checked');
    $('#batch-code').modal('hide');
}

// 渲染自定义数据项
function renderCustomizeDataItem(data) {
    if (!isCustomize) return;
    var html = '';
    var hasMultiSelect = $('.ui-selected').length !== 1;
    $('#jp-page')
        .find('.jatools-coder')
        .add('.jp-text-content')
        .each((i, v) => {
            if (v.matches('div')) return;
            if ($(v).parent().hasClass('jp-label')) return;
            var hasNowSelect = !hasMultiSelect && $(v).parent().hasClass('ui-selected');
            v.dataset.index = i;
            html += `<div class="active" data-index="${i}"><p style="display: flex;">
            <span class="required">数据项名：</span> <input class="data-item-name" type="text" value="${v.dataset.field ? v.dataset.field.replace('${', '').replace('}', '') : ''
                }" ${hasNowSelect ? '' : 'disabled'}/>
            </p>
            <p style="display: flex;">
            <span>实例值：</span> <input class="data-item-code" type="text" value="${v.dataset.code || ''
                }" ${hasNowSelect ? '' : 'disabled'}/>
        </p></div>`;
        });
    $('#customize-data-item-container').empty().html(html);
    $('.data-item-name').on('input', dataNameverify).blur(dataNameverify);
    $('.data-item-code').on('input', dataCodeVerify);
}

function dataCodeVerify() {
    nowBarCodeDom.dataset.code = this.value;
}

function getDateFieldName(data) {
    let name = '';
    if (+data.year !== 0) name += '年';
    if (+data.month !== 0) name += '月';
    if (+data.day !== 0) name += '日';
    return name ? '日期-' + name : '日期';
}

// 打开日期配置
function openDateSetting() {
    let index = $(event.target).parents('li').attr('data-index'),
        data = JSON.parse(nowBarCodeDom.dataset.info);
    renderDateSetting(data[index]);
    $('#date-setting').attr('data-index', index);
    $('#date-setting').modal('show');
}

function renderDateSetting(data) {
    let dayHtml = '';
    let monthHtml = '';
    data.dayList = data.dayList ? data.dayList : defaultDateArr(31, +data.day === 1);
    data.monthList = data.monthList ? data.monthList : defaultDateArr(12, +data.month === 1);
    dayHtml = data.dayList.reduce(
        (pre, cur, i) =>
            pre +
            '<tr><td>' +
            (i + 1) +
            '</td><td><input type="text" value="' +
            cur.value +
            '"/></td></tr>',
        ''
    );
    monthHtml = data.monthList.reduce(
        (pre, cur, i) =>
            pre +
            '<tr><td>' +
            (i + 1) +
            '</td><td><input type="text" value="' +
            cur.value +
            '"/></td></tr>',
        ''
    );
    $('#date-setting-month').html(monthHtml);
    $('#date-setting-day').html(dayHtml);
}

function saveDateSetting() {
    let index = $('#date-setting').attr('data-index'),
        data = JSON.parse(nowBarCodeDom.dataset.info),
        dayList = [],
        monthList = [];
    $('#date-setting-day')
        .children('tr')
        .each((i, v) => {
            dayList.push({
                time: i + 1,
                value: $(v).find('input').val()
            });
        });
    $('#date-setting-month')
        .children('tr')
        .each((i, v) => {
            monthList.push({
                time: i + 1,
                value: $(v).find('input').val()
            });
        });
    data[index].monthList = monthList;
    data[index].dayList = dayList;
    nowBarCodeDom.dataset.info = JSON.stringify(data);
    $('#date-setting').modal('hide');
}

// 打开包装量小数位配置
function openDecimals() {
    let data = JSON.parse(nowBarCodeDom.dataset.info),
        index = $(event.target).parents('li').attr('data-index');
    $('#decimals-setting')
        .find('.serial-num-input')
        .val(data[index].decimalPlace || 0);
    $('#decimals-setting').attr('data-index', index);
    $('#decimals-setting').modal('show');
}

// 保存包装量小数位配置
function saveDecimals() {
    let data = JSON.parse(nowBarCodeDom.dataset.info),
        index = $('#decimals-setting').attr('data-index'),
        fieldTable = data[index].tableName + '_' + data[index].fieldName;
    data[index].decimalPlace = $('#decimals-setting').find('.serial-num-input').val();
    data.forEach(v => {
        if (v.tableName + '_' + v.fieldName === fieldTable) {
            v.decimalPlace = data[index].decimalPlace;
        }
    });
    nowBarCodeDom.dataset.info = JSON.stringify(data);
    $('#decimals-setting').modal('hide');
}

// 打开保存规则弹窗
function openSaveRule() {
    $('#saveRule').modal('show');
}

// 关闭保存规则弹窗
function closeSaveRule() {
    $('#saveRule').modal('hide');
    $('#rulesName').val('');
}

// 打开生产日期
function openProductDate() {
    var data = JSON.parse(nowBarCodeDom.dataset.info);
    var index = $(event.target).parents('li').attr('data-index');
    $('#isProductionDateRequired').prop('checked', globalSetting.isProductionDateRequired);
    layForm.render();
    $('#product-date').attr('data-index', index);
    $('#product-date')
        .find('select')
        .val(data[index].dateFormat || 'yyyy-MM-dd');
    $('#product-date').modal('show');
}

// 保存生产日期
function saveProductDate() {
    var data = JSON.parse(nowBarCodeDom.dataset.info);
    data[$('#product-date').attr('data-index')].dateFormat = $('#product-date')
        .find('select')
        .val();
    nowBarCodeDom.dataset.info = JSON.stringify(data);
    globalSetting.isProductionDateRequired = +$('#isProductionDateRequired').prop('checked');
    $('#product-date').modal('hide');
}

// 文本数据项回填
function textAddDataItem(obj) {
    if (!Global.editing.dataItem) return;
    var field = obj[0].innerText.replace('${', '').replace('}', '');
    var index = Global.editing.dataItem.findIndex(v => v.dataItemsName === field);
    if (index === -1) return;
    var data = Global.editing.dataItem[index];
    let arr = [];
    data.dataItemsList.forEach((v, i) => {
        if (v.configType === '3') {
            if (v.year) {
                arr.push(
                    dateFormatTransition([
                        data.dataItemsList[i],
                        data.dataItemsList[i + 1],
                        data.dataItemsList[i + 2]
                    ])
                );
            }
            return;
        }
        v.fieldIndex = configTypeToFieldIndex(v);
        if (+v.fieldIndex.split('-')[0] === 1) {
            v.tablenNames = tablenNamesObj[v.fieldIndex.split('-')[0] - 1];
        }
        arr.push(v);
    });
    obj[0].dataset.field = data.dataItemsName;
    obj[0].dataset.info = JSON.stringify(arr);
    obj[0].dataset.issn = data.snFlag;
    obj[0].dataset.id = data.dataItemsId;
    obj[0].dataset.code = data.testData;
}

// 条码数据项回填
function barCodeId(obj) {
    if (!Global.editing.dataItem) return;
    var img = $(obj).find('.jatools-coder');
    if (!img.attr('data-field')) return;
    var field = img.attr('data-field').replace('${', '').replace('}', '');
    var index = Global.editing.dataItem.findIndex(v => v.dataItemsName === field);
    if (index === -1) return;
    var data = Global.editing.dataItem[index];
    let arr = [];
    data.dataItemsList.forEach((v, i) => {
        if (v.configType === '3') {
            if (v.year) {
                arr.push(
                    dateFormatTransition([
                        data.dataItemsList[i],
                        data.dataItemsList[i + 1],
                        data.dataItemsList[i + 2]
                    ])
                );
            }
            return;
        }
        v.fieldIndex = configTypeToFieldIndex(v);
        if (+v.fieldIndex.split('-')[0] === 1) {
            v.tablenNames = tablenNamesObj[v.fieldIndex.split('-')[0] - 1];
        }
        arr.push(v);
    });
    img[0].dataset.info = JSON.stringify(arr);
    img[0].dataset.id = data.dataItemsId;
}

// 自动保存
function autoSave(status) {
    // 新增时不自动保存
    if (!hasEdit) return;
    // 保存的时间间隔
    var timeInerval = 60000;
    if (!status) {
        clearInterval(saveTimer);
        saveTimer = null;
        return;
    }
    saveTimer = setInterval(function () {
        if (document.hidden) return;
        if (!isNext(false)) return;
        createLitimg(false);
        if (!hasEdit) clearInterval(saveTimer);
    }, timeInerval);
}

/**
 * @function 判断是否可以保存或预览
 * @version 2.3.0
 * @param {String} type
 * @return {Boolean}
 */
function isNext() {
    if (isLabelTmp) {
        var info = getPageDataItem();
        // var nameObj = info.map(v => v.dataItemsName);
        var nameObj = {};
        // 错误消息
        var errorInfo = {
            errorMsg: '',
            domName: []
        };
        // 是否存在条码sn
        var hasSn = false;

        info.every(v => {
            const { dataItemsName = '', snFlag, domCompName } = v;
            const obj = [
                {
                    condition: !dataItemsName,
                    msg: '存在控件数据项名称为空'
                },
                {
                    condition: dataItemsName.length > 30,
                    msg: '存在控件数据项名称超过30个字符'
                },
                {
                    condition:
                        !/^[\u4E00-\u9FA5A-Za-z]/.test(dataItemsName) &&
                        /^([\u4e00-\u9fa5\da-zA-Z]|_(?!_))+$/.test(dataItemsName),
                    msg: '存在控件数据项名称开头为数字或包含中文字母数字下划线以外的字符'
                },
                {
                    condition: !isCustomize && v.list.length === 0,
                    msg: '存在控件数据项未配置'
                },
                {
                    condition: false,
                    msg: '请设置一个默认物料SN',
                    success: function () {
                        if (+snFlag === 1) {
                            hasSn = true;
                        }
                    }
                },
                {
                    condition: nameObj[dataItemsName],
                    msg: '数据项名称不能重复',
                    success: function () {
                        nameObj[dataItemsName] = domCompName;
                    },
                    error: function () {
                        errorInfo.domName = [nameObj[dataItemsName], domCompName];
                    }
                }
            ];
            return obj.every(v1 => {
                let flag = v1.condition;
                if (flag) {
                    errorInfo.errorMsg = v1.msg;
                    errorInfo.domName = [v.domCompName];
                    v1.error && v1.error();
                } else {
                    v1.success && v1.success();
                }
                return !flag;
            });
        });

        if (!errorInfo.errorMsg && !hasSn && isLabelTmp && !isCustomize) {
            errorInfo.errorMsg = '请设置一个默认物料SN';
        }

        if (errorInfo.errorMsg && isLabelTmp) {
            toggleHighlight(errorInfo.domName.map(v => $('.' + v)[0]));

            scmAlert(errorInfo.errorMsg, {
                status: '3'
            });
            return false;
        }
    }

    // 判断是否有未选中图片的图片控件
    var hasImgSrcEmpty = false;
    $('.jp-image').each((i, v) => {
        if ($(v).find('.jp-image-view').attr('src') === 'images/blank.png') {
            hasImgSrcEmpty = true;
        }
    });
    if (hasImgSrcEmpty) {
        scmAlert('存在图片控件未选择图片', {
            status: '3'
        });
        return false;
    }

    return true;
}

function getImg() {
    // 捕获的节点
    var shareContent = document.getElementById('thumb-img');
    // 把页面中的img标签引入的svg替换为svg
    return SVGInject(shareContent.querySelectorAll('img[src$=".svg"]')).then(function () {
        var getPixelRatio = function (context) {
            // 获取设备的PixelRatio
            var backingStore =
                context.backingStorePixelRatio ||
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio ||
                0.5;
            return (window.devicePixelRatio || 0.5) / backingStore;
        };
        // 获取svg并给svg设置宽高
        var svgElements = shareContent.querySelectorAll('svg');
        svgElements.forEach(function (item) {
            if (item.classList[0] === 'line' && ($(item).width() < 10 || $(item).height() < 10)) {
                var line = $(item).children('line');
                line.attr('stroke-width', line.attr('stroke-width') * 10);
            }
            item.setAttribute('width', item.getBoundingClientRect().width);
            item.setAttribute('height', item.getBoundingClientRect().height);
            item.style.width = null;
            item.style.height = null;
        });
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var scale = getPixelRatio(context); //将canvas的容器扩大PixelRatio倍，再将画布缩放，将图像放大PixelRatio倍。
        var width = shareContent.offsetWidth * scale;
        var height = shareContent.offsetHeight * scale;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        var opts = {
            scale: scale,
            canvas: canvas,
            width: width,
            height: height,
            dpi: window.devicePixelRatio,
            useCORS: true,
            logging: false
        };
        return html2canvas(shareContent, opts).then(function (canvas) {
            var dataUrl = canvas.toDataURL('image/png', 1.0);
            return {
                base64: dataUrl
            };
        });
    });
}

// 保存模板生成缩略图
function createLitimg() {
    // 判断模板名称是否符合
    var tmpName = $('#tmpName').val();
    if (!tmpName || /^\s*$/.test(tmpName)) {
        scmAlert('模板名称不能为空且不能有任何空白字符', {
            status: '3'
        });
        return;
    }
    // 判断模板内容是否为空
    var isEmptyTmp = true;
    $('#jp-page')
        .children()
        .each((i, v) => {
            if (i < 4) return;
            if ($(v).css('display') === 'block' && !$(v).hasClass('rotate-shadow')) {
                isEmptyTmp = false;
            }
        });
    if (isEmptyTmp) {
        scmAlert('模板内容不能为空！', {
            status: '3'
        });
        return;
    }
    scmLoad();
    var dom = $('#thumb-img');
    dom.html(getPageHtml(1).thumbInfo)
        .find('.jatools-coder')
        .each(function () {
            $(this).replaceWith($('<img class="jatools-coder">').attr('src', $(this).attr('src')));
        });
    var imgNum = dom.find('img').length;
    if (dom.find('img').length === 0) {
        saveTemplate();
        return;
    }
    dom.find('img').load(function () {
        if (!--imgNum) {
            saveTemplate();
        }
    });
    dom.find('img').error(function () {
        if (!--imgNum) {
            saveTemplate();
        }
    });
}

async function saveTemplate() {
    var obj = await getImg();
    // 获取不到缩略图就不保存
    if (obj.base64 === 'data:,') {
        scmAlert('缩略图获取失败', {
            status: '3'
        });
        scmLoad();
        return;
    }
    // 判断模板名称长度
    if ($('#tmpName').val().length > 30) {
        scmAlert('模板名称不能超过30个字符', {
            status: '3'
        });
        scmLoad();
        return;
    }
    customList = [];
    Global.editing.datasource.ui.fields.forEach(v => {
    	if(v.isCustomize) {
    		customList.push({
    			customizeCol: v.field,
    			style: '',
    			isRequired: false
    		})
    	}
    });
    var json = {
        json: {
            temp: {
                id: tmpId,
                classId: classId, // 模板分类ID
                labelName: $('#tmpName').val(), // 模板名称
                text: sourceCodeViewer.util.encodeTemplate(),
                labelLength: getPaperSize().paperHeight, // 长度
                labelWidth: getPaperSize().paperWidth, // 宽度
                unit: 'mm', // 单位
                samplePic: obj.base64,
                templateType: tmpType,
                labelRow: labelSetting['jp-label-row'],
                labelCol: labelSetting['jp-label-column'],
                horizontalSpacing:
                    +labelSetting['jp-label-column'] === 1
                        ? 0
                        : labelSetting['jp-label-horizontal'],
                verticalSpacing:
                    +labelSetting['jp-label-row'] === 1 ? 0 : labelSetting['jp-label-vertical'],
                lLength: labelSetting['jp-label-height'],
                lWidth: labelSetting['jp-label-width'],
                direction: +$('#jp-page').is('.jp-landscape'), // 0 纵向  1  横向,
                outsideFlag: getOutsideFlag(),
                defaultFlag: getOutsideFlag() == '1' ? '0' : '',
                // 自定义数据项
                customList
            },
            // 如果是标签模板则获取页面的数据项
            list: isLabelTmp ? getPageDataItem('toService') : []
        }
    };

    var fnName = isLabelTmp
        ? hasEdit
            ? 'updateTemplate'
            : 'insert'
        : hasEdit
            ? 'updateTemplateDocument'
            : 'add';
    var url =
        '/template/' +
        fnName +
        '?mcUserId=' +
        mcUserId +
        '&mcDataAuthId=' +
        mcDataAuthId +
        '&type=' +
        tmpType;
    mesAjax({
    	// id: hasEdit ? '54995ebbab73440083ede9ec3c688899' : '15e5a2ccb43f4bfe9508964ae147c574',
    	url: portAddress + (hasEdit ? '54995ebbab73440083ede9ec3c688899' : '15e5a2ccb43f4bfe9508964ae147c574'),
    	data: {
    		json: JSON.stringify(json.json)
    	},
    	success: function(data) {
            hasEdit = true;
            $('#jp-export').show();
            scmAlert('保存成功！', {
                confirm: function () {
                    $('#scm-alert').find('.msg-close').click();
                },
                close: function () {
                }
            });
            closeCurAndReresh(!hasEdit);
            scmLoad();
    	},
        error: function (data) {
            scmLoad();
            ajaxErr(data);
        }
    })
   /* $.ajax({
        type: 'post',
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify(json),
        url: getProjectName() + url,
        success: function (data) {
            if (data.code === '200') {
                hasEdit = true;
                $('#jp-export').show();
                scmAlert('保存成功！', {
                    confirm: function () {
                        $('#scm-alert').find('.msg-close').click();
                    },
                    close: function () {
                    }
                });
                closeCurAndReresh(!hasEdit);
            } else {
                scmAlert(statusCode[data.message], {
                    status: '2'
                });
            }
            scmLoad();
        },
        error: function (data) {
            scmLoad();
            ajaxErr(data);
        }
    });*/
}

/**
 * @function 获取当前页面的html
 * @param type {Number} 1为缩略图 2为预览
 */
function getPageHtml(type) {
    // 判断宽高是否不正确
    getQueryVariable('tid') &&
        changeWidthHeight(
            !$('#jp-page').is('.jp-landscape'),
            $.style($('#jp-page')[0], 'width'),
            $.style($('#jp-page')[0], 'height')
        );
    var template = sourceCodeViewer.util.encodeTemplate();
    var dataset = {};
    // 当为标签模板且为预览时才获取多行多列
    var isMultiLineColumn = isLabelTmp && +type === 2;

    var paperWidth = isMultiLineColumn
        ? parseInt(getPaperSize().paperWidth)
        : labelSetting['jp-label-width'];
    var paperHeight = isMultiLineColumn
        ? parseInt(getPaperSize().paperHeight)
        : labelSetting['jp-label-height'];

    // 解决当为横向时 缩略图宽高问题
    if (isLabelTmp && +type === 1 && +$('#jp-page').is('.jp-landscape') === 1) {
        var a = paperWidth;
        paperWidth = paperHeight;
        paperHeight = a;
    }

    if (isLabelTmp) {
        var info = getPageDataItem();
        var num = labelSetting['jp-label-row'] * labelSetting['jp-label-column'];
        info.forEach(v => {
            dataset[v.dataItemsName] = isCustomize ? v.testData : previewConfig(v.list);
        });
        if (Object.keys(dataset).length === 0) {
            dataset.a = '123456';
        }
        dataset = Array.from(
            {
                length: isMultiLineColumn ? num : 1
            },
            () => dataset
        );
    } else {
        dataset = PREVIEW_DEMO_LIST[tmpType];
    }
    var html;
    mesAjax({
    	data: {
            thumbnail: template,
            data: JSON.stringify(dataset),
            setting: JSON.stringify({
                labelWidth: labelSetting['jp-label-width'],
                labelHeight: labelSetting['jp-label-height'],
                labelRow: isMultiLineColumn ? labelSetting['jp-label-row'] : 1,
                labelColumn: isMultiLineColumn ? labelSetting['jp-label-column'] : 1,
                labelHorizontal: labelSetting['jp-label-horizontal'],
                labelVertical: labelSetting['jp-label-vertical'],
                direction: +$('#jp-page').is('.jp-landscape'), // 0 纵向  1  横向
                type: tmpType,
                // 单据模板和缩略图不需要多行多列
                paperWidth,
                paperHeight
            }),
            type,
            templateType: tmpType// isLabelTmp ? 'Y' : 'N'
        },
        async: false,
        url: portAddress + '78cd799a03f4484188eea7f664b9e201',
        success: function(data) {
            html = {
            	styleInfo: data.styleInfo,
            	bodyInfo: data.msg,
            	thumbInfo: data.thumbInfo
            };
        }
    })
    /*$.ajax({
        type: 'post',
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify({
            thumbnail: template,
            data: dataset,
            setting: {
                labelWidth: labelSetting['jp-label-width'],
                labelHeight: labelSetting['jp-label-height'],
                labelRow: isMultiLineColumn ? labelSetting['jp-label-row'] : 1,
                labelColumn: isMultiLineColumn ? labelSetting['jp-label-column'] : 1,
                labelHorizontal: labelSetting['jp-label-horizontal'],
                labelVertical: labelSetting['jp-label-vertical'],
                direction: +$('#jp-page').is('.jp-landscape'), // 0 纵向  1  横向
                type: tmpType,
                // 单据模板和缩略图不需要多行多列
                paperWidth,
                paperHeight
            },
            type,
            isLabelTmp: isLabelTmp ? 'Y' : 'N'
        }),
        async: false,
        url: getProjectName() + '/template/thumbnail',
        success: function (data) {
            html = data.data;
        },
        error: function (data) {
            ajaxErr(data);
        }
    });*/
    return html;
}

//关闭当前页且刷新父页面列表
function closeCurAndReresh(flag) {
    try {
        var iframeId = '';
        var iframeSeq = 0; //

        if (window.frameElement != null) {
            iframeId = window.frameElement.id;
            iframeSeq = iframeId.replace('iframe', '');

            var parentFrameId = getQueryVariable('iframeId');
            if (parentFrameId != null && parentFrameId != '') {
                $(window.parent.document)
                    .contents()
                    .find('#' + parentFrameId)[0]
                    .contentWindow.renderTemplate();
            }
        }
        //top.closeTab即MC系统中mainFrame1.jsp中的closeTab方法
        if (flag) {
            // iframeId == "" ? window.close() : top.closeTab(iframeSeq);
        }
    } catch (e) {
        console.error(e);
        window.close();
    }
}

/**
 * @function 日期格式转换
 * @description 后端需要把日期项分成年月日三个项的数据
 * @version 2.3.0
 * @param {String} type
 * @return {String}
 */
function dateFormatTransition(cur, i) {
    if (isArray(cur)) {
        return {
            configType: '3',
            fieldIndex: '3',
            day: cur[2].day,
            dayList: cur[2].dayList,
            month: cur[1].month,
            monthList: cur[1].monthList,
            snReset: cur[0].snReset,
            year: cur[0].year,
            configId: [cur[0].configId, cur[1].configId, cur[2].configId]
        };
    } else {
        const { snReset, year, month, monthList, dayList, day } = cur;
        let arr = [
            {
                snReset,
                year,
                sort: i,
                configType: '3',
                decimalPlace: 0,
                dateStatus: 1,
                configId: ''
            },
            {
                snReset,
                month,
                sort: i + 1,
                configType: '3',
                decimalPlace: 0,
                dateStatus: 2,
                configId: '',
                monthList: monthList ? monthList : defaultDateArr(31, +cur.month === 1)
            },
            {
                snReset,
                day,
                sort: i + 2,
                configType: '3',
                decimalPlace: 0,
                dateStatus: 3,
                configId: '',
                dayList: dayList ? dayList : defaultDateArr(31, +cur.dayList === 1)
            }
        ];
        if (cur.configId && isArray(cur.configId)) {
            arr[0].configId = cur.configId[0];
            arr[1].configId = cur.configId[1];
            arr[2].configId = cur.configId[2];
        }
        return arr;
    }
}

/**
 * @function 计数器
 * @description 依赖 jquery.js counter.css
 * @version 1.1
 * @param {String} id
 * @param {Number} option.defaultValue 渲染后的默认值
 * @param {Number} option.min 最小值
 * @param {Boolean} option.decimal 是否可以输入小数
 * @param {Function} callback 输入框值改变后回调
 */
function renderInput(id, option) {
    var { decimal = false, defaultValue = 0, min = 0, callback } = option;
    // 如果默认值小于min则重新赋值
    if (defaultValue < min) defaultValue = min;
    var html =
        '<div class="scm-input-container"><input class="scm-number-input" type=""><span class="scm-number-btn">' +
        '<span class="iconfont icon-up"></span><span class="iconfont icon-down"></span></span></div>';
    $('#' + id).append(html);
    var timer = null;
    var input = $('#' + id).find('input');
    var iconUp = $('#' + id).find('.icon-up');
    var iconDown = $('#' + id).find('.icon-down');

    input.val(defaultValue);
    input.attr('type', decimal ? 'number' : 'tel');
    iconDown.addClass(+defaultValue - 1 < min ? 'btn-disabled' : '');

    // 值校验以及按钮状态校验
    const valueVerify = function (e) {
        const value = +input[0].value;
        if (e.type === 'input') {
            // 如果不能不输入小数则替换小数点
            if (!decimal && e.data === '.') input.val(value.replace(/\./g, ''));
            // 最小值校验
            if (value < min) input.val(min);
        } else if (e.type === 'blur' && value === 0) {
            // 空值校验
            input.val(min);
        }
        // 当-1小于最小值时 自减按钮设置不可用
        if (value - 1 < min) {
            clearInterval(timer);
            timer = null;
            iconDown.addClass('btn-disabled');
        } else if (value - 1 >= min) {
            iconDown.removeClass('btn-disabled');
        }
        callback && callback(id, input[0]);
    };

    // 自增、自减按钮按下
    const btnMouseDown = function (e, num) {
        if ($(this).hasClass('btn-disabled')) return;
        let value = +input.val();
        input.val(value + num);
        valueVerify(e);
        timer && clearInterval(timer);
        timer = setTimeout(function () {
            timer = setInterval(function () {
                var v = +input.val() + num;
                if (v < min) return;
                input.val(v);
                valueVerify(e);
            }, 100);
        }, 400);
    };

    // 监听输入框手动输入
    input[0].addEventListener('input', function (e) {
        valueVerify(e);
    });
    // 监听输入框失去焦点
    input[0].addEventListener('blur', function (e) {
        valueVerify(e);
    });
    // 监听自增按钮鼠标按下
    iconUp[0].addEventListener('mousedown', function (e) {
        btnMouseDown.call(this, e, 1);
    });
    // 监听自减按钮鼠标按下
    iconDown[0].addEventListener('mousedown', function (e) {
        btnMouseDown.call(this, e, -1);
    });
    // 鼠标抬起
    document.addEventListener('mouseup', function () {
        clearInterval(timer);
        timer = null;
    });
}

function changeWidthHeight(portrait, w, h) {
    if (isLabelTmp) {
        if (
            getQueryVariable('tid') &&
            parseInt(w) === Global.editing.tmpInfo.labellength &&
            parseInt(h) === Global.editing.tmpInfo.labelwidth &&
            portrait
        ) {
            var paperHeight = Global.editing.tmpInfo.labellength;
            Global.editing.tmpInfo.labellength = Global.editing.tmpInfo.labelwidth;
            Global.editing.tmpInfo.labelwidth = paperHeight;
        }
        labelSetting['jp-label-width'] = parseInt(w);
        labelSetting['jp-label-height'] = parseInt(h);
        $('#jp-label-width').find('input').val(parseInt(w));
        $('#jp-label-height').find('input').val(parseInt(h));
    } else {
        if (portrait) {
            if (getQueryVariable('tid')) {
                Global.editing.tmpInfo.labellength = h;
                Global.editing.tmpInfo.labelwidth = w;
            }
            labelSetting['jp-label-width'] = parseInt(w);
            labelSetting['jp-label-height'] = parseInt(h);
        } else {
            if (getQueryVariable('tid')) {
                Global.editing.tmpInfo.labellength = w;
                Global.editing.tmpInfo.labelwidth = h;
            }
            labelSetting['jp-label-width'] = parseInt(h);
            labelSetting['jp-label-height'] = parseInt(w);
        }
    }
}

// 计算标签宽度与纸张宽度
function calcLabelWidth(id) {
    // 如果是单据模板不执行之后代码
    if (!isLabelTmp) return false;
    var w = +$('#jp-page').is('.jp-landscape')
        ? $('#jp-label-height').find('input').val()
        : $('#jp-label-width').find('input').val(),
        h = +$('#jp-page').is('.jp-landscape')
            ? $('#jp-label-width').find('input').val()
            : $('#jp-label-height').find('input').val(),
        row = $('#jp-label-row').find('input').val(),
        column = $('#jp-label-column').find('input').val(),
        horizontal = $('#jp-label-horizontal').find('input').val(),
        vertical = $('#jp-label-vertical').find('input').val(),
        direction = +$('#jp-page').is('.jp-landscape'); // 0 纵向  1  横向
    if (id) {
        labelSetting[id] = $('#' + id).find('input').val();
    } else {
        labelSetting['jp-label-width'] = w;
        labelSetting['jp-label-height'] = h;
        labelSetting['jp-label-row'] = row;
        labelSetting['jp-label-column'] = column;
        labelSetting['jp-label-horizontal'] = horizontal;
        labelSetting['jp-label-vertical'] = vertical;
    }
    if (+labelSetting['jp-label-row'] === 1) {
        $('#jp-label-vertical').find('.iconfont').addClass('btn-disabled');
        $('#jp-label-vertical').find('input').attr('disabled', 'disabled');
        $('#jp-label-vertical').find('input').val(0);
    } else {
        $('#jp-label-vertical').find('.iconfont').removeClass('btn-disabled');
        $('#jp-label-vertical').find('input').removeAttr('disabled');
    }
    if (+labelSetting['jp-label-column'] === 1) {
        $('#jp-label-horizontal').find('.iconfont').addClass('btn-disabled');
        $('#jp-label-horizontal').find('input').attr('disabled', 'disabled');
        $('#jp-label-horizontal').find('input').val(0);
    } else {
        $('#jp-label-horizontal').find('.iconfont').removeClass('btn-disabled');
        $('#jp-label-horizontal').find('input').removeAttr('disabled');
    }
    if (
        w * column + (column - 1) * horizontal > $('#jp-paper-width').val() ||
        h * row + (row - 1) * vertical > $('#jp-paper-height').val()
    ) {
        // clearInterval(timer);
        // $('#jp-setting').parent().children().eq(0).find('.bootstrap-dialog-close-button').hide();
        return true;
    } else {
        // $('#jp-setting').parent().children().eq(0).find('.bootstrap-dialog-close-button').show();
        return false;
    }
}

//获取容器style属性
function getStyleValue(id, attr) {
    var arr = $('#' + id)
        .attr('style')
        .replace(/\s/g, '')
        .split(/[;:]/g);
    if (arr.indexOf(attr) === -1) return '';
    return arr[arr.indexOf(attr) + 1];
}

/**
 * @function 容器高亮
 * @description 需要引animate.css
 * @version 1.0.0
 * @param {Object} dom 高亮的节点
 * @param {Boolean} type true为添加 false为取消 可以手动关闭高亮
 */
var highlightTimer = [];
function toggleHighlight(dom, type = true) {
    highlightTimer.forEach(v => clearInterval(v));
    highlightTimer = [];
    Array.from(dom).forEach(v => {
        // 获取当前dom内是否已经存在高亮
        let highlight = v.querySelector('.dom-highlight');
        const animateName = ['animate__animated', 'animate__headShake'];
        if (highlight) {
            highlight.style.display = 'none';
            highlight.classList.remove(...animateName);
            if (!type) return;
        } else if (!highlight) {
            highlight = document.createElement('div');
            highlight.className = 'dom-highlight';
            v.append(highlight);
        }
        // 触发浏览器重绘
        highlight.offsetHeight;
        highlight.classList.add(...animateName);
        highlight.style.display = 'block';
        highlight.style.opacity = 1;
        v.style.zIndex = 104;
        v.style.overflow = 'initial';
        highlightTimer.push(
            setTimeout(() => {
                $(highlight).animate({
                    opacity: 0
                });
                v.style.overflow = 'overflow';
            }, 3000)
        );
    });
}

/**
 * @function 防止xss注入
 * @version 1.0.0
 * @param {String} str 替换的html
 */
function xssStrReplace(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @function 计算防止精度丢失 需引入math.js
 * @param {number} num 数值
 * @param {String} symbol 符号
 * @param {number} num1 数值
 */
function calculate(num, symbol, num1) {
    var fn = {
        '+': 'add',
        '-': 'subtract',
        '/': 'divide',
        '*': 'multiply'
    };
    num = math.bignumber(num || 0);
    num1 = math.bignumber(num1 || 0);
    var result = math[fn[symbol]](math.bignumber(num), math.bignumber(num1));
    return +math.format(result);
}

/**
 * @function 四舍五入保留小数
 * @description 需要引入math.js
 * @version 2.0.1
 * @param {Number} num 需要转换的值
 * @param {Number} keepNum 保留小数位
 * @param {Boolean} isAddZero 是否补0,只有当keepNum不为0时才能开启
 */
function getRound(num, keepNum = 0, isAddZero = false) {
    var num = math.round(num, keepNum);
    num = isAddZero ? num.toFixed(keepNum) : num;
    return num;
}
