EaxUploader.UploadOnSelect = function() {
    EaxUploader.BaseStrategy.apply(this, arguments);
};
EaxUploader.UploadOnSelect.prototype = new EaxUploader.BaseStrategy();
EaxUploader.UploadOnSelect.prototype.constructor = EaxUploader.UploadOnSelect;

EaxUploader.UploadOnSelect.prototype.onchange = function(event, file) {
    this.widget.start();
};

EaxUploader.UploadOnSelect.prototype.onloadstart = function() {
    this.widget.options.progress_handler.reset();
    if (this.widget.options.progress_handler) {
        this.widget.options.progress_handler.start(this.widget.getFile());
    }
};

EaxUploader.UploadOnSelect.prototype.onabort = function(event) {
    this.widget.enable();

    this.widget.options.progress_handler.reset();
};

EaxUploader.UploadOnSelect.prototype.onerror = function(event, file, code, message, more) {
    this.widget.options.progress_handler.reset();
};
