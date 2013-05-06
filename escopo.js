window.Escopo = (function($) {

    var _objectId = 0;

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
    var _onCreate = function(instance, clazz) {

      // Create a object id. This will be used to create a namespace on
      // object event's
      instance._id = '_id_'+(_objectId++);

      // Create method proxy for all clazz functions
      for (methodName in instance) {
        if ($.isFunction(instance[methodName])) {
          instance[methodName] = $.proxy(instance[methodName], instance);
        }
      }

      // Execute plugins
      var plugins = clazz.plugins;
      for (var i = 0;i < plugins.length; i++) {
        plugins[i].onCreate.apply(plugins[i], [instance, clazz]);
      }
    }

    var _onDestroy = function(instance, clazz) {
      var plugins = clazz.plugins;
      for (var i = 0;i < plugins.length; i++) {
        plugins[i].onDestroy.apply(plugins[i], [instance, clazz]);
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
        _onCreate(this, View);

        // Call "initialize" method
        this.initialize(this.$el, this._params, this.$scope);
    }

    $.extend(View.prototype, {
        initialize : function() {},
        destroy : function() {
          _onDestroy(this, Controller);
          this.$el.remove();
        }
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
        'plugins' : [],
        'methodPlugins' : []
    });

    /**
     * Controller
     * ----------
     */
    var Controller = function(params, scope) {

        this._params = $.extend({}, params);
        this.$scope = $(scope || this.$scope || 'body');

        // Configure method plugins
        _onCreate(this, Controller);

        // Call "initialize" method
        this.initialize(this._params, this.$scope);
    }

    $.extend(Controller.prototype, {
        initialize : function() {},
        destroy : function() {
          _onDestroy(this, Controller);
        }
    });

    $.extend(Controller, {
        // Add extend funcionality
        'extend' : _extend,
        // Flight's like element bind
        'bindTo' : function(params, scope) {
            var _controller = this;
            $(element).each(function(index, element) {
                new _controller(params, scope);
            });
        },
        'plugins' : []
    });


    var _MethodPlugins = {
      'configureMethods' : function(type, instance, clazz) {
          var methodPlugins = clazz.methodPlugins;
          // Configure plugins
          for (methodName in instance) {
            if ($.isFunction(instance[methodName])) {
              // Iterate over plugins.
              for (var i = 0; i < methodPlugins.length; i++) {
                methodPlugins[i][type].apply(this, [methodName, instance]);
              }
            }
          }
      },
      'onCreate' : function(instance, clazz) {
        this.configureMethods('onCreate', instance, clazz);
      },
      'onDestroy' : function(instance, clazz) {
        this.configureMethods('onDestroy', instance, clazz);
      }
    }
    // Applied on View and Controller
    View.plugins.push(_MethodPlugins);
    View.methodPlugins = [];
    Controller.plugins.push(_MethodPlugins);
    Controller.methodPlugins = [];

    /**
     * Plugin to configure scope events
     */
    var _REGEX_SCOPE = new RegExp("^[$]scope\\s([a-zA-Z][a-zA-Z0-9]*([:][a-zA-Z0-9_]+)*$)");
    var _ScopeEventsPlugin = {
      'onCreate' : function(methodName, object) {
          if (_REGEX_SCOPE.test(methodName)) {
              var event = _REGEX_SCOPE.exec(methodName)[1]+'.'+object._id;
              object.$scope.on(event, object[methodName]);
          }
      },
      'onDestroy' : function(methodName, object) {
        if (_REGEX_SCOPE.test(methodName)) {
          console.log('Destruindo o evento '+methodName);
          var event = _REGEX_SCOPE.exec(methodName)[1]+'.'+object._id;
          object.$scope.off(event, object[methodName]);
        }
      }
    } 
    // Applied on View and Controller
    View.methodPlugins.push(_ScopeEventsPlugin);
    Controller.methodPlugins.push(_ScopeEventsPlugin);


    /**
     * Plugin to configure Element events
     */
    var _REGEX_EL = new RegExp("^[$]el(\\(.*\\))?\\s([a-zA-Z][a-zA-Z0-9]*([:][-a-zA-Z0-9_]+)*)$");
    var _ElementEventsPlugin = {
      'onCreate' : function(methodName, object) {
         if (_REGEX_EL.test(methodName)) {
            var regexParts = _REGEX_EL.exec(methodName);
            var $el = object.$el;
            if (regexParts[1]) {
              $el = $el.find(regexParts[1].substr(1, regexParts[1].length - 2));
            }

            $el.bind(regexParts[2], object[methodName]);
        }
      },
      'onDestroy' : function(methodName, object) {
        console.log('Sera que destruo o vinculo com o elemento?');
      }
    }
    View.methodPlugins.push(_ElementEventsPlugin); // Applied only into views


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