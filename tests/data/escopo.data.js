define(['tests/route/escopo.path','lib/path'], function(Escopo){

    var _data = [];
    var _index = {};
    var _id = 0;

    return Escopo.Controller.extend({
        'getIndex' : function(id) {
            for (var i = 0;i < _data.length;i++) {
               if (_data[i].id == id) {
                   return i;
               }
           }
           return -1;
        },
       '$scope data:list' : function() {
           this.$scope.trigger('data:list:success', [_data]);
       },
       '$scope data:get' : function(ev, id) {
           var i = getIndex(id);
           this.$scope.trigger('data:get:success', [_data[i]]);
       },
       '$scope data:insert' : function(ev, model) {
           var id = _id++;
           model.id = id;
           _index[id] = model;
           _data.push(model);
           this.$scope.trigger('data:insert:success', [model]);
           this.$scope.trigger('data:change:success', [_data]);
       },
       '$scope data:update' : function(ev, model) {
           _index[model.id] = model;
           _data[this.getIndex(model.id)] = model;
           this.$scope.trigger('data:update:success', [model]);
           this.$scope.trigger('data:change:success', [_data]);
       },
       '$scope data:remove' : function(ev, id) {
           var i = this.getIndex(id);
           var model = _data[i];
           _data.splice(i, 1);
           delete _index[id];
           this.$scope.trigger('data:remove:success', [model]);
           this.$scope.trigger('data:change:success', [_data]);
       }
    });
   

});