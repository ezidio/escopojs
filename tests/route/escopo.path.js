define(['escopo','lib/path'], function(Escopo, Path){

    // Route method Regex
    var _REGEX_ROUTE = new RegExp("^[$]route\\s+");

    // Route Method Plugin
    var _RoutePlugin = {

        'onCreate' : function(instance) {

            for (var methodName in instance) {
            // Test if the method is a route
            if (_REGEX_ROUTE.test(methodName)) {

                // Retrieve the route path
                var routePath = methodName.substr(7).trim();

                // Configure the route
                Path.map(routePath).to(function() {

                    // Retrieve the route parameters
                    var routeParams = this.params;

                    // If instance has $scope, trigger a change event 
                    if (instance.$scope) {
                        instance.$scope.trigger('route:change', [routePath, routeParams]);
                    }

                    // Call original method
                    instance[methodName].apply(instance, [routeParams]);
                });
            }
            }
        },
        'onDestroy' : function(instance) {

        }
    }

    // Configure the Route into Controller and View
    Escopo.Controller.plugins.push(_RoutePlugin);
    Escopo.View.plugins.push(_RoutePlugin);

    return Escopo;

});