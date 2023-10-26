var PP = (function () {
    function doPrint(code, type, mcDataAuthId) {
        var key = '55c2e4491648465d8a6e967f905f2269';
        if (!key) {
            alert('API key 不能为空.');
            $('#key').focus();
            return;
        }
        DDDY.getToken(key, function (result) {
            if (result.token) {
                $.cookie('token', result.token);
                $.cookie('key', key);
            }
            $('#result').text(JSON.stringify(result, null, 4));
            doPrint1(result.token, code, type, mcDataAuthId);
        });
    }

    // 打印
    function doPrint1(token, code, type, mcDataAuthId) {
        printBefore(function () {
            var how = '0';
            var tid = type;
            var dataset = new Array();
            var bodyData = new Array();
            var map = new Map();
            if (!tid) {
                alert('模板id不能为空.');
                $('#tid').focus();
                return;
            }
            var obj = {
                code: code
            };
            $.ajax({
                type: 'post',
                dataType: 'json',
                data: JSON.stringify(obj),
                contentType: 'application/json;charset=utf-8',
                async: false,
                url:
                    getProjectName() +
                    '/out/salesOutDetail/query?code=' +
                    code +
                    '&mcDataAuthId=' +
                    mcDataAuthId +
                    '&type=' +
                    type,
                success: function (data) {
                    if (data.code == '200') {
                        var datas = data.data;
                        var head = datas.head[0];
                        datas.head[0].company = datas.company;
                        var company = datas.company;
                        tid = getQueryVariable('tid') || datas.tid;
                        if (head != null && head != '') {
                            dataset = getPreviewDataByData(data.data, type);
                        }
                        if (!dataset) {
                            alert('数据不能为空.');
                            $('#dataset').focus();
                            return;
                        }
                        if (how == 0) {
                            wisPreviewById(
                                tid,
                                dataset,
                                function () {
                                    window.localStorage.setItem('canPreview', 'true');
                                },
                                false
                            );
                        } else {
                            DDDY.print(token, tid, dataset, how == 1, function (result) {
                                if (result) $('#result').text(JSON.stringify(result, null, 4));
                                else {
                                    $('#result').text('打印成功');
                                }
                            });
                        }
                    } else {
                        if (top.utilsFp) {
                            top.utilsFp.confirmIcon(3, '提示', '', '', data.message, 0, '300', '');
                        } else {
                            scmAlert(data.message, { status: 3 });
                        }
                        window.localStorage.setItem('canPreview', 'true');
                    }
                },
                error: function (err) {
                    ajaxErr(err);
                    window.localStorage.setItem('canPreview', 'true');
                }
            });
        });
    }

    return {
        doPrint: doPrint
    };
})();
