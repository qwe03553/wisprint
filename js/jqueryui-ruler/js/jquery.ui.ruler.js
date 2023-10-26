(function ($) {
    $.widget("ef.ruler", {
        options: {
            unit: 'px',
            tickMajor: 100,
            tickMinor: 20,
            tickMicro: 10,
            showLabel: true,
            arrowStyle: 'line',
            startX: 0,
            startY: 0
        },

        _$el: null,
        _$container: null,
        _$corner: null,
        _$topRuler: null,
        _$leftRuler: null,
        _$topArrow: null,
        _$leftArrow: null,
        _$stage: null,

        _scrollTop: 0,
        _scrollLeft: 0,

        _scrollBarWidth: 0,
        _unitDiv: 1,

        _lastTopRulerPos: 0,
        _lastLeftRulerPos: 0,

        /**
         * px - pixel
         * mm - millimeter
         * cm - centimeter
         * in - inch
         */
        _units: ['px', 'mm', 'cm', 'in'],

        _create: function () {
        	_rulerThis = this;
            var self = this;

            /* Options */
            this.options.unit = this._constrainUnit(this.options.unit);
            this.options.tickMajor = this._constrainTick(this.options.tickMajor);
            this.options.tickMinor = this._constrainTick(this.options.tickMinor);
            this.options.tickMicro = this._constrainTick(this.options.tickMicro);
            this.options.startX = this._constrainStart(this.options.startX);
            this.options.startY = this._constrainStart(this.options.startY);

            /* Calculate scrollbar width */
            this._scrollBarWidth = this._calcScrollBarWidth();


            /* Create container */
            var $container = $(".jp-content");

            /* corner */
            var $corner = $(document.createElement('div')).addClass('corner');
            // $corner.appendTo(document.body);

            /* Top ruler */
            var $topRuler = $(document.createElement('div')).addClass('ruler').addClass('top');
            $topRuler.appendTo($('.top-ruler').appendTo($('.jp-ruler-view')));

            var toparrowClass, leftarrowClass
            switch (this.options.arrowStyle) {
                case 'arrow':
                    toparrowClass = 'top-arrow';
                    leftarrowClass = 'left-arrow';
                    break;
                case 'line':
                    toparrowClass = 'top-line';
                    leftarrowClass = 'left-line';
                    break;
                case 'none':
                    toparrowClass = 'top-none';
                    leftarrowClass = 'left-none';
                    break;
            }

            var $topArrow = $(document.createElement('div')).addClass(toparrowClass);
            $topArrow.appendTo($topRuler);

            /* Left ruler */
            var $leftRuler = $(document.createElement('div')).addClass('ruler').addClass('left');
            $leftRuler.appendTo($('.left-ruler').appendTo($('.jp-ruler-view')));


            var $leftArrow = $(document.createElement('div')).addClass(leftarrowClass);
            $leftArrow.appendTo($leftRuler);

            /* stage */
            var $stage = $(document.createElement('div')).addClass('stage');
            //$stage.appendTo($container);
            //$stage.append(this.element.contents());


            // $container.appendTo(this.element);

            this._$container = $container;
            this._$corner = $corner;
            this._$topRuler = $topRuler;
            this._$leftRuler = $leftRuler;
            this._$topArrow = $topArrow;
            this._$leftArrow = $leftArrow;
            this._$stage = $stage;

            this.refresh();

            /* events */
            $container.scroll(function () {
                self._scrollTop = $container.scrollTop();
                self._scrollLeft = $container.scrollLeft();

                self._fixRulerPosition();
            });
            this.element.find('.jp-page').mousemove(function (event) {
                var offset = $(this).offset();
                self._fixArrowsPosition(event.pageX - offset.left, event.pageY - offset.top);
            });
            $(window).resize(function () {
                self._fixRulerSize();
                self._updateRulerTicks();
            });
        },

        _destroy: function () {
            /* Unbind */
            this._$container.unbind('scroll');
            this.element.unbind('mousemove');
            $(window).unbind('resize');

            /* Restore element contents */
            this.element.prepend(this._$stage.contents());

            /* Remove created elements */
            this._$container.remove();
        },

        _setOption: function (key, value) {
            switch (key) {
                case 'unit':
                    value = this._constrainUnit(value);
                    break;
                case 'tickMajor':
                case 'tickMinor':
                case 'tickMicro':
                    value = this._constrainTick(value);
                    break;
                case 'startX':
                case 'startY':
                    value = this._constrainStart(value);
                    break;
            }

            this._super(key, value);
        },

        _setOptions: function (options) {
            this._super(options);

            this.refresh();
        },

        _constrainUnit: function (unit) {
            if (typeof unit === 'string') {
                unit = unit.toLowerCase();
                this._units.every(function (sUnit) {
                    if (unit === sUnit)
                        return false;

                    return true;
                });
            } else {
                unit = 'px'
            }

            return unit;
        },

        _constrainTick: function (tick) {
            if (isNaN(tick) || tick < 0)
                return 0;

            return tick;
        },

        _constrainStart: function (start) {
            var value = parseInt(start);
            if (isNaN(value))
                return 0;

            return value;
        },

        _calcScrollBarWidth: function () {
            var $tmpEl = $(document.createElement('div')).css({
                position: 'absolute',
                top: '-999px',
                left: '-999px',
                width: '100px',
                height: '100px',
                overflow: 'hidden'
            });

            this.element.append($tmpEl);

            var w1 = $tmpEl[0].offsetWidth;
            $tmpEl.css('overflow', 'scroll');
            var w2 = $tmpEl[0].offsetWidth;

            if (w1 == w2) w2 = $tmpEl[0].clientWidth;

            $tmpEl.remove();

            return (w1 - w2);
        },

        _calcPixelsPerMM: function () {
            var $tmpEl = $(document.createElement('div')).css({
                position: 'absolute',
                top: '-999px',
                left: '-210mm',
                width: '500mm',
                height: '1px'
            });

            this.element.append($tmpEl);

            // 2021年7月9日10:38:27 放大后尺子刻度也放大
            var px = $tmpEl.width() / 500 * magnification;

            $tmpEl.remove();

            return px;
        },

        scroll: function (top, left) {

        },

        _fixRulerPosition: function () {
            //            this._$corner.css({
            //                top: this._scrollTop,
            //                left: this._scrollLeft
            //            });

            /* Fix rulers position */
            this._updateRulerTicks(true);
            this._$leftRuler.parent().css('top', -this._scrollTop);
            this._$topRuler.parent().css('left', -this._scrollLeft);

        },

        _fixRulerSize: function () {
            this._updateRulerTicks(true);
        },

        _updateRulerTicks: function (reset, type) {

            var _h = this.hContainer || 0;
            var _w = this.wContainer || 0;

            var w = this._$container[0].scrollWidth + 60,
                h = this._$container[0].scrollHeight + 60;

            var topset = true,
                leftset = true;
            if (reset === true) {
                topset && this._$topRuler.find('.tick').remove();
                leftset && this._$leftRuler.find('.tick').remove();
                type && this._$topRuler.find('.tick').remove();
                type && this._$leftRuler.find('.tick').remove();

                this._lastTopRulerPos = this._lastLeftRulerPos = 0;
            }

            var $tick = null;
            var unitPos;



            leftset && this._$leftRuler.parent().height(h);
            topset && this._$topRuler.parent().width(w);

            //   this._lastTopRulerPos = 200;
            /* Top ruler */
            unitPos = (this._lastTopRulerPos) * this._unitDiv;
            var topRulerWidth = this._$topRuler.width() + 100;
            while (topset && this._lastTopRulerPos < topRulerWidth) {
                if (this.options.tickMajor > 0 && (unitPos % this.options.tickMajor) === 0) {
                    $tick = $(document.createElement('div'))
                        .addClass('tick').addClass('major')
                        .css('left', this._lastTopRulerPos + 'px');

                    if (this.options.showLabel === true)
                        $tick.text(unitPos);

                    $tick.appendTo(this._$topRuler);
                } else if (this.options.tickMinor > 0 && (unitPos % this.options.tickMinor) === 0) {
                    $tick = $(document.createElement('div'))
                        .addClass('tick').addClass('minor')
                        .css('left', this._lastTopRulerPos + 'px');

                    $tick.appendTo(this._$topRuler);
                } else if (this.options.tickMicro > 0 && (unitPos % this.options.tickMicro) === 0) {
                    $tick = $(document.createElement('div'))
                        .addClass('tick').addClass('micro')
                        .css('left', this._lastTopRulerPos + 'px');

                    $tick.appendTo(this._$topRuler);
                }

                this._lastTopRulerPos += this._unitDiv;
                unitPos++;
            }

            /* Left ruler */
            unitPos = (this._lastLeftRulerPos + this.options.startY) * this._unitDiv;
            var leftRulerHeight = this._$leftRuler.height() + 100;
            while (leftset && this._lastLeftRulerPos < leftRulerHeight) {
                if (this.options.tickMajor > 0 && (unitPos % this.options.tickMajor) === 0) {
                    $tick = $(document.createElement('div'))
                        .addClass('tick').addClass('major')
                        .css('top', this._lastLeftRulerPos + 'px');

                    if (this.options.showLabel === true)
                        $tick.append('<span>' + unitPos + '</span>')

                    $tick.appendTo(this._$leftRuler);
                } else if (this.options.tickMinor > 0 && (unitPos % this.options.tickMinor) === 0) {
                    $tick = $(document.createElement('div'))
                        .addClass('tick').addClass('minor')
                        .css('top', this._lastLeftRulerPos + 'px');

                    $tick.appendTo(this._$leftRuler);
                } else if (this.options.tickMicro > 0 && (unitPos % this.options.tickMicro) === 0) {
                    $tick = $(document.createElement('div'))
                        .addClass('tick').addClass('micro')
                        .css('top', this._lastLeftRulerPos + 'px');

                    $tick.appendTo(this._$leftRuler);
                }

                this._lastLeftRulerPos += this._unitDiv;
                unitPos++;
            }

            this.hContainer = Math.max(h, _h);
            this.wContainer = Math.max(w, _w);
        },

        _fixArrowsPosition: function (mouseX, mouseY) {
            // var arrowX = mouseX - this.element.offset().left - this._$corner.width() - Math.round(this._$topArrow.outerWidth() / 2) + parseInt($('.ef-ruler').parents().eq(1).css('padding-left'),10);
            //var arrowY = mouseY - this.element.offset().top - this._$corner.height() - Math.round(this._$leftArrow.outerHeight() / 2) + parseInt($('.ef-ruler').parents().eq(1).css('padding-top'),10);

            this._$topArrow.css('left', mouseX);// + this._scrollLeft);
            this._$leftArrow.css('top', mouseY);// + this._scrollTop);
        },

        refresh: function (type) {// type 为true时清空 不影响之前的逻辑
            switch (this.options.unit) {
                case 'px':
                    this._unitDiv = 1;
                    break;
                case 'mm':
                    this._unitDiv = this._calcPixelsPerMM();
                    break;
                case 'cm':
                    this._unitDiv = this._calcPixelsPerMM() * 10;
                    break;
                case 'in':
                    this._unitDiv = this._calcPixelsPerMM() * 25.4;
                    break;
            }

            this._fixRulerPosition();
            this._fixRulerSize();
            this._fixArrowsPosition(0, 0);
            this._updateRulerTicks(true, type);
        }
    });
})(jQuery);
