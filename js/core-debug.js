var gActiveEditor = null;
var gEditing = false;
var saas = false;
var viewscale = 1;
var ROTATE = 0;
var util = new Util();
var isFirstOpenPaper = true;
// 给组件添加名称
var applyUClass = null;

//ROTATE
ROTATE = 1;
///ROTATE
$.imageRatios = ["jp-stretch", "jp-keep-width", "jp-keep-height"];

function saveReport(params, callback) {
	__interface.save(params, callback);
}
function testReport(params) {
	__interface.test(params);
}

function exportReport() {
	__interface.export();
}


function setEditables(fields, fieldParent, defaulteditable, fieldParents/* 数组[parent1,parent2,parent3] */) {
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		field.id = fieldParents.length;
		fieldParents.push(fieldParent);
		if (field.type == 'text') {
			// var key = parent + (field.display || field.field);
			if (typeof field.editable == 'undefined') {
				field.editable = defaulteditable;
			}
		} else if (field.type == 'table' || field.type == 'free') {
			setEditables(field.fields, field, defaulteditable, fieldParents);
		}
	}
}
var __interface;

function getFullPageHTML(tmp) {
	var result = {
		data: []
	};
	var $p = $(tmp.pageHTML);
	for (var i = 0; i < tmp.children.length; i++) {
		var el = tmp.children[i];
		var html = null;
		if (el.type == 'table') {
			var id = "jp-table-" + i;
			var $el = null;
			if (el.html) {
				// 是静态表格
				$el = $(el.html).attr("id", id);
			} else {
				$el = $(el.tableHTML);
				var $tmp = $el.find('table');
				if (el.headerHTML) {
					$tmp.append($(el.headerHTML));
				}
				if (el.options["body-rows"]) {
					var bodyrows = el.options["body-rows"];
					//delete el.options["body-max-rows"];
					el.options["body-rows"] = bodyrows;
					for (var c = 0; c < bodyrows; c++) {
						var $row = $(el.bodyHTML);
						if (c > 0) {
							$row.find('span').html("");
						}
						$tmp.append($row);
						if (!el.dataset) {
							break;// 静态表格，只需要一行
						}
					}
				}
				if (el.pageFooterHTML) {
					$tmp.append($(el.pageFooterHTML));
				}
				if (el.footerHTML) {
					$tmp.append($(el.footerHTML));
				}
				$el.attr("id", id);
				result.data.push({
					id: id,
					name: "saved-options",
					value: {
						dataset: el.dataset,
						options: el.options
					}
				})
			}
			html = $el._outerHTML();
		} else
			html = el.html;
		$p.append($(html));
	}
	result.html = $p._outerHTML();
	return result;
}
function templatetohtml(styles, html) {
	return ['<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',//
		'<html>',//
		'<head>',//
		// noscript ? '' : '<title>jatoolsPrinter打印</title>',//
		'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',//
		// noscript ? '' : '<!-- jatoolsPrinter.js 可以下载，也可以直接以 http://... 引入
		// -->\n<script type="text/javascript"
		// src="http://print.jatools.com/jatoolsPrinter.js"></script>', //
		'<style>', styles, '</style>',//
		'</head>',//
		'<body>',//
		html, '</body>',//
		'</html>']//
		.join('\n');
}
//////////////////////////////////////////////////////////////////////////////////////////////////////
//          CORE HERE
//////////////////////////////////////////////////////////////////////////////////////////////////////
$(function () {
	// 刷新全局数据项zh
	refresh = function () {
		$('.jp-page').removeClass('jp-hidden');
		setDatasourceUI();
		$page.trigger("report-load");
	}
	// ////////////////// drop total menu
	function DropDown(el) {
		this.dd = el;
		this.placeholder = this.dd.children('span');
		this.opts = this.dd.find('ul.dropdown > li');
		this.val = '';
		this.index = -1;
		this.initEvents();
	}
	DropDown.prototype = {
		initEvents: function () {
			var obj = this;
			obj.dd.on('click', function (event) {
				$(this).append($("#jp-total-menu"));
				$(this).toggleClass('active');
				return false;
			});
			obj.opts.on('click', function () {
				var opt = $(this);
				obj.val = opt.text();
				obj.index = opt.index();
				obj.placeholder.text(obj.val);
			});
		},
		getValue: function () {
			return this.val;
		},
		getIndex: function () {
			return this.index;
		}
	}
	function getSettings(id, callback) {
		try {
			if (callback) {
				j().getLastSettings(id, callback)
			} else
				return j().getLastSettings(id);
		} catch (e) {
			callback({});
		}
	}
	String.prototype.format = String.prototype.f = function () {
		var s = this, args = arguments;
		var test = /\{([0-9]+)\}/g;
		return s.replace(test, function (g0, g1) {
			return args[parseInt(g1)];
		});
	};
	function finishTabifier(code, callback) {
		code = code.replace(/\n\s*\n/g, '\n'); // blank lines
		code = code.replace(/^[\s\n]*/, ''); // leading space
		code = code.replace(/[\s\n]*$/, ''); // trailing space
		level = 0;
		callback(code);
	}
	function cleanHTML(code, callback) {
		var i = 0;
		function cleanAsync() {
			var iStart = i;
			for (; i < code.length && i < iStart + LOOP_SIZE; i++) {
				point = i;
				// if no more tags, copy and exit
				if (-1 == code.substr(i).indexOf('<')) {
					out += code.substr(i);
					finishTabifier(out, callback);
					return;
				}
				// copy verbatim until a tag
				while (point < code.length && '<' != code.charAt(point))
					point++;
				if (i != point) {
					cont = code.substr(i, point - i);
					if (!cont.match(/^\s+$/)) {
						if ('\n' == out.charAt(out.length - 1)) {
							out += tabs();
						} else if ('\n' == cont.charAt(0)) {
							out += '\n' + tabs();
							cont = cont.replace(/^\s+/, '');
						}
						cont = cont.replace(/\s+/g, ' ');
						out += cont;
					}
					if (cont.match(/\n/)) {
						out += '\n' + tabs();
					}
				}
				start = point;
				// find the end of the tag
				while (point < code.length && '>' != code.charAt(point))
					point++;
				tag = code.substr(start, point - start);
				i = point;
				// if this is a special tag, deal with it!
				if ('!--' == tag.substr(1, 3)) {
					if (!tag.match(/--$/)) {
						while ('-->' != code.substr(point, 3))
							point++;
						point += 2;
						tag = code.substr(start, point - start);
						i = point;
					}
					if ('\n' != out.charAt(out.length - 1))
						out += '\n';
					out += tabs();
					out += tag + '>\n';
				} else if ('!' == tag[1]) {
					out = placeTag(tag + '>', out);
				} else if ('?' == tag[1]) {
					out += tag + '>\n';
				} else if (t = tag.match(/^<(script|style)/i)) {
					t[1] = t[1].toLowerCase();
					tag = cleanTag(tag);
					out = placeTag(tag, out);
					var isStyle = tag.match(/^<style/i);
					end = String(code.substr(i + 1)).toLowerCase().indexOf('</' + t[1]);
					if (end) {
						cont = code.substr(i + 1, end);
						if (isStyle)
							cont = cont.replace(/^([\s]*)(.*)$/gm, function (matched, g1, g2) {
								return ('\t' + (g2 || ''));
							})
						i += end;
						out += cont;
					}
				} else {
					tag = cleanTag(tag);
					out = placeTag(tag, out);
				}
			}
			if (i < code.length) {
				setTimeout(cleanAsync, 0);
			} else {
				finishTabifier(out, callback);
			}
		}
		var point = 0, start = null, end = null, tag = '', out = '', cont = '';
		cleanAsync();
	}
	function tabs() {
		var s = '';
		for (var j = 0; j < level; j++)
			s += '\t';
		return s;
	}
	function cleanTag(tag) {
		var tagout = '';
		tag = tag.replace(/\n/g, ' '); // remove newlines
		tag = tag.replace(/[\s]{2,}/g, ' '); // collapse whitespace
		tag = tag.replace(/^\s+|\s+$/g, ' '); // collapse whitespace
		var suffix = '';
		if (tag.match(/\/$/)) {
			suffix = '/';
			tag = tag.replace(/\/+$/, '');
		}
		var m, partRe = /\s*([^= ]+)(?:=((['"']).*?\3|[^ ]+))?/;
		while (m = partRe.exec(tag)) {
			if (m[2]) {
				tagout += m[1].toLowerCase() + '=' + m[2];
			} else if (m[1]) {
				tagout += m[1].toLowerCase();
			}
			tagout += ' ';
			// Why is this necessary? I thought .exec() went from where it left
			// off.
			tag = tag.substr(m[0].length);
		}
		return tagout.replace(/\s*$/, '') + suffix + '>';
	}
	function placeTag(tag, out) {
		var nl = tag.match(newLevel);
		if (tag.match(lineBefore) || nl) {
			out = out.replace(/\s*$/, '');
			out += "\n";
		}
		if (nl && '/' == tag.charAt(1))
			level--;
		if ('\n' == out.charAt(out.length - 1))
			out += tabs();
		if (nl && '/' != tag.charAt(1))
			level++;
		out += tag;
		if (tag.match(lineAfter) || tag.match(newLevel)) {
			out = out.replace(/ *$/, '');
			out += "\n";
		}
		return out;
	}
	function j() {
		return getJCP();
	}
	function copy(data) {
		j().copy(data, '');
	}
	function copied(callback) {
		return j().copied('', callback);
	}
	function savefile(data) {
		var _j = j();
		_j.chooseFile(htmlfilter, 'htm', true, function (file) {
			if (file) {
				_j.writeString(file, 'utf-8', data);
			}
		});
	}
	function jpAlert(text) {
		var $d = $('#jp-error-dialog').dialog({
			dialogClass: 'jp-error-dialog',
			width2: 200,
			buttons: {
				'知道了': function () {
					$(this).dialog('close');
				}
			}
		}).find('.jp-error-text').html(text);
	}
	// function htmlLoaded(loader){
	// var $doc=$(loader).contents();
	//		
	// }
	function openfile() {
		var _j = j();
		_j.chooseFile(htmlfilter, 'htm', false, function (file) {
			if (file) {
				_j.readHTML(file, 'utf-8', function (html) {
					var $loader = $('<iframe class="jp-html-loader"><iframe>');

					$(document.body).append($loader);
					var doc = $loader.contents()[0];
					doc.open();
					doc.writeln("<html><body></body></html>");
					doc.close();
					doc.body.innerHTML = html;
					var $p = $('.jp-page', doc);
					// 检查是否是正确的jatoolsPrinter可打印文档
					if (!$p.length) {
						jpAlert("你的文档有问题啊,没找到 <strong>id</strong> 为 <strong>page1</strong> 对象啊!");
					} else
						handlers.sourceCodeViewer.util.decode($p);
					$loader.remove();
				});
			}
		});
	}
	function addStyleSheet(css, doc) {
		var el = $('<style type="text/css"></style>').appendTo($('head', doc)).attr({
			type: 'text/css'
		})[0];
		if (el.styleSheet !== undefined && el.styleSheet.cssText !== undefined) { // IE
			el.styleSheet.cssText = css;
		} else {
			el.appendChild(document.createTextNode(css)); // Others
		};
		return el;
	}
	// 记录位置拖动
	function htmlLoaded($loader, url) {
		// debugger;
		var doc = $loader.contents()[0];
		var $p = $('#page1', doc);
		// 检查是否是正确的jatoolsPrinter可打印文档
		if (!$p.length) {
			jpAlert("你的文档有问题啊,没找到 <strong>id</strong> 为 <strong>page1</strong> 对象啊!");
			$loader.remove();
		} else {
			function doLoad(sets) {
				workingDoc.applySettings(sets);
				addStyleSheet(workingDoc.styles, doc);
				handlers.sourceCodeViewer.util.decode($p, url);
				$loader.remove();
				// 处理显示页脚页眉
				var template = Global.editing["report"];
				if (template && template["bands"]) {
					var bands = template["bands"];
					for (var i = 0; i < bands.length; i++) {
						var band = bands[i];
						if (band.name != 'jp-body') {
							$("#" + band.name, $page).css("height", band.height);
							$page.toggleClass("jp-has-" + band.name.split("-")[1], true);
						}
					}
				}
				$page.trigger('report-load');
			}
			getSettings(Global.editing['report-id'], doLoad);
		}
	}
	function loadHTML(content, isHTML/* 有可能content是url,也可能直接就是html */) {
		var loader = $('<iframe class="jp-html-loader" style="position:absolute;top:0px;left:0;width:0;height:0;"><iframe>')[0];
		if (isHTML) {
			$(document.body).append($(loader));
			var doc = $(loader).contents()[0];
			doc.open();
			doc.writeln(content.html || content);
			doc.close();
			if (content.data) {
				// result.data.push({
				// id : id,
				// name : "saved-options",
				// value : {
				// dataset : el.dataset,
				// options : el.options
				// }
				// })
				// html = $el._outerHTML();
				for (var i = 0; i < content.data.length; i++) {
					var d = content.data[i];
					$("#" + d.id, doc).data(d.name, d.value);
				}
			}
			htmlLoaded($(loader), '');
		} else {
			$(document.body).append($(loader));
			loader.src = content;
			loader.onload = function () {
				htmlLoaded($(loader), content);
			};
		}
	}

	var showingDropdown = null;
	function clickHides() {
		//showingDropdown && showingDropdown.data('dropdown-trigger').dropdown('hide');
		//showingColorChooser && $(showingColorChooser).spectrum("hide");
	}
	function enableDropdown($) {
		$.extend($.fn, {
			"tagName": function (newTag) {
				var $newTag = null;
				this.each(function (i, el) {
					var $el = $(el);
					$newTag = $("<" + newTag + ">");

					// attributes
					$.each(el.attributes, function (i, attribute) {
						// console.log(attribute);
						$newTag.attr(attribute.nodeName, attribute.nodeValue);
					});
					// content
					$newTag.html($el.html());

					$el.replaceWith($newTag);
				});
				return $newTag;
			},
			dropdownxxxxx: function (method, data) {
				switch (method) {
					case 'hide':
						hide();
						return $(this);
					case 'attach':
						return $(this).attr('data-dropdown', data);
					case 'detach':
						hide();
						return $(this).removeAttr('data-dropdown');
					case 'disable':
						return $(this).addClass('dropdown-disabled');
					case 'enable':
						hide();
						return $(this).removeClass('dropdown-disabled');
				}
			},
			contextMenu: function (data, beforeShow, noContextTrigger) {
				if (beforeShow) {
					$(this).data('event-before-show', beforeShow);
				}
				// 弹出式菜单，跟下拉框的区别是，trigger有 context-menu 类
				var result = $(this).attr('data-dropdown', data).mousedown(show);
				if (!noContextTrigger) {
					result.addClass('context-menu');
				}
				return result;
			}
		});
		function disableContextMenu(e) {
			e.preventDefault();
		}
		function show(event) {
			var trigger = $(this), contextmenu = trigger.hasClass('context-menu');
			if (contextmenu) {
				if (event.which !== 3) {
					// 以弹出式菜单方式使用下拉，那么，不是右键点击，就不处理了
					return;
				} else
					// 废掉默认的浏览器弹出式菜单
					$(document).bind('contextmenu', disableContextMenu);
			}
			var dropdown = $(trigger.attr('data-dropdown')), isOpen = trigger.hasClass('dropdown-open');
			if (event) {
				if (trigger !== event.target && $(event.target).hasClass('dropdown-ignore'))
					return;
				event.preventDefault();
				event.stopPropagation();
			}
			//hide();
			if (isOpen || trigger.hasClass('dropdown-disabled'))
				return;
			trigger.addClass('dropdown-open');
			dropdown.data('dropdown-trigger', trigger).addClass('block');
			showingDropdown = dropdown;
			// 如果在弹出前，需要修改菜单项的外观，如jp-text,jp-label时，弹出前应修改其是否自动折行的选项
			var beforeShow = trigger.data('event-before-show');
			if (beforeShow) {
				beforeShow.call(this, dropdown);
			}
			position(event, contextmenu);
			dropdown.trigger('show', {
				dropdown: dropdown,
				trigger: trigger
			});
		}
		function hide(event) {
			//return;
			// hide有两种调有，一种是show方法时调用，没有event，一种是点击在文档中，响应
			// 只有后一种情况，才需要unbind方法，以重新开启默认弹出式菜单
			if (event)
				$(document).unbind('contextmenu', disableContextMenu);
			var targetGroup = event ? $(event.target).parents().addBack() : null;
			if (targetGroup && targetGroup.is('.dropdown')) {
				if (targetGroup.is('.dropdown-menu')) {
					if (!targetGroup.is('A'))
						return;
				} else {
					return;
				}
			}
			$(document).find('.dropdown.block').each(function () {
				var dropdown = $(this);
				dropdown.removeClass('block');
				dropdown.removeData('dropdown-trigger').trigger('hide', {
					dropdown: dropdown
				});
			});
			$(document).find('.dropdown-open').removeClass('dropdown-open');
			showingDropdown = null;
		}
		function position(event, contextmenu) {
			var dropdown = $('.dropdown.block').eq(0)
			// 3. Fix X, Y
			// X = Math.max(0, Math.min(X, $(win).width() - $menu.outerWidth(true)) );
			var dropdown = $('.dropdown.block').eq(0), trigger = dropdown.data('dropdown-trigger'), hOffset = trigger
				? parseInt(trigger.attr('data-horizontal-offset') || 0, 10)
				: null, vOffset = trigger ? parseInt(trigger.attr('data-vertical-offset') || 0, 10) : null;
			if (dropdown.length === 0 || !trigger)
				return;
			var y = event.pageY;
			y = Math.max(0, Math.min(y, $(window).height() - 10 - dropdown.find('.dropdown-menu').outerHeight(true)));
			if (contextmenu) {
				dropdown.css({
					left: event.pageX + 20,
					top: y
				});
			} else
				dropdown.css({
					left: dropdown.hasClass('dropdown-anchor-right')
						? trigger.offset().left - (dropdown.outerWidth() - trigger.outerWidth()) + hOffset
						: trigger.offset().left + hOffset,
					top: trigger.offset().top + trigger.outerHeight() + vOffset
				});
		}
		$(document).on('click.dropdown', '[data-dropdown]', show);
		$(document).on('click.dropdown', hide);
		$(window).on('resize', position);
	}
	//nableDropdown(jQuery);
	// undo
	function $Edit(target, fn, oldval, newval, callback) {
		this.target = target;
		if ($.isFunction(fn[0])) {
			this.$unfn = fn[0];
			this.$refn = fn[1];
			this.arg = fn[2] || null;
		} else {
			this.$fn = $.fn[fn[0]];
			this.arg = fn.slice(1);
			this.arg.push(null);
			this.oldval = $.isArray(oldval) ? oldval : [oldval];
			this.newval = newval;
		}
		this.callback = callback;
	}
	$Edit.prototype.data = function (key, val) {
		this[key] = val;
		return this;
	}
	$Edit.prototype.undo = function () {
		var _this = this;
		this.target.each(function (i) {
			if (_this.$unfn) {
				_this.$unfn.call(_this);
			} else
				_this.$fn.apply($(this), _this.arg._last(_this.oldval[i] || ''));
		});
		this.callback && this.callback(this);
		return this;
	}
	$Edit.prototype.redo = function () {
		var _this = this, multiple = $.isArray(this.newval)
		this.target.each(function (i) {
			if (_this.$refn) {
				_this.$refn.call(_this);
			} else
				_this.$fn.apply($(this), _this.arg._last((multiple ? _this.newval[i] : _this.newval)));
		});
		this.callback && this.callback(this);
		return this;
	}
	function $GroupEdit(callback) {
		this.callback = callback;
		this.edits = [];
	}
	$GroupEdit.prototype.undo = function () {
		for (var i = this.edits.length - 1; i >= 0; i--)
			this.edits[i].undo(true);
		$(document).trigger("undid");
		return this;
	}
	$GroupEdit.prototype.redo = function () {
		for (var i = 0; i < this.edits.length; i++)
			this.edits[i].redo(true);
		$(document).trigger("undid");
		return this;
	}
	function Undo(matrix, listener) {
		this.listener = listener;
		this.undos = [];
		this.redos = [];
	}
	Undo.prototype.clear = function () {
		this.undos = [];
		this.redos = [];
	}
	Undo.prototype.fire = function (edit) {
		// this.listener(this.undos.length,this.redos.length);
		edit && edit.callback && edit.callback.call(edit, edit.target);
	}
	Undo.prototype.undo = function (g) {
		var e = null;
		this.undos.length && this.redos.push(e = this.undos.pop().undo()) && this.fire(e);
		!g && $(document).trigger("undid");
	}
	Undo.prototype.redo = function (g) {
		var e = null;
		this.redos.length && this.undos.push(e = this.redos.pop().redo()) && this.fire(e);
		!g && $(document).trigger("undid");
	}
	Undo.prototype.add = function (e) {
		if (this.group)
			this.group.edits.push(e);
		else {
			this.undos.push(e);
			this.redos = [];
			this.fire();
		}
	}
	Undo.prototype.open = function (callback) {
		this.group = new $GroupEdit(callback);
	}
	Undo.prototype.close = function () {
		var e = this.group;
		this.group = null;
		this.add(e);
	}
	Undo.prototype.cancel = function () {
		this.group = null;
	}
	$s = function (excludecells) {
		var selected = $(".ui-selected");
		if (!selected.length && !excludecells) {
			// 多个表格时，可能会有问题
			var g = $('.jp-table').data('no-excel');
			if (g) {
				selected = g.$s();
			}
		}
		return selected;
	}
	function _removeclass() {
		$(this.target).removeClass(this.cls);
	}
	function _addclass() {
		$(this.target).addClass(this.cls);
	}
	var jcss = $.fn.css;
	$.fn.extend({
		'rad': function () {
			var r = (this.first().attr("style") || '').match(/rotate\s*\(\s*([\-\.\d]+)/);
			if (r) {
				return parseFloat(r[1]);
			} else {
				return 0;
			}
		},
		"selectionFontSize": function () {
			var containerEl, sel;
			if (window.getSelection) {
				sel = window.getSelection();
				if (sel.rangeCount) {
					containerEl = sel.getRangeAt(0).commonAncestorContainer;
					// Make sure we have an element rather than a text node
					if (containerEl.nodeType == 3) {
						containerEl = containerEl.parentNode;
					}
				}
			} else if ((sel = document.selection) && sel.type != "Control") {
				containerEl = sel.createRange().parentElement();
			}
			if (containerEl) {
				var fontSize = getComputedStyle(containerEl, null).getPropertyValue('font-size');
				return parseInt(fontSize);
			} else
				return 0;
		},
		'css': function () {
			if ($(this).is(".ui-resizable-handle")) {
				if ((arguments.length == 1 && arguments[0]["top"]) || (arguments.length == 2 && arguments[0] == "top")) {
					//	console.log(arguments)
				}
			}
			return jcss.apply(this, arguments);
		},
		'select': function () {
			$page.firstSelected
			if (!$s().length) {
				$page.data('first-selected') && $page.data('first-selected').removeClass('ui-selected-first');
				$page.data('first-selected', $(this).addClass('ui-selected-first'));
			}
			var result = $(this).addClass('ui-selected');
			// 当当前选中的控件为文本或条码,且当前为标签模板,则可配置数据项 zh
			(this.hasClass('jp-text') || this.children('.jatools-coder')[0]) && barCodeDataItem.call(this);
			setSizePanel();
			$(document).trigger("selection-changed");
			return result
		},
		'unselect': function () {
			// 取消选中 zh
			globalDataItem.call(this);
			var result = $(this).removeClass('ui-selected').removeClass('ui-selected-first');
			setSizePanel();
			$(document).trigger("selection-changed");
			return result
		},
		'selected': function () {
			return $(this[0]).hasClass('ui-selected');
		},
		'vals': function (f, dest) {
			var fn = $.fn[f[0]], arg = f.slice(1);
			return this.each(function () {
				dest.push(fn.apply($(this), arg));
			});
		},
		// 清除所有辅助元素，至刚初始化的状态 ，在复制前，删除前，使用
		'clearHelpElements': function () {
			this.find('.ui-resizable-handle,.col-separator,.row-separator,.jp-vline-handler,.jp-hline-handler').remove();
			// 清除选中，已初始化标志等
			return this;
		},
		// 清除所有帮助类，比如已经初始化标志，可拖动标志等
		'clearHelpClasses': function () {
			return this.removeClass('ui-selected ui-selected-first jp-ininted ui-draggable ui-resizable');
		},
		attr2: function (p, v) {
			var result = jattr.apply(this, arguments);
			if (v != undefined || p != '_codestyle' || result) {
				return result;
			} else {
				var matched = this.parent().html().match(/\b_codestyle\s*=\s*(['"])(.*?)\1/);
				return matched ? matched[2] : '';
			}
		},
		'cssFrom': function (from, styles) {
			var me = this;
			$.each(styles, function () {
				me.css(this, $(from).css(this));
			});
			return this;
		},
		'_css': function (style, newval) {
			if (style == 'background-color') {
				undo.open();
				this.each(function () {
					var $this = $(this), fn;
					if ($this.is(".jp-shape")) {
						fn = ['attr', 'fill'];
						$this = $this.find(".core");
					} else {
						fn = ['css', style];
					}
					var oldval = [];
					$this.vals(fn, oldval)[fn[0]](fn[1], newval);
					undo.add(new $Edit($this, fn, oldval, newval));
				});
				undo.close();
			} else {
				var oldval = [], fn = ['css', style];
				this.vals(fn, oldval).css(style, newval);
				undo.add(new $Edit(this, fn, oldval, newval));
			}
			return this;
		},
		'_attr': function (prop, newval) {
			var oldval = [], fn = ['attr', prop];
			this.vals(fn, oldval).attr(prop, newval);
			undo.add(new $Edit(this, fn, oldval, newval));
			return this;
		},
		'_addClass': function (cls, removes) {
			if (!$(this).hasClass(cls)) {
				$(this).addClass(cls);
				fn = [_removeclass, _addclass];
				undo.add(new $Edit(this, fn).data('cls', cls));
			}
			if (removes) {
				for (var i = 0; i < removes.length; i++) {
					if (removes[i] != cls)
						$(this)._removeClass(removes[i]);
				}
			}
			return this;
		},
		// 返回其中一个存在的css类，
		'_oneClass': function (classes) {
			for (var i = 0; i < classes.length; i++) {
				if ($(this).hasClass(classes[i])) {
					return classes[i];
				}
			}
			return null;
		},
		'_removeClass': function (cls) {
			if ($(this).hasClass(cls)) {
				$(this).removeClass(cls);
				fn = [_addclass, _removeclass];
				undo.add(new $Edit(this, fn).data('cls', cls));
			}
			return this;
		},
		'borderStyle': function (val) {
			// 取得border是全的，还是只需要上，或左，除了线其他组件，都是全的
			var edge = 'full';
			var pattern = borderPatterns[edge];
			var result = {}, me = this, styles = ($(this).attr('style') || '').split(';');
			if (typeof (val) == "undefined") {
				$.each(styles, function () {
					var style = this.split(':');
					if (style.length == 2 && $.trim(style[0]).match(pattern) && !style[0].includes("radius")) {
						result[$.trim(style[0])] = $.trim(style[1]);
					}
				})
				return result;
			} else {
				$.each(styles, function () {
					var style = this.split(':');
					if (style.length == 2 && $.trim(style[0]).match(pattern) && !style[0].includes("radius")) {
						$(me).css($.trim(style[0]), '');
					}
				})
				return this.css(val);
			}
		},
		//				'_object' : function() {
		//					return this.find('object,embed').first();
		//				},
		'borderStyle___': function (val) {
			// 取得border是全的，还是只需要上，或左，除了线其他组件，都是全的
			var edge = 'full';
			var pattern = borderPatterns[edge];
			var me = this, styles = ($(this).attr('style') || '').split(';');
			if (typeof (val) == "undefined") {
				return {
					"border-top": $(this).css("border-top"),
					"border-right": $(this).css("border-right"),
					"border-bottom": $(this).css("border-bottom"),
					"border-left": $(this).css("border-left")
				};
			} else {
				$.each(styles, function () {
					var style = this.split(':');
					if (style.length == 2 && $.trim(style[0]).match(pattern) && !style[0].includes("radius")) {
						$(me).css($.trim(style[0]), '');
					}
				})
				return this.css(val);
			}
		},
		'_outerHTML': function (keepParams) {
			var cloned = this.eq(0).clone();
			if (!keepParams) {
				cloned.find('param').remove();
			}
			return jQuery('<p>').append(cloned).html();
		},
		'_border': function () {
			var result = {}, lastStyle = '', eq = true, me = this[0];
			$.each(['Top', 'Right', 'Bottom', 'Left'], function (i, el) {
				var style = $.css(me, 'border' + el + 'Style') + ' ' + $.css(me, 'border' + el + 'Color') + ' ' + $.css(me, 'border' + el + 'Width');
				result['border-' + el.toLowerCase()] = style.match(/^none.*/) ? '' : style;
				if (i) {
					if (lastStyle != style) {
						eq = false;
					}
				}
				lastStyle = style;
			})
			return eq ? {
				'border': result['border-top']
			} : result;
		},
		'_attrData': function (name, data) {
			return this.attr("data-" + name, JSON.stringify(data));
		},
		'_codeData': function (v) {
			if (v == undefined) {
				// 取数据
				var result = {};
				result.style = this.attr('data-style');
				result.code = this.attr('data-code');
				result.field = this.attr('data-field') || '';
				return result;
			} else {
				try {
					this.attr('data-style', v.style || '');
					this.attr('data-code', v.code || '');
					this.attr('data-field', v.field || '');
					this.data('style', v.style || '');
					this.data('code', v.code || '');
					this.data('field', v.field || '');
				} catch (e) {
				}
				return this;
			}
		},
		'_style': function (p) {
			return $.style(this[0], p);
		},
		'_copyClass': function (from, cls) {
			if ($(from).is('.' + cls)) {
				this.addClass(cls);
			} else
				this.removeClass(cls);
			return this;
		},
		'_copyCss': function (from, p) {
			if (!$.isArray(p))
				p = [p];
			var $me = this;
			$.each(p, function (i, e) {
				$me.css(e, $(from).css(e));
			});
			return this;
		},
		'_copyAttr': function (from, p, def) {
			if (!$.isArray(p))
				p = [p];
			var $me = this;
			$.each(p, function (i, e) {
				if (def) {
					$me.attr(e, $(from).attr(e) || def);
				} else
					$me.attr(e, $(from).attr(e));
			});
			return this;
		},
		'_appendTo': function (val) {
			// 追加一个组件, 如果val没有定义，则表示undo,有定义，表示redo，
			if (!val) {
				// 删除
				this.clearHelpClasses().remove();
			} else {
				initComponent($(this).appendTo($page).select());
			}
			return this;
		},
		'_removeFrom': function (val) {
			// 删除一个组件
			if (!val) {
				// 增加
				initComponent($(this).appendTo($page).select());
			} else {
				this.clearHelpClasses().remove();
			}
			return this;
		},
		'_uClass': function (val) {
			if (typeof (val) == "undefined") {
				var uniqueClassTest = /\bjp\-comp\-[0-9]+/;
				var classname = $(this).attr('class') || '';
				var g = classname.match(uniqueClassTest);
				return g ? g[0] : '';
			} else {
				this.addClass(val);
				return this;
			}
		}
	});
	Array.prototype._last = function (val) {
		this[this.length - 1] = val;
		return this;
	}
	function FileChooser(input, button, filter, changed) {
		$(input).keydown(function (e) {
			if (e.keyCode == 13) {
				e.preventDefault();
				changed($(input).val());
			}
		}).blur(function () {
			changed($(input).val())
		});
		$(button).click(function () {
			function doChoose(file) {
				if (file) {
					$(input).val('file:///' + file.replace(/(\\)/g, '/'));
					changed($(input).val());
				}
			}
			j().chooseFile(filter, '', false, doChoose);
		});
	}
	function RemoteFileChooser(input, button, filter, uploadUrl, changed) {
		$(input).keydown(function (e) {
			if (e.keyCode == 13) {
				e.preventDefault();
				changed($(input).val());
			}
		}).blur(function () {
			changed($(input).val())
		});
		$(button).click(function () {
			function doChoose(file) {
				if (file) {
					j().readBase64(file, function (filedata) {
						$.post(uploadUrl, {
							name: file,
							data: filedata
						}, function (data/*
													* 返回格式有两种
													* 
													* 1.
													* {"error":"上传文件太大了！"}
													* 2.
													* "http://..../..../.jpg"
													* 
													*/) {
							try {
								var jdata = $.parseJSON(data)
								if (jdata.error) {
									scmAlert(jdata.error, { status: 2 });
									return;
								}
							} catch (e) {
							}
							$(input).val(data.replace(/\n/g, ''));
							changed($(input).val());
						});
					});
				}
			}
			j().chooseFile(filter, '', false, doChoose);
		})
	}
	// 纸张设置对话框
	function PaperEditor() {
		var me = this;
		this.setPaper = function () {
			if (me.$paperWidth.val() && me.$paperHeight.val()) {
				var portrait = !this.$orientation.is('.jp-landscape-icon'), //
					w = isLabelTmp ? this.$labelWidth.val() + 'mm' : this.$paperWidth.val() + 'mm', //
					h = isLabelTmp ? this.$labelHeight.val() + 'mm' : this.$paperHeight.val() + 'mm';//
				if (portrait) {
					!isLabelTmp && $page.css({
						width: w,
						height: h
					})
					$page.removeClass('jp-landscape');
				} else {
					!isLabelTmp && $page.css({
						width: h,
						height: w
					})
					$page.addClass('jp-landscape');
				}
				isLabelTmp && $page.css({
					width: w,
					height: h
				})
			}
			compentlistpanel && compentlistpanel.reposition();
		}
		this.getDialog = function () {
			if (!this.$dialog) {
				this.$dialog = $('#jp-new-dialog');
				this.$dialog.addClass('jp-with-remote');
				//				if (!Global.ajaxUpload)
				//					Global.ajaxUpload = new AjaxUpload(Global.config['upload-max-size'], Global.config['upload-max-size-error']);
				// this.$file = $('.jp-file', uploaddoc).change(function(e) {
				// var files = e.target.files || [e.target.value];
				// if (files.length) {
				// // if (files[0].size > Global.config['upload-max-size']) {
				// // alert(Global.config['upload-max-size']Error);
				// // } else
				// $('form', uploaddoc).submit();
				// // me.$updateForm.data("jp-files",
				// // files).submit();
				// }
				// }), //
				this.$background = $('.jp-paper-background', $page), //
					this.$paperWidth = $('#jp-paper-width', this.$dialog),
					this.$paperHeight = $('#jp-paper-height', this.$dialog),
					// 标签宽度 zh
					this.$labelWidth = $('#jp-label-width input', this.$dialog),
					this.$labelHeight = $('#jp-label-height').find('input'),
					this.$duplex = $('.jp-duplex', this.$dialog), //
					this.$duplex.prop("checked", Global.duplex || false);
				this.$alpha = $('#jp-alpha', this.$dialog), //
					this.$src = $('#jp-image-src', this.$dialog).on('propertychange', function () {
						var $src = $('#jp-image-src', me.$dialog);
						var file = $src.val();
						me.$background.attr('src', file || _blank);
					});
				this.$paperSelect = $('#jp-paper-name', this.$dialog).change(function () {
					var size = $(this).val().split(',');
					if (size.length > 1) {
						me.$paperWidth.val(size[0]);
						me.$paperHeight.val(size[1]);
						!isLabelTmp && me.setPaper();
					} else {
						// 如果是自定义纸张，则选中宽度输入框
						me.$paperWidth.focus(function () {
							var me = this;
							setTimeout(function () {
								me.select();
							}, 10)
						}).focus();
					}
				}), //
					setAlpha = function () {
						var val = me.$alpha.slider('value');
						if (val > 0) {
							var opacity = (100 - val) / 100;
							me.$background.css({
								'filter': 'alpha(opacity=' + (100 - val) + ')',
								'opacity': opacity
							});
						} else {
							me.$background.css({
								'filter': '',
								'opacity': ''
							});
						}
					};
				this.$fileInput = $('#jp-file-input', this.$dialog);
				this.$paperWidth.add(this.$paperHeight).bind('input propertychange', function() {
					if(this.value > 1000) {
						this.value = 1000;
						scmAlert('纸张最大尺寸为1000*1000', {
							status: '3'
						});
						
					}
			        this.value = this.value.replace(/[^\d]/g,""); // .replace('.', "$#$").replace(/\./g, "").replace('$#$', ".")
				});
				var tmpSizeInput = isLabelTmp ? this.$labelWidth.add(this.$labelHeight) : this.$paperWidth.add(this.$paperHeight)
				tmpSizeInput.keydown(function (e) {
					if (e.keyCode == 13) {
						me.setPaper();
					}
				}).blur(function () {
					me.setPaper();
				});
				this.$alpha.slider({
					orientation: "horizontal",
					range: "min",
					max: 100,
					value: 0,
					slide: setAlpha,
					change: setAlpha
				});
				$('.jp-orientation input', this.$dialog).change(function () {
					if ($(this).val() == '-') {
						me.$orientation.addClass('jp-landscape-icon');
						if (!$page.is('.jp-landscape')) {
							$page.addClass('jp-landscape');
							!isLabelTmp && $page.css({
								width: $page._style('height'),
								height: $page._style('width')
							})
						}
					} else {
						me.$orientation.removeClass('jp-landscape-icon');
						if ($page.is('.jp-landscape')) {
							$page.removeClass('jp-landscape');
							!isLabelTmp && $page.css({
								width: $page._style('height'),
								height: $page._style('width')
							})
						}
					}
					compentlistpanel && compentlistpanel.reposition();
				});
				this.$orientation = $('.jp-orientation', this.$dialog);
				$('.jp-background-settings input', this.$dialog).change(function () {
					me.$background._addClass($(this).val(), $.imageRatios);
				});
				$('.jp-bands-settings input', this.$dialog).change(function () {
					var klass = this.id;
					$page.toggleClass(klass, this.checked);
				});
				this.$orientation = $('.jp-orientation', this.$dialog);
				// var
				// $button=$('#jp-file-chooser',this.$dialog).click(function(e){
				// e.preventDefault();
				// $('#jp-file-input').click();
				// });
				$('form', me.$dialog).submit(function () {
					return false
				});
				var ____ = null;
				var $src = $('#jp-image-src', me.$dialog);
				var $button = $('#jp-file-chooser', this.$dialog).click(function (e) {
					// $('.jp-file', uploaddoc).val(null);
					Global.ajaxUpload.click(Global.service["upload-image-service"], function (data) {
						// $button.prop("disabled", true);
						try {
							var jdata = data.error ? data : $.parseJSON(data);
							if (jdata.error) {
								scmAlert(jdata.error, {
									status: '3'
								});
								// $button.prop("disabled", false);
								return;
							}
						} catch (e) {
						}
						____ = data;
						setTimeout(function () {
							$src.val(data.replace(/\n/g, ''));
							var file = $src.val();
							// 防止生产库获取的url错误zh
							if (file && !file.match(/^http:\/\//i) && !file.match(/^https:\/\//i))
								file = '../' + file;
							me.$background.attr('src', file || _blank);
							// $button.prop("disabled", false);
						}, 100);
					})
					// $('.jp-file', uploaddoc).trigger("click");
					// $('.jp-file', uploaddoc).trigger("click");
					// me.$file.trigger("click");
					//e.preventDefault();
					$button.prop("disabled", false);
					//eturn false;
				})
				this.$hasHeader = $('#jp-has-header', this.$dialog); //
				this.$hasFooter = $('#jp-has-footer', this.$dialog); //
				// var imagefilter =
				// '图片文件(*.png;*.jpg;*.gif)|*.png;*.jpg;*.gif|所有文件 (*.*)|*.*';
				// if (Global.service["upload-image-service"])
				// new RemoteFileChooser($src, $button, imagefilter,
				// Global.service["upload-image-service"], function(file) {
				// if (file && !file.match(/^http:\/\//i))
				// file = '../' + file;
				// me.$background.attr('src', file || _blank);
				// });
				// else
				// new FileChooser($src, $button, imagefilter, function(file) {
				// me.$background.attr('src', file || _blank);
				// });
			}
			return this.$dialog;
		}
		this.updateUI = function () {
			var portrait = !$page.is('.jp-landscape'), w = $.style($page[0], 'width'), h = $.style($page[0], 'height');
			// portrait 纵向是true  横向是false
			this.oldData = {
				portrait: portrait,//
				width: isLabelTmp ? w : portrait ? w : h,//
				height: isLabelTmp ? h : portrait ? h : w,//
				src: this.$background.attr('src'),//
				filter: this.$background.css('filter') || '',//
				opacity: this.$background.css('opacity') || '',
				ratio: this.$background._oneClass($.imageRatios),
				hasHeader: $page.is(".jp-has-header"),
				hasFooter: $page.is(".jp-has-footer"),
				paperWidth: $('#jp-paper-width').val() + 'mm',
				paperHeight: $('#jp-paper-height').val() + 'mm',
				hMargin: $('#jp-label-horizontal').find('input').val(),
				vMargin: $('#jp-label-vertical').find('input').val(),
				row: $('#jp-label-row').find('input').val(),
				column: $('#jp-label-column').find('input').val()
				//
			}
			// 查询当前纸张 select中，有没有相应的纸张大小，如果有，选中，没有创建一个，然后，选中
			// var expected = parseInt(this.oldData.width) + ',' + parseInt(this.oldData.height);
			if(isFirstOpenPaper) {
				// 判断宽高是否不正确
				changeWidthHeight(!$('#jp-page').is('.jp-landscape'), $.style($('#jp-page')[0], 'width'), $.style($('#jp-page')[0], 'height'));
				if(Global.editing.tmpInfo) {
					this.oldData.paperHeight = Global.editing.tmpInfo.labellength + 'mm';
					this.oldData.paperWidth = Global.editing.tmpInfo.labelwidth + 'mm';
				} else {
					this.oldData.paperHeight = '297mm';
					this.oldData.paperWidth = '210mm';
				}
				this.$paperHeight.val(parseInt(this.oldData.paperHeight));
				this.$paperWidth.val(parseInt(this.oldData.paperWidth));
				isFirstOpenPaper = false;
			}
			var expected = parseInt(this.oldData.paperWidth) + ',' + parseInt(this.oldData.paperHeight);
			if (!$("option[value='" + expected + "']", this.$paperSelect).length) {
				$('<option value="' + expected + '">' + this.oldData.paperWidth + 'X' + this.oldData.paperHeight + '</option>').insertBefore($('option', this.$paperSelect).last());
			}
			this.$paperSelect.val(expected);
			var checked = null;
			if (portrait) {
				this.$orientation.removeClass('jp-landscape-icon');
				checked = '#jp-paper-portrait';
			} else {
				this.$orientation.addClass('jp-landscape-icon');
				checked = '#jp-paper-landscape';
			}
			$('#' + this.oldData.ratio, this.$dialog)[0].checked = true;
			$(checked, this.$dialog)[0].checked = true;
			this.$src.val(this.oldData.src == _blank ? '' : this.oldData.src);
			this.$alpha.slider('value', 100 * (1 - (this.oldData.opacity || 0)));
			this.$duplex.prop("checked", Global.duplex || false);
			//	this.$hasHeader[0].checked = this.oldData.hasHeader;
			//	this.$hasFooter[0].checked = this.oldData.hasFooter;
		}
		this.open = function () {
			if (!this.instance) {
				calcLabelWidth();
				var $dialog = $('#jp-new-dialog');
				this.instance = new BootstrapDialog({
					title: $dialog.attr('title'),
					draggable: true,
					animate: false,
					closeByBackdrop: false,
					closeByKeyboard: false,
					autodestroy: false,
					message: $dialog.removeClass('jp-dialog'),
					onshown: function (d) {
						me.getDialog();
						me.updateUI();
						$('.modal-dialog').draggable({
							handle: '.modal-header',
					        containment: "parent"
						});
					},
					buttons: [{
						cssClass: "",
						label: "确定",
						action: function (dialog) {
							if(calcLabelWidth()) {
								scmAlert("标签高度乘以行数再加上页面上下边距和垂直间距后大于纸张高度。请调整纸张高度、行数、标签高度、边距或者间距，使所有行可以打印在一张纸上。",{ status: 2 })
								return
							}
							var d = me.oldData;
							me.oldData.height = $('#jp-label-height').find('input').val() + 'mm';
							me.oldData.width = $('#jp-label-width').find('input').val() + 'mm';
							me.setPaper();
							undo.open();
							var oldval = d.src, newval = me.$background.attr('src'), fn = ['attr', 'src'];
							undo.add(new $Edit(me.$background, fn, oldval, newval));
							fn = ['css'];
							undo.add(new $Edit(me.$background, fn, {
								filter: d.filter,
								opacity: d.opacity
							}, {
								filter: me.$background.css('filter'),
								opacity: me.$background.css('opacity')
							}));
							var newratio = me.$background._oneClass($.imageRatios);
							if (d.ratio != newratio) {
								me.$background.removeClass(newratio);
								me.$background.addClass(d.ratio);
								me.$background._addClass(newratio, [d.ratio]);
							}
							undo.add(new $Edit($page, fn, {
								width: d.portrait ? d.width : d.height,
								height: d.portrait ? d.height : d.width
							}, {
								width: $page._style('width'),
								height: $page._style('height')
							}));
							if (d.portrait && $page.is('.jp-landscape')) {
								undo.add(new $Edit($page, [//
									function () {
										$page.removeClass('jp-landscape')
									},//
									function () {
										$page.addClass('jp-landscape')
									}]));
							} else if (!d.portrait && !$page.is('.jp-landscape')) {
								undo.add(new $Edit($page, [function () {
									$page.addClass('jp-landscape')
								}, function () {
									$page.removeClass('jp-landscape')
								}]));
							}
							undo.add(new $Edit($page, fn, {
								width: d.width,
								height: d.height
							}, {
								width: $page._style('width'),
								height: $page._style('height')
							}));
							undo.close();
							dialog.close();
							Global.duplex = me.$duplex.prop("checked");
						}
					}, {
						cssClass: "btn-default2",
						label: "关闭",
						action: function (dialog) {
							/*if(calcLabelWidth()) {
								scmAlert("标签高度乘以行数再加上页面上下边距和垂直间距后大于纸张高度。请调整纸张高度、行数、标签高度、边距或者间距，使所有行可以打印在一张纸上。",{ status: 2 })
								return
							}*/
							var oldval = me.oldData;
							$('#jp-label-horizontal').find('input').val(oldval.hMargin);
							$('#jp-label-vertical').find('input').val(oldval.vMargin);
							$('#jp-label-row').find('input').val(oldval.row);
							$('#jp-label-column').find('input').val(oldval.column);
							$('#jp-label-height').find('input').val(parseInt(oldval.height));
							$('#jp-label-width').find('input').val(parseInt(oldval.width));
							$('#jp-paper-width').val(parseInt(oldval.paperWidth));
							$('#jp-paper-height').val(parseInt(oldval.paperHeight));
							calcLabelWidth();
							//me.oldData.height = $('#jp-label-height').find('input').val() + 'mm';
							//me.oldData.width = $('#jp-label-width').find('input').val() + 'mm';
							//me.setPaper();
							me.$background.attr('src', oldval.src).css({
								filter: oldval.filter,
								opacity: oldval.opacity
							});
							me.$background._addClass(oldval.ratio, $.imageRatios);
							$page.css({
								width: isLabelTmp ? oldval.width : oldval.portrait ? oldval.width : oldval.height,
								height: isLabelTmp ? oldval.height : oldval.portrait ? oldval.height : oldval.width
							});
							if (oldval.portrait) {
								$page.removeClass('jp-landscape')
							} else
								$page.addClass('jp-landscape')
							dialog.close();
						}
					}]
				});
			}
			this.instance.open();
			// 单独通过id设置样式 zh
			$('#jp-new-dialog').parents(".modal-body").attr("id", "jp-setting");
			// 监听弹窗里的输入框
			$('#jp-setting input')
			// 数据项名称
			.add('.data-item-name')
			// 新增数据项文本
			.add('#addDataItem textarea')
			// 模板名称
			.add('#tmpName')
			.focus(function() {
				gEditing = true;
			}).blur(function() {
				gEditing = false;
			})
			// 隐藏关闭按钮
			$('#jp-setting').parent().children().eq(0).find('.bootstrap-dialog-close-button').hide();
		}
	}
	function addFields($parent, pre, suf, fields) {
		for (var i = 0; i < fields.length; i++) {
			var f = fields[i];
			if (f.type == 'table') {
				var $g = $('<optgroup label="{0}">'.format(f.dataset));
				$parent.append($g);
				addFields($g, pre + f.dataset + '.', suf, f.fields);
			} else {
				$parent.append($('<option value="{0}">{1}</option>'.format("${" + pre + f.field + suf + "}", f.field)));
			}
		}
	}
	function getFieldSelect(suf) {
		if (!Global.$fieldSelect) {
			Global.$fieldSelect = {};
		}
		var instance = suf || 'default';
		if (!Global.$fieldSelect[instance]) {
			var $select = $('<select class="hidden"></select>');
			var fields = Global.editing.datasource.ui.fields;
			addFields($select, '', suf || '', fields);
			Global.$fieldSelect[instance] = $select;
		}
		return Global.$fieldSelect[instance];
	}
	// 纸张大小调整对话框
	function PaperVerticalOffsetDialog() {
		var me = this;
		this.getDialog = function () {
			if (!this.$dialog) {
				this.$dialog = $('#jp-v-offset-dialog').dialog({
					autoOpen: false,
					height: 540,
					width: 664,
					buttons: {
						"打印看看": function () {
							workingDoc.testPrintOut();
						},
						"确定": function () {
							$(this).dialog("close");
						},
						"关闭": function () {
							workingDoc._offset.top = me.oldval;
							$(this).dialog("close");
						}
					}
				}), //
					this.$dialog.find('#jp-paper-offset').spinner({
						step: 0.1,
						min: 0.0,
						numberFormat: "n",
						change: function () {
							var upper = $('#jp-paper-up', me.$dialog)[0].checked;
							if (upper) {
								workingDoc._offset.top += $(this).val();
							} else
								workingDoc._offset.top -= $(this).val();
						}
					}).change(function () {
						var upper = $('#jp-paper-up', me.$dialog)[0].checked;
						if (upper) {
							workingDoc._offset.top += $(this).val();
						} else
							workingDoc._offset.top -= $(this).val();
					});
				this.$dialog.find('input:radio').change(function (e) {
					var upper = $('#jp-paper-up', me.$dialog)[0].checked;
					if (upper) {
						me.$dialog.addClass('jp-upper-off');
					} else
						me.$dialog.removeClass('jp-upper-off');
				});
			}
			return this.$dialog;
		}
		this.updateUI = function () {
		}
		this.open = function () {
			var $dialog = this.getDialog();
			this.updateUI();
			this.oldval = workingDoc._offset.top;
			$dialog.dialog('open');
		}
	}
	function PaperHorizonOffsetDialog() {
		var me = this;
		this.getDialog = function () {
			if (!this.$dialog) {
				this.$dialog = $('#jp-h-offset-dialog').dialog({
					autoOpen: false,
					height: 400,
					width: 546,
					buttons: {
						"打印看看": function () {
							workingDoc.testPrintOut();
						},
						"确定": function () {
							$(this).dialog("close");
						},
						"关闭": function () {
							workingDoc._offset.left = me.oldval;
							$(this).dialog("close");
						}
					}
				}), //
					this.$dialog.find('#jp-paper-offset').spinner({
						step: 0.1,
						min: 0.0,
						numberFormat: "n"
					}).change(function () {
						var right = $('#jp-paper-right', me.$dialog)[0].checked;
						if (right) {
							workingDoc._offset.left -= $(this).val();
						} else
							workingDoc._offset.left += $(this).val();
					});;
				this.$dialog.find('input:radio').change(function (e) {
					var right = $('#jp-paper-right', me.$dialog)[0].checked;
					if (right) {
						me.$dialog.addClass('jp-right-off');
					} else
						me.$dialog.removeClass('jp-right-off');
				});
			}
			return this.$dialog;
		}
		this.updateUI = function () {
		}
		this.open = function () {
			var $dialog = this.getDialog();
			this.updateUI();
			this.oldval = workingDoc._offset.left;
			$dialog.dialog('open');
		}
	}
	/* 文件，标签双击编辑器 */
	function InplaceEditor() {
		var me = this;
		this.editor = $("<textarea class='jp-inplace-editor' type='text'></textarea>");
		this.mousedown = function (e) {
			// 如果正在编辑,且不是编辑组件发出的点击，要关闭
			if (me.editor[0] != e.target) {
				me.close();
			}
		};
		// this.keydown = function(e) {
		// if (e.keyCode == 13) {
		// // me.close();
		// }
		//			
		// };
		this.close = function () {
			$(this.target).removeClass('jp-inplace-editing');
			var content = $(this.target).find('.jp-text-content');
			var text = $(this.editor).val();
			if (this.isText && !text.match(/^[\s]*$/)) {
				// text = '${' + text + '}';
			}
			text = this.enter2brace(text);
			var oldval = content.html();
			content.html(text);
			var newval = content.html();
			if (newval != oldval) {
				undo.add(new $Edit(content, ['html'], oldval, newval));
			}
			$(document).off('.editing');
			this.editor.off('.editing').remove();
			gEditing = false;
			this.target = null;
		}
		this.autoHeight = function () {
			this.editor.height(this.editor[0].scrollHeight);
			this.target.height(this.editor[0].scrollHeight);
		}
		this.open = function (target) {
			gEditing = true;
			this.target = target;
			this.isText = $(target).is('.jp-text');
			// this.editor.appendTo(target).cssFrom(target,
			// ['font-size']).val($(target)
			var text = $('.jp-text-content', target).html();
			text = this.brace2enter(text);
			var expression = text.match(/^\$\{([^}]*)[}]$/);
			if (expression) {
				if ($('.jp-text-content', target).hasClass('mutable')) {
					return null;
				}
			}
			/*
			 * if (this.isText) { if (!isEditable(text)) { return null; } }
			 */
			$(target).addClass('jp-inplace-editing');
			this.editor.appendTo(target).css({
				//'height' : '',
				'font-size': $(target).css('font-size'),
				'font-family': $(target).css('font-family'),
				'text-align': $(target).css('text-align')
			}).val(text).focus();
			//this.autoHeight();
			// $(document).unbind('keydown,mousedown');// , this.mousedown);
			$(document).on('mousedown.editing', this.mousedown);
			this.editor.on("input.editing", function () {
				me.autoHeight();
			});
			//this.target.css("height", "");
			return null;
		}
		// 2021-04-12 17:12:46 避免解析脚本
		this.brace2enter = function (text) {
			return text.replace(/<br>/gi, "\n").replace(/&nbsp;/gi, " ").replace(/&gt;/gi, ">").replace(/&lt;/gi, "<");
		}
		this.enter2brace = function (text) {
			return text.replace(/[ ]/g, "&nbsp;").replace(/[>]/g, "&gt;").replace(/[<]/g, "&lt;").replace(/[\n]/g, "<br>");
		}
	}
	function TextEditor() {
		var me = this;
		this.close = function () {
		}, //
			this.getDialog = function () {
				//////////////
				if (!this.$dialog || true) {
					this.$dialog = $("#jp-text-dialog");
					var $d = this.$dialog;
					this.$fieldSelect = getFieldSelect().clone().removeClass('hidden').appendTo($d.find('.jp-field-selector').html("")).selectpicker({
						style: 'btn-default btn-xs',
						clickAsChange: true
					});
					this.$dialog.find('select').change(function() {
						var newval = me.$fieldSelect.selectpicker('val');
						var $content = me.$target.find('.jp-text-content').text(newval);
						if (newval != me.oldval) {
							undo.add(new $Edit($content, ['text'], me.oldval, newval));
						}
					})
				}
				return this.$dialog;
			}
		this.updateUI = function () {
			var $d = this.$dialog;
			this.$fieldSelect.selectpicker('val', this.$target.text());
			this.oldval = this.$target.text()
		}
		this.open = function (target) {
			var me = this;
			this.$target = $(target);
			me.getDialog();
			me.updateUI();
			$('#jp-text-dialog').children().show();
			getQueryVariable('type') === '2' && $('#jp-text-design').show();
		}
	}
	function HtmlEditor() {
		var me = this;
		this.close = function () {
			window["htmlediting"] = false;
			window.getSelection().removeAllRanges();
			$(this.target).removeClass("htmlediting").find(".jp-text-content")//
				.off(".htmleditor").attr("contenteditable", false);
			$page.off('.htmleditor');
			$(document).off('.htmleditor');
			var content = $(this.target).find('.jp-text-content');
			var html = content.html();
			if (html != this.html) {
				undo.add(new $Edit(content, ['html'], this.html, html));
			}
		};
		this.doc_mousedown = function (e) {
			me.close();
		};
		this._ignored = function (e) {
			e.stopPropagation();
		};
		this.selectionchange = function (e) {
			// 设置字体
			var fontName = document.queryCommandValue("FontName");
			$(".right-bar #jp-font-chooser").data('select-picker').val(fontName);
			// 设置字体大小
			var fontSize = $(document).selectionFontSize();
			var $sizechooser = $(".right-bar #jp-font-size-chooser");
			var newsize = parseInt($sizechooser.val(fontSize + " pt").val());
			if (newsize != fontSize) {
				var done = false;
				var $newoption = $("<option>").text(fontSize + " pt");
				$sizechooser.find("option").each(function () {
					if (parseInt($(this).text()) > fontSize) {
						$(this).before($newoption);
						done = true;
						return false;
					}
				});
				if (!done) {
					$sizechooser.append($newoption);
				}
				$sizechooser.selectpicker('refresh');
				$sizechooser.data('select-picker').val(fontSize + " pt");
			}
			$sizechooser.data('select-picker').val(fontSize + " pt");
		};
		this._ignored = function (e) {
			e.stopPropagation();
		};
		this.open = function (target) {
			this.target = target;
			window["htmlediting"] = true;
			this.html = $(target).addClass("htmlediting").find(".jp-text-content")//
				.on("mousedown.htmleditor", this._ignored).on("keydown.htmleditor", this._ignored).attr("contenteditable", true).focus().html();
			$page.on('mousedown.htmleditor', this.doc_mousedown);
			$(document).on("selectionchange.htmleditor", this.selectionchange);
			// window["mydraggable-disabled"] = true;
			// $('.my-editable').mousedown(function (e) {
			// 	e.stopPropagation();
			// });
			// window["mydraggable-disabled"] = true;
			// $(target).find(".jp-text-content").focus()
			// $("<div contenteditable style='width:40%;height:40%;'>hello;</div>").appendTo($page);//.focus();
		}
	}
	function isCode1D(name) {
		return $.inArray(name, ['code39', 'code93', '2of5', 'code128', 'code128a', 'code128b', 'code128c', 'ean13', 'upc', 'upce', 'rm']) > -1;
	}
	function BarcodeEditor() {
		var me = this;
		this.instanceCache = {};
		this.defaults = {
			'bar-1d': {
				'type': 'none',
				'rotate': '0',
				'background': null,
				'bar-color': '#000',
				'space-color': null,
				'show-text': 'true',
				'text-color': '#000',
				'font-size': '11',
				'font-name': 'Arial',
				'autofit': 'false'
			},
			'pdf417': {
				'type': 'none',
				'err-level': '',
				'data-rows': '',
				'data-cols': '',
				'background': null,
				'bar-color': '#000',
				'space-color': null
			},
			'qr': {
				'type': 'none',
				'version': '',
				'background': null,
				'bar-color': '#000',
				'space-color': null
			},
			'datamatrix': {
				'type': 'none',
				'mod-height': '',
				'mod-width': '',
				'background': null,
				'bar-color': '#000',
				'space-color': null
			}
		};
		this.getGroup = function (t) {
			return isCode1D(t) ? 'bar-1d' : t;
		}, //
			this.close = function () {
			}, //
			this.parseData = function (target) {
				var data = $(target).data('jp-barcode-data');
				if (!data) {
					data = {};
					var codedata = $(target).find('img')._codeData();
					var styles = codedata.style.split(';');
					for (var i = 0; i < styles.length; i++) {
						var style = styles[i].split(':');
						// 只有在默认属性中的数据，才行
						// if(this.defaults[style[0]]!=undefined){
						data[style[0]] = style[1];
						// }
					}
					data = $.extend({}, this.defaults[this.getGroup(data.type)], data);
					data.field = codedata.field || '';
					$(target).data('jp-code-data', data)
				}
				return data;
			}, // 
			this.apply = function (target, data) {
				var styles = [], defaults = this.defaults[this.getGroup(data.type)];
				for (p in data) {
					var v = data[p];
					if (p !== 'field' && v != defaults[p] && v) {
						// 2021-03-22 16:34:39 , 空码颜色是透明时，不保存
						if (!(p == 'space-color' && v.indexOf('rgba') == 0))
							styles.push(p + ':' + v);
					}
				}
				var d = $(target).find('img')._codeData();
				d.style = styles.join(';');
				// if(typeof $embed[0].refresh!='undefined')
				// if (!isCode1D(data.type)) {
				// 	d.code = data.field || 'Hello,你好';
				// }
				/*d.code =*/ d.field = data.field || '';
				$(target).find('img')._codeData(d);// [0].setData(d._code,d._codestyle);
				setCodeImage($(target));
			};
		this.updateUI = function (data) {
			if (!this.updating) {
				this.updating = true;
				this.$dialog.find('.jp-code-ui').each(function () {
					var name = $(this).attr('name');
					if ($(this).is('.jp-color-chooser')) {
						$(this).spectrum('set', data[name] || 'rgba(255, 255, 255,0)');
					} else if ($(this).is(':radio') && (this.id === 'jp-' + $(this).attr('name') + '-' + data[name])) {
						this.checked = true;
					} else if ($(this).is(':checkbox')) {
						this.checked = data[name] === $(this).val();
					} else if (this.id == 'jp-qr-version' || this.id == 'jp-qr-version-2') {
						$(this).val('');
						var index = $(this).is('#jp-qr-version') ? 0 : 1;
						if (data.version) {
							var ver = data.version.split('-')[index].toLowerCase();
							$(this).val(ver == 'auto' ? '' : ver);
						}
					} else if (name == 'moudles') {
						if (data['mod-height'])
							$(this).val(data['mod-height'] + 'x' + data['mod-width']);
						else
							$(this).val('');
					} else if ($(this).is('select')) { // 2021/9/13 解决pdf417 不更新 ui的问题
						$(this).selectpicker('val', data[name]);
					}
				});
				this.updating = false;
				if ($('#jp-show-text', this.$dialog).length)
					$('#jp-show-text', this.$dialog).closest('p').nextAll().css('display', $('#jp-show-text', this.$dialog)[0].checked ? 'block' : 'none');
			}
		}//
		this.updateData = function () {
			var data = $.extend({}, this.$target.data('jp-code-data'));
			this.$dialog.find('.jp-code-ui').each(function () {
				var name = $(this).attr('name');
				if ($(this).is('.jp-color-chooser')) {
					data[name] = $(this).val() == 'transparent' ? null : $(this).val();
				} else if ($(this).is(':radio') && this.checked) {
					data[name] = $(this).val();
				} else if ($(this).is(':checkbox')) {
					data[name] = this.checked + '';
				} else if ($(this).is('select.qr-version')) {
					var val = ($('#jp-qr-version', this.$dialog).val() || 'auto') + '-' + ($('#jp-qr-version-2', this.$dialog).val() || 'auto');
					if (val == 'auto-auto')
						val = '';
					data['version'] = val;
				} else if (name == 'moudles') {
					var modules = $(this).val().split('x');
					data['mod-height'] = modules.length ? modules[0] : '';
					data['mod-width'] = modules.length ? modules[1] : '';
				} else if ($(this).is('select')) {
					data[name] = $(this).val();
				}
			});
			// ////////////////////////////////
			// data['rotate']=this.$dialog.find('#_rotate').slider('value');
			this.$target.data('jp-code-data', data)
			return data;
		}, //		
			this.getDialog = function (g) {
				var me = this;
				var dialog = $('#jp-' + g + '-dialog');
				getFieldSelect().clone().removeClass('hidden').addClass('jp-code-ui').attr('name', 'field').appendTo(dialog.find('.jp-field-selector').html("")).selectpicker({
					style: 'btn-default btn-xs',
					clickAsChange: true,
					dropupAuto: false
				});
				dialog.find('select').change(function() {
					var data = me.updateData();
					// var newval = me.$target.find('img').attr('data-field', data.field || "")._codeData();
					var newval = me.$target.find('img');
					// 标签点击确定不保存数据项名称 zh
					!isLabelTmp && newval.attr('data-field', data.field || "")
					newval._codeData();
					var fn = ['_codeData'];
					undo.add(new $Edit(me.$target.find('img'), fn, me.oldval, newval));
				})
				if (!dialog.data('inited')) {
					makeColorChooser($('.jp-color-chooser', dialog));
					dialog.find('select').selectpicker({
						style: 'btn-default btn-xs',
						dropupAuto: false
					});
					setFonts($('#jp-font-name', this.$dialog));
					$('.jp-code-ui', dialog).change(function (e) {
						if (!me.updating) {
							me.apply(me.$target, me.updateData());
						}
					});
					$('#jp-show-text', dialog).change(function () {
						$(this).closest('p').nextAll().css('display', this.checked ? 'block' : 'none');
					});
					dialog.data('inited', true);
				}
				return dialog;
			}, //
			this.open = function (target) {
				var me = this;
				this.$target = $(target);
				this.oldval = $.extend({}, $(target).find("img")._codeData());
				this.data = this.parseData(target);
				// 单据模板未赋值的自动赋值
				if(!this.data.field && !isLabelTmp) {
					this.data.field = Global.editing.datasource.ui.fields[0].field;
					this.$target.children('img').attr('data-field', '${'+ Global.editing.datasource.ui.fields[0].field +'}')
				}
				var g = this.getGroup(this.data.type);
				me.$dialog = me.getDialog(g);
				me.updateUI(me.data);
				$('#jp-' + g + '-design').add('#jp-' + g + '-dialog').show();
				$('#label-design').hide();
			}
	}
	function matchField(text) {
		return text.match(/[\s]*\$\{(.*)\}[\s]*/);
	}
	function openFileDialog(accept, callback) { // this function must be called from  a user
		var inputElement = document.createElement("input");
		inputElement.type = "file";
		//inputElement.accept = accept;
		//	$(inputElement).change, callback)
		// dispatch a click event to open the file dialog
		inputElement.dispatchEvent(new MouseEvent("click"));
	}
	// 图片插入编辑器
	function ImageEditor() {
		var me = this;
		this.close = function () {
		}
		var $src = null;
		var $autoSize = null;
		var changed = function () {
			var src = null;
			if (me.isFieldSource()) {
				src = me.$fieldSelect.val();
			} else {
				src = $src.val() || _blank;
			}
			$('.jp-image-view', me.$target).attr('src', src);
			if ($autoSize[0].checked) {
				$('.jp-image-view', me.$target).removeClass('jp-auto-stretch');
			} else {
				$('.jp-image-view', me.$target).addClass('jp-auto-stretch');
			}
		}
		this.sourceChange = function () {
			if (me.isFieldSource()) {
				me.$fieldselector.removeClass('hidden');
				me.$imageselector.addClass('hidden');
			} else {
				me.$fieldselector.addClass('hidden');
				me.$imageselector.removeClass('hidden');
			}
			changed();
		}
		this.isFieldSource = function () {
			return this.$dialog.find("input[type='radio']:checked").val() == 'field';
		}
		this.getDialog = function () {
			//////////////
			if (!this.$dialog) {
				this.$dialog = $('#jp-image-dialog');
				this.$fieldselector = this.$dialog.find('.field-selector');
				this.$imageselector = this.$fieldselector.next();
				this.$dialog.find('input[type=radio]').change(this.sourceChange);
				if (Global.request.how != 'local-edit' /*|| true*/)
					this.$fieldSelect = getFieldSelect().clone().removeClass('hidden').appendTo(this.$dialog.find('.jp-field-selector').html("")).selectpicker({
						style: 'btn-default btn-xs'
					}).change(changed)
				$src = $('#jp-image-src', this.$dialog).on('propertychange', function () {
					changed();
				});
				// 处理自动缩放设置
				$autoSize = $('#jp-original-size', this.$dialog).change(changed);
				//				if (!Global.ajaxUpload)
				//					Global.ajaxUpload = new AjaxUpload(Global.config['upload-max-size'], Global.config['upload-max-size-error']);
				//					
				//	var $src = $('#jp-image-src', me.$dialog);
				$('form', me.$dialog).submit(function () {
					return false
				});
				//		Global.ajaxUpload.open(Global.service["upload-image-service"], function(data) {});
				//return ;
				var ____ = null;
				var $button = $('#jp-file-chooser', this.$dialog).click(function (e) {
					//					e.preventDefault();
					// $('.jp-file', uploaddoc).val(null);
					// $button.prop("disabled", true);
					//openFileDialog(".png,text/plain", true, function(){});
					//return ;
					Global.ajaxUpload.click(Global.service["upload-image-service"]+"&id="+tmpId, function (data) {
                        console.trace();
						try {
							var jdata = data.error ? data : $.parseJSON(data);
							if (jdata.error) {
								scmAlert(jdata.error, {
									status: '3'
								});
								// $button.prop("disabled", false);
								return;
							}
						} catch (e) {
						}
						data = '/res' + data.match(/\/buss(.*)/)[0];
                        console.log(data);
						____ = data;
						setTimeout(function () {
							$src.val(____.replace(/\n/g, ''));
							var file = $src.val();
							if (file && !file.match(/^http:\/\//i))
								file = '../' + file;
							// me.$background.attr('src', file || _blank);
							changed();
							// $button.prop("disabled", false);
						}, 100);
					})
					// $('.jp-file', uploaddoc).trigger("click");
					// $('.jp-file', uploaddoc).trigger("click");
					// me.$file.trigger("click");
					//e.preventDefault();
					//return false;
				})
			}
			return this.$dialog;
		}
		this.updateUI = function () {
			var src = $('.jp-image-view', this.$target).attr('src') || '';
			var stretched = $('.jp-image-view', this.$target).is('.jp-auto-stretch');
			$('#jp-original-size', this.$dialog)[0].checked = !stretched;
			this.lastVal = {
				src: src,
				stretched: stretched
			};
			src = src == _blank ? '' : src;
			if (src && matchField(src)) {//&& Global.request.how != 'local-edit') {
				// 为空的话，点亮 field select
				this.$dialog.find('#field-source')[0].checked = true;
				if (Global.request.how != 'local-edit' /*|| true*/)
					this.$fieldSelect.selectpicker('val', src);
			} else {
				this.$dialog.find('#file-source')[0].checked = true;
				$('#jp-image-src', this.$dialog).val(src);
			}
			this.sourceChange();
		}
		this.open = function (target) {
			this.$target = $(target);
			me.getDialog();
			me.updateUI();
			$('#jp-image-design').add('#jp-image-dialog').show();
			/*if (!this.instance) {
				var $dialog = $('#jp-image-dialog');
				this.instance = new BootstrapDialog({
					title: $dialog.attr('title'),
					draggable: true,
					animate: false,
					closeByBackdrop: false,
					closeByKeyboard: false,
					autodestroy: false,
					message: $dialog.removeClass('jp-dialog'),
					onshown: function (d) {
						me.getDialog();
						me.updateUI();
					},
					buttons: [{
						cssClass: "",
						label: "确定",
						action: function (dialog) {
							var $img = $('.jp-image-view', me.$target);
							undo.open();
							undo.add(new $Edit($img, ['attr', 'src'], me.lastVal.src, $img.attr('src')));
							var stretched = $img.is('.jp-auto-stretch');
							if (stretched !== me.lastVal.stretched) {
								if (stretched)
									undo.add(new $Edit($img, [//
										function () {
											this.target.removeClass('jp-auto-stretch')
										}, //
										function () {
											this.target.addClass('jp-auto-stretch')
										}]));
								else
									undo.add(new $Edit($img, [//
										function () {
											this.target.addClass('jp-auto-stretch')
										}, //
										function () {
											this.target.removeClass('jp-auto-stretch')
										}]));
							}
							undo.close();
							dialog.close();
						}
					}, {
						cssClass: "btn-default2",
						label: "关闭",
						action: function (dialog) {
							if (me.lastVal.stretched)
								$('.jp-image-view', me.$target).addClass('jp-auto-stretch');
							else
								$('.jp-image-view', me.$target).removeClass('jp-auto-stretch');
							$('.jp-image-view', me.$target).attr('src', me.lastVal.src);
							dialog.close();
						}
					}]
				});
			}
			this.instance.open();*/
		}
	}
	function DataTableEditor() {
		var me = this;
		this.close = function () {
		}, //
			this.updateData = function () {
				var newdata = {
					"header-rows": parseInt($('#table-header-rows', this.$dialog).selectpicker('val')),
					"body-rows": parseInt($('#table-body-rows', this.$dialog).selectpicker('val')),
					"page-footer-rows": 0,
					//				"break-on-bottom" : 'true',
					"footer-rows": parseInt($('#table-footer-rows', this.$dialog).selectpicker('val')),
					"columns": parseInt($('#table-columns', this.$dialog).selectpicker('val')),
					"no-border": !$('#table-no-borders', this.$dialog)[0].checked
				}
				return newdata;
			}, //	
			this.getDialog = function () {
				if (!this.picker) {
					var dialog = $('#data-table-options-dialog');
					dialog.find('select').selectpicker({
						style: 'btn-default btn-xs'
					});
					this.picker = true;
				}
			}, this.updateUI = function () {
				if (this.updated) {
					return;
				}
				var options = this.$target.data("saved-options")["options"];
				if (options) {
					$('#table-header-rows', this.$dialog).val(options["header-rows"] || 0);
					$('#table-body-rows', this.$dialog).val(options["body-rows"] || 5);
					$('#table-footer-rows', this.$dialog).val(options["footer-rows"] || 0);
					$('#table-no-borders', this.$dialog)[0].checked = options["no-border"] ? false : true;
				}
				var include0 = this.$dialog.find("#table-columns option")[0].value == "0";
				if (this.$target.data("saved-options")["dataset"]) {
					this.$dialog.removeClass("jp-static").find("#jp-rows-label").text("表体最大行数:");
					if (!include0)
						$('<option value="0">自动(按字段数自动扩展)</option>').prependTo("#table-columns");
				} else {
					if (include0) {
						$("#table-columns option").first().remove();
					}
					this.$dialog.addClass("jp-static").find("#jp-rows-label").text("行数:");
				}
				this.updated = true;
			}, this.open = function (target, _savedOptions, callback) {
				this.$target = $(target);
				this.savedOptions = _savedOptions;
				if (this.$target.is('.jp-table'))
					return;
				if (!this.instance) {
					var $dialog = this.$dialog = $('#data-table-options-dialog');
					this.instance = new BootstrapDialog({
						title: $dialog.attr('title'),
						draggable: true,
						animate: false,
						closeByBackdrop: false,
						closeByKeyboard: false,
						autodestroy: false,
						message: $dialog.removeClass('jp-dialog'),
						onshown: function (d) {
							me.updateUI();
							me.getDialog();
						},
						buttons: [{
							cssClass: "",
							label: "确定",
							action: function (dialog) {
								//var $img = $('.jp-image-view', me.$target);
								//undo.open();
								//	undo.add(new $Edit($img, ['attr', 'src'], me.lastVal.src, $img.attr('src')));
								var data = me.updateData();
								//undo.close();
								dialog.close();
								callback(data, me.savedOptions);
							}
						}, {
							cssClass: "btn-default2",
							label: "关闭",
							action: function (dialog) {
								dialog.close();
							}
						}]
					});
				}
				this.instance.open();
				/*		
					var options = this.$target.data("saved-options")["options"];
					if (options) {
						$('#table-header-rows', this.$dialog).val(options["header-rows"] || 0);
						$('#table-body-rows', this.$dialog).val(options["body-rows"] || 5);
						$('#table-footer-rows', this.$dialog).val(options["footer-rows"] || 0);
						$('#table-no-borders', this.$dialog)[0].checked = options["no-border"] ? false : true;
					}
					var include0 = this.$dialog.find("#table-columns option")[0].value == "0";
					if (this.$target.data("saved-options")["dataset"]) {
						this.$dialog.removeClass("jp-static").find("#jp-rows-label").text("表体最大行数:");
						if (!include0)
							$('<option value="0">自动(按字段数自动扩展)</option>').prependTo("#table-columns");
					} else {
						if (include0) {
							$("#table-columns option").first().remove();
						}
						this.$dialog.addClass("jp-static").find("#jp-rows-label").text("行数:");
					}
					return this.$dialog.dialog('open');*/
			}
	}
	// 表格组件编辑器
	function TableEditor() {
		var me = this;
		this.close = function () {
		}, //
			this.updateData = function () {
				var newdata = {
					"header-rows": parseInt($('#table-header-rows', this.$dialog).val()),
					"body-rows": parseInt($('#table-body-rows', this.$dialog).val()),
					"footer-rows": parseInt($('#table-footer-rows', this.$dialog).val()),
					"columns": parseInt($('#table-columns', this.$dialog).val()),
					"no-border": !$('#table-no-borders', this.$dialog)[0].checked
				}
				return newdata;
			}, //		
			this.open = function (target, callback) {
				this.$target = $(target);
				if (this.$target.is('.jp-table'))
					return;
				if (!this.$dialog) {
					this.$dialog = $('#jp-table-dialog').dialog({
						width: 510,
						autoOpen: false,
						buttons: {
							'确定': function () {
								//   
								//
								//
								var data = me.updateData();
								$(this).dialog("close");
								callback(data);
							},
							'关闭': function () {
								$(this).dialog("close");
							}
						}
					});
					/*
					 * var changed = function() { $('.jp-image-view',
					 * me.$target).attr('src', $src.val() || _blank); if
					 * ($autoSize[0].checked) { $('.jp-image-view', me.$target)
					 * .removeClass('jp-auto-stretch'); } else { $('.jp-image-view',
					 * me.$target) .addClass('jp-auto-stretch'); } } var $src =
					 * $('#jp-image-src', this.$dialog); var $button =
					 * $('#jp-file-chooser', this.$dialog); var imagefilter = '图片文件
					 * (*.png;*.jpg;*.gif)|*.png;*.jpg;*.gif|所有文件 (*.*)|*.*'; var
					 * imagefilter = '图片文件(*.png;*.jpg;*.gif)|*.png;*.jpg;*.gif|所有文件
					 * (*.*)|*.*'; if (Global.service["upload-image-service"]) new
					 * RemoteFileChooser($src, $button, imagefilter,
					 * Global.service["upload-image-service"], function( file) { if (file &&
					 * !file.match(/^http:\/\//i)) file = '../' + file;
					 * $src.val(file); changed(); }); else new FileChooser($src,
					 * $button, imagefilter, changed); // 处理自动缩放设置 var $autoSize =
					 * $('#jp-original-size', this.$dialog) .change(changed);
					 */
				}
				// type : 'table',
				// options : {
				// "no-border" : true,
				// "header-rows" : 1,
				// "max-body-rows": 5,
				// "footer-rows" : 1
				// },
				// dataset : "订单明细",
				// fields : [{
				// .jp-static .jp-dynamic-option{display:none}
				// }
				var options = this.$target.data("saved-options")["options"];
				if (options) {
					$('#table-header-rows', this.$dialog).val(options["header-rows"] || 0);
					$('#table-body-rows', this.$dialog).val(options["body-rows"] || 5);
					$('#table-footer-rows', this.$dialog).val(options["footer-rows"] || 0);
					$('#table-no-borders', this.$dialog)[0].checked = options["no-border"] ? false : true;
				}
				var include0 = this.$dialog.find("#table-columns option")[0].value == "0";
				if (this.$target.data("saved-options")["dataset"]) {
					this.$dialog.removeClass("jp-static").find("#jp-rows-label").text("表体最大行数:");
					if (!include0)
						$('<option value="0">自动(按字段数自动扩展)</option>').prependTo("#table-columns");
				} else {
					if (include0) {
						$("#table-columns option").first().remove();
					}
					this.$dialog.addClass("jp-static").find("#jp-rows-label").text("行数:");
				}
				return this.$dialog.dialog('open');
			}
	}
	// 模板保存对话框
	function TemplateSaveDialog() {
		var me = this;
		this.open = function (settingsId, callok) {
			this.callok = callok;
			if (!this.$dialog) {
				this.$dialog = $('#jp-template-save-dialog').dialog({
					width: 400,
					autoOpen: false,
					buttons: {
						'确定': function () {
							if (me.callok) {
								if (me.callok($(this).find('#name').val())) {
									$(this).dialog("close");
								}
							} else
								$(this).dialog("close");
						},
						'取消': function () {
							$(this).dialog("close");
						}
					}
				});
			}

			this.$dialog.find('input').keydown(function (event) {
				if (event.keyCode == $.ui.keyCode.ENTER) {
					me.$dialog.parent('.ui-dialog').find("button:eq(0)").trigger("click");
					return false;
				}
			});

			// this.$dialog.find('#jp-settings-id').val(settingsId || '');
			this.$dialog.find('#name').val(settingsId || '');
			return this.$dialog.dialog('open');
		}
	}
	function getCodeData(target) {
		var data = $(target).data('code-data');
		if (!data) {
			data = $(target).data()
		}
	}
	function createBarcode(data, done) {
		data = $.extend({}, data)
		// <img class='jatools-coder' src="http://127.0.0.1:31227/api?type=coder&_code=hello&_codestyle=type:qr;&width=200&height=200&"></img>
		var $html = $(handlers.newBarcode(data));
		var $img = $html.find(".jatools-coder").attr('data-code', data.code).attr('data-style', data.style);
		if (data.field) {
			// $html.find('.jatools-coder').attr('data-field', data.field);
			// 添加自定义属性存放数据项详细信息 zh
			$html.find('.jatools-coder').attr('data-field', data.field).attr('data-info', data.info).attr('data-issn', data.issn);
		}
		if (done) {
			done($html)
		}
		return $html;
	}
	var dtableeditor;
	function createTable(data, done) {
		var options = data.createOptions;
		// type : 'table',
		// options : {
		// "no-border" : true,
		// "header-rows" : 1,
		// "footer-rows" : 1
		// },
		// dataset : "订单明细",
		// fields : [{
		var savedOptions = {
			options: $.extend({}, data.options),
			dataset: data.dataset
		}
		// 新建表格，默认表头行数1;
		savedOptions["options"]["header-rows"] = 1;
		var $tmp = $("<br>").data("saved-options", savedOptions);
		//	new DataTableEditor().open();
		//	return;
		if (!dtableeditor)
			dtableeditor = new DataTableEditor();
		dtableeditor.open($tmp, savedOptions, function (settings, _savedOptions) {
			// var newdata = {
			// "header-rows" : parseInt($('#table-header-rows',
			// this.$dialog)
			// .val()),
			// "body-rows" : parseInt($('#table-body-rows',
			// this.$dialog).val()),
			// "footer-rows" : parseInt($('#table-footer-rows',
			// this.$dialog)
			// .val()),
			// "columns" : parseInt($('#table-columns',
			// this.$dialog).val()),
			// "no-border" : $('#table-no-borders',
			// this.$dialog)[0].checked
			// }
			if (settings["body-rows"] == -1) {
				settings["body-rows"] = 2;
				settings["break"] = "auto";
			}
			var rows = settings["header-rows"] + settings["body-rows"] + settings["footer-rows"];
			var cols = settings["columns"];
			var autotext = false;
			if (!cols) {
				cols = data.fields.length;
				autotext = true;
			}
			var bodyhtml = '<colgroup>';
			for (var col = 0; col < cols; col++) {
				bodyhtml += "<col width='60'></col>";
			}
			bodyhtml += '</colgroup>';
			for (var row = 0; row < rows; row++) {
				var isbody = row == settings["header-rows"];
				// if (isbody)
				// bodyhtml += "<tbody class='jp-body-rows'>"
				bodyhtml += "<tr>";
				for (var col = 0; col < cols; col++) {
					if (col >= data.fields.length) {
						bodyhtml += "<td><span></span></td>";
						continue;
					}
					var tdtext = "";
					if (!autotext) {
						//
					} else {
						var text = (data.fields[col].field);
						if (row < settings["header-rows"]) {
							tdtext = data.fields[col].display || text || "";
						} else if (row == settings["header-rows"]) {
							// 主体行
							if (data.fields[col].format) {
								text = 'format({0},"{1}")'.format(text, data.fields[col].format);
							}
							tdtext = "${" + text + "}";
						}
					}
					var cls = "class='expr";
					if (!data.fields[col].editable) {
						cls += " mutable";
					}
					cls += "'";
					bodyhtml += "<td><span {0}>{1}</span></td>".format(cls, tdtext);
				}
				bodyhtml += "</tr>";
				// if (isbody)
				// bodyhtml += "</tbody>"
			}
			// alert(bodyhtml);
			_savedOptions["options"] = settings;
			var borderClass = settings["no-border"] ? "jp-no-border" : "jp-black-border";
			done($(handlers.newTableTemplate.format(bodyhtml)).data('saved-options', _savedOptions).addClass(borderClass));
		});
		// + "<tr><td style='border:solid 1px gray;'>"
		// +"<div>"// 在object处，包一个div,避免jquery 在clone时的bug
		// +'<object
		// classid="CLSID:E5A01FF5-FC6E-42F3-AF48-DEA5777DED62"
		// windowless="true"
		// style="float:left2;width2:100%;height2:100%">'
		// +'<PARAM NAME="_code" VALUE="6938012345670"/>'
		// +'<PARAM NAME="_codestyle"
		// VALUE="type:code39;autofit:true"/>'
		// +'</object>'
		// +'</div>'
		// + "</td><td style='border:solid 1px gray;'>"
		// + "</td><td style='border:solid 1px gray;'></td>"
		// + "<td style='border:solid 1px gray;'></td></tr>"
		// + "<tr height='30'><td style='border:solid 1px gray;'></td><td
		// style='border:solid 1px gray;'>"
		// + "</td><td style='border:solid 1px gray;'></td>"
		// + "<td style='border:solid 1px gray;'></td></tr>"
		// + "</table>"//
		//		return $(html);
	}
	function asynEach(arr, process, done) {
		if (arr.length) {
			function next(i) {
				if (i < arr.length)
					process(arr[i], i, next);
				else
					done();
			}
			process(arr[0], 0, next);
		}
	}
	// 代码打开，保存工具
	function SourceCodeUtil() {
		this.decode = function ($p, base) {
			var me = this;
			// 有可能是相对地址，先转换成绝对地址
			var base = util.getAbsoluteURL(document.URL, base);
			// 清除原来的组件
			$('.jp-component', $page).remove();
			// undo要清掉
			undo.clear();
			var w = $p._style('width'), h = $p._style('height');
			// 修改jp-page的高度，宽度，方向，
			w && $page.css('width', w);
			h && $page.css('height', h);
			$page._copyClass($p, 'jp-landscape').removeClass('jp-hidden');
			// $page.find('.jp-paper-background').attr('src', _blank);
			$p.children().each(function (i) {
				for (e in me.decoders) {
					if ($(this).is(e)) {
						var rad = $(this).data("rad");
						var newcomp = me.decoders[e].call(me, $(this), i, base);
						if (newcomp) {
							if (rad) {
								newcomp.css("transform", "rotate({0}rad)".format(rad));
							}

							copydata($(this), newcomp, ['mmleft', 'mmtop', 'mmwidth', 'mmheight']);


							// 如果是 table,就不要复制width,height,因为
							// width,height由里面的table自动确定
							var commons = newcomp.is('.jp-table') ? ['left', 'top'] : ['left', 'top', 'width', 'height'];
							commons = commons.concat(["border-radius", "opacity", "box-shadow", "padding", "padding-left", "padding-top", "padding-right", "padding-bottom"])
							var target = newcomp.appendTo($page)._copyCss($(this), commons)._uClass($(this)._uClass());
							initComponent(target, true);
							var border = $(this)._border();
							if (border && border.border != '') {
								$(newcomp).css(border);
							}
						}
						return;
					}
				}
			});
			compentlistpanel && compentlistpanel.reposition();
		}, //
			// 打开文件


			this.textstyles = ['line-height', 'font-family', 'font-weight', 'font-style', 'text-decoration', 'font-size', 'color', 'background-color', 'white-space',
				'text-align', 'z-index'];

		this.decoders = {
			// 2021-03-15 13:01:31 将字号复制到新对象的 inline style
			'inlineFontSize': function (target, $new) {
				if (target.style.fontSize) {
					$new.css('font-size', target.style.fontSize);
				}
				return $new;
			},

			'.jp-paper-background': function ($target, id, base) {
				// 底图，透明度
				// j().util.getAbsoluteURL(src, base);
				var _src = $target.attr('src');
				var src = _src;
				// 将背景，图片对象的 src 转换成 absolute
				if (src) {
					src = util.getAbsoluteURL(base, src);
				}
				$('.jp-paper-background', $page)._copyCss($target, ['filter', 'opacity']).attr('_src', _src);
			},
			'.jp-label': function ($target, id) {
				// newLabel:"<div class='jp-label jp-component'><span
				// class='jp-text-content'></span><p
				// class='jp-selected-layer'></p></div>",
				// 创建一个新对象
				var $label = $(handlers.newLabel)._copyClass($target, 'jp-font-fit');
				$('.jp-text-content', $label).html($target.html());
				//2021-03-15 13:04:28
				return this.decoders.inlineFontSize($target[0], $label._copyCss($target, this.textstyles));
			},
			'.jp-text': function ($target, id) {
				var $text = $(handlers.newText)._copyClass($target, 'jp-font-fit');
				$('.jp-text-content', $text).html($target.html());
				// 文本数据项回填 zh
				isLabelTmp && textAddDataItem($text.children('.jp-text-content'));
				//2021-03-15 13:03:50, 
				return this.decoders.inlineFontSize($target[0], $text._copyCss($target, this.textstyles));
			},
			'.jp-shape': function ($target, id) {
				var isline = $target.find("svg.line").length > 0;
				var $text = $target.clone(true).addClass("jp-component").toggleClass("no-rotate", isline).toggleClass("no-padding", isline);
				if (isline) {
					$text.find("svg.line").css({ width: "100%", height: "100%" });
				}
				return $text._copyCss($target, ['z-index']);
			},
			'.jp-html': function ($target, id) {
				var $text = $(handlers.newHTML);
				$('.jp-text-content', $text).html($target.html());
				//2021-03-15 13:04:21
				return this.decoders.inlineFontSize($target[0], $text._copyCss($target, this.textstyles));
			},
			'.jp-barcode': function ($target, id) {
				var $img = $target.find(".jatools-coder");
				var data = {
					code: $img.attr("data-code"),
					style: $img.attr("data-style"),
					field: $img.attr("data-field"),
					// 条码数据项赋值 zh
					info: $img.attr("data-info"),
					issn: $img.attr("data-issn")
				}
				var $barcode = createBarcode(data);
				// 文本数据项回填 zh
				isLabelTmp && barCodeId($barcode);
				return $barcode._copyCss($target, ['background-color', 'z-index']);
			},



			'.jp-image': function ($target, id, base) {
				// debugger;
				// var src = _src || _blank;
				var _src = $target.find('img').attr('src');
				var src = _src;
				// 将背景，图片对象的 src 转换成 absolute
				if (src) {
					//src = util.getAbsoluteURL(base, src);
				}
				var $image = $(handlers.newImage), $srcimg = $target.find('img'), $newimg = $image.find('img').attr('src', src || _blank)._copyClass($srcimg, 'jp-auto-stretch');
				return $image._copyCss($target, ['background-color', 'z-index']).attr('_src', _src/*
				* 把原来的
				* src保存，便于encode时恢复
				*/);
			},




			//[ EXTLOGO
			'.jp-logo': function ($target, id, base) {
				// debugger;
				// var src = _src || _blank;
				var _src = $target.find('img').attr('src');
				var $logo = $(handlers.newLogo), $srcimg = $target.find('img'), $newimg = $logo.find('img').attr('src', _src)._copyClass($srcimg, 'jp-auto-stretch');
				return $logo._copyCss($target, ['background-color', 'z-index']).attr('_src', _src/*
					* 把原来的
					* src保存，便于encode时恢复
					*/);
			},
			//] EXTLOGO

			'.jp-registration-mark':function($target, id, base){
				var _src = $target.find('img').attr('src');
				var $logo = $(handlers.registrationMark), $srcimg = $target.find('img'), $newimg = $logo.find('img').attr('src', _src)._copyClass($srcimg, 'jp-auto-stretch');
				return $logo._copyCss($target, ['background-color', 'z-index']).attr('_src', _src/*
					* 把原来的
					* src保存，便于encode时恢复
					*/);				
			},
			
			'.jp-line-horz': function ($target, id) {
				var $line = $(handlers.newLineHorz);
				return $line._copyCss($target, ['border-bottom-width', 'border-bottom-style', 'border-bottom-color', 'z-index']);
			},
			'.jp-line-vert': function ($target, id) {
				var $line = $(handlers.newLineVert);
				return $line._copyCss($target, ['border-right-width', 'border-right-style', 'border-right-color', 'z-index']);
			},
			'.jp-table': function ($target, id) {
				var $new = $(handlers.newTableTemplate.format($('table', $target).html())), $newtable = $('table', $new);
				// $srctable=$('table',$target);
				// $table.html($('table',$target).html());
				var borderClass = $target.is('.jp-black-border') ? "jp-black-border" : "jp-no-border";
				$new.addClass(borderClass)._copyCss($target, ['z-index']);
				if (!$target.is('.jp-static')) {
					$new.data("saved-options", $target.data("saved-options"));
				}
				return $new;
			}
		}, //
			this.encoders = {
				// 2021-03-15 12:54:17 将字号设置到 inline style
				'inlineFontSize': function (target, result) {
					if (target.style.fontSize) {
						result.comp.css('font-size', target.style.fontSize);
					}
					return result;
				},
				'.jp-paper-background': function ($target, id, cross) {
					if ($target.attr('src') == _blank)
						return null;
					else {
						var ratioClass = ($target.attr("className") || '').match(/(jp\-keep\-width|jp\-keep\-height)/) || "";
						var src = $target.attr("src");
						var opactiy = parseFloat($target.css("opacity") || 0);
						var style = "";
						if (opactiy) {
							style = "opacity:{0};filter: alpha(opacity={1})".format(opactiy, opactiy * 100);
						}
						return {
							style: style,//$target.attr('style'),
							comp: $('<img class="jp-paper-background screen-only jp-comp-' + id + '">').attr('src', src).addClass(ratioClass)
						};
					}
				},
				'.jp-label': function ($target, id) {
					$target.css("width", $target.outerWidth());
					$target.css("height", $target.outerHeight());
					var html = $('.jp-text-content', $target).html();
					// 2021-03-15 12:55:57, 将字号设置到 inline style
					var result = {
						style: $target.attr('style').replace(/text\-decoration\s*\:\s*underline.*?[\;]/g, 'text-decoration:underline;'),
						comp: $('<div class="jp-label jp-comp-' + id + '">').html(html)._copyClass($target, 'jp-font-fit')
					};
					return this.encoders.inlineFontSize($target[0], result);
				},
				'.jp-text': function ($target, id) {
					$target.css("width", $target.outerWidth());
					$target.css("height", $target.outerHeight());
					var html = $('.jp-text-content', $target).html();
					// 2021-03-15 12:55:57, 将字号设置到 inline style
					var result = {
						style: $target.attr('style').replace(/text\-decoration\s*\:\s*underline.*?[\;]/g, 'text-decoration:underline;'),
						comp: $('<div class="jp-text jp-comp-' + id + '">').html(html)._copyClass($target, 'jp-font-fit')
					};
					return this.encoders.inlineFontSize($target[0], result);
				},
				'.jp-html': function ($target, id) {
					$target.css("width", $target.outerWidth());
					$target.css("height", $target.outerHeight());
					var html = $('.jp-text-content', $target).html();


					// 2021-03-15 12:55:57, 将字号设置到 inline style
					var result = {
						style: $target.attr('style').replace(/text\-decoration\s*\:\s*underline.*?[\;]/g, 'text-decoration:underline;'),
						comp: $('<div class="jp-html jp-comp-' + id + '">').html(html)
					};
					return this.encoders.inlineFontSize($target[0], result);
				},
				'.jp-shape': function ($target, id) {
					var isline = $target.find("svg.line").length;
					if (isline) {
						$target.css({ "transform": "none", "padding": "0" }).attr("data-rad", 0);
					}

					$target.css("width", $target.outerWidth());
					$target.css("height", $target.outerHeight());
					var html = $("<div>").append($('svg', $target).clone(true).css({ width: $target.innerWidth(), height: $target.innerHeight() })).html();
					return {
						style: $target.attr('style'),
						comp: $('<div class="jp-shape jp-comp-' + id + '">').html(html)
					};
				},
				'.jp-barcode': function ($target, id, cross) {
					var $srcCoder = $('img', $target);
					var scriptsrc = "http://127.0.0.1:31227/api?type=coder&code={0}&style={1}&width={2}&height={3}".format($srcCoder.attr("data-field"), $srcCoder.attr("data-style").replace(/\#/g, ''),
						$srcCoder[0].offsetWidth, $srcCoder[0].offsetHeight)
					var $newCoder = $($srcCoder[0].cloneNode()).attr("src", scriptsrc);
					// http://127.0.0.1:31227/api?type=coder&code=http://print.jatools.com/demos.htm?name=joe%26id=123&style=type:qr;&width=480&height=480&
					return {
						style: $target.attr('style'),
						comp: $('<div class="jp-barcode jp-comp-' + id + '">').append($newCoder.tagName('div'))
					};
				},
				'.jp-image': function ($target, id, cross) {
					var $srcImg = $('img', $target);
					var $newImg = $($srcImg[0].cloneNode());
					if ($newImg.attr('src') == _blank)
						$newImg.attr('src', '');
					return {
						style: $target.attr('style'),
						comp: $('<div class="jp-image jp-comp-' + id + '">').append($newImg)
					};
				},

				//[ EXTLOGO

				'.jp-logo': function ($target, id, cross) {
					var $srcLogo = $('img', $target);
					var $newLogo = $($srcLogo[0].cloneNode());
					return {
						style: $target.attr('style'),
						comp: $('<div class="jp-logo jp-comp-' + id + '">').append($newLogo)
					};
				},
				//] EXTLOGO
				
				'.jp-registration-mark': function ($target, id, cross) {
					var $markSrc = $('img', $target);
					var $registrationMark = $($markSrc[0].cloneNode());
					return {
						style: $target.attr('style'),
						comp: $('<div class="jp-registration-mark jp-comp-' + id + '">').append($registrationMark)
					};
				},

				'.jp-line-vert': function ($target, id) {
					// $target.css('width', '1px');
					return {
						style: $target.css('width', '0px').attr('style'),
						comp: $('<div class="jp-line-vert jp-comp-' + id + '">')
					};
				},
				'.jp-line-horz': function ($target, id) {
					// $target.css('height', '1px');
					return {
						style: $target.css('height', '0px').attr('style'),
						comp: $('<div class="jp-line-horz jp-comp-' + id + '">')
					};
				},
				'.jp-table': function ($target, id) {
					var $table = $('table', $target);
					$table.find('tr').each(function () {
						$(this).attr('height', $(this).height());
					})
					var $newTable = $($table[0].cloneNode(true));
					var borderClass = $target.is(".jp-black-border") ? "jp-black-border" : "jp-no-border";
					return {
						style: $target.attr('style'),
						comp: $('<div class="jp-table jp-comp-{0} {1}">'.format(id, borderClass)).append($newTable)
					};
				}
			}, //
			this.headObject = function () {
				return '<OBJECT ID="jatoolsPrinter" CLASSID="CLSID:B43D3361-D075-4BE2-87FE-057188254255" codebase="jatoolsPrinter.cab#version=5,7,0,0"></OBJECT>';
			}
		this.bodyObject = function () {
			return ['<object id="ojatoolsPrinter" codebase="jatoolsPrinter.cab#version=5,4,0,0"', '	classid="clsid:B43D3361-D075-4BE2-87FE-057188254255" width="0" height="0">',
				'	<embed id="ejatoolsPrinter" type="application/x-vnd.jatoolsPrinter" width="0" height="0"></embed>', '</object>'].join('\n');
		}
		this.debugButtons = function (cross) {
			return ['<div>', '<input type="button" value="打印预览..." onClick="doPrint(\'打印预览...\')">',//
				'<input type="button" value="打印..." onClick="doPrint(\'打印...\')">',//
				'<input type="button" value="打印" onClick="doPrint(\'打印\')">',//
				'</div>'].join('\n')
		}, //
			this.debugScript = function (crossbrowser) {
				var myDoc = getMyDoc();
				return ["<script>", "function doPrint(how){",//
					"	var myDoc={",//
					"		settings:{",//
					"			paperWidth:" + myDoc.settings.paperWidth + ",",//
					"			paperHeight:" + myDoc.settings.paperHeight + ",",//
					"			orientation:" + myDoc.settings.orientation,//
					"		},",//
					"		marginIgnored:true,",//
					"		enableScreenOnlyClass:true,",//
					"		documents:document,",//
					"		copyrights:'NCIT Copyrights Reserved.'",//
					"	};", 'var jatoolsPrinter = getJatoolsPrinter();', "	if(how=='打印预览...')",//
					"		jatoolsPrinter.printPreview(myDoc);",//
					"	else if(how=='打印...')",//
					"		jatoolsPrinter.print(myDoc,true);",//
					"	else",//
					"		jatoolsPrinter.print(myDoc,false);",//
					"}",//	
					"</script>"//		
				].join('\n');
			}
		// 取得用户在本地位置调整后，有可能改变的css,比如，位置，颜色，字体，背景等
		this.getChangableStyles = function (//
			styleLimit// 为了override服务端的css,需要的限定前缀，一般为
			// .jp-page,如:
			// .jp-page .jp-comp-1{top: 375px...}
		) {
			var css = [], me = this;
			$page.children().each(function () {
				for (e in me.encoders) {
					if ($(this).is(e)) {
						var encoded = me.encoders[e].call(me, $(this), 0, true);
						if (encoded) {
							if (encoded.style) {
								var uclass = $(this)._uClass();
								if (uclass)
									css.push(styleLimit + '.' + uclass + '{' + encoded.style + '}');
							}
						}
					}
				}
			});
			return css;
		}, applyUClass = function () {
			var used = [];
			var noused = [];
			$page.children().each(function () {
				var uclass = $(this)._uClass();
				if (uclass) {
					used[uclass] = true;
				} else
					noused.push($(this));
			});
			$.each(noused, function (i, v) {
				for (var i = 0; true; i++) {
					var uclass = 'jp-comp-' + i;
					if (!used[uclass]) {
						$(this)._uClass(uclass);
						used[uclass] = 1;
						break;
					}
				}
			})
		}
		function encryptCodes(content, passcode) {
			var result = [];
			var passLen = passcode.length;
			for (var i = 0; i < content.length; i++) {
				var passOffset = i % passLen;
				var calAscii = (content.charCodeAt(i) + passcode.charCodeAt(passOffset));
				result.push(calAscii);
			}
			return JSON.stringify(result);
		}

		function data2attr($src, $target, props) {
			for (var i = 0; i < props.length; i++) {
				var val = $src.data(props[i]) || '';
				if (val) {
					$target.attr("data-" + props[i], (val + "").trim());
				}
			}
		}

		function copydata($src, $target, props) {
			for (var i = 0; i < props.length; i++) {
				var val = $src.data(props[i]) || '';
				if (val) {
					$target.data(props[i], val);
				}
			}
		}


		// 取得当前模板对象 {styles:'xxx',pageBody:'...'}
		this.encodeTemplate = function (restoreSrc/* 是否恢复 img.src的載入時候的地址 */) {
			var me = this;
			var _page = $('<div id="page${pageNo}" class="jp-page">').css({
				width: $page._style('width'),
				height: $page._style('height')
			})._copyClass($page, 'jp-landscape');//
			var index = 0;
			var css = [];
			var components = [];
			applyUClass();
			//var tid = 1; 新生成时表格时，就赋值
			$page.children().each(function () {
				for (e in me.encoders) {
					if ($(this).is(e)) {
						// alert($(encoded.comp).find('tr').html());
						var rad = $(this).rad();
						var encoded = me.encoders[e].call(me, $(this), index, true);
						if (encoded) {
							data2attr($(this), encoded.comp, ['mmleft', 'mmtop', 'mmwidth', 'mmheight']);
							if (rad && !$(this).is(".no-rotate")) {
								encoded.comp.attr("data-rad", rad);
							}
							var uclass = $(this)._uClass();
							var newuclass = encoded.comp._uClass();
							if (newuclass) {
								encoded.comp.removeClass(newuclass).addClass(uclass);
							}
							var el = null;
							if ($(this).is('.jp-table')) {
								el = $.extend(true, {}, $(this).data('saved-options'));
								if (!el["dataset"]) {
									/*
									 * 如果是静态表格，则只保存 html el ={ html: }
									 */
									el.html = $(encoded.comp)._outerHTML();
								} else {
									/*
									 * el ={ headerHTML: footerHTML;
									 * bodyHTML; tableHTML: }
									 */
									var settings = el['options'];
									var row = 0;
									//el.id = "tid-" + tid;
									var rows = $(encoded.comp).find("table")/*.attr("id", el.id)*/.find('tr');
									//tid++;
									if (settings["header-rows"]) {
										var tmp = '';
										for (var c = 0; c < settings["header-rows"]; c++) {
											var $r = $(rows[row]);
											//													$r.attr('height', $r.height());
											tmp += $r._outerHTML();
											row++;
										}
										el.headerHTML = tmp;
									}
									// if (el["dataset"]) {
									//											var $r = $(rows[row]);
									//											$r.attr('height', $r.height());
									el.usedFields = [];
									var regex = /\$\{(.*?)\}/;
									$(rows[row]).find("td").each(function () {
										var found = $(this).text().match(regex);

										if (found) // 有可能没有用
											el.usedFields.push(found[1] || '');
									});
									el.bodyHTML = $(rows[row])._outerHTML();
									// } else {
									// var bodies =
									// settings["body-rows"];
									// el.bodyHTML = "";
									// for (var r = row; r < bodies +
									// row; r++) {
									// el.bodyHTML +=
									// $(rows[r])._outerHTML();
									// }
									// }
									row = settings["header-rows"] + settings["body-rows"];
									if (settings["page-footer-rows"]) {
										var tmp = '';
										for (var c = 0; c < settings["page-footer-rows"]; c++) {
											tmp += $(rows[row])._outerHTML();
											row++;
										}
										el.pageFooterHTML = tmp;
									}
									row = settings["header-rows"] + settings["body-rows"] + settings["page-footer-rows"];
									if (settings["footer-rows"]) {
										var tmp = '';
										for (var c = 0; c < settings["footer-rows"]; c++) {
											tmp += $(rows[row])._outerHTML();
											row++;
										}
										el.footerHTML = tmp;
									}
									rows.remove();
									var bottom = "";
									if ((settings["break"] || '') == 'auto') {
										// 如果不是每页可见，则不要告诉 jcp 行头数
										var headerrows = settings["header-repeat"] ? settings["header-rows"] || 0 : 0;
										el.id = $(encoded.comp).find("table").attr("max-height", this.offsetHeight).attr("headerrows", headerrows).attr("id")
										css.push('.jp-page .' + uclass + ' td {white-space: normal;}');
									}
									el.tableHTML = $(encoded.comp)._outerHTML();
								}
							} else {
								var html = $(encoded.comp)._outerHTML($(this).is('.jp-barcode'));
								//										if ($(this).is('.jp-barcode'))
								//											html = html.replace(/\<param\s*[^>]*\>/g, '');
								//											
								//											
								el = {
									html: html
								};
							}
							el.type = e.substring(4);
							components.push(el);
							// _page.append(encoded.comp);
							if (encoded.style) {
								css.push('.jp-page .' + uclass + '{' + encoded.style + '}');
							}
							index++;
						}
					}
				}
			})
			var bands = [];
			$(".jp-bands >div", $page).each(function () {
				if (this.offsetHeight) {
					bands.push({
						name: this.id,
						height: this.offsetHeight
					});
				}
			});
			var result = {
				datasource: Global.editing['datasource-id'],
				"styles-global": [
					'.jp-page{position:relative}',
					//		'.jp-component{padding: 2px;}',		
					// text-align-last:justify;-moz-text-align-last:justify;-webkit-text-align-last:justify;
					'.jp-text,.jp-label{padding: 0px;word-wrap: break-word;font-size2:12px;white-space:normal;word-break:break-all;text-justify:distribute-all-lines;}',
					'.jp-text,.jp-label,.jp-image,.jp-barcode,jp-logo{position:absolute;overflow:hidden}',
					'.jp-line-horz,.jp-line-vert{font-size:0px;}',//
					'.jp-line-horz,.jp-line-vert,.jp-table,.jp-shape{position:absolute;}',//
					'div.jp-black-border td {border-right: black 0.4pt solid;border-bottom: black 0.4pt solid;}',//
					'div.jp-black-border table {border-left: black 0.4pt solid;border-top: black 0.4pt solid;}',//
					'div.jp-no-border table {border: none;}', //
					'.jp-table{min-width:1px;min-height:1px;}', '.jp-table table{border-collapse:collapse}',
					'.jp-auto-stretch,.jp-barcode object,.jp-barcode embed{width: 100%; height: 100%;}',//
					'.jp-paper-background{position:absolute;}',//
					'.jp-stretch,svg {width: 100%;height:100%;}',//
					'.jp-keep-width {width: 100%;}',//
					'.jp-keep-height {height: 100%;	}',//
					Global.config.defaults.style || ""].join('\n'),
				"styles-local": rgb2hex(css.join('\n')),
				children: components,
				pageHTML: _page._outerHTML()
			};
			if (bands.length) {
				result.bands = bands;
			}
			return encryptCodes(JSON.stringify(result), "TB1372501");
		}
		this.encode = function (debug, crossbrowser) {
			var me = this;
			var _page = $('<div id="page1" class="jp-page ">').css({
				width: $page._style('width'),
				height: $page._style('height')
			})._copyClass($page, 'jp-landscape');//
			var index = 0;
			var css = [];
			$page.children().each(function () {
				for (e in me.encoders) {
					if ($(this).is(e)) {
						var encoded = me.encoders[e].call(me, $(this), index, true);
						if (encoded) {
							_page.append(encoded.comp);
							if (encoded.style) {
								css.push('.jp-comp-' + index + '{' + encoded.style + '}');
							}
							index++;
						}
					}
				}
			})
			var html = _page.appendTo(document.body)._outerHTML(true);// .replace(/((\<\!\-\-TO_DELETE)|(TO_DELETE\-\-\>))/g,
			// '');
			// var html =
			// _page.appendTo(document.body)._outerHTML().replace(/((\<\!\-\-TO_DELETE)|(TO_DELETE\-\-\>))/g,
			// '');
			// alert("XXXXXXXXXXX\n"+html);
			_page.remove();
			return [
				// '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01
				// Transitional//EN"
				// "http://www.w3.org/TR/html4/loose.dtd">',//
				'<html>',//
				'<head>',//
				'<title>jatoolsPrinter打印</title>',//
				'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',//
				((!crossbrowser) && debug) ? this.headObject() : '',
				debug ? '<!-- jatoolsPrinter.js 可以下载，也可以直接以 http://... 引入 -->' : '',
				debug ? '<script type="text/javascript" src="http://print.jatools.com/jatoolsPrinter.js"></script>' : '', //
				'<style>',//
				Global.config.defaults.style || "",//
				'.jp-page{position:relative}',
				'.jp-text,.jp-label{font-size:12px;white-space:nowrap}',
				'.jp-text,.jp-label,.jp-image,.jp-barcode{position:absolute;overflow:hidden}',//
				'.jp-line-horz,.jp-line-vert,.jp-table,.jp-shape{position:absolute;}',//
				'div.jp-black-border td {border-right: black 0.4pt solid;border-bottom: black 0.4pt solid;}',//
				'div.jp-black-border table {border-left: black 0.4pt solid;border-top: black 0.4pt solid;}',//
				'div.jp-no-border table {border: none;}', //	
				'.jp-line-horz,.jp-line-vert{font-size:0px;}',//
				'.jp-table{min-width:1px;min-height:1px;}', '.jp-table table{border-collapse:collapse}',
				'.jp-auto-stretch,.jp-barcode object,.jp-barcode embed,svg{width: 100%; height: 100%;}',//
				'.jp-paper-background{position:absolute;width:100%;height:100%;}',//
				rgb2hex(css.join('\n')),//
				'</style>',//
				debug ? this.debugScript(crossbrowser) : '', '</head>',//
				'<body>',//
				debug ? this.debugButtons(crossbrowser) : '', html,//
				(crossbrowser && debug) ? this.bodyObject() : '', '</body>',//
				'</html>']//
				.join('\n');
		}
	};
	// 代码查看对话框
	// 组件面板对话框
	function ComponentListDialog() {
		var me = this;
		this.reposition = function () {
			return;
			//$page.find('ruler-top-inner').css()
		}
		this.initCreated = function (data, offset, $created) {
			var expr = (data.display || data.field);
			var fieldParent = Global.editing['field-parents'][data.id];
			if (fieldParent.type == 'free') {
				expr = data.parent + "." + expr;
			}
			if (data.format) {
				expr = 'format({0},"{1}")'.format(expr, data.format);
			}
			expr = data.expr || '${' + expr + '}';
			$s().unselect();
			offset.magnification = magnification;
			$created.appendTo($page).offset(offset);
			if (!$('table', $created).length) {
				// 如果创建的是表格组件，则不选中它
				$created.select();
			}
			initComponent($created);
			if (data.type == 'label') {
				if (data.text == '+') {
					_editorFactory.edit($created);
				} else
					$created.find('.jp-text-content').text(data.expr || data.text);
			} else if (data.type == 'text') {
				var $text = $created.find('.jp-text-content').text(expr);
				if (!data.editable) {
					$text.addClass("mutable");
				}
			} else if (data.type == 'image') {
				$created.find('img').attr('src', expr);
				$created.css({
					width: 100,
					height: 100
				});
			}
			// 注册undo
			undo.add(new $Edit($created, ['_appendTo'], null, $page));
		}
		this.create = function (data, offset) {
			var type = 'new' + data['type'].charAt(0).toUpperCase() + data['type'].slice(1);
			if (data.type == 'barcode') {
				var expr = data.expr || '${' + (data.parent ? data.parent + "." : "") + data.field + '}';
				$created = createBarcode({
					'code': expr,
					'style': 'type:' + data.codetype + ';autofit:true'
				}, function ($created) {
					$created.css({
						width: 100,
						height: 100
					}).attr('title', expr);
					me.initCreated(data, offset, $created);
				});
			} else if (data.type == 'table') {
				createTable(data, function ($created) {
					$created.attr('title', data.text);
					me.initCreated(data, offset, $created);
				});
			} else if (data.type == 'free') {
				// 拖动 free，什么也不做
			} else {
				var $created = $(handlers[type]);
				me.initCreated(data, offset, $created);
			}
		}
		this.beforeTotalMenuShow = function () {
			$.extend(true, me.menuFieldData, $(this).data("jp-field-data"));
		}
		this.createDraggableField = function (fields, level, parent) {
			enableDropdown(jQuery);
			$.each(fields, function (i, e) {
				var hasChildren = !!e['fields'];
				e['parent'] = parent || '';
				var newli = $('<li style="position:relative;" data-level="'+ level +'"><a href="#">'+ (hasChildren ? '<span class="caret caret-close"></span>' : '') + (e['display'] || e['field'] || e['text'] || e['dataset'] || "") + '</a></li>').data(
					'jp-field-data', e).addClass("jp-draggable-field" + (hasChildren ? ' jp-table-field' : ''))
				// .addClass("jp-dropdown");
				if (level)
					newli.find("a").addClass('jp-level-' + level);
				if (e["total-menu"]) {
					// newli.addClass('jp-total-menu').attr(
					// "data-dropdown", "hello");
					// data-dropdown
					newli.addClass('jp-total-menu').contextMenu('#jp-total-menu', me.beforeTotalMenuShow, true);
				}
				if(e.isCustomize) {
					$('#jp-customize-comp-list').prepend(newli);
				} else {
					me.$panel.append(newli);
				}
				// debugger;
				if (hasChildren) {
					me.createDraggableField(e['fields'], ++level, e['dataset']);
				}
			});
			this.menuFieldData = {
				totals: true
			}
			$("#jp-total-menu li").addClass("jp-draggable-field").data("jp-field-data", this.menuFieldData)
			// jp-draggable-field
			// new DropDown($('.jp-total-menu', me.$panel));
		}
		this.resetFields = function () {
			this.$panel.html("");
			this.createDraggableField(Global.editing.datasource.ui.fields, 0);
			$(".jp-draggable-field").draggable({
				appendTo: $page,
				helper: "clone",
				zIndex: 1000,
				start: function (event, ui) {
					$page.data('cell-parentable', $(event.target).data('jp-field-data').type != 'table');
				},
				drag: function (event, ui) {
					//	document.title = ui.position.top + "," + ui.position.left;
					// $target.data('no-excel', noexcel);
					if ($page.data('cell-parentable'))
						$('.jp-table', $page).each(function () {
							var hit = $(this).data('no-excel').trySelect(event.pageX, event.pageY);
							$page.data('hit-cell', hit);
							if (hit)
								return false;
						});
				}
			});
			$('.jp-table-field').click(function() {
				var li = this;
				var icon = $(this).find('.caret');
				const isClose = icon.hasClass('caret-close');
				icon.toggleClass('caret-close');
				$('#jp-comp-list li[data-level="1"]').toggle();
			})
		}
		this.open = function () {
			// this.$dialog = Global.request.how == 'view' ? $('.jp-view-tools') : $('#jp-comp-list-dialog');
			this.$panel = $('#jp-comp-list');
			var datasourcetitle = Global.editing['datasource-id'];
			if (Global.editing.datasource.name) {
				datasourcetitle += ' - ' + Global.editing.datasource.name;
			}
			// this.$dialog.find('.id-input').val(Global.request['rid']);
			// if (Global.request['rid']) {
			// 	this.$dialog.find('.id-input').addClass('textBoxNormalReadOnly').prop("disabled", true);
			// }
			if (Global.request.how == 'view') {
				//this.$dialog.find("input").addClass('textBoxNormalReadOnly').prop("disabled", true);
				this.$panel.find("select").addClass('textBoxNormalReadOnly').prop("disabled", true);
				this.$panel.find('.ui-layout-center').children().addClass("hidden");
				return;
			}
			// this.$dialog.find('#jp-datasource-name').text(datasourcetitle);
			this.resetFields();
			// var left = Math.min($(window).width() - 220, $page.width() + 15);
			// this.$dialog.dialog({
			// 	dialogClass: "no-close jp-component-list-dlg",// 目的是在布局时隐藏该对话框
			// 	top: 50,
			// 	closeOnEscape: false,
			// 	position: [left, 45],
			// 	width: 210,
			// 	resizable: false,
			// 	autoOpen: true
			// });
			// ///	dialog.draggable( "option", "containment", container );
			// //this.$dialog.draggable("option", "containment", $(document.body));
			// //	var height = this.$dialog.dialog("option", "height");
			// if (this.$dialog.height() > $(window).height()) {
			// 	this.$dialog.dialog("option", "height", $(window).height());
			// }
			// me.reposition();
			// this.$dialog.layout({
			// 	//applyDemoStyles : true,
			// 	north__resizable: false,
			// 	north__spacing_open: 0,
			// 	south__resizable: false,
			// 	south__spacing_open: 0
			// });
			// $(window).resize(function () {
			// 	me.reposition();
			// });
			// 让$page可以接受拖动的组件
			$page.droppable({
				accept: "li.jp-draggable-field",
				drop: function (event, ui) {
					var data = $.extend(true, {}, ui.draggable.data('jp-field-data'));
					var field = (data.field || data.display);
					var fieldParent = Global.editing['field-parents'][data.id];
					if (data.totals) {
						field += "." + ui.helper.text();
					}
					var hit = $page.data('hit-cell');
					// debugger;
					if ($page.data('cell-parentable') && hit) {
						var td = hit.srcEl;
						if (gActiveEditor && td == gActiveEditor.el) {

						} else {
							var replace = false;
							var saveoptions = $(td).closest(".jp-table").data("saved-options");
							if (!saveoptions) {
								// 
								if (data.parent) {
									field = data.parent + "." + field;
								}
								replace = true;
							} else {
								var tbsettings = saveoptions["options"] || {};
								var hittest = hitTest(tbsettings, hit.row);
								//0=表眉，1=明细主体，2= 明细扩展，3=表脚
								replace = hittest != 2;//&& (data.totals || !data.parent || tbsettings["header-rows"] != hit.row);
							}
							if (replace) {
								var expr = null;
								if (event.shiftKey) {
									expr = ui.helper.children().first().html();
								} else {
									if (data.format) {
										field = 'format({0},"{1}")'.format(field, data.format);
									}
									expr = data.expr || '${' + field + '}';
								}
								$(td).html('<span class="expr">{0}</span>'.format(expr));
								if (!data.editable) {
									$(td).find("span").addClass("mutable");
								}
							}
						}
					} else if (data.totals || !(fieldParent && fieldParent.type == 'table') /* 明细字段，不能放在page里面 */) {
						if (gActiveEditor && td == gActiveEditor.el) {

						} else {
							//
							if (data.totals) {
								data.display = field;
							}
							var pos = $(this).find("li.ui-draggable-dragging").offset();
							// $(this).find(".placeholder").remove();
							pos.top /= magnification;
							pos.left /= magnification;
							me.create(data, pos);
						}
					}
					$page.data('hit-cell', null);
				}
			})
			return this;
		}
	}
	function endCreateClick(e) {
		// 如果是生成按钮，忽略
		// 如果
		if ($created && $(e.target).closest('.jp-page').add($(e.target).closest('a.jp-creating')).length == 0) {
			endCreate();
		}
	};
	var tid = 0;
	function getTID() {
		if (!tid) {
			$page.find("table").each(function () {
				var index = parseInt(this.id.split("-")[1]);
				if (index > tid) {
					tid = index;
				}
			});
		}
		return "tid-" + (++tid);
	}
	function getMyDoc() {
		var myDoc = {
			keepURL: true,
			// settingsID: Global.request['rid'] || '',
			// settings: {},
			// noMargins: true,
			// enableScreenOnlyClass: true,
			// logPage : true,
			copyrights: '杰创软件拥有版权  www.jatools.com'
		};
		var settings = myDoc.settings;
		var portrait = !$page.is('.jp-landscape'), //
			w = $.style($page[0], 'width'), //
			h = $.style($page[0], 'height'), //
			paperWidth = isLabelTmp ? w : portrait ? w : h, //
			paperHeight = isLabelTmp ? h : portrait ? h : w//
		/*
		 * // 查询当前纸张 select中，有没有相应的纸张大小，如果有，选中，没有创建一个，然后，选中
		 * ,expected=parseInt(paperWidth)+','+parseInt(paperHeight),paperName=$("#jp-paper-name
		 * option[value='" +expected+"']").text() ||'';
		 * if(paperName.match(/^[ab][1-6]$/i)){ settings.paperName=paperName;
		 * }else{
		 */
		//	settings.paperWidth = parseInt(paperWidth) * 10;
		//	settings.paperHeight = parseInt(paperHeight) * 10;
		// }
		//settings.orientation = portrait ? 1 : 2;
		return myDoc;
	}
	function startCreate($button) {
		$created && endCreate();
		$button.closest('a').add($(document.body)).addClass('jp-creating');
		$(document).one('mousedown', endCreateClick);
		$('.ui-draggable', $page).each(function () {
			$(this).data('draggable').options.disabled = true;
		})
	}
	function endCreate() {
		$created = null;
		$('.ui-draggable', $page).each(function () {
			$(this).data('draggable').options.disabled = false;
		})
		$('.jp-creating').removeClass('jp-creating');
		$(document).unbind('mousedown', endCreateClick)
		$('.active-frame').removeClass('active-frame');
		// 渲染自定义模板数据项
		renderCustomizeDataItem();
	}
	function setBorder(target, newval) {
		var fn = ['borderStyle'], oldval = [];
		target.vals(fn, oldval).borderStyle(newval);
		undo.add(new $Edit(target, fn, oldval, newval));
		return target;
	}
	function testPrintOut(newDoc/* 结构同 myDoc, 此为优先, */, html) {
		if ($('#jp-test-print').prop('disabled')) return;
		$('#jp-test-print').attr('disabled', 'disabled');
		$('#jp-test-print').prop('disabled', true);
		var myDoc = getMyDoc();
		if (newDoc) {
			$.extend(true, myDoc, newDoc);
		}
		//	myDoc.settings = 'auto';
		//		if (Global.request.debug || true)
		//window.open(myDoc.documents);
		//myDoc.documents="auto.html";
		//myDoc.keepURL=false;
		myDoc.listener = function (e) {
			if (e && e.type == "window-close") {
				$('#jp-test-print').prop('disabled', false);
				$('#jp-test-print').removeAttr('disabled');
			}
		};
		j().printPreview(myDoc, false);
	}
	function CustomBorderDialog() {
		var me = this;
		this.close = function () {
		}, //
			this.getDialog = function () {
				//////////////
				if (!this.$dialog) {
					this.$dialog = $("#jp-border-dialog");
					var $d = this.$dialog;
					var $viewer = $('#jp-border-viewer', $d), $line = $('#jp-line-viewer', $d);
					// $('.jp-border-previewer', $d).click(function (e) {
					// 	$.each(['.border-top', '.border-right', '.border-bottom', '.border-left'], function (i, el) {
					// 		if ($(e.target).is(el)) {
					// 			var style = el.substring(1);
					// 			old = $.style($viewer[0], style) || $.style($viewer[0], 'border');
					// 			$viewer.css(style, old ? '' : $.style($line[0], 'border-top'));
					// 		}
					// 	})
					// });
					$d.find(".width-input").on("input", function () {
						this.dataset.value = this.value;
						$d.trigger("border-changed");
					});
					var fromSettings = function () {
						var borderstyle = $d.find(".style-viewer").css("border-top-style");
						var borderwidth = $d.find(".width-input").val();
						var bordercolor = $d.find(".color-viewer").css("background-color");
						return "{0} {1}px {2}".format(borderstyle, borderwidth, bordercolor);
					}
					var $input = $d.find("input.spectrum").val('rgb(0,0,0)').spectrum({
						flat: true,
						showInput: true,
						showButtons: false,
						showPalette: true,
						showSelectionPalette: true,
						maxPaletteSize: 20,
						preferredFormat: 'rgb',
						showSelectionPalette: true,
						color: 'rgb(0,0,0)',
						paletteConfig: "8x8"
					}).on("input", function () {
						$drop.find(".sp-preview-inner").css("background-color", $input.val());
						$d.trigger("border-changed");
						// this.dataset.value = this.value;
						// $drop.data("selections")[func](prop, this.value + unit);
					});
					var $drop = $input.closest(".dropdown");
					$input.on("pallet-changed", function () {
						$drop.find(".sp-trigger").trigger("click");
					})
					$d.on("click", ".border-style li", function () {
						var style = $(this).find("span").css("border-top");
						$d.find("span.style-viewer").css("border-top", style);
						$d.trigger("border-changed");
					}).on("click", ".jp-border-line", function () {
						var border = $(this).data("border");
						var current = $viewer.css(border);
						$viewer.add($s()).css(border, !current || current.includes("none") ? fromSettings() : "");
					}).on("click", ".cmd", function () {
						if (this.id == 'border-none') {
							["top", "right", "bottom", "left"].map(function (val) {
								$viewer.add($s()).css("border-" + val, "");
							})
						} else {
							$d.find(".borders a").addClass("active");
							$d.trigger("border-changed");
						}
					}).on("border-changed", function () {
						$d.find(".borders a.active").each(function () {
							$viewer.add($s()).css(this.id, fromSettings());
						});
					});
					// makeColorChooser($('#jp-border-color', $d), null, function (color) {
					// 	$line.css('border-top-color', color.toHexString());
					// });
				}
				return this.$dialog;
			}
		this.updateUI = function () {
			var me = this;
			var $d = this.$dialog;
			this.oldvalues = [];
			var fn = ['borderStyle'], oldval = [];
			$s().vals(fn, this.oldvalues);
			var $viewer = $('#jp-border-viewer', $d).borderStyle($s().first().borderStyle()), //
				firstborder = null;
			for (var p of ["left", "top", "right", "bottom"]) {
				var border = $viewer.css("border-" + p);
				if (!border.includes("none")) {
					firstborder = {
						style: $viewer.css("border-" + p + "-style"),
						color: $viewer.css("border-" + p + "-color"),
						width: parseInt($viewer.css("border-" + p + "-width"))
					}
					break;
				}
			}
			if (!firstborder) {
				firstborder = {
					style: "solid",
					color: "rgb(0,0,0)",
					width: 1
				}
			}
			$d.find(".style-viewer").css("border-top-style", firstborder.style);
			$d.find(".width-input").val(firstborder.width)[0].dataset.value = firstborder.width;
			$d.find(".color-viewer").css("background-color", firstborder.color);
		}
		this.open = function (target) {
			this.$target = $(target);
			me.getDialog();
			me.updateUI();
			/*if (!this.instance) {
				var $dialog = $('#jp-border-dialog');
				this.instance = new BootstrapDialog({
					title: $dialog.attr('title'),
					draggable: true,
					animate: false,
					cssClass: "custom-border-dialog",
					closeByBackdrop: false,
					closeByKeyboard: false,
					autodestroy: false,
					message: $dialog.removeClass('jp-dialog'),
					onshown: function (d) {
						me.getDialog();
						me.updateUI();
					},
					buttons: [{
						cssClass: "",
						label: "确定",
						action: function (dialog) {
							var newval = $('#jp-border-viewer', me.$dialog)._border();
							// //console.log(newval);
							if ($s().length) {
								var fn = ['borderStyle'];
								var newval = $('#jp-border-viewer', me.$dialog).borderStyle();
								undo.add(new $Edit($s(), fn, me.oldvalues, newval));
							}
							dialog.close();
						}
					}, {
						cssClass: "btn-default2",
						label: "关闭",
						action: function (dialog) {
							$s().each(function (e, i) {
								$(this).borderStyle(me.oldvalues[i]);
							});
							dialog.close();
						}
					}]
				});
			}
			this.instance.open();*/
		}
	}
	function setFonts(target) {
		try {
			function doFonts(fonts) {
				// debugger;
				if (fonts) {
					var fontSelect = $(target)[0];
					if(!fontSelect) return;
					for (var i = 0; i < fonts.length; i++) {
						fontSelect.options[i] = new Option(fonts[i], fonts[i]);
					}
					$(target).selectpicker('refresh').selectpicker({dropupAuto: false});
				};
			}
			j().getFonts(function (fonts) {
				doFonts(fonts);
			});
		} catch (e) {
		}
	}
	function makeColorChooser(target, extraOptions, callback) {
		$(target).each(function (e) {
			var me = this;
			var options = {
				showInitial: true,
				showPalette: true,
				showSelectionPalette: true,
				maxPaletteSize: 10,
				preferredFormat: "hex",
				cancelText: "关闭",
				chooseText: "确定",
				localStorageKey: "spectrum.demo",
				palette: [
					["rgba(255, 255, 255,0)", "rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(255, 255, 255)"].slice($(this).is('.jp-with-transparent') ? 0 : 1),
					["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)", "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)",
						"rgb(153, 0, 255)", "rgb(255, 0, 255)"]],
				change: function (color, opts) {
					callback && callback(color, opts);
				},
				show: function () {
					showingColorChooser = me;
				},
				hide: function () {
					showingColorChooser = null;
				}
			};
			extraOptions && (options = $.extend(extraOptions, options));
			$(this).spectrum(options);
		});
	}
	function hex(x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	}
	function rgb2hex(code) {
		return code.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, function (matched, r, g, b) {
			return "#" + hex(r) + hex(g) + hex(b);
		})
	}
	function lineColorChanged(color) {
		var fortarget = $('#jp-line-actions').data('for-target');
		if (fortarget.is('.jp-line-vert')) {
			type = 'border-right-color';
		} else {
			type = 'border-bottom-color';
		}
		fortarget._css(type, color.toHexString());
		fortarget.dropdown('hide');
	}
	var colorChanged = function (color, opts) {
		var c = color.alpha ? color.toHexString() : 'transparent';
		if (window["htmlediting"]) {
			document.execCommand(opts.style == 'color' ? 'forecolor' : "backcolor", false, c);
		} else {
			$s()._css(opts.style, c);
		}
	}
	var strokeColorChanged = function (color, opts) {
		var c = color.alpha ? color.toHexString() : 'transparent';
		$s().find("SVG .core")._attr('stroke', c);
		undo.open();
		$s().find("SVG.icon")._css('color', c);
		undo.close();
	}
	function setSizePanel() {
		var $sel = $s();
		var selected = $sel.length;
		if (selected == 0) {
			sizetools.removeClass('jp-visible');
			sizeinputs.val('');
		} else if (selected == 1) {
			var off = $sel.position();
			var x = parseFloat($sel.data("mmleft") || parseFloat(off.left * mm$px).toFixed(2) / magnification);
			var y = parseFloat($sel.data("mmtop") || parseFloat(off.top * mm$px).toFixed(2) / magnification);
			var w = parseFloat($sel.data("mmwidth") || parseFloat($sel.width() * mm$px).toFixed(2));
			var h = parseFloat($sel.data("mmheight") || parseFloat($sel.height() * mm$px).toFixed(2));
			var istable = $s().closest('.jp-table').length > 0;
			$('#jp-left-input', sizetools).val(calculate(x, '/', 1).toFixed(2));
			$('#jp-top-input', sizetools).val(calculate(y, '/', 1).toFixed(2));
			$('#jp-width-input', sizetools).val(calculate(w, '*', 1)).prop('disabled', istable);
			$('#jp-height-input', sizetools).val(calculate(h, '*', 1)).prop('disabled', istable);
			sizetools.addClass('jp-visible');
		} else {
			sizeinputs.val('');
			sizetools.addClass('jp-visible');
		}
	}
	function changeSize() {
		if ($(this).val()) {
			var prop = $(this).attr('id').split('-')[1];
			$s().not($(this).attr("not") || '').data("mm" + prop, $(this).val() + ' ')._css(prop, parseFloat($(this).val() * px$mm) + 'px');
		}
	}
	function getLastZIndex(x) {
		var indexs = [100], selections = $('.jp-component', $page);
		if (x)
			selections = selections.not(x);
		selections.vals(['css', 'z-index'], indexs);
		return Math.max.apply(null, indexs) + 1;
	}
	function selecting() {
		var uiselecting = $page.find('.ui-selecting');
		if (uiselecting.length == 1) {
			$page.data('first-selected') && $page.data('first-selected').removeClass('ui-selected-first');
			$page.data('first-selected', $(uiselecting[0]).addClass('ui-selected-first'));
		}
	}
	function getDefaultSizes(sizetype) {
		if (!defaultsizes) {
			defaultsizes = {
				"text": {
					width: 60,
					height: 25
				},
				"2dcode": {
					width: 50,
					height: 50
				},
				"barcode": {
					width: 60,
					height: 30
				},
				"image": {
					width: 200,
					height: 200
				},
				"vline": {
					width: 1,
					height: 100
				},
				"hline": {
					width: 100,
					height: 1
				},
				"table": {
					width: 1,
					height: 1
				},
				"registration-mark":{
					width: 20,
					height: 20
				}
			}
		}
		return defaultsizes[sizetype];
	}
	function mySelectChange($target, handler) {
		$target.focus()
	}
	function beforeTextMenuShow(dropdown) {
		// 设置菜单，正在处理的text 组件，便于响应菜单命令时，找到起作用的text组件
		$(dropdown).data('for-target', $(this));
		// 根据当前组件的属性，设置是否选中的外观
		var $content = $(this);
		if ($content.css('white-space') == 'nowrap') {
			$('#jp-word-wrap', dropdown).removeClass('jp-checked');
		} else
			$('#jp-word-wrap', dropdown).addClass('jp-checked');
		if ($(this).hasClass('jp-font-fit')) {
			$('#jp-font-fit', dropdown).addClass('jp-checked');
		} else
			$('#jp-font-fit', dropdown).removeClass('jp-checked');
	}
	function beforeTableMenuShow(dropdown) {
		// 设置菜单，正在处理的text 组件，便于响应菜单命令时，找到起作用的text组件
		$(dropdown).data('for-target', $(this));
		var nowrap = tablemenuhandlers.isNoWrap();
		if (!nowrap) {
			$('#jp-table-autowrap', dropdown).addClass('jp-checked');
		} else
			$('#jp-table-autowrap', dropdown).removeClass('jp-checked');
		// 根据当前组件的属性，设置是否选中的外观
		if ($(this).is('.jp-black-border')) {
			$('#jp-table-border', dropdown).addClass('jp-checked');
		} else
			$('#jp-table-border', dropdown).removeClass('jp-checked');
		var $bodysetItem = $(dropdown).find('#jp-table-body').parent();
		if ($(this).is('.jp-static')) {
			$bodysetItem.addClass('jp-hidden');
		} else {
			var settings = $(this).data("saved-options")["options"];
			$('#jp-header-repeat', dropdown).toggleClass("jp-checked", settings["header-repeat"]);
			$bodysetItem.removeClass('jp-hidden');
		}
	}
	function beforeLineMenuShow(dropdown) {
		// 设置菜单���正在处理的text 组件，便于响应菜单命令时，找到起作用的text组件
		$(dropdown).data('for-target', $(this));
		$('#jp-line-color').spectrum("set", $(this).css('background-color'));
	}
	function initComponent(_target, noIndex) {
		var result = $(_target);
		result.each(function () {
			var target = this;
			if ($(target).is('.jp-barcode')) {
				//						$t.find('img').css({
				//									width : '100%',
				//									height : '100%'
				//								});
				setCodeImage($(target));
			}
			if (Global.request.editing) {
				if (!$(target).is('.jp-ininted'))
					$(target).addClass('jp-ininted').mydraggable({
						// containment:'parent',
						// grid:[20,20],
						start: function (ev, ui) {
							this.clickx = ev.clientX;
							this.clicky = ev.clientY;
							this.startPageX = ev.pageX;
							this.startPageY = ev.pageY;
							this.startLeft = ev.target.offsetLeft;
							this.startTop = ev.target.offsetTop;
							// if (window["mydraggable-disabled"])
							// 	return false;
							// //console.log(ui.helper.text());
							if (!$(this).selected())
								$(this).select();
							selected = $s().each(function () {
								var el = $(this);
								el.data("offset", el.offset());
								el.data("offset2", {
									left: this.offsetLeft,
									top: this.offsetTop
								});
							});
							offset = $(this).offset();
							var oldval = [], fn = ['offset'];
							selected.vals(fn, oldval);
							$(ev.target).data({
								'oldOffsets': oldval,
								'dragging': selected.length == 1
							});
						},
						stop: function (e) {
							$(e.target).data({
								'dragging': false,
								'rulers': null
							});
							$('.jp-ruler-element').css('display', 'none');
							handlers.endMove($(e.target).data('oldOffsets'))
						},
						drag: function (ev, ui) {
							// if (window["mydraggable-disabled"])
							// 	return false;
							var dt = ui.position.top - offset.top, dl = ui.position.left - offset.left;
							// take all the elements
							// that are selected
							// expect
							// $("this"),
							// which
							// is the element being
							// dragged and loop
							// through each.
							var me = this;
							// 多选移动
							selected.not(this).each(function () {
								// create
								// the
								// variable
								// for
								// we
								// don't
								// need
								// to
								// keep
								// calling
								// $("this")
								// el =
								// current
								// element
								// we
								// are
								// on
								// off
								// =
								// what
								// position
								// was
								// this
								// element
								// at
								// when
								// it
								// was
								// selected,
								// before
								// drag
								var el = $(this), off = el.data("offset2");
								el.css({
									top: off.top + (ev.pageY - me.startPageY) / magnification,
									left: off.left + (ev.pageX - me.startPageX) / magnification
								});
							});
							var rulers = $(ev.target).data('rulers');
							if (rulers)
								renderRulers(ev.target, rulers);
							// var original = ui.originalPosition;
							// jQuery will simply use the same object we alter here
							// ui.position = {
							// 	left: (ev.clientX - this.clickx + original.left) / viewscale,
							// 	top: (ev.clientY - this.clicky + original.top) / viewscale
							// };
						}
					})//
				// 固定大小的组件不能可视化改变大小 ，比如 ，表格组件
				var resizable, pressed;
				if (!$(target).is('.fixed')) {
					var resizeopt = {
						minWidth: -10000, // these need to be large and negative
						minHeight: -10000,
						rulerSet: true,
						start: function (e, ui) {
							var $target = $(e.target);
							$($s()[0]).data({ "mmwidth": '', "mmheight": '' });
							getConnectorPositions(e.target);
							var oldVals = {
								width: $target.width(),
								height: $target.height()
							};
							if ($target.find(".ui-resizable-p1").length) {
								// 计算中p1p2的坐标
								var p1 = $target.find(".ui-resizable-p1")[0].className.match(/\sp\-([10]+)\-([10]+)/), p2 = $target.find(".ui-resizable-p2")[0].className
									.match(/\sp\-([10]+)\-([10]+)/), xs = {
										'0': ui.originalPosition.left,
										"100": ui.originalPosition.left + ui.originalSize.width
									}, ys = {
										'0': ui.originalPosition.top,
										"100": ui.originalPosition.top + ui.originalSize.height
									};
								$target.data("p1p2", {
									'p1': {
										x: xs[p1[1]],
										y: ys[p1[2]]
									},
									'p2': {
										x: xs[p2[1]],
										y: ys[p2[2]]
									}
								});
							}
							oldVals.dx = $target.outerWidth() - oldVals.width;
							oldVals.dy = $target.outerHeight() - oldVals.height;
							var $t = $target.data({
								'oldVals': oldVals,
								'dragging': true
							});
							// var p = {
							// 	left: parseInt($(e.target).css("left")),
							// 	top: parseInt($(e.target).css("top"))
							// };
							rad = $target.rad();
							// if (rad) {
							// 	var w = $target.width(),
							// 		h = $target.height();
							// 	var c = {
							// 		left: p.left + w / 2,
							// 		top: p.top + h / 2
							// 	}
							// 	var p1 = rotate(c.left, c.top, p.left, p.top, rad);
							// 	pressed = {
							// 		rad: rad,
							// 		p: p, // 未旋转左上角
							// 		c: c, // 中心点
							// 		width: w,
							// 		height: h,
							// 		pageX: e.pageX,
							// 		pageY: e.pageY,
							// 		p1: p1,  // p1 是左上角p的旋转 rad 后的位置
							// 		q1: {   // q1 是右下角旋转后的位置
							// 			left: 2 * c.left - p1.left,
							// 			top: 2 * c.top - p1.top
							// 		}
							// 	};
							// } else {
							// 	pressed = {
							// 		rad: rad,
							// 		p: p
							// 	}
							// }
						},
						resize: function (e, ui) {
							var rulers = $(e.target).data('rulers');
							if (rulers)
								renderRulers(e.target, rulers);
							setSizePanel();
							if (rad) {
								// // q1 移动后的新位置
								// var q1newx = pressed.q1.left + e.pageX - pressed.pageX;
								// var q1newy = pressed.q1.top + e.pageY - pressed.pageY;
								// // 新的中心点
								// var cnewx = (q1newx + pressed.p1.left) / 2;
								// var cnewy = (q1newy + pressed.p1.top) / 2;
								// // 什么点p在以新中心旋转rad后，可以得到与原左上角旋转点p1，同样的坐标，即旋转对象在变大小后，左上角位置不变
								// var pnew = rotate(cnewx, cnewy, pressed.p1.left, pressed.p1.top, -rad);
								// // 新右下角位置，未旋转
								// var qnew = rotate(cnewx, cnewy, q1newx, q1newy, -rad);
								// // 新的对象大小，
								// var wnew = qnew.left - pnew.left;
								// var hnew = qnew.top - pnew.top;
								// ui.position.top = pnew.top;
								// ui.position.left = pnew.left;
								// $(e.target).css({
								// 	top: pnew.top,
								// 	left: pnew.left,
								// 	width: wnew + "px",
								// 	height: hnew + "px"
								// });
							} else {
								// var x = this.startLeft, y = this.startTop;
								// var width = this.startLeft + e.pageX - this.startPageX;
								// var height = this.startTop + e.pageY - this.startPageY;
								// if (width < 0) {
								// 	x = this.startLeft + width;
								// }
								// if (height < 0) {
								// 	y = this.startTop + height;
								// }
								// ui.position.left = x;
								// ui.position.top = y;
								// ui.size.width = Math.abs(width);
								// ui.size.height = Math.abs(height);
							}
							if (ROTATE) {
								$s().first().enableRotate('sync');
							}
						},
						stop: function (e) {
							var $t = $(e.target);
							$('jp-h-ruler,jp-v-ruler').css('display', 'none');
							var newwidth = $t.width(), newheight = $t.height();
							var oldVals = $t.data('oldVals');
							undo.open();
							undo.add(new $Edit($t, ['width'], oldVals.width, newwidth));
							undo.add(new $Edit($t, ['height'], oldVals.height, newheight));
							undo.close();
							$t.data({
								'dragging': false,
								'rulers': null,
								'oldVals': null
							});
							if ($t.is('.jp-barcode')) {
								setCodeImage($t);
							}
						}
					};
					if ($(target).find('.line').length) {
						var classes = getSVGLineClass(target);
						resizeopt.free = true;
						resizeopt.handles = 'p1.{0},p2.{1}'.format(classes[0], classes[1]);
						resizeopt.handlesChanged = function ($target) {
							var classes = getSVGLineClass($target);
							$target.find(".ui-resizable-p1")[0].className = 'ui-resizable-handle ui-resizable-p1 ' + classes[0];
							$target.find(".ui-resizable-p2")[0].className = 'ui-resizable-handle ui-resizable-p2 ' + classes[1];
							//var $p1 = $target.find(".ui-resizable-p1")[0].className.replace(/\sp-[10\-]+/
						}
					}
					$(target).resizable(resizeopt).mousedown(function (e) {
						if (!$(this).selected()) {
							if (!e.ctrlKey)
								$s().unselect();//
							// //////////////////$(this).siblings().unselect();
							$(this).select();
							$(document).trigger("selection-changed");
						}
					}).click(function (e) {
						// 2021年4月20日09:48:24  解决普通文本双击修改
						editComponent.call(this, e);
					}).dblclick(function (e) {
						// 2021年4月20日09:48:24  解决普通文本双击修改
						editComponent.call(this, e);
					});
				}
				if ($(target).find('span.jp-text-content').length) {
					$(target).contextMenu('#jp-text-actions', beforeTextMenuShow);
				} else if ($(target).is('.jp-line')) {
					//LINEPROPS
					$(target).contextMenu('#jp-line-actions', beforeLineMenuShow);
					///LINEPROPS
				} else if ($(target).is('.jp-table')) {
					//	var $contextMenu = $("#contextMenu");
					$(target).contextMenu('#jp-table-actions', beforeTableMenuShow);
				}
			}
		});
		if (!noIndex) {
			result.css('z-index', getLastZIndex(result));
		}
		// 调用组件生成监听器,使用表格有机会做成noexcel,如挂接弹出式菜单，允许可视化调整行高列宽等。
		Global.request.editing && _createdListeners.fire(result);
		// var data=result.data('code-data');
		// if(result.is('.jp-code')&&data){
		// // 是打印控件，则要给出控件的绘制数据
		// result._object()._codeData(data);
		// }
		if (Global.request.viewing && result.is('.jp-table')) {
			result.children(':not(table)').remove();
		}
		return result;
	}
	
	function editComponent(e) {
		if($(this).hasClass('jp-label') && e.type === 'click') return;
		_editorFactory.edit($(this));
		if ($(e.target).is('.jp-component')) {
			if (!e.offsetX) {
				e.offsetX = (e.pageX - $(e.target).offset().left);
			}
			if (e.offsetX > $(e.target).width()) {
				$(e.target).addClass('jp-menu-dropping')
			}
		}
	}
	
	function getSVGLineClass(target) {
		var $line = $(target).find("line");
		return ["p-" + $line.attr("x1").split("%")[0] + '-' + $line.attr("y1").split("%")[0],//
		"p-" + $line.attr("x2").split("%")[0] + '-' + $line.attr("y2").split("%")[0]]
	}
	function selectDatasource(callback) {
		$.post(Global.service.DBACTION, {
			how: "getDatasourceList"
		}, function (data) {
			if (data.success) {
				var rows = data.result.rows;
				var trs = [];
				$.each(rows, function (row) {
					var tdhtml = "<tr {2}><td class='did'>{0}</td><td>{1}</td></tr>".format(this[0], this[1], !row ? "class='selected'" : '');
					trs.push(tdhtml);
				})
				new BootstrapDialog({
					title: '选择数据源',
					cssClass: "select-datasource-dialog",
					draggable: true,
					animate: false,
					closable: false,
					closeByBackdrop: false,
					closeByKeyboard: false,
					message: "<div class='wrapper'><div style='width:100%;overflow-x:hidden;height:250px;widt2h:400px;'>"
						+ "<table style='left:0px;margin:0;display:none;' class='table-striped dataTable compact table boo-table table-bordered'><thead>"
						+ "<th>ID</th><th>名称</th></thead><tbody>" + trs.join("") + //
						"</tbody></table></div></div>",//
					buttons: [{
						cssClass: "",
						label: "确定",
						action: function (dialog) {
							var tid = dialog.getModalBody().find('tr.selected td.did');
							if (tid.length) {
								dialog.close();
								callback && callback(tid.text(), tid.next().text());
							} else {
								alert('请至少选中一个扫描点.');
							}
						}
					}],
					onshown: function (dialog) {
						//data.result.sql = sql;
						dialog.getModalBody().find("table").data("page", data.result).css('display', 'table').DataTable({
							"paging": false,
							"ordering": false,
							"scrollY": "200px",
							"scrollCollapse": false,
							"info": false,
							"searching": false,
							"language": {
								"emptyTable": "无数据"
							}
						});
						dialog.getModalBody().find('.dataTables_scrollBody tbody').on('click', 'tr', function () {
							if (!$(this).is('selected')) {
								$(this).parent().children().removeClass('selected');
								$(this).addClass('selected').find('input').prop('checked', true);
							}
						}).on('dblclick', 'tr', function () {
							dialog.close();
							if ($(this).is('.selected')) {
								var $tid = $(this).find('.did');
								callback && callback($tid.text(), $tid.next().text());
							}
						});
						dialog.getModalBody().find('.dataTables_scrollBody').on('scroll', function () {
							$('.dataTables_scrollHead table').css('margin-left', parseInt($('.dataTables_scrollBody').scrollLeft()) * -1)
						});
					}
				}).open();
			}
		}, 'json');
	}
	function setDatasourceUI() {
		var defaulteditable = true;
		Global.editing['field-parents'] = []; // 根据field.id号，可以取到该field的父节点
		setEditables(Global.editing.datasource.ui.fields, Global.editing.datasource.ui, defaulteditable, Global.editing['field-parents']);
		if (compentlistpanel) {
			compentlistpanel.resetFields();
		} else
			compentlistpanel = new ComponentListDialog().open();
	}
	function loadDatasource(did) {
		//$.getJSON("service/getDatasource.jsp?ds=" + did, {}, function (data) {
		// $.getJSON(getProjectName()+"/ddservice/getDataSource?ds=" + did, {}, function (data) {
			// Global.editing.datasource = data;
			Global.editing['datasource-id'] = did;
			$page.removeClass('jp-hidden')
			setDatasourceUI();
			//setTimeout(function() {
			$page.trigger("report-load");
			//	}, 1000)
		// });
	}
	function SaveDialog(callback) {
		var me = this;
		var $d = $("#jp-comp-list-dialog");
		var $id = $d.find(".id-input");
		var $name = $d.find(".name-input");
		if (Request.how == 'new') {
			if (!$id.val()) {
				Alert("报表 ID 不能为空，请重新输入 .", function () {
					$id.focus();
				})
				return;
			}
			if ($id.val().indexOf(',') > -1) {
				Alert("报表 ID 不能包含逗号字符 , 请重新输入 .", function () {
					$id.focus();
				})
				return;
			}
		}
		if (!Global.editing.report) {
			Global.editing.report = {};
		}
		Global.editing.report['id'] = $id;
		Global.editing.report['auditor-id'] = "admin";
		callback();
	}
	// 有可能npjp,jatoolsPrinter没加载完，所以延迟设置字体
	// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ end drop menu
	// 
	Global.request.viewing = Global.request.how == 'view';
	Global.request.editing = !Global.request.viewing;
	$.fn.selectpicker.Constructor.DEFAULTS.noneSelectedText = '';
	new RegExp('MSIE (\\d+\\.\\d+);').test(navigator.userAgent);
	var IE = (0 + new Number(RegExp.$1)) || 11;
	if (document.URL.match(/^http:\/\//i) && !Global.service["upload-image-service"])
		Global.service["upload-image-service"] = Global.service["upload-image-service"];
	var settingsId = '12';
	var level = 0;
	var LOOP_SIZE = 100;
	var _blank = _GLO_PATH + 'buss/reso/wisprint/images/blank.png';
	console.log(_blank)
	
	var ownLine = ['area', 'body', 'head', 'hr', 'i?frame', 'link', 'meta', 'noscript', 'style', 'table', 'tbody', 'thead', 'tfoot'];
	var contOwnLine = ['li', 'dt', 'dt', 'h[1-6]', 'option', 'script'];
	var lineBefore = new RegExp('^<(/?' + ownLine.join('|/?') + '|' + contOwnLine.join('|') + ')[ >]');
	lineAfter = new RegExp('^<(br|/?' + ownLine.join('|/?') + '|/' + contOwnLine.join('|/') + ')[ >]');
	var newLevel = ['blockquote', 'div', 'dl', 'fieldset', 'form', 'frameset', 'map', 'ol', 'p', 'pre', 'select', 'td', 'th', 'tr', 'ul', 'object'];
	newLevel = new RegExp('^</?(' + newLevel.join('|') + ')[ >]');
	var htmlfilter = 'html 文件 (*.htm;*.html)|*.htm;*.html|所有文件 (*.*)|*.*';
	var undo = new Undo();
	var jattr = $.fn.attr;
	var borderPatterns = {
		'left': /^border\-left.*$/,
		'top': /^border\-top.*$/,
		'full': /^border.*$/
	};
	var workingDoc = {
		settings: {},
		_offset: { // 以0.1mm为单位的偏移,
			// 1. 初始化，从 lastSettings.styles的 .jp-page.margin-top/left得来，如:
			// .jp-page{margin-top:12mm;margin-left:12mm;...};
			// 2. 用户选择调整上下、左右偏移时，改变此值
			// 3. 拖放设计保存时
			top: 0,
			left: 0
		},
		applySettings: function (sets) {
			this.settings = {};
			this._offset.top = 0;
			this._offset.left = 0;
			this.styles = null;
			// 只处理打印机，纸张大小，方向,和保存的拖放位置
			if (sets) {
				if (sets.printer) {
					this.settings.printer = sets.printer;
				}
				if (sets.paperWidth) {
					this.settings.settings = {
						paperWidth: sets.paperWidth,
						paperHeight: sets.paperHeight,
						orientation: sets.orientation || 1
					}
				}
				this.styles = sets.styles || '';
			}
			this.parseOffset();
		},
		parseOffset: function () {
			// .jp-page{margin-top:12mm;margin-left:12mm;...};
			this._offset.top = 0;
			this._offset.left = 0;
			if (this.styles) {
				var test = /\.jp\-page\s*\{(.*?)\}/g;
				var test2 = /\bmargin\-(top|left)\s*\:\s*([0-9\.]+)mm/g;
				var g = null, g2 = null;
				while (g = test.exec(this.styles)) {
					var style = g[1];
					while (g2 = test2.exec(style)) {
						var p = g2[1];
						var v = g2[2];
						this._offset[p] = parseFloat(v);
					}
					return;
				}
			}
		},
		getOffsetStyle: function () {
			if (this._offset.left || this._offset.top) {
				return '.jatools-printing .jp-page{margin-left:{0}mm;margin-top:{1}mm}'.format(this._offset.left, this._offset.top);
			} else
				return '';
		},
		getDragCSS: function () {
			var css = handlers.sourceCodeViewer.util.getChangableStyles('.jp-page ');
			css.push(this.getOffsetStyle());
			return css.join('\n');
		},
		getSessionedMyDoc: function (sessionedreport) {
			sessionedreport.pid = Global.request.pid || "";
			var myDoc = {
				settings: $.extend({}, this.settings)
			};
			myDoc.styles = this.getDragCSS();
			myDoc.documents = Global.service['build-page-service'] + "?" + $.param(sessionedreport);
			return myDoc;
		},
		testPrintOut: function (myDoc) {
			testPrintOut(myDoc);
		}
	};
	var currentLayout = null;
	var $page = $('.jp-page').on('report-load', function () {
		$(this).parent().ruler({
			unit: 'mm',
			tickMajor: 10,
			tickMinor: 5,
			tickMicro: 1
		});
		var $ruler = $page.closest('.jp-content');
		var $topRuler = $(document.body).find('.top-ruler .ruler');
		var $leftRuler = $(document.body).find('.left-ruler .ruler');
		//		function scrollRuler() {
		//			var left = -$ruler[0].scrollLeft + parseInt($page.css('left'));
		//			var top = -$ruler[0].scrollTop;
		//			$topRuler.css("left", left);
		//			$leftRuler.css("top", top);
		//		}
		//$ruler.scroll(scrollRuler);
		//$page.on('positioned', scrollRuler);
		//scrollRuler();
	})
	// 纸张使用 cookie上的设置
	var paper = {
		portrait: getQueryVariable('tid') ? Global.editing.tmpInfo.direction : false,
		width: getQueryVariable('tid') ? isLabelTmp ? Global.editing.tmpInfo.lwidth : Global.editing.tmpInfo.labelwidth : '210',
		height: getQueryVariable('tid') ? isLabelTmp ? Global.editing.tmpInfo.llength : Global.editing.tmpInfo.labellength : '297'
	}
	if (paper) {
		/*if (!paper.portrait) {
			$page.removeClass('jp-landscape');
		} else {
			$page.addClass('jp-landscape');
		}*/
		$page.css({
			width: paper.width + 'mm',
			height: paper.height + 'mm'
		});
	}
	function SourceCodeViewer() {
		var me = this;
		this.util = new SourceCodeUtil();
		this.close = function () {
		}, //
			this.setCode = function (debug, cross) {
				var brush = new SyntaxHighlighter.HtmlScript('js');
				brush.init({
					toolbar: false,
					'brush': 'htmlscript'
				});
				cleanHTML(this.util.encode(debug, cross), function (code) {
					$('#jp-plain-code', me.$dialog).val(code);
					code = brush.getHtml(code.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
					// 将表达式格式化
					code = code.replace(/([$][{][^}]*[}])/gm, "<span class='jp-expression'>$1</span>");
					$('#jp-code', me.$dialog).html(code);
					me.$dialog.dialog('open').find('.syntaxhighlighter').scrollLeft(0);
				});
			}//
		this.open = function () {
			if (!this.$dialog) {
				$('#jp-source-code-dialog').find('.jp-button-set').buttonset();
				this.$dialog = $('#jp-source-code-dialog').dialog({
					width: 800,
					autoOpen: false
				});
				$('#jp-copy-code', this.$dialog).click(function () {
					copy($('#jp-plain-code', me.$dialog).val());
				});
				$('#jp-save-code', this.$dialog).click(function () {
					savefile($('#jp-plain-code', me.$dialog).val());
				});
				$('input:checkbox', this.$dialog).change(function () {
					var debug = $('#jp-debug-code', me.$dialog)[0].checked;
					var cross = $('#jp-cross-browser', me.$dialog)[0].checked;
					me.setCode(debug, cross);
				});
			}
			// html-script : [$][{][^}]*[}]
			// var sh = new SyntaxHighlighter();
			var debug = $('#jp-debug-code', this.$dialog)[0].checked;
			var cross = $('#jp-cross-browser', this.$dialog)[0].checked;
			this.setCode(debug, cross);
			return this.$dialog;
		}
	}
	//<p class='jp-selected-layer'></p>
	var _inplaceEditor = new InplaceEditor();
	var _barcodeEditor = new BarcodeEditor();
	var _textEditor = new TextEditor();
	var _htmlEditor = new HtmlEditor();
	var _dataTableEditor = null;
	sourceCodeViewer = new SourceCodeViewer();
	var handlers = {
		'copied-flag': 'jp-component-copied:',
		'copied-flag-test': /^jp\-component\-copied\:/,
		paperEditor: new PaperEditor(),
		sourceCodeViewer: new SourceCodeViewer(),
		//SVGSHAPE
		newRect: "<div class='jp-shape jp-component'><svg class='rect' style='width:100%;height:100%;' xmlns='http://www.w3.org/2000/svg' version='1.1'><rect class='core' x='0' y='0' width='100%' height='100%' fill='transparent' stroke='navy' stroke-width='2' stroke-location='inside'/></svg></div>",
		newSVGIcon: "<div class='jp-shape jp-component'>{0}</div>",
		newCircle: "<div class='jp-shape jp-component' ><svg  class='ellipse' style='width:100%;height:100%;overflow:visible' xmlns='http://www.w3.org/2000/svg' ><ellipse class='core ' cx='50%' cy='50%' rx='50%' ry='50%' fill='transparent' stroke='red' stroke-width='2' stroke-location='inside'/></svg></div>",
		newLine: "<div class='jp-shape jp-component no-padding no-rotate' ><svg class='line' viewBox='0 0 100% 100%' style='position:absolute;box-sizing:content-box;top:-20px;width:100%;height:100%;left:-20px;right2:-20px;bottom2:-20px;padding:20px;' xmlns='http://www.w3.org/2000/svg' ><line class='core line' x1='0' y1='0' x2='100%' y2='100%' stroke='red' stroke-width='1'/></svg></div>",
		///SVGSHAPE
		newLabel: "<div class='jp-label jp-component' style='white-space:normal'><span class='jp-text-content'></span><p class='jp-selected-layer'></p></div>",
		newHTML: "<div class='jp-html jp-component' style='white-space:normal'><div contenteditable style='width:100%;height:100%;' class='jp-text-content'></div><p class='jp-selected-layer'></p></div>",
		newText: "<div class='jp-text jp-component' style='white-space:normal'><span class='jp-text-content'></span><p class='jp-selected-layer'></p></div>",
		//		newBarcode : '<div class="jp-barcode jp-component" ><p class="jp-selected-layer"></p>'//
		//				+ '<OBJECT windowless="true" ' + 'classid=CLSID:E5A01FF5-FC6E-42F3-AF48-DEA5777DED62 ' + '>' + //
		//				/*		
		//					<OBJECT CLASSID='CLSID:E5A01FF5-FC6E-42F3-AF48-DEA5777DED62' style='width: 130px; height: 80px; border: solid 1px green;'>
		//						<param name='_codestyle' value='type:qr;' />
		//						<param name='_code' value='http://print.jatools.com' />
		//						<embed type='application/x-vnd.jatoolsCoder' _code='http://print.jatools.com' _codestyle='type:qr;' style='width: 130px; height: 80px; border: solid 1px green;' />
		//					</OBJECT>
		//					*/
		//				'<param name="_code" value="${_code}"></param>'//
		//				+ '<param name="_codestyle" value="${_codestyle}"></param>'//
		//				+ '<embed _code="${_code}" _codestyle="${_codestyle}" type="application/x-vnd.jatoolsCoder"  windowless="true"></embed></OBJECT></div>',
		//<img class='jatools-coder' src="http://127.0.0.1:31227/api?type=coder&_code=hello&_codestyle=type:qr;&width=200&height=200&"></img>
		newBarcode: function (data) {
			return "<div class='jp-barcode jp-component'><img class='jatools-coder' src='" + buildCodeURL(data) + "'></img><p class='jp-selected-layer'></p></div>"
		},

		newImage: "<div class='jp-image jp-component'><img class='jp-image-view' src='" + _blank + "'></img><p class='jp-selected-layer'></p></div>",
		//[ EXTLOGO
		newLogo: "<div class='jp-logo jp-component'><img src='http://www.morewis.com/static/v1/main/image/logo.png'></img><p class='jp-selected-layer'></p></div>",
		//] EXTLOGO
		registrationMark: "<div class='jp-registration-mark jp-component'><img src='"+_GLO_ROOTPATH+"/buss/reso/wisprint/images/icon/registration-mark.svg'></img><p class='jp-selected-layer'></p></div>",
		newLineHorz: "<div class='jp-line-horz jp-line jp-component' style='padding:0px;max-height:1px;height:0px;border-bottom-width:1px;border-bottom-style: solid;border-bottom-color: black;'><div class='jp-hline-handler'></div></div>",
		newLineVert: "<div class='jp-line-vert jp-line jp-component' style='padding:0px;max-width:1px;width:0px;border-right-width:1px;border-right-style: solid;border-right-color:black;'><div class='jp-vline-handler'></div></div>",
		newTableTemplate: "<div class='fixed jp-table no-rotate jp-component' style='overflow:visible;border:none;padding:0;min-width:1px;min-height:1px;'>"
			+ "<p class='jp-selected-layer'/>" + "<div class='jp-table-move-handle'></div>"
			+ "<div title='明细记录行。此行对应数据集中的一条记录，多于一条记录时向下扩展.' style='z-index:100' class='jp-table-detail-master'></div>"
			+ "<div title='总计行，最后一页显示.'  class='jp-table-summary'></div>" + "<table cellspacing='0'>" + "{0}" + "</table>"//
			+ "<div title='明细记录行可扩展区域，不够扩展时则分页.' class='jp-table-detail-body'></div><div class='rubber'></div>"//
			+ "<input type='text' class='celleditor'></input>"//
			+ "<div class='selection-frame'>"//				
			+ "<div class='selection-bg'></div>" + "</div>" + "<div class='drop-frame'></div>"//
			+ "</div>",
		// newTable : "<div class='fixed jp-table jp-component'.jp-table-footer
		// style='overflow:visible;border:none;padding:0;min-width:1px;min-height:1px;'>"
		// + "<p class='jp-selected-layer'/>"
		// + "<div class='jp-table-move-handle'></div>"
		// + "<div class='jp-table-detail-master'></div>"
		// + "<div class='jp-table-detail-body'></div>"
		// + "<table cellspacing='0'>"
		// + "<colgroup><col width='60'></col><col width='60'></col><col
		// width='60'></col><col width='60'></col></colgroup>"
		// + "<tr><td style='border:solid 1px gray;'>"
		// +"<div>"// 在object处，包一个div,避免jquery 在clone时的bug
		// +'<object
		// classid="CLSID:E5A01FF5-FC6E-42F3-AF48-DEA5777DED62"
		// windowless="true"
		// style="float:left2;width2:100%;height2:100%">'
		// +'<PARAM NAME="_code" VALUE="6938012345670"/>'
		// +'<PARAM NAME="_codestyle"
		// VALUE="type:code39;autofit:true"/>'
		// +'</object>'
		// +'</div>'
		// + "</td><td style='border:solid 1px gray;'>" + "</td><td
		// style='border:solid 1px gray;'></td>" + "<td style='border:solid 1px
		// gray;'></td></tr>"
		// + "<tr height='30'><td style='border:solid 1px gray;'></td><td
		// style='border:solid 1px gray;'>" + "</td><td style='border:solid 1px
		// gray;'></td>"
		// + "<td style='border:solid 1px gray;'></td></tr>" + "</table>"//
		// + "<div class='rubber'></div>"//
		// + "<input type='text' class='celleditor'></input>"//
		// + "<div class='selection-frame'>"//
		// + "<div class='selection-bg'></div>" + "</div>" + "<div
		// class='drop-frame'></div>"//
		// + "</div>",
		'jp-new': function () {
			this.paperEditor.open();
		},
		'jp-v-offset': function () {
			if (!this.paperVerticalOffsetDialog) {
				this.paperVerticalOffsetDialog = new PaperVerticalOffsetDialog();
			}
			this.paperVerticalOffsetDialog.open();
		},
		'jp-h-offset': function () {
			if (!this.paperHorizonOffsetDialog) {
				this.paperHorizonOffsetDialog = new PaperHorizonOffsetDialog();
			}
			this.paperHorizonOffsetDialog.open();
		},
		'jp-open': function () {
			openfile();
		},
		'jp-save': function () {
			this.sourceCodeViewer.open();
		},
		'jp-print': function () {
			// 如果正在设计套打模板，则先保存到服务端
			var template = {
				template: handlers.sourceCodeViewer.util.encodeTemplate()
			};
			template.settingsID = Global.request['rid'] + '.tmp';
			template.how = 'sessioned';
			$.post(Global.service['report-service'], template, function (data) {
				if (data.sessionedreport) {
					workingDoc.sessionedreport = data.sessionedreport;
					workingDoc.testPrintOut();
				}
			});
		},
		'jp-undo': function () {
			undo.undo();
		},
		'jp-redo': function () {
			undo.redo();
		},
		'jp-delete': function (e) {
			// 注册undo
			var sel = $s(true).clearHelpClasses();
			if (NoExcel.$active) {
				NoExcel.$active.data('no-excel').deleteCells();
			} else if (sel.length) {
				undo.add(new $Edit(sel, ['_removeFrom'], null, $page));
				sel.clearHelpElements().remove();
				renderCustomizeDataItem();
			}
		},
		'jp-copy': function (e) {
			if (NoExcel.$active)
				return;
			$s().each(function () {
				if ($(this).is(".jp-table")) {
					if ($(this).data('saved-options')) {
						var options = $(this).data('saved-options')["options"];
						// ("saved-options")["options"]["header-rows"]
						$(this).attr(options).attr("dataset", $(this).data('saved-options')["dataset"]);
					}
				}
				//	2021-04-12 17:43:25 解决复制后，丢掉尺寸的问题
				else if (!$(this).is('.fixed') && ($(this).data('mmwidth') || $(this).data('mmheight'))) {
					$(this).attr('data-mmwidth', $(this).data('mmwidth'));
					$(this).attr('data-mmheight', $(this).data('mmheight'));

				}
			})
			// var clones = $s(true).clone();
			var copyed = $s(true).clone().clearHelpElements().clearHelpClasses();
			// zhouhan 复制时不复制id
			copyed.children('.jatools-coder').attr('data-id', '');
			copyed.children('.jp-text-content').attr('data-id', '');
			copy(this['copied-flag'] + $('<div>').append(copyed)._outerHTML(true/*
			* 保留
			* barcode的
			* param
			*/));
			applyUClass();
		},
		'jp-cut': function (e) {
			var sel = $s(true);
			undo.add(new $Edit(sel, ['_removeFrom'], null, $page));
			this['jp-copy'].call(this);
			sel.clearHelpElements().clearHelpClasses().remove();
		},
		'jp-paste': function (e) {
			var self = this;
			copied(function (_copied) {
				_copied = _copied || '';
				if (_copied.match(self['copied-flag-test'])) {
					$s().unselect();
					var pasted = $(_copied.substring(self['copied-flag'].length)).children().each(function (i, c) {
						var $self = $(self);

						if ($(c).is(".jp-table") && !($(c).data("saved-options"))) {
							// dataset="订单明细" no-border="false"
							// columns="0" footer-rows="1"
							// body-rows="6" header-rows="1"
							var savedoptions = {
								dataset: $(c).attr("dataset"),
								options: {
									"header-rows": parseInt($(c).attr("header-rows")),
									"body-rows": parseInt($(c).attr("body-rows")),
									"page-footer-rows": parseInt($(c).attr("page-footer-rows")),
									"footer-rows": parseInt($(c).attr("footer-rows")),
									"break-on-bottom": $(c).attr("break-on-bottom") || ''
								}
							}
							$(c).data("saved-options", savedoptions);
						}
						// $(self)
						// .removeClass('ui-selected
						// jp-ininted
						// ui-draggable
						// ui-resizable');
					});
					pasted = initComponent(pasted.appendTo($page).animate({
						left: '+=5',
						top: '+=5'
					}, 0).select());
					// 重新设置 jp-comp-n，避免与源组件tgj
					pasted.each(function () {
						$(this).removeClass($(this)._uClass());
					})
					undo.add(new $Edit(pasted, ['_appendTo'], null, $page));
					renderCustomizeDataItem();
					applyUClass();
				}
			});
		},

		'jp-font': function (e) {
			if (window["htmlediting"]) {
				document.execCommand('fontName', false, e.target.value);
			} else
				$s()._css('font-family', e.target.value);
		},
		'jp-font-size-pt': function (e) {
			if (window["htmlediting"]) {
				handlers.applyFontSize(parseInt(e.target.value) + 'pt');
			} else
				$s()._css('font-size', parseInt(e.target.value) + 'pt');
		},
		'jp-shape-command': function (e) {
			if ($(e.currentTarget).is(".thickness-command")) {
				var thickness = parseInt($(e.target).closest("li").text());
				$s().find("SVG .core")._attr('stroke-width', thickness);
			} else if ($(e.currentTarget).is(".dash-command")) {
				var dash = $(e.target).closest("li").find('line').attr("stroke-dasharray") || '';
				$s().find("SVG .core")._attr('stroke-dasharray', dash);
			}
		},
		'jp-bold': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("bold", false, null);
			} else {
				//	$page.selectable("disable");
				//$(target).find(".jp-text-content").focus()
				//$("<div contenteditable style='width:40%;height:40%;z-index:1000;border:solid 2px green;'>hello;</div>").appendTo($page).focus();
				var fontWeight = !$(e.target).closest('a').is('.active') ? '700' : 'normal';
				$s()._css('font-weight', fontWeight);
			}
		},
		'jp-italic': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("italic", false, null);
			} else {
				var fontStyle = !$(e.target).closest('a').is('.active') ? 'italic' : 'normal';
				$s()._css('font-style', fontStyle);
			}
		},
		'jp-color': function (e) {
		},
		'jp-background': function (e) {
		},
		'jp-underline': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("underline", false, null);
			} else {
				var fontDecoration = !$(e.target).closest('a').is('.active') ? 'underline' : 'none';
				$s()._css('text-decoration', fontDecoration);
			}
		},
		'jp-align-left': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("justifyLeft", false, null);
			} else {
				$s()._css('text-align', $(e.target).closest('a').data('value'));
			}
		},
		'jp-align-center': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("justifyCenter", false, null);
			} else {
				$s()._css('text-align', $(e.target).closest('a').data('value'));
			}
		},
		'jp-align-right': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("justifyRight", false, null);
			} else {
				$s()._css('text-align', $(e.target).closest('a').data('value'));
			}
		},
		'jp-align-justify': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("justifyFull", false, null);
			} else {
				$s()._css('text-align', $(e.target).closest('a').data('value'));
			}
		},
		'jp-supscript': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("superscript", false, null);
			}
		},
		'jp-subscript': function (e) {
			if (window["htmlediting"]) {
				document.execCommand("subscript", false, null);
			}
		},
		'jp-new-label': function (e) {
			startCreate($(e.target));
			$created = $(this.newLabel).data("size-type", 'text');
		},
		'jp-new-text': function (e) {
			startCreate($(e.target));
			$created = $(this.newText).data("size-type", 'text');
		},
		'jp-new-html-text': function (e) {
			startCreate($(e.target));
			$created = $(this.newHTML).data("size-type", 'text');
		},
		'jp-new-barcode': function (e) {
			var codetype = $(e.target).attr('code-type');
			var sizetype = /(qr|datamatrix|pdf417)/.test(codetype) ? '2dcode' : 'barcode';
			startCreate($(e.target));


			// https://www.neodynamic.com/Products/Help/BarcodeWinControl2.5/working_barcode_symbologies.htm
			// 一维码
			// code 39   /^[0-9A-Z\-\.\ \$\/\+\%]+$/
			// code 93  /^[0-9A-Z\-\.\ \$\/\+\%]+$/
			// code 2/5   /^[0-9]+$/  
			// code128   /^[\x00-\x7F\xC8-\xD3]+$/
			// code128A  /^[\x00-\x5F\xC8-\xCF]+$/
			// code128B  /^[\x20-\x7F\xC8-\xCF]+$/
			// code128C  /^[0-9]+$/ and 长度为双
			// ean13   /^[0-9]{13}$/
			// upca  /^[0-9]{11}$/
			// upce  /^[0-9]{6}$/
			// royal mail   /^[0-9A-Z]+$/
			// 二维码
			// pdf 417  /^[\x00-\xff]*$/ 所有 ascii 码
			// qr code  /^[\x00-\xff]*$/ 所有 ascii 码
			// datamatrix  /^[\x00-\xff]*$/ 所有 ascii 码
			// code 2/5  只能数字，字数不限  
			// code128C  只能数字，字数必须偶数
			// ean13  只能数字，字数必须为 13
			// upca  只能数字，字数必须为 11
			// upce   只能数字，字数必须为 6

			var samplecode = {
				'2of5': '1234567',
				'upc': '12345678901',
				'upce': '123456',
				'ean13': '1234567890123',

			};

			$created = createBarcode({
				'code': samplecode[codetype] || '1234567890',
				'style': 'type:' + codetype + ';autofit:true'
			}).data("size-type", sizetype);
			// 至此，新生成的barcode,类似：
			// ie下:
			// <object clsid='...'></object>
			// ff下:
			// <embed type='...'></embed>
			// 注意，上述对象中，不包含_code,_codestyle的attribute或者
			// <param>,设计时，俩属性都存放在父对象的data中
			// 所以在复制、导入、导出时，对barcode 需要特别处理
		},
		'jp-new-image': function (e) {
			var _this = this;
			printBefore(function() {
				startCreate($(e.target));
				$created = $(_this.newImage).data("size-type", 'image');
				$created.find('img').addClass('jp-auto-stretch');
			})
		},
		//[ EXTLOGO
		'jp-new-logo': function (e) {
			startCreate($(e.target));
			$created = $(this.newLogo).data("size-type", 'logo');
			$created.find('img').addClass('jp-auto-stretch');
		},

		//] EXTLOGO
		'jp-registration-mark': function (e) {
			startCreate($(e.target));
			$created = $(this.registrationMark).data("size-type", 'registration-mark');
			$created.find('img').addClass('jp-auto-stretch');
		},
		
		'jp-new-line-vert': function (e) {
			startCreate($(e.target));
			$created = $(this.newLineVert).data("size-type", 'vline');
		},
		'jp-new-line-horz': function (e) {
			startCreate($(e.target));
			$created = $(this.newLineHorz).data("size-type", 'hline');
		},
		'jp-new-rect': function (e) {
			startCreate($(e.target));
			$created = $(this.newRect).data("shape-type", 'rect');
		},
		'jp-new-svg-icon': function (e, svg) {
			startCreate($(e.target));
			$created = $(this.newSVGIcon.format(svg)).data("shape-type", 'icon');
			$created.find("svg").attr({
				"width": "100%",
				"height": "100%",
				"class": "icon"
			});
		},
		'jp-new-circle': function (e) {
			startCreate($(e.target));
			$created = $(this.newCircle).data("shape-type", 'circle');
		},
		'jp-new-star': function (e) {
			startCreate($(e.target));
			$created = $(this.newStar).data("shape-type", 'star');
		},
		'jp-new-line': function (e) {
			startCreate($(e.target));
			$created = $(this.newLine).data("shape-type", 'line');
		},
		'jp-new-table': function (e) {
			// debugger;
			startCreate($(e.target));
			var rows = 3, cols = 6;
			var dim = $(e.target).data('dim');
			if (dim) {
				rows = dim.rows;
				cols = dim.columns;
			}
			var bodyhtml = '<colgroup>';
			for (var col = 0; col < cols; col++) {
				bodyhtml += "<col width='60'></col>";
			}
			bodyhtml += '</colgroup>';
			for (var row = 0; row < rows; row++) {
				bodyhtml += "<tr>";
				for (var col = 0; col < cols; col++) {
					bodyhtml += "<td><span></span></td>";
				}
				bodyhtml += "</tr>";
			}
			$created = $(this.newTableTemplate.format(bodyhtml)).addClass("jp-black-border").data("size-type", 'table');
		},
		'jp-font-size': function (down) {
			var oldval = [], newval = [], fn = ['css', 'font-size'];
			var dt = down ? -2 : 2;
			$s().vals(fn, oldval).each(function () {
				var fontsize = (parseInt($(this).css('font-size')) + dt) + 'px';
				$(this).css({
					'font-size': fontsize
				});
			}).vals(fn, newval);
			undo.add(new $Edit($s(), fn, oldval, newval));
		},
		applyFontSize: function (newsize) {
			document.execCommand("fontSize", false, "7");
			var fontElements = window.getSelection().anchorNode.parentNode
			fontElements.removeAttribute("size");
			fontElements.style.fontSize = newsize;
		},
		'jp-size-up': function (e) {
			if (window["htmlediting"]) {
				var current = $(document).selectionFontSize();
				if (current)
					this.applyFontSize(parseInt(Math.min(current + 3, 72) + "") + "px");
			} else {
				this['jp-font-size'].call(this, false);
			}
		},
		'jp-size-down': function (e) {
			if (window["htmlediting"]) {
				var current = $(document).selectionFontSize();
				if (current)
					this.applyFontSize(parseInt(Math.max(current - 3, 5) + "") + "px");
			} else {
				this['jp-font-size'].call(this, true);
			}
		},
		'undo': undo,
		'jp-front': function (e) {
			if ($s().length == 1) {
				var target = $s()[0], zindexs = [], zmap = {};
				$('.jp-component', $page).each(function (e) {
					var zindex = $(this).css('z-index');
					zindexs.push(zindex);
					zmap[zindex] = this;
				}).each(function () {
					if (target == this) {
						zindexs.sort();
						var zindex = $(this).css('z-index');
						var i = $.inArray(zindex, zindexs);
						if (i < zindexs.length - 1) {
							var nextzindex = zindexs[i + 1];
							var nexttarget = zmap[nextzindex];
							undo.open();
							$(target)._css('z-index', nextzindex);
							$(nexttarget)._css('z-index', zindex);
							undo.close();
						}
					}
				});
			}
		},
		'jp-back': function (e) {
			if ($s().length == 1) {
				var target = $s()[0], zindexs = [], zmap = {};
				$('.jp-component', $page).each(function (e) {
					var zindex = $(this).css('z-index');
					zindexs.push(zindex);
					zmap[zindex] = this;
				}).each(function () {
					if (target == this) {
						zindexs.sort();
						var zindex = $(this).css('z-index');
						var i = $.inArray(zindex, zindexs);
						if (i > 0) {
							var nextzindex = zindexs[i - 1];
							var nexttarget = zmap[nextzindex];
							undo.open();
							$(target)._css('z-index', nextzindex);
							$(nexttarget)._css('z-index', zindex);
							undo.close();
						}
					}
				});
			}
		},
		'jp-top': function (e) {
			if ($s().length == 1) {
				var target = $s()[0], zindexs = [], zmap = {};
				$('.jp-component', $page).vals(['css', 'z-index'], zindexs);
				$(target)._css('z-index', Math.max.apply(null, zindexs) + 1);
			}
		},
		'jp-bottom': function (e) {
			if ($s().length == 1) {
				var target = $s()[0], zindexs = [], zmap = {};
				$('.jp-component', $page).vals(['css', 'z-index'], zindexs);
				$(target)._css('z-index', Math.min.apply(null, zindexs) - 1);
			}
		},
		// 对齐等大小
		'jp-align2-left': function (e) {
			if ($s().length > 1) {
				$s()._css('left', $page.data('first-selected').css('left'));
			}
		},
		'jp-align2-center': function (e) {
			if ($s().length > 1) {
				var first = $page.data('first-selected');
				var center = parseInt(first.css('left')) + parseInt(first.css('width')) / 2;
				undo.open();
				$s().each(function () {
					var c = parseInt($(this).css('left')) + parseInt($(this).css('width')) / 2;
					var newleft = parseInt($(this).css('left')) + (center - c);
					$(this)._css('left', newleft);
				});
				undo.close();
			}
		},
		'jp-align2-right': function (e) {
			if ($s().length > 1) {
				var first = $page.data('first-selected');
				var right = parseInt(first.css('left')) + parseInt(first.css('width'));
				undo.open();
				$s().each(function () {
					var r = parseInt($(this).css('left')) + parseInt($(this).css('width'));
					var newleft = parseInt($(this).css('left')) + (right - r);
					$(this)._css('left', newleft);
				});
				undo.close();
			}
		},
		'jp-align2-top': function (e) {
			if ($s().length > 1) {
				$s()._css('top', $page.data('first-selected').css('top'));
			}
		},
		'jp-align2-middle': function (e) {
			if ($s().length > 1) {
				var first = $page.data('first-selected');
				var center = parseInt(first.css('top')) + parseInt(first.css('height')) / 2;
				undo.open();
				$s().each(function () {
					var c = parseInt($(this).css('top')) + parseInt($(this).css('height')) / 2;
					var newleft = parseInt($(this).css('top')) + (center - c);
					$(this)._css('top', newleft);
				});
				undo.close();
			}
		},
		'jp-align2-bottom': function (e) {
			if ($s().length > 1) {
				var first = $page.data('first-selected');
				var right = parseInt(first.css('top')) + parseInt(first.css('height'));
				undo.open();
				$s().each(function () {
					var r = parseInt($(this).css('top')) + parseInt($(this).css('height'));
					var newleft = parseInt($(this).css('top')) + (right - r);
					$(this)._css('top', newleft);
				});
				undo.close();
			}
		},
		'jp-equal-width': function (e) {
			if ($s().length > 1) {
				$s()._css('width', $page.data('first-selected').css('width'));
				$s().each(function () {
					var $coder = $(this);

					if ($coder.is('.jp-barcode'))
						setCodeImage($coder);

				});
			}
		},
		'jp-equal-height': function (e) {
			if ($s().length > 1) {
				$s()._css('height', $page.data('first-selected').css('height'));
				$s().each(function () {

					var $coder = $(this);

					if ($coder.is('.jp-barcode'))
						setCodeImage($coder);

				});
			}
		},
		// 键盘方向键移动
		'moving': false, // 正在移动
		'oldPosition': null,// 开始位置,
		"endMove": function (oldPos) {
			if (this.moving) {
				oldPos = this.oldPosition;
			}
			// 检测是否有组件在页面之外，如果有，则关闭本次移动
			var offsets = [], widths = [], heights = [], fn = ['offset'];
			$s().vals(fn, offsets).vals(['width'], widths).vals(['height'], heights);
			// 2021年7月9日09:55:59 解决放大后边界没变
			var rightlimit = $page.width() * viewscale + $page.offset().left;
			var bottomlimit = $page.height() * viewscale + $page.offset().top;
			var leftlimit = $page.offset().left * viewscale;
			var toplimit = $page.offset().top * viewscale;
			// var toplimit =
			for (var i = 0; i < offsets.length; i++) {
				var pos = offsets[i], r = pos.left + widths[i], b = pos.top + heights[i];
				if (pos.left > rightlimit || pos.top > bottomlimit || r < leftlimit || b < toplimit) {
					// 本次操作无效， 恢复原位置
					new $Edit($s(), fn, oldPos, offsets).undo();
					return;
				}
			}
			undo.add(new $Edit($s(), fn, oldPos, offsets));
			this.moving = false;
		},
		"listenKeyup": function () {
			if (!this.moving) {
				this.oldPosition = [], fn = ['offset'];
				$s().vals(fn, this.oldPosition);
				$(document).one("keyup", $.proxy(this.endMove, this));
				this.moving = true;
			}
		},
		'jp-move-left': function (e) {
			if ($s().length) {
				this.listenKeyup();
				$s().each(function () {
					var left = parseInt($(this).css('left')) - 1;
					$(this)._css('left', left);
				});
			}
		},
		'jp-move-up': function (e) {
			if ($s().length) {
				undo.open();
				$s().each(function () {
					var left = parseInt($(this).css('top')) - 1;
					$(this)._css('top', left);
				});
				undo.close();
			}
		},
		'jp-move-right': function (e) {
			if ($s().length) {
				this.listenKeyup();
				$s().each(function () {
					var left = parseInt($(this).css('left')) + 1;
					$(this)._css('left', left);
				});
			}
		},
		'jp-move-down': function (e) {
			if ($s().length) {
				undo.open();
				$s().each(function () {
					var left = parseInt($(this).css('top')) + 1;
					$(this)._css('top', left);
				});
				undo.close();
			}
		},
		// 边框
		'jp-border-1px': function (e) {
			setBorder($s(), {
				border: 'solid 1px black'
			});
		},
		'jp-border-no': function (e) {
			undo.open();
			$s()._css('border-radius', '');
			setBorder($s(), {
				border: ''
			});
			undo.close();
		},
		'jp-border-custom': function (e) {
			var $d = $("#jp-border-dialog"), $selected = $s();
			$("#jp-border-dialog").show();
			if (!customBorderDialog)
				customBorderDialog = new CustomBorderDialog();
			customBorderDialog.open();
		},
		'scales': ['.25', '.33', '.5', '.67', '.75', '.8', '.9', '1', '1.1', '1.25', '1.5', '1.75', '2', '2.5', '3', '4', '5'],
		scaleView: function (up) {
			this.viewscalestr = this.viewscalestr || '1';
			var i = this.scales.indexOf(this.viewscalestr);
			if (up) {
				i++;
			} else {
				i--;
			}
			if (i >= 0 && i < this.scales.length) {
				viewscale = parseFloat(this.viewscalestr = this.scales[i]);
				$page.css("transform", "scale({0})".format(this.viewscalestr));
			}
		},
		'jp-scale-up': function (e) {
			SCALE && this.scaleView(true);
		},
		'jp-scale-down': function (e) {
			SCALE && this.scaleView(false);
		}
	}
	var customBorderDialog = null;
	var hotkeys = {
		'shift+187': {
			cmd: 'jp-scale-up',
			enabled: 5
			// '101'
		},
		'shift+189': {
			cmd: 'jp-scale-down',
			enabled: 5
			// '101'
		},
		'ctrl+c': {
			cmd: 'jp-copy',
			enabled: 5
			// '101'
		},
		'ctrl+x': {
			cmd: 'jp-cut',
			enabled: 5
			// '101'
		},
		'ctrl+v': {
			cmd: 'jp-paste',
			enabled: 5
			// '101'
		},
		'ctrl+z': {
			cmd: 'jp-undo',
			enabled: 7
			// '111'
		},
		'ctrl+y': {
			cmd: 'jp-redo',
			enabled: 7
			// '111'
		},
		'ctrl+]': {
			cmd: 'jp-size-up',
			enabled: 7
			// '111'
		},
		'ctrl+[': {
			cmd: 'jp-size-down',
			enabled: 7
			// '111'
		},
		'ctrl+PgUp': {
			cmd: 'jp-front',
			enabled: 7
			// '111'
		},
		'ctrl+PgDn': {
			cmd: 'jp-back',
			enabled: 7
			// '111'
		},
		'ctrl+End': {
			cmd: 'jp-bottom',
			enabled: 7
			// '111'
		},
		'ctrl+Home': {
			cmd: 'jp-top',
			enabled: 7
			// '111'
		},
		'46': {
			cmd: 'jp-delete',
			enabled: 5
			// '101'
		},
		'37': {
			cmd: 'jp-move-left',
			enabled: 5
			// '101'
		},
		'38': {
			cmd: 'jp-move-up',
			enabled: 5
			// '101'
		},
		'39': {
			cmd: 'jp-move-right',
			enabled: 5
			// '101'
		},
		'40': {
			cmd: 'jp-move-down',
			enabled: 5
			// '101'
		},
		forView: function (viewtype) {
			for (e in this) {
				if (this[e].enabled) {
					this[e].enabled &= viewtype;
				}
			}
		}
	};
	var ctrlkeys = {//
		'33': 'PgUp',// page up
		'34': 'PgDn',// page down
		'35': 'End',// end
		'36': 'Home',// home
		'219': '[',
		'221': ']'
		// }
	}
	var showingColorChooser = null;
	$('#jp-color').each(function () {
		var options = {
			style: 'color'
		}
		if ($(this).closest(".right-bar")) {
			options.theme = "right-anchor";
		}
		makeColorChooser($(this), options, colorChanged);
	});
	makeColorChooser($('#jp-stroke-color'), {
		theme: "right-anchor"
	}, strokeColorChanged);
	makeColorChooser($('#jp-line-color'), {
		theme: "right-anchor",
		style: 'background-color',
		flat: true,
		move: lineColorChanged
	}, lineColorChanged);
	makeColorChooser($('#jp-background'), {
		theme: "right-anchor",
		style: 'background-color'
	}, colorChanged);
	var getPositions = function (target) {
		var p2left = target.offsetLeft, p2top = target.offsetTop, w = $(target).outerWidth(), h = $(target).outerHeight();
		// 计算每个物件的9个点,可以用6个值得到
		// [左,中,右,上,中,下,宽,高]
		return [p2left, //
			p2left + Math.round(w / 2), //
			p2left + w, //
			p2top,//
			p2top + Math.round(h / 2),//
			p2top + h, w, h, $(target), $(target).rad()];
	}
	var getConnectorPositions = function (target) {
		var siblingConnectors = [];
		// 计算各连接点
		// $('.jp-connector').remove();
		$(".ui-draggable", $page).each(function () {
			var p2 = $(this).offset();
			// 计算每个物件的9个点,可以用6个值得到
			// [x1,x2,x3,y1,y2,y3]
			var connectors = $(this).data('connectors');
			if (true || !connectors) {
				// [左,中,右,上,中,下,宽,高]
				connectors = getPositions(this);
				// //console.log(connectors);
				$(this).data('connectors', connectors);
			}
			var connector = $(this).data('connector');
			if (!connector) {
				connector = $('<p class="jp-connector jp-ruler-element"></p>').appendTo($(target).parent());
				$(this).data('connector', connector);
				// 被拖动组件,有可能有两个对齐点
				$(this).data('connector2', $('<p class="jp-connector jp-ruler-element"></p>').appendTo($(target).parent()));
			}
			connector.offset({
				left: connectors[1] - 3,
				top: connectors[4] - 3
			});
			if (this != target) {
				if ($(this).is('.jp-table')) {
					// 如果是表格组件，忽略中心点
					connectors = connectors.slice(0);
					connectors[1] = -1000;
					connectors[4] = -1000;
				}
				siblingConnectors.push(connectors);
			} else {
				$(target).data('sibling-connectors', siblingConnectors);
			}
		});
	}
	var renderRulers = function (target, rulers) {
		var connectors = null;
		$.each(rulers, function (i) {
			if (!connectors)
				connectors = getPositions(target);
			var x1 = connectors[this.from[1]];
			var y1 = connectors[this.from[2]];
			$(target).data(i ? 'connector2' : 'connector').css('display', 'block').css({
				left: x1 - 3,
				top: y1 - 3
			});
			var _connectors = this.to[0].data('connectors');
			var x2 = _connectors[this.to[1]];
			var y2 = _connectors[this.to[2]];
			this.to[0].data('connector').css('display', 'block').css({
				left: x2 - 3,
				top: y2 - 3
			});
			if (this.name == 'h') {
				$('.jp-h-ruler').css({
					'width': Math.abs(x1 - x2),
					'display': 'block'
				}).css({
					left: Math.min(x1, x2),
					top: y2
				});
			} else {
				$('.jp-v-ruler').css({
					'height': Math.abs(y1 - y2),
					'display': 'block'
				}).css({
					left: x2,
					top: Math.min(y1, y2)
				});
			}
		})
	}
	var getShortestLine = function (//
		c1,// 被拖动组件的起始位置
		c2,// 静止，被检测组件的座标
		e1,// 拖动组件的边
		e2,// 静止组件的边
		start/* c1,c2中点的起始为止 x为0,y为3 */) {
		var maxlen = Number.MAX_VALUE, result = [];//
		var start1 = (e1 == 1) ? start + 1 : start;
		var start2 = (e2 == 1) ? start + 1 : start;
		var end1 = (e1 == 1) ? start1 + 1 : start + 3;
		var end2 = (e2 == 1) ? start2 + 1 : start + 3;
		for (var i = start1; i < end1; i++) {
			var p1 = c1[i];
			for (var k = start2; k < end2; k++) {
				var p2 = c2[k];
				if (Math.abs(p2 - p1) < maxlen) {
					result[0] = i;
					result[1] = k;
					maxlen = Math.abs(p2 - p1);
				}
			}
		}
		return result;
	}
	var rulerSet = function (//
		connectors,// 拖动组件的座标
		siblingConnectors,// 静止组件的座标
		ex,// 拖动组件横向对比边,如 [2,1]只对右边，中间对齐
		ey,// 拖动组件纵向对比边,如 [5,4]只对下边，中间对齐
		doSet) {
		$('.jp-ruler-element').css('display', 'none');
		var vertical = false;
		var horizental = false;
		var rulers = [];
		$.each(siblingConnectors, function () {
			var that = this;
			// 中，下，上进行对比
			$.each(ey, function (i, _activeIndex) {
				// 拖动组件的中/上/下的y
				var y1 = connectors[_activeIndex], thisIndex = _activeIndex;
				$.each([4, 5, 3], function (i, _followedIndex) {
					// 未拖动组件的座标
					var y2 = that[_followedIndex];
					if (y2 <= y1 && y1 <= y2 + 1) {
						doSet(connectors, y2, 3, thisIndex);
						var shortest = getShortestLine(connectors, that, thisIndex - 3, _followedIndex - 3, 0);
						var ex1 = shortest[0], ex2 = shortest[1];
						rulers.push({
							name: 'h',
							from: [connectors[8], ex1, thisIndex],
							to: [that[8], ex2, _followedIndex]
						});
						horizental = true;
						return !horizental;
					}
					if (that[9]) {
						return false;
					}
				});
				return !horizental;
			})
			$.each(ex, function (i, _activeIndex) {
				// 拖动组件的中/上/下的y
				var x1 = connectors[_activeIndex], thisIndex = _activeIndex;
				$.each([1, 2, 0], function (i, _followedIndex) {
					// 未拖动组件的座标
					var x2 = that[_followedIndex];
					if (x2 <= x1 && x1 <= x2 + 1) {
						doSet(connectors, x2, 0, thisIndex);
						var shortest = getShortestLine(connectors, that, thisIndex, _followedIndex, 3);
						var ey1 = shortest[0], ey2 = shortest[1];
						rulers.push({
							name: 'v',
							from: [connectors[8], thisIndex, ey1],
							to: [that[8], _followedIndex, ey2]
						});
						vertical = true;
						return !vertical;
					}
					if (that[9]) {
						return false;
					}
				});
				return !vertical;
			})
			return !(horizental && vertical);
		});
		return rulers;
	}
	var xxx = 1;
	var mydraggableEnabled = true;
	var $lastZIndex = 1000;
	var $created = null;
	$('.jp-common-command a,.jp-common-command input,.jp-shape-command').click(function (e) {
		var handler = handlers[$(this).attr('id')];
		handler && handler.call(handlers, e);
	});
	var sizetools = $('.jp-bottom-bar');
	var chizi = $('.chizi');
	var sizeinputs = $('input', sizetools);
	var mm$px = 100 / chizi.width();
	var px$mm = chizi.width() / 100;
	// 在弹出式菜单弹出的时候，设置
	var activenoexcel = null;
	var tablemenuhandlers = {
		setNoexcel: function () {
			// 当前的弹出式菜单对象在 showingDropdown
			// 其trigger,就是 <table>的父对象，即jp-component其no-excel数据在创建时被设置
			this.noexcel = showingDropdown.data('dropdown-trigger').data('no-excel');
			this.cell = this.noexcel.getSelection();
		},
		isNoWrap: function () {
			this.setNoexcel();
			return this.noexcel.isCSS(this.cell, "white-space", 'nowrap');
		},
		'jp-table-autowrap': function (e) {
			this.setNoexcel();
			var whitespace = 'normal';
			if ($(e.target).is(".jp-checked")) {
				// 是自动换行了
				whitespace = 'nowrap';

			} else {
				//2021-03-15 13:22:39, 解决西文不自动折行的问题
				this.noexcel.css(this.cell, "word-wrap", 'break-word');
				this.noexcel.css(this.cell, "word-break", 'break-all');
			}
			this.noexcel.css(this.cell, "white-space", whitespace);
			this.noexcel.resetHeights();
			this.noexcel.resetSections();
		},
		'jp-table-htmltext': function (e) {
			this.setNoexcel();
			this.noexcel.changeComponentType(this.cell, 'jp-html');
		},
		'jp-table-merge': function () {
			this.setNoexcel();
			this.noexcel.mergeCell(this.cell);
		},
		'jp-table-unmerge': function () {
			this.setNoexcel();
			this.noexcel.unmergeCell(this.cell);
		},
		'jp-table-insert-1-row-before': function (e) {
			this['jp-table-insert-3-row-before'].call(this, e, 1);
		},
		'jp-table-insert-3-row-before': function (e, n) {
			this.setNoexcel();
			var where = this.cell ? this.cell.row : 0;
			this.noexcel.insertRowsBefore(where, n || 3, this.cell);
			this.noexcel.resetHeights();
		},
		'jp-table-insert-1-row-after': function (e) {
			this['jp-table-insert-3-row-after'].call(this, e, 1);
		},
		'jp-table-insert-3-row-after': function (e, n) {
			this.setNoexcel();
			var where = this.cell.row;
			n = (n || 3);
			this.noexcel.insertRowsAfter(where, n, this.cell);
			this.noexcel.resetHeights();
		},
		'jp-table-delete-rows': function () {
			this.setNoexcel();
			if (this.cell.rowSpan == this.noexcel.rows())
				return;
			this.noexcel.deleteRows(this.cell);
			this.noexcel.resetHeights();
		},
		'jp-table-insert-1-col-before': function (e) {
			this['jp-table-insert-3-col-before'].call(this, e, 1);
		},
		'jp-table-insert-3-col-before': function (e, n) {
			this.setNoexcel();
			var where = this.cell ? this.cell.col : 0;
			this.noexcel.insertColumnsBefore(where, n || 3);
		},
		'jp-table-insert-1-col-after': function (e) {
			this['jp-table-insert-3-col-after'].call(this, e, 1);
		},
		'jp-table-insert-3-col-after': function (e, n) {
			this.setNoexcel();
			var where = this.cell ? this.cell.col : 0;
			this.noexcel.insertColumnsAfter(where, n || 3);
		},
		'jp-table-delete-cols': function () {
			this.setNoexcel();
			//2021-03-22 16:58:04 不允许删除所有列
			if (this.cell.colSpan == this.noexcel.g().columns.length)
				return;

			this.noexcel.deleteColumns(this.cell.col, this.cell.col2);
		},
		'jp-table-border': function () {
			var $target = showingDropdown.data('dropdown-trigger');
			if (!$target.is('.jp-static')) {
				var settings = $target.data("saved-options")["options"];
				settings["no-border"] = !settings["no-border"];
			}
			var borderClass = $target.is('.jp-black-border') ? "jp-no-border" : "jp-black-border";
			$target.removeClass("jp-no-border jp-black-border").addClass(borderClass);
		},
		'jp-header-repeat': function () {
			var $target = showingDropdown.data('dropdown-trigger');
			if (!$target.is('.jp-static')) {
				var settings = $target.data("saved-options")["options"];
				settings["header-repeat"] = !settings["header-repeat"];
			}
		},
		'jp-table-body1': function () {
			this.setNoexcel();
			var $target = showingDropdown.data('dropdown-trigger');
			var settings = $target.data("saved-options")["options"];
			settings["header-rows"] = this.cell.row;
			settings["body-rows"] = this.cell.rowSpan;
			settings["footer-rows"] = this.noexcel.rows() - this.cell.row2 - 1;
			this.noexcel.resetHeights();
		},
		'jp-table-page-summary': function () {
			this.setNoexcel();
			var $target = showingDropdown.data('dropdown-trigger');
			var settings = $target.data("saved-options")["options"];
			var footerstart = (settings["header-rows"] || 0) + (settings["body-rows"] || 0);
			var rows = this.noexcel.rows();
			var sectionrows = this.getSections(settings);
			for (var i = footerstart; i < rows; i++) {
				if (i <= this.cell.row2) {
					sectionrows[i] = "page-footer-rows";
				} else {
					sectionrows[i] = "footer-rows";
				}
			}
			this.setSections(settings, sectionrows);
			this.noexcel.resetHeights();
		},
		'jp-table-summary': function () {
			this.setNoexcel();
			var $target = showingDropdown.data('dropdown-trigger');
			var settings = $target.data("saved-options")["options"];
			var footerstart = (settings["header-rows"] || 0) + (settings["body-rows"] || 0);
			var rows = this.noexcel.rows();
			var sectionrows = this.getSections(settings);
			for (var i = footerstart; i < rows; i++) {
				if (i >= this.cell.row) {
					sectionrows[i] = "footer-rows";
				} else {
					sectionrows[i] = "page-footer-rows";
				}
			}
			this.setSections(settings, sectionrows);
			this.noexcel.resetHeights();
		},
		'setSections': function (settings, rownames) {
			this.setNoexcel();
			var sections = ["header-rows", "body-rows", "page-footer-rows", "footer-rows"];
			for (var i = 0; i < sections.length; i++) {
				settings[sections[i]] = 0;
			}
			for (var f = 0; f < rownames.length; f++) {
				var section = rownames[f];
				settings[section]++;
			}
			this.noexcel.resetSections();
			//setTrStyle(null, trs.eq(settings["header-rows"]).css("height"));
			return rownames;
		},
		'getSections': function (settings) {
			if (this.sections) {
				return this.sections;
			} else {
				this.sections = [];
				var fields = ["header-rows", "body-rows", "page-footer-rows", "footer-rows"];
				for (var f = 0; f < fields.length; f++) {
					var sectionrows = settings[fields[f]] || 0;
					for (var i = 0; i < sectionrows; i++) {
						this.sections.push(fields[f]);
					}
				}
			}
			return this.sections;
		},
		'jp-table-body': function () {
			this.setNoexcel();
			var $target = showingDropdown.data('dropdown-trigger');
			var settings = $target.data("saved-options")["options"];
			var sectionrows = this.getSections(settings);
			sectionrows.fill("header-rows", 0, this.cell.row);
			var end = settings["break"] == "auto" ? this.cell.row + 2 : this.cell.row + this.cell.rowSpan;
			sectionrows.fill("body-rows", this.cell.row, end);
			var rows = this.noexcel.rows();
			var replaced = "footer-rows";
			for (var r = rows - 1; r >= end; r--) {
				if (sectionrows[r] != "body-rows") {
					replaced = sectionrows[r];
				} else {
					sectionrows[r] = replaced;
				}
			}
			this.setSections(settings, sectionrows);
			this.noexcel.g().resetHeights().resetSelection();
		}
	}
	var templateSaveDialog = null, printviewinited = false;
	function makeSlideInput(targets) {
		targets.find("input").on("input", function () {
			$(this).siblings().val(this.value);
			if ($(this).attr("type") === "range") {
				$(this).siblings().trigger("change");
			} else {
				$(this).trigger("change");
			}
		});
	}
	function makeToggleButton(targets) {
		targets.on("click.toggle-image", "button", function (e) {
			if (!$(this).is(".active")) {
				$(this).addClass("active").siblings().removeClass("active");
				$(this).parent().find("input").val($(this).data("value")).trigger("change");
			}
			return false;
		}).find("input").on("inited", function () {
			var value = this.value;
			$(this).siblings("button").removeClass("active").each(function () {
				if ($(this).data("value") == value) {
					$(this).addClass("active");
				}
			});
		});
	}

	$('.jp-commands >a').click(function () {
		if ($(this).is('.jp-upload-template')) {
			__interface.save();
			return true;
		} else if ($(this).is('#jp-layout')) {
			// $(document.body).addClass('jp-layouting');
			// new LayoutControlDialog().open();
			// setTimeout(function(){
			// new LayoutControlDialog().open();
			// },1000);
			handlers['jp-new'].call(handlers);
		} else if ($(this).is('.jp-test-print')) {
			// 预览
			labelPrintPreview();
			return true;
		} else if ($(this).is('.jp-export')) {
			__interface.export();
			return true;
		} else if ($(this).is('#jp-exit-layout')) {
			$(document.body).removeClass("print-view");
			return true;
		} else if ($(this).is('.jp-layout-print')) {
			__interface.getSessionedMyDoc(null, function (myDoc) {
				// $.getJSON(myDoc.documents + "&scope=.page-layout", function (pages) {
				var pages = labels;
				Global["sessioned-pages"] = pages;
				var sheet = document.getElementById("layout-sheet");
				if (!sheet) {
					sheet = document.createElement('style');
					sheet.id = "layout-style";
					document.body.appendChild(sheet);
				}
				sheet.innerHTML = pages.style;
				$(document.body).addClass("print-view");
				if (!printviewinited) {
					initPrintLayout();
				}
			});
			// });
		} else if ($(this).is('#jp-close')) {
			window.close();
		} else if ($(this).is('#jp-edit-fields')) {
			$pp = $(this).parent().parent();
			if ($pp.is(".fields-editing")) {
				var fields = $("#jp-comp-list-editor").val().split("\n");
				for (var i = 0; i < fields.length; i++) {
					fields[i] = {
						type: 'text',
						field: fields[i]
					};
				}
				Global.$fieldSelect = {};
				Global.editing.datasource.ui.fields = fields;
				setDatasourceUI();
			}
			$pp.toggleClass("fields-editing");
		}
	});
	var defaultsizes = null;
	var justCreated = false; // 指出新组件刚被创建，阻止底图点击事件取消对新组件的选中状态
	// 使双击能够生效.当组件可选时，mousedown后，鼠标下面，总会生成一个helper,致使该组件，不会产生mouseup事件，因此，也不触发dblclick事件
	var _mouseStart = null;
	var _editorFactory = {
		edit: function ($target) {
			for (e in this.editors) {
				if ($target.is(e)) {
					this.editors[e].open($target);
				}
			}
		},
		editors: {
			'.jp-html': _htmlEditor,
			'.jp-text': _textEditor,
			'.jp-label': _inplaceEditor,
			'.jp-barcode': _barcodeEditor,
			'.jp-table': new DataTableEditor(),
			'.jp-image': new ImageEditor()
		}
	};
	var dtablescells = null;
	var $dtable = $('.jp-new-table-chooser table');
	var $dcaption = $('#jp-table-dim-caption');
	var lastcellpos = null;
	var tableCreated = function ($target) {
		// 挂table对象
		// 挂接弹出式菜单
		var noexcel = $('table', $target).attr('id', getTID()).noExcel({
			resizelistener: setSizePanel,
			undo: undo
		});
		// 在表格的父对象上，保留noexcel对象，以便调用其中的相应方法
		$target.data('no-excel', noexcel);
		// 阻止所有mousedown事件，以阻止拖动mydraggable，选择动作selectable,但应允许表格拖动手柄
		$target.mousedown(function (e) {
			if (!$(e.srcElement || e.target).is('.jp-table-move-handle')) {
				// e.stopPropagation();
				mydraggableEnabled = false;
			}
		});
		$(document).mouseup(function () {
			mydraggableEnabled = true;
		});
	}
	var _createdListeners = {
		fire: function ($target) {
			for (e in this.listeners) {
				if ($target.is(e)) {
					this.listeners[e].call($target, $target);
				}
			}
		},
		listeners: {
			'.jp-table': tableCreated
		}
	};
	var compentlistpanel = null;
	var savedialog = null;
	$(window).resize(function () {
		// var height=$(this).innerHeight()-$('.jp-toolbar').height()-4;
		// $('.jp-content').outerHeight(height);
	})
	$(window).resize(); // on page load
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// 初始化
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if (Global.request.editing) {
		function decryptCodes(codesArr, passcode) {
			var result = [];
			var str = '';
			var passLen = passcode.length;
			for (var i = 0; i < codesArr.length; i++) {
				var passOffset = i % passLen;
				var calAscii = (codesArr[i] - passcode.charCodeAt(passOffset));
				result.push(calAscii);
			}
			for (var i = 0; i < result.length; i++) {
				var ch = String.fromCharCode(result[i]);
				str += ch;
			}
			return str;
		}
		if ($.isArray(Global.editing.report)) {
			Global.editing.report = JSON.parse(decryptCodes(Global.editing.report, "TB1372501"));
		}
		$page.on('mousedown', function (e) {
			if (NoExcel.$active && !$(e.target).closest('.jp-table').length) {
				NoExcel.$active.data('no-excel').trigger('blur');
			}
		})
		$(document).keydown(function (e) {
			// 如果正在输入控件<input>按键，则设计面板快捷键不可用
			if (!gEditing) {
				var key = null;
				if (e.ctrlKey) {
					key = 'ctrl+' + (ctrlkeys[e.keyCode + ''] || String.fromCharCode(e.keyCode).toLowerCase());
				} else if (e.shiftKey) {
					key = 'shift+' + e.keyCode || String.fromCharCode(e.keyCode).toLowerCase();
				} else if (e.keyCode == 46/* del */
					|| e.keyCode <= 40 && e.keyCode >= 37) {
					key = e.keyCode + '';
				}
				if (key && hotkeys[key] && hotkeys[key].enabled) {
					key = hotkeys[key].cmd;
					handlers[key] && handlers[key].call(handlers);
					e.preventDefault();
					return false;
				}
			}
		});
		$.widget("ui.mydraggable", $.ui.draggable, {
			_create: function () {
				this.element.data($.ui.draggable.prototype.widgetName, this.element.data($.ui.mydraggable.prototype.widgetName));
				$.ui.draggable.prototype._create.call(this);
			},
			_generatePosition: function (e) {
				e.target = $(e.target).closest('.jp-component')[0];
				var $parent = $(e.target).closest(".jp-content");
				var result = {
					top: this.lastY + (e.pageY - this.lastPageY) / magnification, // 解决放大后移动太快
					left: this.lastX + (e.pageX - this.lastPageX) / magnification
				}, //$.ui.draggable.prototype._generatePosition.call(this, e), 
					$this = $(e.target);
				//result = $.ui.draggable.prototype._generatePosition.call(this, e);
				// console.log("result", JSON.stringify(result))
				var me = this;
				if ($(e.target).data('dragging')) {
					var doSet = function (c1,// 拖动组件
						expected,// 理想的位置
						baseIndex,// 位置起始处,0/3=横对齐/纵对齐
						thisIndex// 正在对拖动组件哪一边对齐,左中右上中下=012345
					) {
						var p = baseIndex ? 'top' : 'left';
						var scroll = baseIndex ? $parent.scrollTop() : $parent.scrollLeft();
						//result[p] = expected + c1[baseIndex] - c1[thisIndex] - me.offset.parent[p] + scroll;
						//	console.log(p, result[p]);
					}
					var connectors = $this.data('connectors').slice(0), siblingConnectors = $this.data('sibling-connectors')
					//console.log("dx,dy:", dx, dy);
					if (connectors[9]) {
						// 如果拖动旋转对象，则重新计算中点
						var p2left = e.target.offsetLeft, p2top = e.target.offsetTop, w = $(e.target).outerWidth(), h = $(e.target).outerHeight();
						connectors[1] = p2left + Math.round(w / 2);
						connectors[4] = p2top + Math.round(h / 2);
					} else {
						var dx = (e.pageX /*+ $parent.scrollLeft() */ - this.lastPageX) / viewscale, // *this.offset.parent.left+*/result.left
							dy = (e.pageY /*+ $parent.scrollTop()*/ - this.lastPageY) / viewscale;// *this.offset.parent.top+*/result.top-connectors[3];
						for (var i = 0; i < 6; i++) {
							connectors[i] += ((i < 3) ? dx : dy);
						}
					}
					//var rulers = rulerSet(connectors, siblingConnectors, [1, 2, 0], [4, 5, 3], doSet);
					var rulers = rulerSet(connectors, siblingConnectors, connectors[9] ? [1] : [1, 2, 0], connectors[9] ? [4] : [4, 5, 3], doSet);
					$(e.target).data('rulers', rulers);
				}
				return result;
			},
			_mouseMove: function (event) {
				if (mydraggableEnabled) {
					var result = $.ui.draggable.prototype._mouseMove.call(this, event);
					ROTATE && $s().first().enableRotate('sync');

					if ($s().length == 1) {
						setSizePanel();
					}
				} else
					return event.preventDefault();
			},
			_mouseStart: function (event) {
				// if (window["mydraggable-disabled"])
				// 	return false;

				$s().data({ "mmleft": '', "mmtop": '' });

				event.target = $(event.target).closest('.jp-component')[0];
				var $parent = $(event.target).parent();
				this.lastPageX = event.pageX /*+ $parent.scrollLeft();*/
				this.lastPageY = event.pageY /*+ $parent.scrollTop();*/
				this.lastX = event.target.offsetLeft;
				this.lastY = event.target.offsetTop;
				// //console.log(e.target);
				var p = $(event.target).position(), container = [p.left, p.top];
				$(".ui-selected", $page).not(event.target).each(function () {
					if (!$(this).is('td')) {
						var p2 = $(this).position();
						(p2.left < container[0]) && (container[0] = p2.left);
						(p2.top < container[1]) && (container[1] = p2.top);
					}
				});
				var parentOffset = $(event.target).closest('.jp-page').offset();
				// document.title=parentOffset.left+','+parentOffset.top;
				container[0] = parentOffset.left + p.left - container[0];
				container[1] = parentOffset.top + /* $parent.scrollTop()+*/p.top - container[1];
				container[2] = container[3] = 1000000;
				this.options.containment = container;
				// var offset=$(this).offset();
				getConnectorPositions(event.target);
				$.ui.draggable.prototype._mouseStart.call(this, event);
				ROTATE && $s().first().enableRotate('sync');


			}
		});
		// 加载表格弹出式菜单事件处理
		$('.jp-table-command a').click(function (e) {
			var id = this.id;
			// 用一个call吧，以便tablemenuhandlers，作为this
			tablemenuhandlers[id] && tablemenuhandlers[id].call(tablemenuhandlers, e);
		});
		// 加载线条菜单事件处理
		$('.jp-line-command a').click(function (e) {
			var fortarget = $(this).closest('.dropdown')//
				.data('for-target');
			var id = this.id, matches = id.match(/jp\-border\-style\-([\d]px)/);
			var type = null;
			if (fortarget.is('.jp-line-vert')) {
				type = 'border-right';
			} else {
				type = 'border-bottom';
			}
			//
			if (matches) {
				undo.open();
				fortarget._css(type + "-width", matches[1]);
				undo.close();
			} else {
				matches = id.match(/jp\-border\-style\-(.*)/);
				if (matches) {
					undo.open();
					fortarget._css(type + "-style", matches[1]);
					undo.close();
				}
				// 设置颜色
			}
		});
		$('.jp-text-command a').click(function (e) {
			var fortarget = $(this).closest('.dropdown')//
				.data('for-target'), //
				content = $('.jp-text-content', fortarget), //
				checked = $(this).hasClass('jp-checked');//
			var id = this.id;
			undo.open();
			if (id == 'jp-word-wrap') {
				// 如果已经是折行了
				// 则清除
				if (checked) {
					fortarget._css('white-space', 'nowrap');
				} else {
					// 如果不是自动折行，则自动折行，并关闭font fit
					fortarget._css('white-space', 'normal');
					//2021-03-17 14:10:39
					fortarget._css('word-wrap', 'break-word');
					fortarget._css('word-break', 'break-all');
					fortarget._removeClass('jp-font-fit');
				}
			} else // 点中了字体自适应
			{
				// 如果已选中，则取消选中
				if (checked) {
					fortarget._removeClass('jp-font-fit');
				} else // 如果未选中，则选中，前关闭自动折行
				{
					fortarget._addClass('jp-font-fit');
					fortarget._css('white-space', 'nowrap');
				}
			}
			undo.close();
		});
		// 可以手动设置高与宽
		sizeinputs.keydown(function (e) {
			if (e.keyCode == NoExcel.KEYS.RETURN) {
				changeSize.call(this, e);
			}
		}).blur(changeSize);
		// sizetools.addClass('jp-visible');
		$('#jp-barcode-chooser a').click(function (e) {
			printBefore(function() {
				handlers['jp-new-barcode'].call(handlers, e);
			})
		});
		$(".right-bar").find('#jp-font-chooser').selectpicker({
			style: 'btn-default btn-sm',
			clickAsChange: true,
			width: '138px',
			dropupAuto: false
		})
		$(".right-bar").find('#jp-font-size-chooser').selectpicker({
			style: 'btn-default btn-sm',
			clickAsChange: true,
			width: '65px',
			dropupAuto: false
		})
		$('#jp-font-chooser').change(handlers['jp-font']);
		$('#jp-font-size-chooser').change(handlers['jp-font-size-pt']);
		__interface = {
			"export": function () {
				commDownload(portAddress + "13a72786a3a34966b5104e41a3b04df3&mcDataAuthId="+getQueryVariable('mcDataAuthId')+"&mcUserId="+getQueryVariable('mcUserId')+"&id="+tmpId)
				
				/*var template = handlers.sourceCodeViewer.util.encodeTemplate();
				var params = {
					how: "sessioned",
					template: template
				}
				$.post(Global.service['report-service'], params, function (data) {
					if (data.sessionedreport) {
						var $downloadframe = $("iframe.download");
						if (!$downloadframe.length) {
							$downloadframe = $("<iframe>").addClass("hidden download").appendTo(document.body);
						}
						// $downloadframe.attr("src", Global.service['report-service'] + "?how=export&sessionedreport=" + data.sessionedreport);
						$downloadframe.attr("src", "http://localhost:8080/wisprint/template/export?mcDataAuthId="+getQueryVariable('mcDataAuthId')+"&mcUserId="+getQueryVariable('mcUserId')+"&id="+getQueryVariable('tid'));
						
						setTimeout(function() {
							$downloadframe.remove();
						}, 200)
					}
				}, 'json');*/
			},
			save: function (params, callback) {
				if (!Global.request["tid"]) {
					this.save2(params, callback);
					return;
				}
				var template = handlers.sourceCodeViewer.util.encodeTemplate();
				// var tmp = {one: 1, two: "2"};
				// alert(JSON.stringify(template)); // '{"one":1,"two":"2"}'
				// alert(template.pageBody);
				// debugger;
				var savetemplate = function (id, New) {
					template.settingsID = id;
					template.duplex = Global.duplex || false;
					//	console.log(template);
					// template.how = 'upload';
					params = params || {};
					params.settingsID = id;
					params["new"] = New;
					params.how = "upload";
					params.userid = Global.request.userid || "";
					params.datasource = Global.editing['datasource-id'];
					params.name = Global.editing.report['name'];
					params.settingsID = params.name || id; // 安佑升级
					// saas 
					// params.settingsID =  id; 
					params['auditor-id'] = Global.editing.report['auditor-id'];
					params.template = template;
					Global.request['report-id'] = id;
					params.settingsID = id;
					$.post(Global.service['report-service'], params, function (data) {
						hideWait();
						if (!data.error_code) {
							var portrait = !$page.is('.jp-landscape'), w = $.style($page[0], 'width'), h = $.style($page[0], 'height');
							$.cookie('paper', {
								portrait: portrait,
								width: w,
								height: h
							});
							Alert("保存成功！");
							Global.saved = true;
							if (Global.request.tab) {
								j().postMessage(Global.request.tab, JSON.stringify(data));
							}
							//									if (Global.callback) {
							//										Global.callback(data);
							//									} else {
							//										window.opener.postMessage(JSON.stringify(data), "*");
							//									}
						} else {
							Alert("该报表 ID 已存在，无法保存 !", function () {
								$id.focus();
							});
						}
					}, 'json');
					return true;
				}
				var settingsid = Global.request['rid'];
				var $d = $("#jp-comp-list-dialog");
				var $id = $d.find(".id-input");
				var $auditor = $d.find(".auditor-select");
				//				if (saas) {
				//					if (Global.request.how == 'new') {
				//						if (!$id.val()) {
				//							Alert("报表 ID 不能为空，请重新输入 .", function() {
				//										$id.focus();
				//									})
				//							return;
				//						}
				//						if ($id.val().indexOf(',') > -1) {
				//							Alert("报表 ID 不能包含逗号字符 , 请重新输入 .", function() {
				//										$id.focus();
				//									})
				//							return;
				//						}
				//					}
				//				}
				//showWait();
				if (!Global.editing.report) {
					Global.editing.report = {};
				}
				Global.editing.report['auditor-id'] = "admin";
				var New = (!Global.request["rid"] && !Global.saved);
				savetemplate(Global.request["tid"], New);
				return true;
			},
			save2: function (params, callback) {
				var template = handlers.sourceCodeViewer.util.encodeTemplate();
				// var tmp = {one: 1, two: "2"};
				// alert(JSON.stringify(template)); // '{"one":1,"two":"2"}'
				// alert(template.pageBody);
				// debugger;
				var savetemplate = function (id, New) {
					template.settingsID = id;
					template.duplex = Global.duplex || false;
					//	console.log(template);
					// template.how = 'upload';
					params = params || {};
					params.settingsID = id;
					params["new"] = New;
					params.how = "upload";
					params.userid = Global.request.userid || "";
					params.datasource = Global.editing['datasource-id'];
					params.name = Global.editing.report['name'];
					params.settingsID = params.name || id; // 安佑升级
					// saas 
					// params.settingsID =  id; 
					params['auditor-id'] = Global.editing.report['auditor-id'];
					params.template = template;
					if (!templateSaveDialog) {
						templateSaveDialog = new TemplateSaveDialog();
					}
					templateSaveDialog.open(params.settingsID, function (id) {
						if ((id || '').match(/^\s*$/)) {
							return false;
						} else {
							Global.request['report-id'] = id;
							params.settingsID = id;
							$.post(Global.service['report-service'], params, function (data) {
								hideWait();
								if (!data.error_code) {
									var portrait = !$page.is('.jp-landscape'), w = $.style($page[0], 'width'), h = $.style($page[0], 'height');
									$.cookie('paper', {
										portrait: portrait,
										width: w,
										height: h
									});
									Global.request["tid"] = id;
									Alert("保存成功！");
									Global.saved = true;
									if (Global.request.tab) {
										j().postMessage(Global.request.tab, JSON.stringify(data));
									}
									//									if (Global.callback) {
									//										Global.callback(data);
									//									} else {
									//										window.opener.postMessage(JSON.stringify(data), "*");
									//									}
								} else {
									Alert("该报表 ID 已存在，无法保存 !", function () {
										$id.focus();
									});
								}
							}, 'json');
							return true;
						}
					});
					return;
				}
				var settingsid = Global.request['rid'];
				var $d = $("#jp-comp-list-dialog");
				var $id = $d.find(".id-input");
				var $auditor = $d.find(".auditor-select");
				if (saas) {
					if (Global.request.how == 'new') {
						if (!$id.val()) {
							Alert("报表 ID 不能为空，请重新输入 .", function () {
								$id.focus();
							})
							return;
						}
						if ($id.val().indexOf(',') > -1) {
							Alert("报表 ID 不能包含逗号字符 , 请重新输入 .", function () {
								$id.focus();
							})
							return;
						}
					}
				}
				//showWait();
				if (!Global.editing.report) {
					Global.editing.report = {};
				}
				Global.editing.report['auditor-id'] = "admin";
				var New = (!Global.request["rid"] && !Global.saved);
				savetemplate($id.val(), New);
				return true;
			},
			test: function (params) {
				this.getSessionedMyDoc(params, function (myDoc) {
					workingDoc.testPrintOut(myDoc);
				});
			},
			getSessionedMyDoc: function (params, callback) {
				var template = handlers.sourceCodeViewer.util.encodeTemplate();
				// var tmp = {one: 1, two: "2"};
				// alert(JSON.stringify(template)); // '{"one":1,"two":"2"}'
				// alert(template.pageBody);
				// debugger;
				if (Global.editing['report-id'])
					template.settingsID = Global.editing['report-id'];
				// template.how = 'upload';
				params = params || {};
				var documentsparams = $.extend({}, params);
				params.settingsID = Global.editing['report-id'];
				params.how = "sessioned";
				params.template = template;
				$.post(Global.service['report-service'], params, function (data) {
					data = $.parseJSON(data);
					documentsparams.sessionedreport = data.sessionedreport;
					callback(workingDoc.getSessionedMyDoc(documentsparams));
				});
				// if (!templateSaveDialog) {
				// templateSaveDialog = new TemplateSaveDialog();
				// }
				// templateSaveDialog.open(settingsid, function(id) {
				// if ((id || '').match(/^\s*$/)) {
				// return false;
				// } else {
				// Global.request['report-id'] = id;
			}
		}
		$(document).click(function () {
			$('.jp-total-menu').removeClass('active');
		});
		$dtable.mousemove(function (e) {
			if ($(e.target).is('td')) {
				if (!dtablescells) {
					dtablescells = [];
					$dtable.find('tr').each(function (row) {
						var cells = $(this).find('td').each(function (col) {
							$(this).data('pos', {
								row: row,
								col: col,
								index: (row * 10) + col
							});
						});
						dtablescells.push(cells);
					})
				}
				var pos = $(e.target).data('pos');
				if (lastcellpos && pos.index == lastcellpos.index)
					return;
				lastcellpos = pos;
				$dtable.find('.selected').removeClass('selected');
				for (var row = 0; row <= pos.row; row++) {
					for (var col = 0; col <= pos.col; col++) {
						$(dtablescells[row][col]).addClass('selected');
					}
				}
				$dcaption.text((pos.col + 1) + "x" + (pos.row + 1) + " 表格");
			}
		}).parent().hover(function () {
		}, function () {
			$dtable.find('.selected').removeClass('selected');
			$dcaption.text("插入表格");
		}).click(function () {
			if (lastcellpos) {
				$('#jp-new-table').data("dim", {
					rows: (lastcellpos.row >= 10 ? lastcellpos.row - 10 : lastcellpos.row) + 1,
					columns: lastcellpos.col + 1
				}).click();
			}
			clickHides();// $dtable.closest('.dropdown').hide();
		})
		$page.selectable({
			// distance:1,
			filter: '.jp-component',
			start: function (e) {
				if (window["mydraggable-disabled"])
					return false;
				// 隐藏下拉框
				clickHides();
				// debugger;
				var selectable = $(e.target).data('selectable-item', null).data('selectable');
				selectable.helper.css('z-index', getLastZIndex());
				if ($created) {
					// 因为是autoRefresh，所以设置任何组件，不可选中
					// 保留之前的filter设置，以便在 stop 时恢复
					var _filter = selectable.options.filter;
					selectable.options.filter = '#jp-undefined';
					selectable.selectees = $('#jp-undefined', e.target);
					$(e.target).data('_filter', _filter)
				}
				$s().unselect();
			},
			stop: function (e) {
				if ($created) {
					var poff = $page.offset();
					var helper = $(e.target).data('selectable').helper;
					var offset = helper.offset();
					var w = helper.width();
					var h = helper.height();
					if (offset.left == -1 && offset.top == -1 && w == 0 && h == 0) {
						// 点击生成组件，用默认大小
						offset.left = e.pageX;// - $page.offset().left;
						offset.top = e.pageY;// - $page.offset().top;
						var sizetype = $created.data("size-type");
						var defsize = getDefaultSizes(sizetype);
						w = defsize.width;
						h = defsize.height;
					} else {
						if (w < 10)
							w = 150;
						if (h < 10)
							h = 30;
					}
					h = calculate(h, '/', magnification);
					w = calculate(w, '/', magnification);
					// $s().unselect();
					$created.appendTo($page).css('left', calculate(calculate(offset.left, '-', poff.left), '/',  magnification)).css('top', calculate(calculate(offset.top, '-', poff.top), '/',  magnification));
					if ($created.is('.jp-table')) {
						// 调整表格组件列宽，不让它超出画布，很怪的需求，
						var maxWidth = ($page.offset().left - $created.offset().left) / viewscale + $page.width() - 2;
						if ($created.width() > maxWidth) {
							var cols = $('col', $created);
							var colwidth = maxWidth / cols.length;
							cols.attr("width", colwidth);
						}
					} else
						// 如果创建的是表格组件，则不选中它
						$created.select();
					if (!$created.is('.fixed')) {
						$created.width(w).height(h);
					}
					initComponent($created);
					// 注册undo
					undo.add(new $Edit($created, ['_appendTo'], null, $page));
					// 编辑
					_editorFactory.edit($created);
					$(e.target).data('selectable').options.filter = $(e.target).data('_filter');
					endCreate();
					justCreated = true;
				}
				// e.stopPropagation();
				setSizePanel();
				$(document).trigger("selection-changed");
				return false;
			},
			selecting: function (event, ui) {
				selecting();
			},
			unselecting: function (event, ui) {
				selecting();
			}
		}).find('.jp-paper-background').andSelf()/*
		* .mouseup(function(e){
		* if($(e.target).is('.jp-paper-background')&&!justCreated){
		* $s().unselect(); }
		* justCreated=false; })
		*/.dblclick(function (e) {
			if (!$(e.target).closest('.jp-component').length) {
				//handlers['jp-new'].call(handlers);
				return false;
			}
		}).mousedown(function (e) {
			if ($(e.target).is('.jp-paper-background') && !justCreated) {
				$s().unselect();
			}
			justCreated = false;
		});
		// _mouseStart = $page.data('selectable')['_mouseStart'];
		// $page.data('selectable')['_mouseStart'] = function (e) {
		// 	_mouseStart.call(this, e);
		// 	this.helper.css({
		// 		"top": -1,
		// 		"left": -1
		// 	});
		// };
		$('.has-clear input[type="text"]').on('hover', function () {
			var $this = $(this);
			$this.siblings('.form-control-clear').toggleClass('hidden', !$this.val());
		}).trigger('propertychange');
		$('.form-control-clear').click(function () {
			$(this).addClass('hidden').siblings('input[type="text"]').val('').trigger('propertychange').focus();
		});
	}
	setTimeout(function () {
		// debugger;
		// top:50%;margin-top:-148mm;
		// 如果不是ie8，需要将 top设置为定值, 对于设置
		if (8 != IE) {
			$('.jp-for-layout').css({
				'top': '50%',
				'left': '50%'
			});
		} else {
			$('.jp-for-layout').css('position', 'relative');
		}
		Global.duplex = false;
		if (Global.editing["report"] && Global.editing["report"].duplex) {
			Global.duplex = true;
		}
		if (Global.request.how == 'local-edit' /*|| true*/) {
			//	if (Global.request.did)
			//	loadDatasource(Global.request.did);
			$page.removeClass('jp-hidden')
			setDatasourceUI();
			//					//setTimeout(function() {
			$page.trigger("report-load");
			setTimeout(function () {
				setFonts($('#jp-font-chooser'));
			}, 1000);
		} else if (Global.request.how == 'new') {
			// if (Global.request.did)
				loadDatasource('1');
			scmLoad();
			handlers['jp-new'].call(handlers);
			setTimeout(function () {
				setFonts($('#jp-font-chooser'));
			}, 1000);
		} else {
			if (Global.request.how == 'edit') {
				//					var url = Global.service['report-service'] + '?how=download&settingsID=' + encodeURI(Global.request['report-id']) + "&" + Math.random();
				//					$.getJSON(url, {}, function(data) {
				//								//handlers['jp-new'].call(handlers);
				//								//$page.removeClass('jp-hidden');
				//								Global.editing.datasource = data._datasource;
				//								Global.editing['datasource-id'] = data.datasource;
				//								setDatasourceUI();
				//								var dochtml = getFullPageHTML(data);
				//								dochtml.html = templatetohtml(data.styles, dochtml.html.replace(/\$\{pageNo\}/, '1'));
				//								loadHTML(dochtml, true);
				//							});
				Global.editing['datasource-id'] = Global.editing["report"].datasource;
				var data = Global.editing["report"];
				if (data["styles-global"]) {
					data.styles = data["styles-global"] + (data["styles-local"] || "");
				}
				setDatasourceUI();
				var dochtml = getFullPageHTML(data);
				dochtml.html = templatetohtml(data.styles, dochtml.html.replace(/\$\{pageNo\}/, '1'));
				loadHTML(dochtml, true);
				scmLoad();
				setTimeout(function () {
					setFonts($('#jp-font-chooser'));
				}, 1000);
			} else if (Global.request.how == 'clone') {
				//					var url = Global.service['report-service'] + '?how=download&settingsID=' + encodeURI(Global.request['report-id']) + "&" + Math.random();
				//					$.getJSON(url, {}, function(data) {
				//								//handlers['jp-new'].call(handlers);
				//								//$page.removeClass('jp-hidden');
				//								Global.editing.datasource = data._datasource;
				//								Global.editing['datasource-id'] = data.datasource;
				//								setDatasourceUI();
				//								var dochtml = getFullPageHTML(data);
				//								dochtml.html = templatetohtml(data.styles, dochtml.html.replace(/\$\{pageNo\}/, '1'));
				//								loadHTML(dochtml, true);
				//							});
				Global.request.how == 'new';
				Global.request["report-id"] = '';
				Global.editing['datasource-id'] = Global.editing["report"].datasource;
				var data = Global.editing["report"];
				data['name'] = '';
				data['auditor-id'] = '';
				if (data["styles-global"]) {
					data.styles = data["styles-global"] + (data["styles-local"] || "");
				}
				setDatasourceUI();
				var dochtml = getFullPageHTML(data);
				dochtml.html = templatetohtml(data.styles, dochtml.html.replace(/\$\{pageNo\}/, '1'));
				loadHTML(dochtml, true);
				setTimeout(function () {
					setFonts($('#jp-font-chooser'));
				}, 1000);
			} else // if (Global.request.how == 'view')
			{
				//					var url = Global.service['report-service'] + '?how=download&settingsID=' + encodeURI(Global.request['report-id']) + "&" + Math.random();
				//					$.getJSON(url, {}, function(data) {
				//							
				//							});
				Global.editing['datasource-id'] = Global.editing["report"].datasource;
				var data = Global.editing["report"];
				if (data["styles-global"]) {
					data.styles = data["styles-global"] + (data["styles-local"] || "");
				}
				setDatasourceUI();
				var dochtml = getFullPageHTML(data);
				dochtml.html = templatetohtml(data.styles, dochtml.html.replace(/\$\{pageNo\}/, '1'));
				loadHTML(dochtml, true);
				setTimeout(function () {
					setFonts($('#jp-font-chooser'));
				}, 1000);
			}
		}
		$('#jp-header', $page).resizable({
			handles: 's'
		});
		$('#jp-footer', $page).resizable({
			handles: 'n',
			resize: function (event, ui) {
				$(this).css("top", '');
			}
		});
	}, 1000);
	$(document).on("rotated", function (e, undos) {
		var fn = ['css', 'transform'];
		undo.open();
		$s().each(function () {
			var undos = $(this).data("undos") || '';
			if (undos)
				undo.add(new $Edit($(this), fn, 'rotate({0}rad)'.format(undos["old"]), 'rotate({0}rad)'.format(undos["new"])));
		});
		undo.close();
	});
	document.onkeydown = function (e) {
		if ((e.which || e.keyCode) == 65 && e.ctrlKey) {
			e.preventDefault();
			$s().unselect();//
			// //////////////////$(this).siblings().unselect();
			$page.find('.jp-component').select();
		}
	}
	var iconframe = document.getElementById("bootstrap-icon-frame");
	if (iconframe)
		iconframe.onload = function () {
			var $group = $(this).closest(".btn-group");
			$(this.contentWindow.document.body).click(function (e) {
				var $li = $(e.target).closest("li");
				if ($li.length) {
					var svgname = $li.find("use").attr("xlink:href").split("#")[1];
					$.get("images/bootstrap-icons-1.0.0/{0}.svg".format(svgname), function (data) {
						var svg = new XMLSerializer().serializeToString(data.documentElement);
						handlers['jp-new-svg-icon'].call(handlers, e, svg);
					});
				}
				$group.removeClass("open");
			})
		};
	// ui hook
	$('.auto-layout').click(function () {
		var $layout = $(".page-layout").html("");
		var rows = parseInt($("#jp-layout-rows").val());
		var cols = parseInt($("#jp-layout-cols").val());
		var $page = $(".jp-page").clone(true).css("display", "block").css("box-shadow", '');
		$page.find('.ui-resizable-handle,.jp-selected-layer,.rotate-shadow').remove();
		var $el = $page.addClass("page-el");
		for (var r = 0; r < rows; r++) {
			var $row = $("<div class='page-row'>").appendTo($layout);
			for (var c = 0; c < cols; c++) {
				$row.append($el.clone(true));
			}
		}
	})
	$.fn.focusTextToEnd = function () {
		this.focus();
		var $thisVal = this.val();
		this.val('').val($thisVal);
		return this;
	}
	var UNDEF = "undefined";
	var getSelection, setSelection, deleteSelectedText, deleteText, insertText;
	var replaceSelectedText, surroundSelectedText, extractSelectedText, collapseSelection;
	// Trio of isHost* functions taken from Peter Michaux's article:
	// http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
	function isHostMethod(object, property) {
		var t = typeof object[property];
		return t === "function" || (!!(t == "object" && object[property])) || t == "unknown";
	}
	function isHostProperty(object, property) {
		return typeof (object[property]) != UNDEF;
	}
	function isHostObject(object, property) {
		return !!(typeof (object[property]) == "object" && object[property]);
	}
	function fail(reason) {
		if (window.console && window.console.log) {
			window.console.log("RangyInputs not supported in your browser. Reason: " + reason);
		}
	}
	function adjustOffsets(el, start, end) {
		if (start < 0) {
			start += el.value.length;
		}
		if (typeof end == UNDEF) {
			end = start;
		}
		if (end < 0) {
			end += el.value.length;
		}
		return {
			start: start,
			end: end
		};
	}
	function makeSelection(el, start, end) {
		return {
			start: start,
			end: end,
			length: end - start,
			text: el.value.slice(start, end)
		};
	}
	function getBody() {
		return isHostObject(document, "body") ? document.body : document.getElementsByTagName("body")[0];
	}
	$(document).ready(function () {
		var testTextArea = document.createElement("textarea");
		getBody().appendChild(testTextArea);
		if (isHostProperty(testTextArea, "selectionStart") && isHostProperty(testTextArea, "selectionEnd")) {
			getSelection = function (el) {
				var start = el.selectionStart, end = el.selectionEnd;
				return makeSelection(el, start, end);
			};
			setSelection = function (el, startOffset, endOffset) {
				var offsets = adjustOffsets(el, startOffset, endOffset);
				el.selectionStart = offsets.start;
				el.selectionEnd = offsets.end;
			};
			collapseSelection = function (el, toStart) {
				if (toStart) {
					el.selectionEnd = el.selectionStart;
				} else {
					el.selectionStart = el.selectionEnd;
				}
			};
		} else if (isHostMethod(testTextArea, "createTextRange") && isHostObject(document, "selection") && isHostMethod(document.selection, "createRange")) {
			getSelection = function (el) {
				var start = 0, end = 0, normalizedValue, textInputRange, len, endRange;
				var range = document.selection.createRange();
				if (range && range.parentElement() == el) {
					len = el.value.length;
					normalizedValue = el.value.replace(/\r\n/g, "\n");
					textInputRange = el.createTextRange();
					textInputRange.moveToBookmark(range.getBookmark());
					endRange = el.createTextRange();
					endRange.collapse(false);
					if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
						start = end = len;
					} else {
						start = -textInputRange.moveStart("character", -len);
						start += normalizedValue.slice(0, start).split("\n").length - 1;
						if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
							end = len;
						} else {
							end = -textInputRange.moveEnd("character", -len);
							end += normalizedValue.slice(0, end).split("\n").length - 1;
						}
					}
				}
				return makeSelection(el, start, end);
			};
			var offsetToRangeCharacterMove = function (el, offset) {
				return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
			};
			setSelection = function (el, startOffset, endOffset) {
				var offsets = adjustOffsets(el, startOffset, endOffset);
				var range = el.createTextRange();
				var startCharMove = offsetToRangeCharacterMove(el, offsets.start);
				range.collapse(true);
				if (offsets.start == offsets.end) {
					range.move("character", startCharMove);
				} else {
					range.moveEnd("character", offsetToRangeCharacterMove(el, offsets.end));
					range.moveStart("character", startCharMove);
				}
				range.select();
			};
			collapseSelection = function (el, toStart) {
				var range = document.selection.createRange();
				range.collapse(toStart);
				range.select();
			};
		} else {
			getBody().removeChild(testTextArea);
			fail("No means of finding text input caret position");
			return;
		}
		// Clean up
		getBody().removeChild(testTextArea);
		function getValueAfterPaste(el, text) {
			var val = el.value, sel = getSelection(el), selStart = sel.start;
			return {
				value: val.slice(0, selStart) + text + val.slice(sel.end),
				index: selStart,
				replaced: sel.text
			};
		}
		function pasteTextWithCommand(el, text) {
			el.focus();
			var sel = getSelection(el);
			// Hack to work around incorrect delete command when
			// deleting the
			// last word on a line
			setSelection(el, sel.start, sel.end);
			if (text == "") {
				document.execCommand("delete", false, null);
			} else {
				document.execCommand("insertText", false, text);
			}
			return {
				replaced: sel.text,
				index: sel.start
			};
		}
		function pasteTextWithValueChange(el, text) {
			el.focus();
			var valueAfterPaste = getValueAfterPaste(el, text);
			el.value = valueAfterPaste.value;
			return valueAfterPaste;
		}
		var pasteText = function (el, text) {
			var valueAfterPaste = getValueAfterPaste(el, text);
			try {
				var pasteInfo = pasteTextWithCommand(el, text);
				if (el.value == valueAfterPaste.value) {
					pasteText = pasteTextWithCommand;
					return pasteInfo;
				}
			} catch (ex) {
				// Do nothing and fall back to changing the
				// value manually
			}
			pasteText = pasteTextWithValueChange;
			el.value = valueAfterPaste.value;
			return valueAfterPaste;
		};
		deleteText = function (el, start, end, moveSelection) {
			if (start != end) {
				setSelection(el, start, end);
				pasteText(el, "");
			}
			if (moveSelection) {
				setSelection(el, start);
			}
		};
		deleteSelectedText = function (el) {
			setSelection(el, pasteText(el, "").index);
		};
		extractSelectedText = function (el) {
			var pasteInfo = pasteText(el, "");
			setSelection(el, pasteInfo.index);
			return pasteInfo.replaced;
		};
		var updateSelectionAfterInsert = function (el, startIndex, text, selectionBehaviour) {
			var endIndex = startIndex + text.length;
			selectionBehaviour = (typeof selectionBehaviour == "string") ? selectionBehaviour.toLowerCase() : "";
			if ((selectionBehaviour == "collapsetoend" || selectionBehaviour == "select") && /[\r\n]/.test(text)) {
				// Find the length of the actual text inserted,
				// which could vary
				// depending on how the browser deals with line
				// breaks
				var normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
				endIndex = startIndex + normalizedText.length;
				var firstLineBreakIndex = startIndex + normalizedText.indexOf("\n");
				if (el.value.slice(firstLineBreakIndex, firstLineBreakIndex + 2) == "\r\n") {
					// Browser uses \r\n, so we need to account
					// for extra \r
					// characters
					endIndex += normalizedText.match(/\n/g).length;
				}
			}
			switch (selectionBehaviour) {
				case "collapsetostart":
					setSelection(el, startIndex, startIndex);
					break;
				case "collapsetoend":
					setSelection(el, endIndex, endIndex);
					break;
				case "select":
					setSelection(el, startIndex, endIndex);
					break;
			}
		};
		insertText = function (el, text, index, selectionBehaviour) {
			setSelection(el, index);
			pasteText(el, text);
			if (typeof selectionBehaviour == "boolean") {
				selectionBehaviour = selectionBehaviour ? "collapseToEnd" : "";
			}
			updateSelectionAfterInsert(el, index, text, selectionBehaviour);
		};
		replaceSelectedText = function (el, text, selectionBehaviour) {
			var pasteInfo = pasteText(el, text);
			updateSelectionAfterInsert(el, pasteInfo.index, text, selectionBehaviour || "collapseToEnd");
		};
		surroundSelectedText = function (el, before, after, selectionBehaviour) {
			if (typeof after == UNDEF) {
				after = before;
			}
			var sel = getSelection(el);
			var pasteInfo = pasteText(el, before + sel.text + after);
			updateSelectionAfterInsert(el, pasteInfo.index + before.length, sel.text, selectionBehaviour || "select");
		};
		function jQuerify(func, returnThis) {
			return function () {
				var el = this.jquery ? this[0] : this;
				var nodeName = el.nodeName.toLowerCase();
				if (el.nodeType == 1 && (nodeName == "textarea" || (nodeName == "input" && /^(?:text|email|number|search|tel|url|password)$/i.test(el.type)))) {
					var args = [el].concat(Array.prototype.slice.call(arguments));
					var result = func.apply(this, args);
					if (!returnThis) {
						return result;
					}
				}
				if (returnThis) {
					return this;
				}
			};
		}
		$.fn.extend({
			getSelection: jQuerify(getSelection, false),
			setSelection: jQuerify(setSelection, true),
			collapseSelection: jQuerify(collapseSelection, true),
			deleteSelectedText: jQuerify(deleteSelectedText, true),
			deleteText: jQuerify(deleteText, true),
			extractSelectedText: jQuerify(extractSelectedText, false),
			insertText: jQuerify(insertText, true),
			replaceSelectedText: jQuerify(replaceSelectedText, true),
			surroundSelectedText: jQuerify(surroundSelectedText, true)
		});
	});


	var selectionchange = function () {
		// 设置字体
		var $se = $s();
		if ($se.length) {
			var $first = $($se[0]);
			var fontName = $first.css("font-family");
			$(".right-bar #jp-font-chooser").data('select-picker').val(fontName);
			// 设置字体大小
			// 2021-03-12 12:45:02, 优先从 inline style里的font-size设置
			var fontSize = $first[0].style.fontSize || $first.css("font-size");

			if (fontSize.indexOf('px') > -1) {
				fontSize = parseInt(0.75 * parseInt(fontSize));
			} else {
				fontSize = parseInt(fontSize);
			}
			var $sizechooser = $(".right-bar #jp-font-size-chooser");
			var newsize = parseInt($sizechooser.val(fontSize + " pt").val());
			if (newsize != fontSize) {
				var done = false;
				var $newoption = $("<option>").text(fontSize + " pt");
				$sizechooser.find("option").each(function () {
					if (parseInt($(this).text()) > fontSize) {
						$(this).before($newoption);
						done = true;
						return false;
					}
				});
				if (!done) {
					$sizechooser.append($newoption);
				}
				$sizechooser.selectpicker('refresh').selectpicker({
					dropupAuto: false
				});
				$sizechooser.data('select-picker').val(fontSize + " pt");
			}
			$sizechooser.data('select-picker').val(fontSize + " pt");
		}
	};

	if (ROTATE) {
		var enablerotate = function () {
			var s = $s();
			$(document.body).toggleClass("no-selection", s.length === 0);

			if (s.length > 0) {
				s.first().enableRotate();
				selectionchange();
			}
		}
		$(document).on("selection-changed", enablerotate).on("undid", enablerotate)
	}
	function px2em(elem, px) {
		var elemFontSize = parseInt(window.getComputedStyle(elem, null).fontSize, 10);
		return Math.round(parseInt(px) / elemFontSize * 10) / 10;
	}



	$(".right-bar .simple-style-drop").on("show.bs.dropdown", function (event) {
		if (!$s().length)
			return false;
		var $drop = $(this);
		var prop = $drop.data("prop");
		var func = $drop.data("func");
		var target = $drop.data("target") || '';
		var computedStyle = prop.replace(/-([a-z])/g, function (g) {
			return g[1].toUpperCase();
		});
		var selections = $s();
		if (target) {
			selections = selections.find(target);
		}
		var oldval = [];
		selections.vals([func, prop], oldval);
		$drop.data({
			"old-values": oldval,
			"cancel": false,
			"selections": selections
		});
		var first = selections.first()[0];
		var value = func == 'css' ? window.getComputedStyle(first, null)[computedStyle] : selections.first().attr(prop);
		if ($drop.data("px2em")) {
			value = px2em(first, value);
		}
		var unit = $drop.data("unit") || '';
		if (!$drop.data("hooked")) {
			$drop.find("svg.close").click(function () {
				$drop.data("cancel", true);
			});
			var $input = $drop.find("input");
			if ($input.is(".spectrum")) {
				$input.val('rgb(0,0,0)').spectrum({
					flat: true,
					showInput: true,
					showButtons: false,
					showPalette: true,
					showSelectionPalette: true,
					maxPaletteSize: 20,
					preferredFormat: 'rgb',
					showAlpha: true,
					showSelectionPalette: true,
					color: $input.val(),
					paletteConfig: "8x8"
				});//.parent().mousedown(function (e) { e.stopPropagation(); });
			}
			$input.on("input", function () {
				this.dataset.value = this.value;
				$drop.data("selections")[func](prop, this.value + unit);
			});

			$drop.data("input", $input);
			$drop.data("hooked", true);
		}

		value = (value + "").split(/[a-z]+/)[0];
		$drop.data("input").val(value)[0].dataset.value = value;
	}).on("hide.bs.dropdown", function (event) {
		var $drop = $(this);
		var selections = $drop.data("selections");
		var prop = $drop.data("prop");
		var func = $drop.data("func");
		var oldvalues = $(this).data("old-values");
		if ($(this).data("cancel")) {
			// 如果按了 close按钮，则不应恢复以前的设置
			selections.each(function (i) {
				$(this)[func](prop, oldvalues[i]);
			})
		} else {
			//加入undo
			undo.add(new $Edit(selections, [func, prop], oldvalues, selections.first()[func](prop)));
		}
	});

});
// 把表格板配置信息，转换成Cell 便于计算
function bodyCell(settings) {
	// function Cell(r, c, w, h)
	return new Cell(settings["header-rows"], 1, 1, settings["body-rows"]);
}
// 给定行数，指出该行所处位置 0=表眉，1=明细主体，2= 明细扩展，3=表脚
function hitTest(settings, row) {
	var cell = bodyCell(settings)
	if (row < cell.row) {
		return 0;
	} else if (row == cell.row) {
		return 1;
	} else if (row <= cell.row2) {
		return 2;
	} else
		return 3;
}
function AjaxUpload(bytesLimit, errorBytesLimit) {
	var me = this;
	if (!this.$iframe) {
		this.$iframe = $('<iframe style="height: 30px; position: absolute; top: -40px;left:-200px;"></iframe>').prependTo(document.body);
	}
	this.init = function () {
		var uploaddoc = this.$iframe.contents()[0];
		uploaddoc.open();
		uploaddoc.writeln('<html><body>' + '<form action="" enctype="multipart/form-data" class="jp-upload-form" method="post">'
			+ '<input  type="file" name="file" class="jp-file"  style="position:absolute;top:-40px;" accept="image/png,image/jpeg,image/jpg,image/svg,image/gif" />' + '</form>' + '</body></html>');
		uploaddoc.close();
		this.doc = uploaddoc;
		this.$fileinput = $('.jp-file', uploaddoc).change(function (e) {
			var files = e.target.files;// || [e.target.value];
			function prepareSubmit(filesize) {
				filesize = parseInt(filesize + "");
				if (filesize > bytesLimit) {
					// alert(errorBytesLimit);
					me.callback({ error: errorBytesLimit });

				} else {
					me.$iframe.bind("load", function () {
						var data = me.$iframe.contents()[0].body.innerHTML;
						me.callback(data);
						me.$iframe.unbind("load");
					});
					$('form', uploaddoc).submit();
				}
			}
			if (files && files.length) {
				prepareSubmit(files[0].size);
			} else if (e.target.value && getJatoolsPrinter) {
				getJatoolsPrinter().get("filesize://" + e.target.value, prepareSubmit);
			}
		})
	}
	this.click = function (url, callback) {
		this.init();
		$('form', this.doc).attr('action', url);
		this.callback = callback;
		setTimeout(function () {
			me.$fileinput[0].dispatchEvent(new MouseEvent("click"));
		}, 100);
	}
}
(function (factory) {
	if (typeof define === 'function' && define.amd) {

		define(['jquery'], factory);
	} else if (typeof exports === 'object') {

		module.exports = factory(require('jquery'));
	} else {

		factory(jQuery);
	}
}(function ($) {
	var pluses = /\+/g;
	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}
	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}
	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}
	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {

			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}
		try {

			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch (e) {
		}
	}
	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}
	var config = $.cookie = function (key, value, options) {
		// Write
		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);
			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
			}
			return (document.cookie = [encode(key), '=', stringifyCookieValue(value), options.expires ? '; expires=' + options.expires.toUTCString() : '', // use

			options.path ? '; path=' + options.path : '', options.domain ? '; domain=' + options.domain : '', options.secure ? '; secure' : ''].join(''));
		}
		var result = key ? undefined : {},

			cookies = document.cookie ? document.cookie.split('; ') : [], i = 0, l = cookies.length;
		for (; i < l; i++) {
			var parts = cookies[i].split('='), name = decode(parts.shift()), cookie = parts.join('=');
			if (key === name) {
				result = read(cookie, value);
				break;
			}
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}
		return result;
	};
	config.defaults = {};
	$.removeCookie = function (key, options) {
		$.cookie(key, '', $.extend({}, options, {
			expires: -1
		}));
		return !$.cookie(key);
	};
}));
$.cookie.json = true;

