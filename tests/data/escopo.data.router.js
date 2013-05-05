define(['tests/route/escopo.path'], function(Escopo){

    return Escopo.Controller.extend({
        
       '$route #list' : function() {
           this.$scope.trigger('data:list');
       },
       '$route #get/:id' : function(id) {
           this.$scope.trigger('data:get', [id]);
       },
       '$scope #remove/:id' : function(id) {
           this.$scope.trigger('data:remove', [id]);
       }
    });
   

});