window.Escopo = (function($) {

    /**
     * Extension Method
     */
    var _extend = function(staticProps, protoProps) {

        if (!protoProps) {
          protoProps = staticProps;
          staticProps = {};
        }

        var parent = this;
        var child = function(){ return parent.apply(this, arguments); };
        $.extend(child, parent, staticProps);
        $.extend(child.prototype, this.prototype, protoProps);
        return child;
    };

    /**
     * Utilitary Function to internally configure method plugins to a instance
     */
    var _configurePlugins = function(instance, pluginList) {
        // Configure plugins
        for (methodName in instance) {
            if ($.isFunction(instance[methodName])) {
                // Create  method proxy
                instance[methodName] = $.proxy(instance[methodName], instance);

                // Iterate over plugins.
                for (var i = 0; i < pluginList.length; i++) {
                    pluginList[i](methodName, instance);
                }
            }
        }
    }

    /**
     * Utilitary function to find a element that is a parent scope
     * Retrieve the element, or false if don't have
     */
    var _parentScope = function(el) {
        var $scope = $(el).parents('.scope-context');
        return ($scope.length == 0) ? false : $scope[0];
    }


    /**
     * View
     * ----
     */
    var View = function(element, params, scope) {

        this._params = $.extend({}, params);
        this.$el = $(element);
        this.$scope = $(scope || this.$scope|| _parentScope(this.$el) || 'body');

        // Configure method plugins
        _configurePlugins(this, View.plugins);

        // Call "initialize" method
        this.initialize(this.$el, this._params, this.$scope);
    }

    $.extend(View.prototype, {
        initialize : function() {}
    });

    $.extend(View, {
        // Add extend funcionality
        'extend' : _extend,
        // Flight's like element bind
        'bindTo' : function(element, params, scope) {
            var _view = this;
            $(element).each(function(index, element) {
                new _view(element, params, scope);
            });
        },
        'plugins' : []
    });

    /**
     * Controller
     * ----------
     */
    var Controller = function(params, scope) {

        this._params = $.extend({}, params);
        this.$scope = $(scope || this.$scope || 'body');

        // Configure method plugins
        _configurePlugins(this, Controller.plugins);

        // Call "initialize" method
        this.initialize(this._params, this.$scope);
    }

    $.extend(Controller.prototype, {
        initialize : function() {},
        // Flight's like element bind
        'bindTo' : function(params, scope) {
            var _controller = this;
            $(element).each(function(index, element) {
                new _controller(params, scope);
            });
        }
    });

    $.extend(Controller, {
        'extend' : _extend,
        'plugins' : []
    });


    /**
     * Plugin to configure scope events
     */
    var _REGEX_SCOPE = new RegExp("^[$]scope\\s([a-zA-Z][a-zA-Z0-9]*([:][a-zA-Z0-9_]+)*$)");
    var _ScopeEventsPlugin = function(methodName, object) {
        if (_REGEX_SCOPE.test(methodName)) {
            var event = _REGEX_SCOPE.exec(methodName)[1];
            object.$scope.bind(event, object[methodName]);
        }
    }
    // Applied on View and Controller
    View.plugins.push(_ScopeEventsPlugin);
    Controller.plugins.push(_ScopeEventsPlugin);


    /**
     * Plugin to configure Element events
     */
    var _REGEX_EL = new RegExp("^[$]el(\\(.*\\))?\\s([a-zA-Z][a-zA-Z0-9]*([:][-a-zA-Z0-9_]+)*)$");
    var _ElementEventsPlugin = function(methodName, object) {
         if (_REGEX_EL.test(methodName)) {
            var regexParts = _REGEX_EL.exec(methodName);
            var $el = object.$el;
            if (regexParts[1]) {
              $el = $el.find(regexParts[1].substr(1, regexParts[1].length - 2));
            }

            $el.bind(regexParts[2], object[methodName]);
        }
    }
    View.plugins.push(_ElementEventsPlugin); // Applied only into views


    return {
      'View' : View,
      'Controller' : Controller,
      // Plublish plugins to reutilize on another classes
      '_plugins' : {
          'elementEvents' : _ElementEventsPlugin,
          'scopeEvents' : _ScopeEventsPlugin
      }
    }
})(window.jQuery || window.Zepto);

// Possibility use with require.js
if (!!window.define) {
  window.define([], function() {
    return window.Escopo;
  })
}