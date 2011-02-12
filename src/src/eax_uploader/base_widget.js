
EaxUploader.BaseWidget = function() {
};
EaxUploader.BaseWidget.prototype = {
    init: function(query, options) {
        this.query = query;
        this.options = options;
        this.upload_strategy = this.options.upload_strategy;
        this.upload_strategy.init();
    },
    
    triggerEvent: function(event_name, args) {
        var handler = this.upload_strategy[event_name];
        if (handler) {
            if ( ! args) {
                args = [];
            }
            handler.apply(this.upload_strategy, args);
        }
        this.triggerUserEvent(event_name, args);
    },

    triggerUserEvent: function(event_name, args) {
      var user_handler = this.options[event_name];
      if (user_handler) {
          user_handler.apply(window, args)
      }
    },
    
    boundHandler: function(event_name) {
        var triggerEvent = EaxUploader.bind(this, 'triggerEvent');
        return function() {
            triggerEvent(event_name, arguments);
        };
    },
    
    start: function() {
        throw "Unimplemented method start()";
    },
    
    disable: function() {
        throw "Unimplemented method disable()";
    },
    
    enable: function() {
        throw "Unimplemented method enable()";
    },
    
    cancel: function() {
        throw "Unimplemented method cancel()";
    },
    
    setValue: function(value) {
        throw "Unimplemented method setValue()";
    },
    
    getValue: function() {
        throw "Unimplemented method getValue()";
    }
};
