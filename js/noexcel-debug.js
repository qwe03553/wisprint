var NoExcel = {
	$active: null,
	_id26: [],
	KEYS: {
		RETURN: 13,
		UP: 38,
		DOWN: 40,
		LEFT: 37,
		RIGHT: 39,
		TAB: 9
	},
	id26: function (i) {
		if (this._id26[i])
			return this._id26[i];
		var _i = i, result = '';
		do {
			result = String.fromCharCode((i % 26) + 65) + result;
		} while (i = Math.floor(i / 26));
		this._id26[_i] = result;
		return result;
	},
	derect: function (c, d) {
		c.top += d;
		c.left += d;
		c.width -= d * 2;
		c.height -= d * 2;
		return c;
	}
}

// 扩展 jquery
$.fn.extend({
	// 将对象插入到目标指定位置
	insertAt: function (to, index) {
		if (!to instanceof jQuery) {
			to = $(to);
		};
		if (index === 0) {
			$(this).prependTo(to)
		} else {
			$(this).insertAfter(to.children().eq(index - 1));
		}
	},
	// 将对象的值，填充到数组
	_fill: function (f, dest) {
		var fn = $.fn[f[0]], arg = f.slice(1);
		return this.each(function () {
			dest.push(fn.apply($(this), arg));
		});
	}
});


function $NXEdit(target, fn, oldval, newval, callback) {
	this.target = target;
	if ($.isFunction(fn[0])) {
		this.$unfn = fn[0];
		this.$refn = fn[1];
		$.extend(this, fn[2]);
	} else {
		this.$fn = $.fn[fn[0]];
		this.arg = fn.slice(1);
		this.arg.push(null);
		this.oldval = $.isArray(oldval) ? oldval : [oldval];
		this.newval = newval;
	}
	this.callback = callback;
}
$NXEdit.prototype.undo = function () {
	var _this = this;
	this.getTarget().each(function (i) {
		if (_this.$unfn) {
			_this.$unfn.call(_this);
		} else
			_this.$fn.apply($(this), _this.arg._last(_this.oldval[i] || ''));
	});
	return this;
}
$NXEdit.prototype.getTarget = function () {
	return this.target.grid ? this.target.grid.$(this.target.selection) : this.target;
}
$NXEdit.prototype.redo = function () {
	var _this = this, multiple = $.isArray(this.newval);
	this.getTarget().each(function (i) {
		if (_this.$refn) {
			_this.$refn.call(_this);
		} else
			_this.$fn.apply($(this), _this.arg._last((multiple ? _this.newval[i] : _this.newval)));
	});
	return this;
}

