define(['escopo','lib/path'], function(Escopo, Path){

    // Route method Regex
    var _REGEX_ROUTE = new RegExp("^[$]route\\s+");

    // Route Method Plugin
    var _RoutePlugin = {

        'onCreate' : function(methodName, object) {
            // Test if the method is a route
            if (_REGEX_ROUTE.test(methodName)) {

                // Retrieve the route path
                var routePath = methodName.substr(7).trim();

                // Configure the route
                Path.map(routePath).to(function() {

                    // Retrieve the route parameters
                    var routeParams = this.params;

                    // If object has $scope, trigger a change event 
                    if (object.$scope) {
                        object.$scope.trigger('route:change', [routePath, routeParams]);
                    }

                    // Call original method
                    object[methodName].apply(object, [routeParams]);
                });
            }
        },
        'onDestroy' : function(methodName, object) {
            // Test if the method is a route
            if (_REGEX_ROUTE.test(methodName)) {
                console.log('Removendo a rota '+methodName);
            }
        }
    }

    // Configure the Route into Controller and View
    Escopo.Controller.methodPlugins.push(_RoutePlugin);
    Escopo.View.methodPlugins.push(_RoutePlugin);

    return Escopo;

});