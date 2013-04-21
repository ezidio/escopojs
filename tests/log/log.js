define(['escopo'], function(Escopo){
   
   var Log = {};

   Log.Panel = Escopo.View.extend({
      '$scope log:event:success' : function(ev, message) {
          this.$el.append('<p>'+message+'</p>');
      }
   });

   Log.Button = Escopo.View.extend({
      '$el click' : function() {
        var label = this.$el.text();
          this.$scope.trigger('log:event:success', ['Clicou no botão '+label]);
      } 
   });
   
   return Log;
    
});