function Alert(error, callback) {
	new BootstrapDialog({
		title: '消息 ',
		cssClass: "alert-dialog",
		draggable: true,
		animate: false,
		closeByBackdrop: false,
		closeByKeyboard: false,
		message: "<div class='wrapper'></div>",//
		buttons: [{
			cssClass: "btn-green",
			label: "确认",
			action: function (dialogRef) {
				dialogRef.close();
				callback && callback();
			}
		}],
		onshown: function (dialog) {
			dialog.getModalBody().find(".wrapper").text(error);
		}
	}).open();
}
function buildCodeURL(data) {
	var tmpl = "http://127.0.0.1:31227/api?type=coder&code={0}&style={1}&width={2}&height={3}&".format(data.code, encodeURIComponent(data.style.replace(/\#/g, '')), data.width | 0, data.height | 0);
	return tmpl;
}
function setCodeImage($coder) {

	var $img = $coder.find('img');
	var data = {
		code: $img.data("code"),
		style: $img.data('style'),
		width: $img.width(),
		height: $img.height()
	}
	$img[0].src = buildCodeURL(data);
}
function showWait() {
	var $img = $('body >div.progress2');
	if (!$img.length) {
		$("<div class='progress2'  style='width:100%;height:100%;border:1px solid black;position:absolute;top:0;text-align:center;z-index:50000'><img style='margin-top:10em;'></img></div>")
			.appendTo(document.body).find("img").attr('src', 'images/cp_wait_img.gif')
	}
	$img.css("display", "block")
}
function hideWait() {
	$('body >div.progress2').hide();
}
function setTrStyle(table, height) {

	var oRule, sheet;
	var sheet = document.styleSheets[0];
	var rules = sheet.rules;
	var selector = "#{0} tr.ex, #{0} tr.ex td".format(table);
	var compactselector = selector.replace(/\s/g, "");
	for (i = 0; i < rules.length; i++) {
		oRule = rules[i];
		if (!oRule || !oRule.selectorText)
			continue;
		// console.log(oRule.selectorText);
		if (oRule.selectorText.replace(/\s/g, '') == compactselector) {
			sheet.deleteRule(i);
			sheet.insertRule(selector + "{height: " + height + "px!important; }");
			return;
		}

	}
	sheet.insertRule(selector + "{height: " + height + "px!important; }");

}
var rowsediting = false;
$.fn.inlineEdit = function () {
	$(this).click(function (e) {
		if (rowsediting) {
			return; // 避免正在编译时，响应本事件
		}
		var el = $(this);
		if (el.attr('rows') == '*')
			return; // 如果是区域内自动扩展，不需要设置行数
		rowsediting = true;
		var input = $('#rows-editor');
		if (!input.length) {
			input = $('<input id="rows-editor" type="text" />').appendTo(document.body);
		}

		el.append(input);
		input.appendTo(el).val(el.attr("rows")).show().focus().select();
		$(document).on("mousedown.rowseditor", function (e) {
			if (e.target == input[0])
				return;
			rowsediting = false;
			if (input.val() != "") {
				//	connectWith.val($(this).val()).change();
				var rows = parseInt(input.val());
				if (!isNaN(rows) && rows >= 1)
					el.closest('.jp-table').data('no-excel').setBodyRows(rows);
			}
			input.hide();
			$(document).off(".rowseditor");
		});
		e.stopPropagation(); // 避免此事件，激发上面的 document.mousedown.rowedtior 事件
	});
	return this;
};
Global.ajaxUpload = new AjaxUpload(Global.config['upload-max-size'], Global.config['upload-max-size-error']);
var $valueSpan = $('.valueSpan');
var $value = $('#slider11');
$valueSpan.html($value.val());
$value.on('input change', function () {
	$valueSpan.html($value.val());
});
function rotate(cx, cy, x, y, radians) {
	var cos = Math.cos(-radians);
	var sin = Math.sin(-radians);
	var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
	var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
	return {
		left: nx,
		top: ny
	};
}

