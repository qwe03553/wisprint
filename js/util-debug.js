function Util() {
	// 用这个不用回调的版本，比 jatoolsPrinter.getAbsoluteURL 简化
	return {
		getAbsoluteURL: function (base, relative) {
			if (!relative)
				return base;
			if (relative.match(/^http:\/\//i))
				return relative;
			var stack = base.split("/"), parts = relative.split("/");
			stack.pop();
			for (var i = 0; i < parts.length; i++) {
				if (parts[i] == ".")
					continue;
				if (parts[i] == "..")
					stack.pop();
				else
					stack.push(parts[i]);
			}
			return stack.join("/");
		}
	}
}


Array.prototype._LT = function (v) {
	var l = 0, h = this.length - 1;
	while (l <= h) {
		var m = (l + h) >>> 1;
		if (this[m] === v) {
			return m;
		}
		if (this[m] > v) {
			h = m - 1;
		} else {
			l = m + 1;
		}
	}
	return l;
} // attr,css~{1`<-~}

Array.prototype._last = function (val) {
	this[this.length - 1] = val;
	return this;
}

