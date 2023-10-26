(function ($) {
  // public methods
  var methods = {
    enableRotate: function (options) {
      return this.each(function () {
        if (!$(this).data('rotatables'))
          _init($(this), options || {});
        $(this).data('rotatables')._enable();
      });
    },
    sync: function () {
      return this.each(function () {
        if (!$(this).data('rotatables'))
          _init($(this), {})._enable();
        else
          $(this).data('rotatables')._sync();
      });
    }

  };
  $.fn.enableRotate = function (method) {
    if (!method) {
      $(document.body).toggleClass("no-rotate", $(this[0]).is(".no-rotate"));
      return methods.enableRotate.apply(this, arguments);
    } else if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.freetrans');
    }
    return false;
  };
  // private methods
  function _init(target, options) {
    var widget = {
      options: {
        angle: false, // specify an angle in radians (for backward compatability)
        // degrees: false, // specify angle in degrees
        handle: false, // an image to use for a handle
        handleOffset: { // where the handle should appear
          top: 0,
          left: 0
        },
        radians: false, // specify angle in radians
        rotate: null, // a callback for during rotation
        rotationCenterOffset: { // offset the center of the element for rotation
          top: 0,
          left: 0
        },
        snap: false, // boolean flag, should the element snap to a certain rotation?
        start: null, // callback when rotation starts
        step: 22.5, // angle in degrees that the rotation should be snapped to
        stop: null, // callback when rotation stops
        transforms: null, // other transforms to performed on the element
        wheelRotate: true

        // boolean flag, should the element rotate when the mousewheel is rotated?
      },
      // accessor for the angle in radians
      angle: function (angle) {
        if (angle === undefined) {
          return this.options.angle
        }
        this.options.angle = angle
        this.elementCurrentAngle = angle
        this._performRotation(this.options.angle)
      },
      // calculates the element center if needed and returns it
      getElementCenter: function () {
        this.elementCenter = this._calculateElementCenter()
        return this.elementCenter
      },
      // accessor for the handle
      handle: function (handle) {
        if (handle === undefined) {
          return this.options.handle
        }
        this.options.handle = handle
      },

      rotationCenterOffset: function (offset) {
        if (offset === undefined) {
          return this.options.rotationCenterOffset
        }
        if (offset.top !== null) {
          this.options.rotationCenterOffset.top = offset.top
        }
        if (offset.left !== null) {
          this.options.rotationCenterOffset.left = offset.left
        }
      },
      // listener for rotating the element
      rotateElement: function (event) {
        if (!this.element || this.element.disabled || this.options.disabled) {
          return false
        }
        if (!event.which) {
          this.stopRotate(event)
          return false
        }
        var rotateAngle = this._calculateRotateAngle(event)
        var previousRotateAngle = this.elementCurrentAngle
        this.elementCurrentAngle = rotateAngle


        this._performRotation(rotateAngle)
        if (previousRotateAngle !== rotateAngle) {
          this.hasRotated = true
        }
        return false
      },
      currentRadius: function () {
        var r = target.attr("style").match(/rotate\s*\(\s*([\-\.\d]+)/);
        if (r) {
          return elementCurrentAngle = parseFloat(r[1]);
        } else {
          return 0;
        }
      },
      // listener for starting rotation
      startRotate: function (event) {
        target.data("undos", null);
        if (!$(target).is(".ui-selected")) {
          return;
        }



        target.data("undos", { "old": this.currentRadius() });

        var rotatings = this.element.data("rotatings") || 0;
        this.element.data("rotatings", rotatings + 1);

        $(document).trigger("rotate-start");
        var center = this.getElementCenter()
        var startXFromCenter = event.pageX - center.x
        var startYFromCenter = event.pageY - center.y
        this.mouseStartAngle = Math.atan2(startYFromCenter, startXFromCenter)
        this.elementStartAngle = this.elementCurrentAngle
        this.hasRotated = false

        $(document).bind('mousemove', this.listeners.rotateElement)
        $(document).bind('mouseup', this.listeners.stopRotate)
        return false
      },
      // listener for stopping rotation
      stopRotate: function (event) {
        if (!this.element || this.element.disabled) {
          return
        }
        $(document).unbind('mousemove', this.listeners.rotateElement)
        $(document).unbind('mouseup', this.listeners.stopRotate)
        this.elementStopAngle = this.elementCurrentAngle




        target.data("undos")["new"] = this.currentRadius();
        var rotatings = this.element.data("rotatings") || 0;
        rotatings--;


        this.element.data("rotatings", rotatings);

        if (rotatings == 0) {
          $(document).trigger("rotated");
        }

        setTimeout(function () {
          this.element = false
        }, 10)
        return false
      },
      // listener for mousewheel rotation
      wheelRotate: function (event) {
        if (!this.element || this.element.disabled || this.options.disabled) {
          return
        }
        event.preventDefault()
        var angle = this._angleInRadians(Math.round(event.originalEvent.deltaY / 10))
        if (this.options.snap || event.shiftKey) {
          angle = this._calculateSnap(angle)
        }
        angle = this.elementCurrentAngle + angle
        this.angle(angle)
        this._trigger('rotate', event, this.ui())
      },

      /* *********************** private functions ************************** */
      // calculates the radians for a given angle in degrees
      _angleInRadians: function (degrees) {
        return degrees * Math.PI / 180
      },
      // calculates the degrees for a given angle in radians
      _angleInDegrees: function (radians) {
        return radians * 180 / Math.PI
      },
      // calculates the center of the element
      _calculateElementCenter: function () {
        var elementOffset = this._getElementOffset()
        // Rotation center given via options
        if (this._isRotationCenterSet()) {
          return {
            x: elementOffset.left + this.rotationCenterOffset().left,
            y: elementOffset.top + this.rotationCenterOffset().top
          }
        }
        // Deduce rotation center from transform-origin
        if (this.element.css('transform-origin') !== undefined) {
          var originPx = this.element.css('transform-origin').match(/([\d.]+)px +([\d.]+)px/)
          if (originPx != null) {
            return {
              x: elementOffset.left + parseFloat(originPx[1]),
              y: elementOffset.top + parseFloat(originPx[2])
            }
          }
        }
        // Default rotation center: middle of the element
        return {
          x: elementOffset.left + this.element.width() / 2,
          y: elementOffset.top + this.element.height() / 2
        }
      },
      // calculates the angle that the element should snap to and returns it in radians
      _calculateSnap: function (radians) {
        var degrees = this._angleInDegrees(radians)
        degrees = Math.round(degrees / this.options.step) * this.options.step
        return this._angleInRadians(degrees)
      },
      // calculates the angle to rotate the element to, based on input
      _calculateRotateAngle: function (event) {
        var center = this.getElementCenter()
        var xFromCenter = event.pageX - center.x
        var yFromCenter = event.pageY - center.y
        var mouseAngle = Math.atan2(yFromCenter, xFromCenter)
        var rotateAngle = mouseAngle - this.mouseStartAngle + this.elementStartAngle
        if (this.options.snap || event.shiftKey) {
          rotateAngle = this._calculateSnap(rotateAngle)
        }
        return rotateAngle
      },
      // constructor
      _enable: function () {
        if (target.closest(".jp-table").length) {
          return;
        }
        var shadow = target.parent().find(".rotate-shadow");
        if (!shadow.length) {
          shadow = $("<div class='rotate-shadow'><div class='handler'></div></div>").appendTo(target.parent());
        }
        this.element = shadow;
        this._sync();
        this.targets = target.add(shadow);
        var rotator = shadow.find(options.handle || '.handler');
        rotator.bind('mousedown.rotatables', this.listeners.startRotate);
        this.rotationCenterOffset(this.options.rotationCenterOffset)
        this.elementCurrentAngle = this.currentRadius()
        this._performRotation(this.elementCurrentAngle)
        //this.rotationCenterOffset(this.options.rotationCenterOffset)
        // this.elementCurrentAngle = this.options.radians || this.options.angle || 0
        // this._performRotation(this.elementCurrentAngle)
      },
      _sync: function () {
        if (this.element) {
          var shadow = this.element;
          var csss = ["width", "height", "left", "top"];
          for (var i = 0; i < csss.length; i++) {
            shadow.css(csss[i], target.css(csss[i]) || "");
          }
        }
      },
      // constructor
      _create: function () {
        this.options = $.extend(this.options, options);
        this.listeners = {
          rotateElement: $.proxy(this.rotateElement, this),
          startRotate: $.proxy(this.startRotate, this),
          stopRotate: $.proxy(this.stopRotate, this),
          wheelRotate: $.proxy(this.wheelRotate, this)
        }
        target = $(target).data('rotatables', this);

      },
      // destructor
      _destroy: function () {
        this.element.removeClass('ui-rotatable')
        this.element.find('.ui-rotatable-handle').remove()
        if (this.options.wheelRotate) {
          this.element.unbind('wheel', this.listeners.wheelRotate)
        }
      },
      // used for the handle
      _dragStart: function (event) {
        if (this.element) {
          return false
        }
      },
      // retrieves the element offset
      _getElementOffset: function () {
        this._performRotation(0)
        var offset = this.element.offset()
        this._performRotation(this.elementCurrentAngle)
        return offset
      },
      _getTransforms: function (angle) {
        var transforms = 'rotate(' + angle + 'rad)'
        if (this.options.transforms) {
          transforms += ' ' + (function (transforms) {
            var t = []
            for (var i in transforms) {
              if (transforms.hasOwnProperty(i) && transforms[i]) {
                t.push(i + '(' + transforms[i] + ')')
              }
            }
            return t.join(' ')
          }(this.options.transforms))
        }
        return transforms
      },
      // checks to see if the element has a rotationCenterOffset set
      _isRotationCenterSet: function () {
        return (this.options.rotationCenterOffset.top !== 0 || this.options.rotationCenterOffset.left !== 0)
      },
      // performs the actual rotation on the element
      _performRotation: function (angle) {
        if (this._isRotationCenterSet()) {
          this.targets.css('transform-origin', this.options.rotationCenterOffset.left + 'px ' + this.options.rotationCenterOffset.top + 'px')
          this.targets.css('-ms-transform-origin', this.options.rotationCenterOffset.left + 'px ' + this.options.rotationCenterOffset.top + 'px') /* IE 9 */
          this.targets.css('-webkit-transform-origin', this.options.rotationCenterOffset.left + 'px ' + this.options.rotationCenterOffset + 'px') /* Chrome, Safari, Opera */
        }
        var transforms = this._getTransforms(angle)

        this.targets.css('transform', transforms)
        this.targets.css('-moz-transform', transforms)
        this.targets.css('-webkit-transform', transforms)
        this.targets.css('-o-transform', transforms)
      }

    }

    widget._create();
    return widget;

  }

})(jQuery);
