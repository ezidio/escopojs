window.Escopo = (function($) {


  var _globalObjectId = 0;



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
    instance._id = '_id_'+(_globalObjectId++);

    // Create method proxy for all clazz functions
    for (methodName in instance) {
      if ($.isFunction(instance[methodName])) {
        instance[methodName] = $.proxy(instance[methodName], instance);
      }
    }

    // Execute plugins
    var plugins = clazz.plugins;
    for (var i = 0;i < plugins.length; i++) {
      var plugin = plugins[i];
      plugin.onCreate.apply(plugin, [instance, clazz]);
    }
  }

  /**
   * Utilitary Function to call onDestroy method from plugins.
   */
  var _onDestroy = function(instance, clazz) {
    var plugins = clazz.plugins;
    for (var i = 0;i < plugins.length; i++) {
      var plugin = plugins[i];
      plugin.onDestroy.apply(plugin, [instance, clazz]);
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
        'plugins' : [],
        // Flight's like element bind
        'bindTo' : function(element, params, scope) {
            var _view = this;
            $(element).each(function(index, element) {
                new _view(element, params, scope);
            });
        }
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
    };

    $.extend(Controller.prototype, {
        initialize : function() {},
        destroy : function() {
          _onDestroy(this, Controller);
        }
    });

    $.extend(Controller, {
        // Add extend funcionality
        'extend' : _extend,
        'plugins' : []
    });


    /**
     * Scope Events plugin
     * ---------------------
     * This plugin configure the scope events based on method names that have the pattern
     * '$scope methodName';
     *
     * When the element is destroied, the scope events are removed only if 'destroy' method is called.
     */
    var _ScopeEventsPlugin = (function() {
      
      // Define the scope method regex
      var REGEX = new RegExp("^[$]scope\\s([a-zA-Z][a-zA-Z0-9]*([:][a-zA-Z0-9_]+)*$)");

      // Get the event name from method name
      var getEventName = function(instance, methodName) {

        // If isn't function or isn't a scope method, return false.
        if (!$.isFunction(instance[methodName]) || !REGEX.test(methodName)) {
          return false;
        }
        // Execute the regex on method name to retrieve the event name
        var regexParts = REGEX.exec(methodName);
        return regexParts[1]+'.'+instance._id;
      }
      
      return {
        'onCreate' : function(instance, clazz) {
          var eventName;
          for (var methodName in instance) {
            if (eventName = getEventName(instance, methodName)) {
              instance.$scope.on(eventName, instance[methodName]);
            }
          }
        },
        'onDestroy' : function(instance, clazz) {
          var eventName;
          for (var methodName in instance) {
            if (eventName = getEventName(instance, methodName)) {
              instance.$scope.off(eventName, instance[methodName]);
            }
          }
        }
      }
    })();

    /**
     * Element Events plugin
     * ---------------------
     * This plugins automatically configure the element methods based on method's name
     * that have the pattern '$el eventName'.
     *
     * Element children can have events configured by the '$el(child path) eventName'
     *
     */
    var _ElementEventsPlugin = (function() {

      // Expression language
      var REGEX = new RegExp("^[$]el(\\(.*\\))?\\s([a-zA-Z][a-zA-Z0-9]*([:][-a-zA-Z0-9_]+)*)$");
      
      // Realize the parse of method. 
      var parseMethod = function(instance, methodName) {

        // If isn't function or isn't a element method, return false.
        if (!$.isFunction(instance[methodName]) || !REGEX.test(methodName)) {
          return false;
        }

        // Execute the regex to retrieve the element path
        var regexParts = REGEX.exec(methodName);
        // Retrieve the event name, and include the namespace of the element
        // The namespace will guarantee that the correct event will be removed 
        // from the scope.
        var eventName = regexParts[2]+'.'+instance._id;
        // Mark the event where a parent event
        var childEvent = false;
        var $el = instance.$el;
        // Find children elements
        if (regexParts[1]) {
          childEvent = true;
          $el = $el.find(regexParts[1].substr(1, regexParts[1].length - 2));
        }

        return {'element' : $el, 'eventName' : eventName, 'childEvent' : childEvent};
      };

      // Function that configure only child event's.
      // These can be used when the element renderize templates.
      var _childEvents = function(instance) {
        var info;
        for (var methodName in instance) {
          var info = parseMethod(instance, methodName);
          if (info && info.childEvent) {
            info.element.on(info.eventName, instance[methodName]);
          }
        }
      }

      // Retrieve the plugin method's
      return {
        
        'onCreate' : function(instance) {
          var info;
          for (var methodName in instance) {
            info = parseMethod(instance, methodName);
            if (info) {
              info.element.on(info.eventName, instance[methodName]);
            }
          }
          
          // Add on instance a method to configure child events
          instance.childEvents = function() {
            _childEvents(this);
          };

        },
        // On destroy the instance, remove all configured bindings.
        'onDestroy' : function(instance) {
          var info;
          for (var methodName in instance) {
            info = parseMethod(instance, methodName);
            if (info) {
              info.element.off(info.eventName, instance[methodName]);
            }
          }
        }
      }

    })();


    // Configure View plugins
    View.plugins.push(_ScopeEventsPlugin);
    View.plugins.push(_ElementEventsPlugin);

    // Configure Controller plugins
    Controller.plugins.push(_ScopeEventsPlugin);

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