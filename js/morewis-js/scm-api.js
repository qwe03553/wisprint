// 请求接口 zh

/* @function 获取物料打印明细
 * 请求参数:
 */
var getLabelPrint = (url, data) => scmAjax(url, JSON.stringify(data), 'POST');

/* @function 获取物料打印明细
 * 请求参数:
 * id: 订单id
 * mcDataAuthId: 组织机构
 * materialName: 物料品名
 * materialCode: 物料料号
 */
var getMaterialDetail = data => scmAjax('/out/purchaseInDetail/getList', data);

/* @function 获取物料打印明细
 * 请求参数：
 * id: 明细id
 * mcDataAuthId: 组织机构
 * type: 0是外箱标签 1是物料标签
 * number: 分页页数
 * tempSn: 条码
 */
var getMaterialPrintDetail = data => scmAjax('/template/labelprinttask/geTaskDetails', data);

/* @function 获取包装量信息
 * 请求参数：
 * mcUserId: 明细id
 * mcDataAuthId: 组织机构
 * id: 明细id
 */
var getPackInfoByCode = data => scmAjax('/template/materialdetail/inList', data);

function scmAjax(url, data, type = 'get') {
	return new Promise((resolve, rejected) => {
        $.ajax({
        	type,
            dataType: "json",
            url: getProjectName() + url,
            contentType: type === 'get' ? 'application/x-www-form-urlencoded' : 'application/json;charset=utf-8',
            data: type === 'get' ? data : data,
            success: function(data) {
            	if(data.code === '200') {
                    resolve(data.data);
            	} else {
                	console.error(url);
                	rejected();
            	}
            },
            error: function(data) {
            	!isLocal && top.util.closeLoading();
            	window.localStorage.setItem('canPreview', 'true');
            	console.error(url);
            	console.error(data);
            	rejected();
                ajaxErr(data);
            }
        })
    })
}