function Cell(r, c, w, h) {
	this.row = r;
	this.col = c;
	this.rowSpan = h || 1;
	this.colSpan = w || 1;
	this.row2 = this.row + this.rowSpan - 1;
	this.col2 = this.col + this.colSpan - 1;
	this.merged = this.rowSpan > 1 || this.colSpan > 1;
} //
Cell.prototype.contains = function (that) {
	return that.row >= this.row && that.row <= this.row2 && that.col >= this.col && that.col <= this.col2 && that.row2 >= this.row && that.row2 <= this.row2
		&& that.col2 >= this.col && that.col2 <= this.col2;
}
Cell.prototype.containsY = function (that) {
	if (typeof that === 'number') {
		return that >= this.row && that <= this.row2;
	} else
		return that.row >= this.row && that.row <= this.row2 && that.row2 >= this.row && that.row2 <= this.row2
}
Cell.prototype.intersects = function (that) {
	var tw = this.colSpan, th = this.rowSpan, rw = that.colSpan, rh = that.rowSpan;
	if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
		return false;
	}
	var tx = this.col, ty = this.row, rx = that.col, ry = that.row;
	rw += rx;
	rh += ry;
	tw += tx;
	th += ty;
	return ((rw < rx || rw > tx) && (rh < ry || rh > ty) && (tw < tx || tw > rx) && (th < ty || th > ry));
}
Cell.prototype.clone = function () {
	var result = new Cell(this.row, this.col, this.colSpan, this.rowSpan);
	result.srcEl = this.srcEl;
	result.status = this.status;
	return result;
}
Cell.prototype.id = function () {
	return this.row + '-' + this.col;
}
Cell.prototype.id26 = function () {
	return NoExcel.id26(this.col) + (this.row + 1);
}
Cell.prototype.union = function (that) {
	this.row = Math.min(this.row, that.row);
	this.col = Math.min(this.col, that.col);
	this.row2 = Math.max(this.row2, that.row2);
	this.col2 = Math.max(this.col2, that.col2);
	this.rowSpan = this.row2 - this.row + 1;
	this.colSpan = this.col2 - this.col + 1;
	return this;
};
Cell.prototype.reset = function (newRows, newCols) {
	// this.row = Math.max(this.row, that.row);
	this.row2 = Math.min(this.row2, newRows - 1);
	this.rowSpan = this.row2 - this.row + 1;
	this.col2 = Math.min(this.col2, newCols - 1);
	this.colSpan = this.col2 - this.col + 1;
	if (!this.rowSpan) {
		this.rowSpan++;
		this.row = Math.max(0, this.row - 1);
	}
	if (!this.colSpan) {
		this.colSpan++;
		this.col = Math.max(0, this.col - 1);
	}
	return this;
};
function Grid(t) {
	this.t = t;
	this.$t = $(t);
	var statik = this['static'] = !this.$t.parent().data('saved-options');
	if (statik)
		this.$t.parent().addClass("jp-static");
	var $firsttd = this.$t.find("td:first");
	this.tdOuter = $firsttd.outerHeight() - $firsttd.height();
	var $parent = this.$t.parent();
	var dimsChanged = false;
	var heightsChanged = false;
	var widthsChanged = false;
	// 看是否有至少一个对象
	this.colSeparators = $('.col-separator', $parent);
	if (!this.colSeparators.length) {
		// 如果不存在一个分割，则创建一个
		this.colSeparators = $('<div class="col-separator"></div>').appendTo($parent);
	}
	this.rowSeparators = $('.row-separator', $parent);
	if (!this.rowSeparators.length) {
		// 如果不存在一个分割，则创建一个
		this.rowSeparators = $('<div class="row-separator"></div>').appendTo($parent);
	}
	/*
	 * this.$wrap=this.$t.closest('.sheet-wrapper');
	 * this.$leftheader=this.$wrap.find('.left-header-table');
	 * this.$topheader=this.$wrap.find('.top-header-table');
	 */
	this.$selection = $parent.find('.selection-frame');
	var $detailMaster = $parent.find('.jp-table-detail-master');
	var $detailBody = $parent.find('.jp-table-detail-body').inlineEdit();
	if (!statik) {
		$detailBody.inlineEdit();
	}
	var $footer = $parent.find('.jp-table-summary');
	//$detailMaster.contextMenu('#jp-detail-section-actions');
	this.afterCellBase = function (row, col) {
		var cell = this.cells[row][col];
		if (cell.colSpan > 1 && cell.col2 > col) {
			cell.hit2ndCol = true;
			return cell;
		} else {
			for (; col >= 0; col--) {
				cell = this.cells[row][col];
				if (cell && cell.row == row) {
					cell.hit2ndCol = null;
					return cell;
				}
			}
			return null;
		}
	}
	this.repositionHelpUI = function () {
		// 
		if (!this["static"] && heightsChanged) {
			var sets = $parent.data("saved-options")["options"];
			var detailstartrow = sets["header-rows"] || 0;
			var bodyrows = sets["body-rows"];
			var footerrows = sets["footer-rows"];
			$detailMaster.css({
				top: this.rowy[detailstartrow] + 3,
				height: this.heights[detailstartrow] - 3
			});
			var rows = sets["break"] == 'auto' ? '*' : bodyrows;
			$detailBody.css({
				top: this.rowy[detailstartrow] - 1,
				height: this.rowy[detailstartrow + bodyrows] - this.rowy[detailstartrow] + 1
			}).attr("rows", rows);
			if (footerrows) {
				$footer.css({
					height: this.rowy[this.rowy.length - 1] - this.rowy[this.rowy.length - 1 - footerrows] - 2
				}).show();
			} else {
				$footer.hide();
			}
		}
	}
	this.$ = function (select) {
		// 仅处理左上角的那个单元格
		if (select.LTSrcEl) {
			return $(select.LTSrcEl)
		} else if (typeof (select.row) == 'number') {
			var result = [];
			for (var r = select.row; r <= select.row2; r++) {
				for (var c = select.col; c <= select.col2; c++) {
					var cell = this.cells[r][c];
					if (cell && !cell.virtual)
						result.push(cell.srcEl);
				}
			}
			return $(result);
		} else if (typeof (select) == 'string') {
			return this.$t.find(select);
		}
	}
	// 取得某一行，列位置的左面可插入点，即哪个cell.srcEl之前插入
	this.beforeCellBase = function (row, col) {
		var cell = this.cells[row][col];
		if (cell.colSpan > 1 && cell.col < col) {
			// 当前col处于合并单元格的非头列位置，如第2，3列位置
			// 此种情况，一般不需要插入，只需colSpan++即可
			cell.hit2ndCol = true;
			return cell;
		} else {
			// 选中了合并单元格的头列或非合并单元格
			for (; col < this.columns.length; col++) {
				cell = this.cells[row][col];
				if (cell && cell.row == row) {
					cell.hit2ndCol = null;
					return cell;
				}
			}
			// 只有一种情况返回为null,选中了头列，非头行的合并单元格，且该单元格处于行尾
			return null;
		}
	}

	this.jp = function () {
		if (!$.jp) {
			$.jp = navigator.userAgent.indexOf('MSIE') > -1 ? document.getElementById('ojatoolsPrinter') : document.getElementById('ejatoolsPrinter');
		}
		return $.jp;
	}
	this.inlineStyles = function (doc, root) {
		root = root || doc.body;
		var rules = doc.styleSheets[doc.styleSheets.length - 1].cssRules;
		for (var idx = 0, len = rules.length; idx < len; idx++) {
			$(rules[idx].selectorText, root).each(function (i, elem) {
				elem.style.cssText += rules[idx].style.cssText;
			});
		}
	}
	this.insertColumn = function (col, before) {
		var spans = {};
		var insert = before ? this.$insertBefore : this.$insertAfter;
		var cellbase = before ? this.beforeCellBase : this.afterCellBase;
		insert.call(this, $(this.columns[col]).clone(), this.columns[col]);
		for (var row = 0; row < this.cells.length; row++) {
			var cell = cellbase.call(this, row, col), $tr = $(this.trs[row]);
			if (cell && cell.hit2ndCol) {
				var id = cell.id();
				if (!spans[id]) {
					this.attr($(cell.srcEl), 'colSpan', 1 + cell.srcEl.colSpan);
					spans[id] = cell;
				}
			} else {
				var cloned = $(this.cells[row][col].srcEl).clone(false).css('height', '').empty().attr({
					rowSpan: 1,
					colSpan: 1
				});
				insert.call(this, cloned, cell ? cell.srcEl : null, $tr);
			}
		}
		return this;
	}
	this.deleteColumns = function (_col, _col2) {
		var me = this;
		this.um.open(function () {
			me.reset().resetWidths().resetSelection(true);
		});
		for (var row = 0; row < this.cells.length; row++) {
			var therow = this.cells[row];
			for (var col = _col; col <= _col2; col++) {
				if (!row)
					this.$remove(this.columns[col]);
				var cell = therow[col], id = cell.id();
				if (cell && !cell.status.done) {
					if (cell.col >= _col && cell.col2 <= _col2) {
						this.$remove(cell.srcEl);
					} else {
						var dspan = Math.min(cell.col2, _col2) - Math.max(cell.col, _col) + 1;
						this.attr($(cell.srcEl), 'colSpan', cell.srcEl.colSpan - dspan);
					}
					cell.status.done = true;
				}
			}
		}
		this.um.close();
		return this;
	}
	this.$s = function () {
		// 先检查缓存，提高效率
		if (!this.selectedCache) {
			var result = [];
			var sel = this.selection;
			if (sel)
				for (var row = sel.row; row <= sel.row2; row++) {
					var therow = this.cells[row];
					if (therow)
						for (var col = sel.col; col <= sel.col2; col++) {
							var cell = therow[col];
							if (cell && !cell.virtual) {
								result.push(cell.srcEl);
							}
						}
				}
			this.selectedCache = $(result);
		}
		return this.selectedCache;
	}, this.resizeColumns = function (col, n, w) {
		var oldval = [], fn = ['attr', 'width'], sel = 'col:lt(' + (col + n) + ')' + (col ? ':gt(' + (col - 1) + ')' : '');
		this.$(sel)._fill(fn, oldval).attr('width', w);
		this.um && this.um.add(new $NXEdit({
			grid: this,
			selection: sel
		}, fn, oldval, w, function (t) {
			t.grid.resetWidths().resetSelection(true);
		}));
		return this;
	}
	this.resizeRows = function (row, n, h) {
		var oldval = [], fn = ['attr', 'height'], sel = 'tr:lt(' + (row + n) + ')' + (row ? ':gt(' + (row - 1) + ')' : '');
		this.$(sel)._fill(fn, oldval).attr('height', h); // .css('line-height',h+'px');
		this.um && this.um.add(new $NXEdit({
			grid: this,
			selection: sel
		}, fn, oldval, h, function (t) {
			t.grid.resetHeights().resetSelection(true).$(sel); // .css('line-height',this.newval+'px');
		}));
		return this;
	}
	this.css = function (sel, style, newval, old) {
		var oldval = [], fn = ['css', style];
		this.$(sel)._fill(fn, oldval).css(style, newval);
		if (oldval.length == 1 && old !== undefined)
			oldval[0] = old;
		this.um && this.um.add(new $NXEdit({
			grid: this,
			selection: sel.clone()
		}, fn, oldval, newval));
		return this;
	}
	this.isCSS = function (sel, style, val) {
		var result = true;
		this.$(sel).each(function () {
			if ($(this).css(style) != val) {
				result = false;
				return false;
			}
		});
		return result;
	}
	this.focusedRight = function (r, c, nowrap) {
		c = this.cells[r][c].col2 + 1;
		if (c >= this.columns.length) {
			if ((++r) >= this.cells.length || nowrap)
				return null;
			c = 0;
		}
		var cell = this.cells[r][c];
		return !cell.virtual ? cell : this.focusedRight(r, c++);
	}
	this.focusedLeft = function (r, c, nowrap) {
		if ((--c) < 0) {
			if ((--r) < 0 || nowrap)
				return null;
			c = this.columns.length - 1;
		}
		var cell = this.cells[r][c];
		return cell.row == r ? cell : this.focusedLeft(r, c--);
	}
	this.focusedUp = function (r, c, nowrap) {
		if ((--r) < 0) {
			if ((--c) < 0 || nowrap)
				return null;
			r = this.cells.length - 1;
		}
		var cell = this.cells[r][c];
		return cell.col == c ? cell : this.focusedUp(r--, c);
	}
	this.focusedDown = function (r, c, nowrap) {
		r = this.cells[r][c].row2 + 1;
		if (r >= this.cells.length) {
			if ((++c) >= this.columns.length || nowrap)
				return null;
			r = 0;
		}
		var cell = this.cells[r][c];
		return !cell.virtual ? cell : this.focusedDown(r++, c);
	}
	this.insertRowsBefore = function (row, cnt) {
		var tr = this.trs[row];
		for (var i = 0; i < cnt; i++) {
			var newrow = $(tr.cloneNode(false));
			var therow = this.cells[row];
			var $tr = $(tr);
			this.$insertBefore(newrow, $tr);
			for (var col = 0; col < therow.length; col++) {
				var cell = therow[col];
				if (cell.row < row) {
					this.attr($(cell.srcEl), 'rowSpan', 1 + parseInt($(cell.srcEl).attr('rowSpan')));
				} else {
					var cloned = $(cell.srcEl).clone(false).empty().attr({
						rowSpan: 1,
						colSpan: 1
					});
					this.$append(newrow, cloned);
					for (var c = cell.col + 1; c <= cell.col2; c++) {
						this.$append(newrow, cloned.clone(false));
					}
				}
				col = cell.col2;
			}
		}
		return this;
	}
	this.$replace = function (replaced, by) {
	}
	this.$blankCell = function ($replaced) {
		var $with = $('<td>').css('height', $replaced.height());
		$replaced.replaceWith($with);
		this.um.add(new $NXEdit($replaced, [function () {
			this.$with.replaceWith(this.target);
			// this.$with[0].parentNode.replaceChild(this.target[0],
			// this.$with[0])
		}, function () {
			this.target.replaceWith(this.$with);
		}, {
			$with: $with
		}]));
		return $with;
	}
	this.insertRowsAfter = function (row, cnt) {
		var tr = this.trs[row];
		for (var i = 0; i < cnt; i++) {
			var newrow = $(tr.cloneNode(false));
			var therow = this.cells[row];
			var $tr = $(tr);
			this.$insertAfter(newrow, $tr);
			for (var col = 0; col < therow.length; col++) {
				var cell = therow[col];
				if (cell.row2 > row) {
					this.attr($(cell.srcEl), 'rowSpan', parseInt($(cell.srcEl).attr('rowSpan')) + 1);
				} else {
					var cloned = $(cell.srcEl).clone(false).empty().attr({
						rowSpan: 1,
						colSpan: 1
					});
					this.$append(newrow, cloned);
					for (var c = cell.col + 1; c <= cell.col2; c++) {
						this.$append(newrow, cloned.clone(false));
					}
				}
				col = cell.col2;
			}
		}
		return this;
	}
	this.changeComponentType = function (sel, newtype) {
		this.um.open(this.reset.bind(this));
		var changes = 0;
		for (var row = sel.row; row <= sel.row2; row++) {
			var therow = this.cells[row];
			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (!cell.virtual) {
					var $td = $(cell.srcEl);
					if (!$td.find(".jp-text-content").length) {
						var oldval = $td.html();
						var text = $td.text();
						$td.html("").append($('<div class="jp-text-content"></div>').text(text));
						var newval = $td.html();
						this.um.add(new $NXEdit($td, ['html'], oldval, newval));
						changes++;
					}
				}
			}
		}
		if (changes) {
			this.um.close();
			this.reset(this.t);
		} else
			this.um.cancel();
	}
	this.deleteCells = function (sel) {
		this.um.open(this.reset.bind(this));
		for (var row = sel.row; row <= sel.row2; row++) {
			var therow = this.cells[row];
			var $previousCell = this.previousCell(row, sel.col);
			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (!cell.virtual) {
					var $td = $(cell.srcEl);
					$previousCell = this.$blankCell($td);
				} else {
					// 是虚的
					// 应该新增一个cell
					var newtd = $('<td>');
					if ($previousCell)
						this.$insertAfter(newtd, $previousCell);
					else
						this.$prepend($(this.trs[row]), newtd);
					$previousCell = newtd;
				}
			}
		}
		this.um.close();
		this.reset(this.t);
	}, this.deleteRows = function (_row, _row2) {
		$.each(this.merged, function () {
			if (this.row < _row && this.row2 >= _row) {
				var drow = Math.min(_row2, this.row2) - _row2 + 1;
				this.srcEl.rowSpan -= drow;
			} else if (this.row >= _row && this.row <= _row2 && this.row2 > _row2) {
				this.srcEl.rowSpan = (this.row2 - _row2);
				this.status.cutfooter = true;
			}
		});
		if (this.cells.length - 1 > _row2) {
			var after = null, r2 = _row2 + 1, tr = this.trs[r2];
			for (var col = 0; col < this.columns.length; col++) {
				var cell = this.cells[r2][col];
				var $el = $(cell.srcEl);
				if (cell.status.cutfooter) {
					if (after) {
						this.$insertAfter($el, after);
					} else {
						if (tr.cells.length) {
							this.$insertBefore($el, $(tr.cells[0]));
						} else
							this.$append(tr, $el);
					}
					cell.status.cutfooter = false;
				}
				if (cell.row == r2) {
					after = $el
				}
			}
		}
		for (var row = _row; row <= _row2; row++) {
			this.$remove(this.trs[_row]);
		}
		return this;
	}
	this.clipboardEl = function () {
		var $result = $('#clipboard-el');
		if (!$result.length) {
			$result = $('<div id="clipboard-el"></div>').css('display', 'none').appendTo(document.body);
		}
		return $result.html('');
	}
	this.copy = function (sel) {
		// 创建一个空的表格
		var clonedtable = this.t.cloneNode();
		var tbdy = document.createElement('tbody');
		// 将选中单元格，复制到该表格
		for (var row = sel.row; row <= sel.row2; row++) {
			var tr = document.createElement('tr');
			var therow = this.cells[row];
			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (cell.row == row && !cell.virtual) {
					tr.appendChild(cell.srcEl.cloneNode(true));
				}
			}
			tbdy.appendChild(tr);
		}
		clonedtable.appendChild(tbdy);
		var $root = this.clipboardEl().append(clonedtable);
		this.inlineStyles(document, $root);
		//	alert($root.html());
		// 将此表格html，复制到剪贴板
		this.jp().copy($root.html(), 'html');
	}
	this.paste = function (pos) {
		// 创建一个空的表格
		this.jp().copied('html');
	}
	// this.merge = function (sel) {
	// 	var me = this;
	// 	var heightChanged = false;
	// 	var callback = function () {
	// 		if (heightChanged) {
	// 			me.reset(me.t).resetHeights();
	// 		} else
	// 			me.reset(me.t)
	// 	};
	// 	this.um.open(callback);
	// 	var el = this.cells[sel.row][sel.col].srcEl;
	// 	for (var row = sel.row; row <= sel.row2; row++) {
	// 		var therow = this.cells[row];
	// 		for (var col = sel.col; col <= sel.col2; col++) {
	// 			var cell = therow[col];
	// 			if (!cell.virtual && cell.srcEl != el) {
	// 				this.$remove(cell.srcEl);
	// 			}
	// 		}
	// 	}
	// 	var oldval = $(el).css('height');
	// 	this.attr($(el), 'colSpan', sel.colSpan).attr($(el), 'rowSpan', sel.rowSpan);
	// 	// 如果有高度合并的情况，则应将左上解的单元格高度，放大
	// 	if (sel.row2 > sel.row) {
	// 		heightChanged = true;
	// 		var newval = this.getCellHeight(sel);
	// 		// 使this.css -> _fill -> 只处理左上角单元格
	// 		sel.LTSrcEl = el;
	// 		this.css(sel, 'height', newval, oldval);
	// 	}
	// 	this.um.close();
	// 	this.reset(this.t).resetHeights();
	// 	return this;
	// }
	// this.unmerge = function (sel) {
	// 	var heightChanged = false;
	// 	this.um.open(function () {
	// 		if (heightChanged) {
	// 			this.reset(this.t).resetHeights();
	// 		} else
	// 			this.reset(this.t)
	// 	}.bind(this));
	// 	for (var row = sel.row; row <= sel.row2; row++) {
	// 		var therow = this.cells[row];
	// 		var after = this.beforeCellBase(row, sel.col).srcEl;
	// 		for (var col = sel.col; col <= sel.col2; col++) {
	// 			var cell = therow[col];
	// 			if (!cell.virtual) {// 如果是主单元，则改span
	// 				if (cell.merged) {
	// 					// 高度应该变化
	// 					if (cell.row2 > cell.row) {
	// 						heightChanged = true;
	// 						var oldval = $(cell.srcEl).css('height');
	// 						var sel2 = cell.clone();
	// 						sel2.LTSrcEl = cell.srcEl;
	// 						sel2.row2 = sel2.row;
	// 						var newval = this.getCellHeight(sel2);
	// 						// 使this.css -> _fill -> 只处理左上角单元格
	// 						this.css(sel2, 'height', newval, oldval);
	// 					}
	// 					this.attr($(cell.srcEl), 'colSpan', 1).attr($(cell.srcEl), 'rowSpan', 1);
	// 				}
	// 				after = $(cell.srcEl);
	// 			} else {
	// 				// 如果是辅单元，则插入
	// 				//after = this.$insertAfter($(cell.srcEl).clone(false).empty(), $(after));
	// 				after = this.$insertBefore($(cell.srcEl).clone(false).empty(), $(after));
	// 			}
	// 		}
	// 	}
	// 	this.um.close();
	// 	this.reset(this.t).resetHeights();
	// 	return this;
	// }
	this.merge = function (sel) {
		var me = this;
		var heightChanged = false;
		var callback = function () {
			if (heightChanged) {
				me.reset(me.t).resetHeights();
			} else
				me.reset(me.t)
		};
		this.um.open(callback);
		var el = this.cells[sel.row][sel.col].srcEl;
		for (var row = sel.row; row <= sel.row2; row++) {
			var therow = this.cells[row];
			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (!cell.virtual && cell.srcEl != el) {
					this.$remove(cell.srcEl);
				}
			}
		}
		var oldval = $(el).css('height');
		this.attr($(el), 'colSpan', sel.colSpan).attr($(el), 'rowSpan', sel.rowSpan);
		// 如果有高度合并的情况，则应将左上解的单元格高度，放大
		if (sel.row2 > sel.row) {
			heightChanged = true;
			var newval = this.getCellHeight(sel);
			// 使this.css -> _fill -> 只处理左上角单元格
			sel.LTSrcEl = el;
			this.css(sel, 'height', newval, oldval);
		}
		this.um.close();
		this.reset(this.t).resetHeights();
		return this;
	}
	this.unmerge = function (sel) {
		var heightChanged = false;
		this.um.open(function () {
			if (heightChanged) {
				this.reset(this.t).resetHeights();
			} else
				this.reset(this.t)
		}.bind(this));
		for (var row = sel.row; row <= sel.row2; row++) {
			var therow = this.cells[row];
			var beforecell = this.beforeCellBase(row, sel.col);
			var after = beforecell ? beforecell.srcEl : null;

			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (!cell.virtual) {// 如果是主单元，则改span
					if (cell.merged) {
						// 高度应该变化
						if (cell.row2 > cell.row) {
							heightChanged = true;
							var oldval = $(cell.srcEl).css('height');
							var sel2 = cell.clone();
							sel2.LTSrcEl = cell.srcEl;
							sel2.row2 = sel2.row;
							var newval = this.getCellHeight(sel2);
							// 使this.css -> _fill -> 只处理左上角单元格
							this.css(sel2, 'height', newval, oldval);
						}
						this.attr($(cell.srcEl), 'colSpan', 1).attr($(cell.srcEl), 'rowSpan', 1);
					}
					after = $(cell.srcEl);
				} else {
					// 如果是辅单元，则插入

					after = this.$insertAfter($(cell.srcEl).clone(false).empty(), after ? $(after) : null, $(this.trs[row]))
				}
			}
		}
		this.um.close();
		this.reset(this.t).resetHeights();
		return this;
	}
	this.attr = function ($target, prop, newval, callback) {
		var oldvals = [];
		$target.each(function () {
			oldvals.push($(this).attr(prop));
			$(this).attr(prop, newval);
		});
		this.um.add(new $NXEdit($target, ['attr', prop], oldvals, newval, callback));
		return this;
	}
	this.$insertAfter = function ($target, $after, $parent) {
		if ($after) {
			$target.insertAfter($after);
			this.um.add(new $NXEdit($target, [function () {
				this.target.remove();
			}, function () {
				this.target.insertAfter(this.after);
			}, {
				after: $after
			}]));
		} else {
			$parent.prepend($target);
			this.um.add(new $NXEdit($target, [function () {
				this.target.remove();
			}, function () {
				this.$parent.prepend(this.target);
			}, {
				$parent: $parent
			}]));
		}
		return $target;
	}
	this.$insertBefore = function ($target, $before, $parent) {
		if ($before) {
			$target.insertBefore($before);
			this.um.add(new $NXEdit($target, [function () {
				this.target.remove();
			}, function () {
				this.target.insertBefore(this.before);
			}, {
				before: $before
			}]));
		} else {
			$parent.append($target);
			this.um.add(new $NXEdit($target, [function () {
				this.target.remove();
			}, function () {
				this.$parent.append(this.target);
			}, {
				$parent: $parent
			}]));
		}
		return $target;
	}
	this.$prepend = function ($parent, $target) {
		$parent.prepend($target);
		this.um.add(new $NXEdit($target, [function () {
			this.target.remove();
		}, function () {
			this.$parent.prepend(this.target);
		}, {
			$parent: $parent
		}]));
		return $target;
	}
	this.$append = function (parent, target) {
		var $parent = $(parent), $target = $(target);
		$parent.append($target);
		this.um.add(new $NXEdit($target, [function () {
			this.target.remove();
		}, function () {
			this.$parent.append(this.target);
		}, {
			$parent: $parent
		}]));
		return $target;
	}
	this.$insertCell = function ($prevCell) {
		// this.$insertAfter($('<td>11111111111dddddddddddddd</td>'),
		// $(this.trs[row].cells[3]));
		// return;
		var $with = $('<td>11111111111dddddddddddddd</td>').$insertAfter($(this.trs[row].cells[3]));
		// this.trs[row].insertCell($with[0],cellIndex);
		this.um.add(new $NXEdit($with, [function () {
			// this.target.remove();
		}, function () {
			this.tr.insertCell(this.target[0], this.cellIndex);
		}, {
			tr: this.trs[row],
			cellIndex: cellIndex
		}]));
		return this;
	}
	this.$remove = function (target) {
		var edit = null, $target = $(target);
		if ($target.is('td')) {
			edit = new $NXEdit($target, [function () {
				if (this.cellIndex) {
					// 如果是第一个单元格
					this.target.insertAfter(this.parent[0].cells[this.cellIndex - 1]);
				} else
					this.parent.prepend(this.target);
			}, function () {
				this.target.remove();
			}, {
				cellIndex: $target[0].cellIndex,
				parent: $target.parent()
			}]);
		} else {
			edit = new $NXEdit($target, [function () {
				this.target.insertAt(this.parent, this.index);
			}, function () {
				this.target.remove();
			}, {
				index: $target.index(),
				parent: $target.parent()
			}]);
		}
		$target.remove();
		this.um.add(edit);
		return $target;
	}
	this.openUndo = function (callback) {
		this.um.open(callback);
	}
	this.closeUndo = function () {
		this.um.close();
	}
	this.addUndo = function (edit) {
		this.um.add(edit);
	}
	this.setBorder = function (sel, borders) {
		/*
		 * 输入参数：selected=[left,right,center,top,bottom,middle]
		 * 如果是左边(adg)，使用border-left =selected.left
		 * 如果是上边(abc)，使用border-top=selected.top; 如果是下边(ghi),
		 * 使用border-bottom=selected.bottom 如果是右边(cfi), 使用 border-right =
		 * selected.right;
		 * 
		 * 如果下边还没处理,则 border-bottom = selected.middle; 如果右边还没处理,则 border-right =
		 * selected.center;
		 */
		this.um.open();
		for (var row = sel.row; row <= sel.row2; row++) {
			var therow = this.cells[row];
			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (!cell.virtual) {
					var css = {
						bottom: borders.middle,
						right: borders.center
					};
					if (cell.col == sel.col)
						css.left = borders.left;
					if (cell.col2 == sel.col2)
						css.right = borders.right;
					if (cell.row == sel.row)
						css.top = borders.top;
					if (cell.row2 == sel.row2)
						css.bottom = borders.bottom;
					for (side in css) {
						var prop = 'border-' + side;
						prop += '-style';
						var old = $.style(cell.srcEl, prop) || '';
						this.css(cell, prop, css[side], old);
					}
				}
			}
		}
		if (sel.row == 0) {
			this.offsetParentDiv().resetWidths().resetHeights();
		}
		this.um.close();
		return this;
	}
	this.setFont = function (sel, font) {
		this.um.open();
		for (var row = sel.row; row <= sel.row2; row++) {
			var therow = this.cells[row];
			for (var col = sel.col; col <= sel.col2; col++) {
				var cell = therow[col];
				if (!cell.virtual) {
					var css = {
						bottom: borders.middle,
						right: borders.center
					};
					if (cell.col == sel.col)
						css.left = borders.left;
					if (cell.col2 == sel.col2)
						css.right = borders.right;
					if (cell.row == sel.row)
						css.top = borders.top;
					if (cell.row2 == sel.row2)
						css.bottom = borders.bottom;
					for (side in css) {
						var prop = 'border-' + side;
						prop += '-style';
						var old = $.style(cell.srcEl, prop) || '';
						this.css(cell, prop, css[side], old);
					}
				}
			}
		}
		if (sel.row == 0) {
			this.offsetParentDiv().resetWidths().resetHeights();
		}
		this.um.close();
		return this;
	}
	this.offsetParentDiv = function () {
		/*
		 * var cells=this.trs[0].cells; var maxWidth=0; for(var i=0;i<cells.length;i++){
		 * var w=parseFloat(jQuery.curCSS(cells[i],"borderTopWidth",true))||0;
		 * if(w>maxWidth) maxWidth=w; }
		 */
		// var tdOff = this.$t.parent().closest('td').offset();
		var p = $(this.trs[0].cells[0]).position();
		this.$t.parent().css({
			'top': -p.top,
			'left': -p.left
		});
		return this;
	}
	this.getBound = function (cell) {
		var h = 0;
		for (var r = cell.row; r <= cell.row2; r++) {
			h += this.heights[r];
		}
		var w = 0;
		for (var c = cell.col; c <= cell.col2; c++) {
			w += this.widths[c];
		}
		return {
			top: this.rowy[cell.row] - 1,
			left: this.colx[cell.col] - 1,
			width: w - this.tdOuter + 3,
			height: h - this.tdOuter + 3
		}
	}
	this.getCellHeight = function (cell) {
		var h = -this.tdOuter;
		for (var r = cell.row; r <= cell.row2; r++) {
			h += this.heights[r];
		}
		return h;
	}
	this.resetWidths = function () {
		this.widths = [];
		var xy = $(this.trs[0].cells[0]).position();
		// var xy=$(this.trs[0].cells[0]).position();
		this.colx = [xy.left];
		var me = this, x = xy.left;
		$.each(this.columns, function (i) {
			var w = parseInt($(this).attr('width'));
			x += w;
			me.widths.push(w);
			me.colx.push(x);
			// ie，有可能，<col width>不起作用，加减后
			$(this).attr('width', w);
			var separator = me.colSeparators[i] || $(me.colSeparators[0]).clone().appendTo(me.$t.parent());
			$(separator).css({
				'left': x + 1,
				'display': 'block'
			});
			me.colSeparators[i] = $(separator).data('colIndex', i);
		});
		// 有可能多出来的分割条，隐藏它
		for (var i = this.columns.length; i < this.colSeparators.length; i++)
			$(this.colSeparators[i]).css('display', 'none');
		// $(this.columns[0]).attr($(this.columns[0]).attr('width'));
		this.$t.width(x);
		this.resizelistener();
		return this;
	}
	this.resetSections = function () {
		if (!this["static"]) {
			var settings = $parent.data("saved-options")["options"];
			this.$t.find("tr").removeClass("ex").slice(settings["header-rows"] + 1, settings["header-rows"] + settings["body-rows"]).addClass("ex");
		}
		return this;
	}
	this.resetHeights = function () {
		if (!this["static"] && !this.$t.is(".auto-break")) {
			var detailstartrow = $parent.data("saved-options")["options"]["header-rows"] || 0;
			var h = parseInt($(this.trs[detailstartrow]).attr('height')) || 30;// $(this).height();//
			setTrStyle(this.t.id, h);
		}
		this.heights = [];
		var xy = $(this.trs[0].cells[0]).position();
		this.rowy = [xy.top];
		var me = this, y = xy.top;
		$.each(this.trs, function (i) {
			var h = parseInt($(this).attr('height')) || 30;// $(this).height();//
			// parseInt($(this).attr('clientHeight'));
			// 在本行上的所有单元格，显式设置高度，便于单元格内对象，100%对齐
			// debugger;
			var cells = this.cells;
			$.each(this.cells, function (i) {
				// 这里面可能有合并单元格
				$(this).css('height', h);
			});
			h = $(this).height();
			y += h;
			me.heights.push(h);
			me.rowy.push(y);
			var separator = me.rowSeparators[i] || $(me.rowSeparators[0]).clone().appendTo(me.$t.parent());
			$(separator).css('top', y - 2);
			me.rowSeparators[i] = $(separator).data('rowIndex', i);
		});
		for (var i = this.trs.length; i < this.rowSeparators.length; i++)
			$(this.rowSeparators[i]).css('display', 'none');
		// 合并单元格的高度需要重新调整
		$.each(this.merged, function (i) {
			$(this.srcEl).css('height', me.getCellHeight(this));
		});
		// this.$t.parent().height(y+4);
		// debugger;
		dimsChanged = true;
		heightsChanged = true;
		this.repositionHelpUI();
		this.resizelistener();
		return this;
	}
	this.getCell = function (x, y) {
		if (!this.ready || x < 0 || y < 0 || x > this.$t.width() || y > this.$t.height())
			return null;
		var row = this.rowy._LT(y) - 1;
		if (row >= this.heights.length)
			row--;
		else if (row < 0)
			row = 0;
		var col = this.colx._LT(x) - 1; // if (col >= this.widths.length) col--;
		return this.cells[row][col];
	}
	this.resetSelection = function (noheader) {
		return this.resizeSelection(this.selection, noheader);
	}
	this.layout = function () {
		this.$t.css('width', 10); // this.trs[0].height=this.trs[0].offsetHeight;
		// var $col = $(this.columns[0]);
		// $col.attr('width',$col.attr('width'));
	}
	this.selectedCache = null;// 选中对象缓存，在this.resizeSelection()时，置null,在this.$s()时重设
	this.resizeSelection = function (sels, noheader) {
		if (sels) {
			sels.reset(this.heights.length, this.widths.length);
			var b = this.getBound(sels), tpos = this.$t.position();
			b.top += (tpos.top + this.$t.parent().scrollTop());
			b.left += (tpos.left + this.$t.parent().scrollLeft());
			this.$selection.css(b);
			this.selectedCache = null;
			this.selection = sels.clone();
			$s().unselect();
			this.$s().select();
		}
		return this;
	}
	// 取得cell在row中的cellIndex
	this.cellIndex = function (row, col) {
		var row = this.cells[row];
		var result = -1;
		for (var c = 0; c < col; c++) {
			// 如果不是shadow的，则记录其index;
			if (!row[c].virtual)
				result = row[c].srcEl.cellIndex;
		}
		return result + 1;
	}
	// 取得本行最接近col的单元格
	this.previousCell = function (row, col) {
		var row = this.cells[row];
		var result = -1;
		for (var c = 0; c < col; c++) {
			// 如果不是shadow的，则记录其index;
			if (!row[c].virtual)
				return $(row[c].srcEl);
		}
		return null;
	}
	this.reset = function () {
		var me = this;
		this.cells = [];
		this.merged = [];
		this.columns = []; //
		this.trs = t.rows;
		var rowspans = [];
		for (var i = 0; i < t.rows.length; i++) {
			this.cells[i] = [];
		}
		for (var i = 0; i < t.rows.length; i++) {
			var row = t.rows[i];
			var firstAvailCol = 0;
			for (var j = 0; j < row.cells.length; j++) {
				while (rowspans[firstAvailCol]) {
					rowspans[firstAvailCol]--;
					firstAvailCol++;
				}
				var td = row.cells[j];
				// cell={row,col,colSpan,rowSpan,srcEl,status,merged}
				// <TD>.myCell = Cell
				// 
				// this.cells[row,col] = Cell, 如果是合并单元格，被覆盖的单元格 用
				// Cell.clone填充，并Cell.virtual=true
				// this.merged[i] = Cell
				// this.trs[i] = <TR>
				// this.columns[i] = <Col>
				var cell = new Cell(td.parentNode.rowIndex, firstAvailCol, td.colSpan, td.rowSpan);
				cell.srcEl = td;
				cell.status = {};
				td.myCell = cell;
				if (cell.merged) {
					this.merged.push(cell);
					var cloned = cell.clone();
					cloned.virtual = true;
					for (var r = cell.row; r <= cell.row2; r++) {
						for (var c = cell.col; c <= cell.col2; c++) {
							this.cells[r][c] = cloned;
						}
					}
				}
				this.cells[cell.row][cell.col] = cell;
				for (var c = 0; c < td.colSpan; c++) {
					rowspans[firstAvailCol] = td.rowSpan - 1;
					firstAvailCol++;
				}
			}
			for (var c = firstAvailCol; c < rowspans.length; c++) {
				if (rowspans[c])
					rowspans[c]--;
			}
		} // ~{<FKc~} colgroup
		$('colgroup col', t).each(function () {
			me.columns.push(this);
		});
		this.ready = true;
		return this;
	}
} //
// $.fn.noExcel
(function ($) {
	$.fn.caret = function (p) {

		this[0].selectionStart = p;
		this[0].selectionEnd = p;
		return this;
	};
	$.fn.noExcel = function (options) {
		options = $.extend({
			undo: true,
			resizelistener: $.noop,
			undolistener: $.noop
		}, options);
		var sels = null, selectionborders = null,
			// 选中对象缓存，在select()时，置null,在$s()时重设
			selectedCache = null;
		var select = function (tl, br) {
			selectedCache = null;
			sels = tl.myCell.clone().union(br.myCell), cells = [], intermerged = true;
			while (intermerged) {
				intermerged = false;
				$.each(grid.merged, function () {
					if (sels.intersects(this) && !sels.contains(this)) {
						sels = sels.union(this);
						intermerged = true;
					}
				});
			}
			grid.resizeSelection(sels);
		}
		var me = this[0], $me = $(me);
		var grid = new Grid(me);
		if (!grid["static"] && grid.$t.closest('.jp-table').data("saved-options")["options"]["break"] == "auto") {
			grid.$t.addClass("auto-break");
		}
		grid.resizelistener = options.resizelistener;
		grid.resetSections().reset().resetHeights().resetWidths();
		var $parent = $me.parent(), $selection = $parent.find('.selection-frame'), $selectable = $parent.find('.jp-selected-layer'), $selectionbg = $selection
			.find('.selection-bg'), $celleditor = $parent.find('input'), $handle = $parent.find('.jp-table-move-handle'), td0 = null, lasttd = null, down = false, hit = function (
				e) {
				var offset = $me.offset();
				// console.log(e.pageX, e.pageY);
				e.cell = grid.getCell((e.pageX - offset.left) / viewscale + $parent.scrollLeft(), (e.pageY - offset.top) / viewscale + $parent.scrollTop());
				return e;
			}, _mousemove = function (e) {
				if (!$(document.body).is('.jp-creating')) {
					if (e.target == $selectionbg[0])
						e = hit(e);
					// else
					// 	console.log("no hits");
					var td2 = e.cell ? e.cell.srcEl : $(e.target).closest('td')[0];
					// console.log(td2.innerText);
					if (td2 && td2 != lasttd && td2.myCell) {
						lasttd = td2;
						select(td0, lasttd);
					}
				}
			}, _mousedown = function (e) {
				if (e.which > 1)
					return;
				// document.onselectstart = function () {
				// 	return false;
				// }
				// me.onselectstart = function () {
				// 	return false;
				// }
				$me.bind('mousemove', _mousemove);
				// .hover(function() {
				// $handle.css("display", "block");
				// }, function() {
				// setTimeout(function() {
				// if (!$parent.is(":hover"))
				// $handle.css("display", "none");
				// }, 5000);
				// });
				$selectionbg.bind('mousemove', _mousemove);
				td0 = e.cell ? e.cell.srcEl : $(e.target).closest('td')[0];
				td0 && td0.myCell && select(td0, td0);
				$parent.data('no-excel').trigger("focus");
				// $parent.addClass('cell-selected');
			},
			// 如果正在创建对象，则指出将落下的单元格
			lastdropcell = null, _dropdown = function (e) {
				var e2 = null;
				if ($(document.body).is('.jp-creating') && (e2 = hit(e)).cell) {
					if (!lastdropcell || lastdropcell.srcEl != e2.cell.srcEl) {
						var b = grid.getBound(e2.cell);
						// 缩小些，可以让单元格内的虚框不与td的边框重复
						b.left += 3;
						b.top += 3;
						b.width -= 8;
						b.height -= 8;
						$('.drop-frame').css(b);
						$parent.addClass('active-frame');
						lastdropcell = e2.cell;
					}
				}
			}
		// $me.parent().bind('mousemove',_dropdown);
		$selectionbg.mousedown(function (e) {
			_mousedown(hit(e));
		});
		$selectable.mousedown(function (e) {
			$parent.unselect();
			_mousedown(hit(e));
		});
		$(this).mousedown(_mousedown).parent().mouseup(function () {
			$me.unbind('mousemove', _mousemove);
			$selectionbg.unbind('mousemove', _mousemove);
		});
		// 安装弹出式菜单
		var resizeinfo = {};
		var __mousemove = function (e) {
			if (resizeinfo.fortop) {
				var p = resizeinfo.localStartX + (e.pageX - resizeinfo.pageStartX) / viewscale;
				if (p > resizeinfo.floor)
					resizeinfo.$handle.css('left', p);
			} else {
				var p = resizeinfo.localStartY + (e.pageY - resizeinfo.pageStartY) / viewscale;
				if (p > resizeinfo.floor)
					resizeinfo.$handle.css('top', p);
			}
		}
		this.parent().mousedown(function (e) {
			var fortop = $(e.target).is('.col-separator');
			if (fortop || $(e.target).is('.row-separator')) {
				// 取得mytable的容易content-div的左上角位置，有可能，第一个单元格设置边框时，cell.left,top不为0
				resizeinfo.parentPos = {
					left: 0,
					top: 0
				};// $(grid.trs[0].cells[0]).position();
				var parent = document;
				$(parent).bind('mousemove', __mousemove).one('mouseup', function () {
					$(parent).unbind('mousemove', __mousemove);
					$(grid.$t).css('cursor', 'default');
					if (!resizeinfo.fortop) {
						// debugger;
						var newsize = parseInt(resizeinfo.$handle.css('top')) - resizeinfo.floor, multiple = sels && resizeinfo.index >= sels.row && resizeinfo.index <= sels.row2;
						if (multiple)
							grid.resizeRows(sels.row, sels.rowSpan, newsize);
						else
							grid.resizeRows(resizeinfo.index, 1, newsize);
						grid.resetHeights();
					} else {
						// debugger;
						var newsize = parseInt(resizeinfo.$handle.css('left')) - resizeinfo.floor, multiple = sels && resizeinfo.index >= sels.col && resizeinfo.index <= sels.col2;
						if (multiple)
							grid.resizeColumns(sels.col, sels.colSpan, newsize);
						else
							grid.resizeColumns(resizeinfo.index, 1, newsize);
						grid.resetWidths();
					}
					grid.resizeSelection(sels, true);
					resizeinfo.$handle.hide();
				}) //
				resizeinfo.fortop = fortop;
				resizeinfo.$handle = $parent.find('.rubber');
				if (!resizeinfo.fortop) {
					resizeinfo.index = $(e.target).data('rowIndex');
					resizeinfo.floor = grid.rowy[resizeinfo.index];
					// 拖动行的位置,相对于table的parent
					resizeinfo.localStartY = grid.rowy[resizeinfo.index + 1];
					// 鼠标开始拖动处
					resizeinfo.pageStartY = e.pageY;
					resizeinfo.$handle.css({
						top: resizeinfo.localStartY,
						height: '1px',
						left: '0px',
						width: Math.max($me.width(), $parent.width() - 20)
					}).show();
					$(grid.$t).css('cursor', 's-resize');
				} else {
					resizeinfo.index = $(e.target).data('colIndex');
					resizeinfo.floor = grid.colx[resizeinfo.index];
					// 拖动列的位置,相对于table的parent
					resizeinfo.localStartX = grid.colx[resizeinfo.index + 1];
					// 鼠标开始拖动处
					resizeinfo.pageStartX = e.pageX;
					resizeinfo.$handle.css({
						left: resizeinfo.localStartX,
						width: '1px',
						top: '0px',
						height: Math.max($me.height(), $parent.height() - 20)
					}).show();
					$(grid.$t).css('cursor', 'e-resize');
				}
			}
		});
		function HtmlEditor() {
			var me = this;
			this.close = function () {
				window["htmlediting"] = false;
				window.getSelection().removeAllRanges();
				this.target.closest('.jp-table').removeClass("htmlediting");
				$(this.target).find(".jp-text-content")//
					.off(".htmleditor").attr("contenteditable", false);
				this.$page.off('.htmleditor');
				$(document).off('.htmleditor');
				if (undomanager) {
					var content = $(this.target).find('.jp-text-content');
					var html = content.html();
					if (html != this.html) {
						var td = this.el;
						undomanager.add(new $NXEdit({
							grid: grid,
							selection: td.myCell.clone()
						}, ['html'], this.html, $(td).html(), function (t) {
							t.grid.resetHeights().resizeSelection(t.selection, true);
						}));
					}
				}
				grid.resetHeights().resetSelection(true);
				gEditing = false;
			};
			this.doc_mousedown = function (e) {
				me.close();
			};
			this.selectionchange = function (e) {
				// 设置字体
				var fontName = document.queryCommandValue("FontName");
				$(".right-bar #jp-font-chooser").val(fontName);
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
					$sizechooser.val(fontSize + " pt");
				}
			};
			this._ignored = function (e) {
				e.stopPropagation();
			};
			this.open = function (target) {
				this.target = target;
				this.$page = target.closest(".jp-page");
				this.el = target[0];
				window["htmlediting"] = true;
				$(this.target).closest('.jp-table').addClass("htmlediting");
				this.html = $(target).addClass("htmlediting").find(".jp-text-content")//
					.on("mousedown.htmleditor", this._ignored).on("keydown.htmleditor", this._ignored).on("selectstart.htmleditor", this.selectionchange).attr(
						"contenteditable", true).focus().html();
				this.$page.on('mousedown.htmleditor', this.doc_mousedown);
				$(document).on("selectionchange.htmleditor", this.selectionchange);
				gEditing = true;
				// window["mydraggable-disabled"] = true;
				// $('.my-editable').mousedown(function (e) {
				// 	e.stopPropagation();
				// });
				// window["mydraggable-disabled"] = true;
				// $(target).find(".jp-text-content").focus()
				// $("<div contenteditable style='width:40%;height:40%;'>hello;</div>").appendTo($page);//.focus();
			}
		}
		/* 文件，标签双击编辑器 */
		function InplaceCellEditor() {
			var me = this;
			this.$editor = $("<textarea class='jp-inplace-editor' type='text' style='border2:none;'></textarea>");
			this.on = false;
			this.listenEditor = function (on) {
				if (!on) {
					this.$editor.off('.cell-editor');
				} else if (!this.on && on) {
					this.$editor.on('blur.cell-editor', this.onblur);
					this.$editor.on('keydown.cell-editor', this.onkeydown);
					this.$editor.on('keypress.cell-editor', this.onkeypress);
				}
			}
			this.onkeydown = function (e) {
				return focusmove(e.keyCode, e, true);
			}
			this.onkeypress = function (e) {
				focusmove(e.keyCode, e, true);
				e.stopPropagation();
			}
			this.onblur = function () {
				//me.close();
			}
			this.close = function () {
				if (this.editing) {
					this.editing = false;
					gEditing = false;
					var td = this.el;
					if (td) {
						var oldval = this.oldtext;
						$(td).html('<span class="expr">' + this.enter2brace(this.$editor.val()) + '</span>');
						this.$editor.hide();
						if (undomanager) {
							undomanager.add(new $NXEdit({
								grid: grid,
								selection: td.myCell.clone()
							}, ['text'], oldval, $(td).text(), function (t) {
								t.grid.resetHeights().resizeSelection(t.selection, true);
							}));
						}
					}
					$(this.target).removeClass('jp-inplace-editing').closest('.jp-table').removeClass('cell-editing');
					$(this.td).parent().attr('height', $(this.td).parent().height());
					listenDocument(true);
					this.listenEditor(false);
					gActiveEditor = null;
					grid.resetHeights().resetSelection(true);
					// $(this.target).removeClass('jp-inplace-editing');
					// var content = $(this.target).find('.jp-text-content');
					// var text = $(this.editor).val();
					// if (this.isText && !text.match(/^[\s]*$/)) {
					// // text = '${' + text + '}';
					// }
					// text = this.enter2brace(text);
					// var oldval = content.html();
					// content.html(text);
					// var newval = content.html();
					// if (newval != oldval) {
					// undo.add(new $Edit(content, ['html'], oldval, newval));
					// }
					// $(document).off('.editing');
					// this.editor.off('.editing').remove();
					// gEditing = false;
					// this.target = null;
				}
			}
			this.autoHeight = function () {
				//		this.editor.height(this.editor[0].scrollHeight);
				//	this.target.height(this.editor[0].scrollHeight);
			}
			this.open = function (target, key) {
				this.editing = true;
				gEditing = true;
				this.target = target;
				this.el = target[0];
				// this.editor.appendTo(target).cssFrom(target,
				// ['font-size']).val($(target)
				// 取 span里的内容
				var text = $('.expr', target).html() || '';
				this.oldtext = this.brace2enter(text);
				var height = $(target).height();
				$(target).text('');
				text = this.brace2enter(text);
				this.$editor.appendTo(target).css({
					'height': height,
					'width': $(target).width() - 2,
					//	'line-height' : ($(target).height() - 2) + "px",
					'font-size': $(target).css('font-size'),
					'float': 'left',
					'font-family': $(target).css('font-family'),
					'text-align': $(target).css('text-align')
				}).val(key || text).show().focus();//.focusTextToEnd();
				$(target).addClass('jp-inplace-editing').closest('.jp-table').addClass('cell-editing');
				// this.autoHeight();
				// $(document).unbind('keydown,mousedown');// , this.mousedown);
				// $(document).on('mousedown.editing', this.mousedown);
				// this.editor.on("input.editing", function() {
				// me.autoHeight();
				// });
				// this.target.css("height", "");
				gActiveEditor = this;
				listenDocument(false);
				this.listenEditor(true);
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
		var _inplaceEditor = new InplaceCellEditor();
		var _htmleditor = null;
		// 去掉在线编辑功能
		$parent.dblclick(function (e) {
			var offset = $me.offset();
			var x = e.pageX - offset.left + $parent.scrollLeft(), y = e.pageY - offset.top + $parent.scrollTop(), cell = grid.getCell(x, y);
			if (cell && cell.srcEl) {
				var $jptable = $(cell.srcEl).closest(".jp-table");
				var hittest = 0;
				if (!$jptable.is('.jp-static')) {
					var tbsettings = $jptable.data("saved-options")["options"] || {};
					hittest = hitTest(tbsettings, cell.row);
				}
				if (hittest != 2) {
					var text = $(cell.srcEl).text();
					var expression = text.match(/^\$\{([^}]*)[}]$/);
					if (expression) {
						// text =
						// $jptable.data("saved-options")["dataset"] +
						// "." + expression[1];
						if ($('.expr', cell.srcEl).hasClass('mutable')) {
							return null;
						}
					}
					if ($(cell.srcEl).find(".jp-text-content").length) {
						if (!_htmleditor)
							_htmleditor = new HtmlEditor();
						_htmleditor.open($(cell.srcEl));
					} else
						_inplaceEditor.open($(cell.srcEl));
					return;
				}
			}
		});
		var focusmove = function (key, e, fromCellEditor) {
			var keys = NoExcel.KEYS, cell = null;
			if (e.type == 'keydown') {
				switch (key) {
					case keys.UP:
						cell = grid.focusedUp(sels.row, sels.col, true);
						break;
					//					case keys.TAB :
					//						cell = grid.focusedRight(sels.row, sels.col, false); // continued
					//						// =
					//						// false;
					//						break;
					case keys.RIGHT:
						!fromCellEditor && (cell = grid.focusedRight(sels.row, sels.col, true));
						break;
					case keys.LEFT:
						!fromCellEditor && (cell = grid.focusedLeft(sels.row, sels.col, true));
						break;
					case keys.DOWN:
						//			case keys.RETURN :
						cell = grid.focusedDown(sels.row, sels.col, key != keys.RETURN);
						if (cell == null) {
							_inplaceEditor.close();
						}
						break;
					default:
						break;
				}
			} else {
				switch (key) {
					//					case keys.UP :
					//						cell = grid.focusedUp(sels.row, sels.col, true);
					//						break;
					case keys.TAB:
						cell = grid.focusedRight(sels.row, sels.col, false); // continued
						// =
						// false;
						break;
					//					case keys.RIGHT :
					//						!fromCellEditor && (cell = grid.focusedRight(sels.row, sels.col, true));
					//						break;
					//					case keys.LEFT :
					//						!fromCellEditor && (cell = grid.focusedLeft(sels.row, sels.col, true));
					//						break;
					//					case keys.DOWN :
					//						//			case keys.RETURN :
					//						cell = grid.focusedDown(sels.row, sels.col, key != keys.RETURN);
					//						if (cell == null) {
					//							_inplaceEditor.close();
					//						}
					//						break;
					default:
						break;
				}
			}
			if (cell) {
				_inplaceEditor.close();
				grid.resizeSelection(sels = cell.clone());
				return false;
			};
		};
		/*
		 * $celleditor.blur(function() { gEditing = false; var td =
		 * $celleditor.data('fortd'); if (td) { var oldval = $(td).text();
		 * $(td).html('<span class="expr">' + $celleditor.val() + '</span>');
		 * $celleditor.data('fortd', null).hide(); if (undomanager) {
		 * undomanager.add(new $NXEdit({ grid : grid, selection :
		 * td.myCell.clone() }, ['text'], oldval, $(td).text(), function(t) {
		 * t.grid.resizeSelection(t.selection, true); })); gActiveEditor = null; } }
		 * }).keydown(function(e) { return focusmove(e.keyCode, e);
		 * }).keypress(function(e) { focusmove(e.keyCode, e);
		 * e.stopPropagation(); }).focus(function() { gEditing = true; })
		 */
		function dockeydown(e) {
			if (!gEditing && NoExcel.$active)
				return focusmove(e.keyCode, e);
		}
		function dockeypress(e) {
			if (!gEditing && !$(e.target).is('input') && NoExcel.$active) {
				var ctrls = e.which == 0, key = e.keyCode || e.which;
				if (!ctrls && key != 13) {
					var cell = grid.cells[sels.row][sels.col];
					if (cell) {
						var b = grid.getBound(cell);
						_inplaceEditor.open($(cell.srcEl), String.fromCharCode(key));
						return false;
					}
				}
			}
		}
		var listeningDoc = false;
		function listenDocument(on) {
			if (on) {
				if (!listeningDoc) {
					$(document).on('keydown.grid', dockeydown).on('keypress.grid', dockeypress);
					listeningDoc = true;
				}
			} else if (listeningDoc) {
				$(document).off('.grid');
				listeningDoc = false;
			}
		}
		$(document).mousedown(function (e) {
			if (_inplaceEditor.$editor[0] != e.target && !$(e.target).closest('li').is('.jp-draggable-field')) {
				_inplaceEditor.close();
			}
		});
		var undomanager = null;
		if (options.undo) {
			grid.um = undomanager = options.undo;// new
			// Undo(grid,options.undolistener);
		}
		return { // ~{AP2YWw~}
			copy: function (cell) {
				// alert('hello,core!');
				// grid.copy(cell);
			},
			cut: function () {
				// noexcel.cut();
			},
			paste: function (cell) {
				// grid.paste(cell);
			},
			'delete': function (cell) {
				grid.deleteCells(cell || sels);
			},
			trySelect: function (x, y) {
				if (!$(document.body).is('.jp-creating')) {
					var offset = $me.offset();
					var cell = grid.getCell(x - offset.left + $parent.scrollLeft(), y - offset.top + $parent.scrollTop());
					var td2 = cell ? cell.srcEl : null;
					if (td2 && td2 != lasttd && td2.myCell) {
						lasttd = td2;
						select(lasttd, lasttd);
						$parent.data('no-excel').trigger("focus");
					}
					return cell;
				}
				return null;
			},
			trigger: function (type) {
				if (type == 'focus') {
					if (NoExcel.$active) {
						NoExcel.$active.data('no-excel').trigger("blur");
					}
					$('.jp-table').removeClass('cell-selected');
					NoExcel.$active = $parent.addClass('cell-selected');
					listenDocument(true);
				} else if (type == 'blur') {
					NoExcel.$active.removeClass('cell-selected');
					NoExcel.$active = null;
					listenDocument(false);
				}
			},
			insertColumnsBefore: function (col, count) {
				grid.openUndo(function () {
					grid.reset().resetWidths()
				});
				for (var i = 0; i < count; i++) {
					grid.insertColumn(col, true);
				}
				grid.closeUndo();
				grid.reset().resetWidths();
			},
			insertColumnsAfter: function (col, count) {
				grid.openUndo(function () {
					grid.reset().resetWidths()
				});
				for (var i = 0; i < count; i++) {
					grid.insertColumn(col, false);
				}
				grid.closeUndo();
				grid.reset().resetWidths();
			},
			deleteColumns: function (col, col2) {
				grid.deleteColumns(col, col2).reset().resetWidths().resetSelection(true);
			},
			// ~{PP2YWw~}
			insertRowsBefore: function (row, count, cell) {
				grid.openUndo(function () {
					grid.reset().resetHeights().resetSections();
				});
				var $tablecomp = grid.$t.closest('.jp-table');
				if (!$tablecomp.is('.jp-static')) {
					var oldsettings = $tablecomp.data("saved-options")["options"];
					var newsettings = $.extend({}, oldsettings);
					var bodycell = bodyCell(newsettings);
					// 区域自动扩展时，不允许在master和扩展行之间，加行
					if (oldsettings["break"] == "auto" && cell.row == oldsettings["header-rows"] + 1) {
						return;
					}
					grid.insertRowsBefore(row, count);
					if (cell.row < newsettings["header-rows"] + 1) {
						newsettings["header-rows"] += count;
					} else if (cell.row <= bodycell.row2) {
						newsettings["body-rows"] += count;
					} else {
						newsettings["footer-rows"] += count;
					}
					$tablecomp.data("saved-options")["options"] = newsettings;
					grid.addUndo(new $NXEdit($tablecomp, [function () {
						this.target.data("saved-options")["options"] = this.oldval;
					}, function () {
						this.target.data("saved-options")["options"] = this.newval;
					}, {
						oldval: oldsettings,
						newval: newsettings
					}]));
				} else {
					grid.insertRowsBefore(row, count);
				}
				grid.closeUndo();
				grid.reset().resetHeights().resetSections();
			},
			setBodyRows: function (rows) {
				var $tablecomp = grid.$t.closest('.jp-table');
				var oldsettings = $tablecomp.data("saved-options")["options"];
				var newsettings = $.extend({}, oldsettings);
				var oldrows = oldsettings["body-rows"];
				if (rows == oldrows)
					return;
				grid.openUndo(function () {
					grid.reset().resetHeights().resetSections();
				});
				var masterrow = oldsettings["header-rows"] || 0;
				newsettings["body-rows"] = rows;
				if (rows > oldrows) {
					grid.insertRowsAfter(masterrow, rows - oldrows);
				} else {
					grid.deleteRows(masterrow + 1, masterrow + oldrows - rows);
				}
				$tablecomp.data("saved-options")["options"] = newsettings;
				grid.addUndo(new $NXEdit($tablecomp, [function () {
					this.target.data("saved-options")["options"] = this.oldval;
				}, function () {
					this.target.data("saved-options")["options"] = this.newval;
				}, {
					oldval: oldsettings,
					newval: newsettings
				}]));
				grid.closeUndo();
				grid.reset().resetHeights().resetSections();
			},
			insertRowsAfter: function (row, count, cell) {
				grid.openUndo(function () {
					grid.reset().resetHeights().resetSections();
				});
				var $tablecomp = grid.$t.closest('.jp-table');
				if (!$tablecomp.is('.jp-static')) {
					var oldsettings = $tablecomp.data("saved-options")["options"];
					var newsettings = $.extend({}, oldsettings);
					var bodycell = bodyCell(newsettings);
					// 区域自动扩展时，不允许在master和扩展行之间，加行
					var auto = oldsettings["break"] == "auto";
					if (auto && cell.row == oldsettings["header-rows"]) {
						return;
					}
					grid.insertRowsAfter(row, count);
					if (auto && cell.row == oldsettings["header-rows"] + 1) {
						// 区域扩展时，在扩展行向面加的行，都加到 footer-rows上去
						newsettings["footer-rows"] += count;
					} else if (cell.row < newsettings["header-rows"]) {
						newsettings["header-rows"] += count;
					} else if (cell.row <= bodycell.row2) {
						newsettings["body-rows"] += count;
					} else {
						newsettings["footer-rows"] += count;
					}
					$tablecomp.data("saved-options")["options"] = newsettings;
					grid.addUndo(new $NXEdit($tablecomp, [function () {
						this.target.data("saved-options")["options"] = this.oldval;
					}, function () {
						this.target.data("saved-options")["options"] = this.newval;
					}, {
						oldval: oldsettings,
						newval: newsettings
					}]));
				} else {
					grid.insertRowsAfter(row, count);
				}
				grid.closeUndo();
				grid.reset().resetHeights().resetSelection(true).resetSections();
			},
			resetSections: function () {
				grid.resetSections();
			},
			deleteRows: function (cell) {
				var row = cell.row;
				var row2 = cell.row2;
				grid.openUndo(function () {
					grid.reset().resetHeights().resetSelection(true);
				});
				var $tablecomp = grid.$t.closest('.jp-table');
				if (!$tablecomp.is('.jp-static')) {
					var oldsettings = $tablecomp.data("saved-options")["options"];
					var newsettings = $.extend({}, oldsettings);
					var bodycell = bodyCell(newsettings);
					var auto = oldsettings["break"] == "auto";
					if (auto && (cell.containsY(bodycell.row) || cell.containsY(bodycell.row2))) {
						// 自动扩展时，不能删除主行和扩展行，但可以用设置明细行，来改变
						return;
					}
					grid.deleteRows(row, row2);
					if (!cell.containsY(bodycell)) {
						// 2021-04-12 18:36:26 解决删除表脚行，使所有表脚行不可见的问题

						var rows = Array(newsettings["header-rows"]).fill('h')//
							.concat(Array(newsettings["body-rows"]).fill('b')) //
							.concat(Array(newsettings["footer-rows"]).fill('f'));//
						rows.map(function (val, i) {
							if (i >= cell.row && i <= cell.row2) {
								if (val == 'h') {
									newsettings["header-rows"]--;
								} else if (val == 'b') {
									newsettings["body-rows"]--;
								} else {
									newsettings["footer-rows"]--;
								}
							}

						});
					}
					$tablecomp.data("saved-options")["options"] = newsettings;
					grid.addUndo(new $NXEdit($tablecomp, [function () {
						this.target.data("saved-options")["options"] = this.oldval;
					}, function () {
						this.target.data("saved-options")["options"] = this.newval;
					}, {
						oldval: oldsettings,
						newval: newsettings
					}]));
				} else {
					grid.deleteRows(row, row2);
				}
				grid.closeUndo();
				grid.reset().resetHeights().resetSelection(true);
			},
			fillTestText: function () {
				$(me).find('td').each(function () {
					var cell = this.myCell;
					if (cell)
						$(this).text(cell.row + ',' + cell.col + ',' + cell.colSpan + ',' + cell.rowSpan);
				});
			},
			undo: function () {
				undomanager && undomanager.undo();
			},
			redo: function () {
				undomanager && undomanager.redo();
			},
			changeComponentType: function (sel, newtype) {
				grid.changeComponentType(sel, newtype);
			},
			mergeCell: function (cell) {
				grid.merge(cell);
			},
			setBorder: function (cell, borders) {
				grid.setBorder(cell, borders);
			},
			setViewport: function (w, h) {
				viewport(w, h);
			},
			unmergeCell: function (cell) {
				grid.unmerge(cell);
			},
			css: function (cell, style, val) {
				grid.css(cell, style, val);
			},
			isCSS: function (cell, style, val) {
				return grid.isCSS(cell, style, val);
			},
			removeColumn: function (col, col2) {
			},
			removeRow: function (row, row2) {
			},
			deleteCells: function (cell) {
				grid.deleteCells(cell || sels);
			},
			getSelection: function () {
				return sels;
			},
			$s: function () {
				return grid.$s();
			},
			prop: function (cell, p, val) {
			},
			refresh: function () {
				grid.reset();
			},
			g: function () {
				return grid;
			},
			rows: function () {
				return grid.heights.length;
			},
			resetHeights: function () {
				grid.resetHeights();
				return this;
			}
		};
	};
})(jQuery);