
EaxUploader.UploadOnSubmit = function() {
    var options = arguments[0];
    this.disable_submit_button = true;
    if (options) {
        if (typeof options.disable_submit_button != 'undefined') {
            this.disable_submit_button = options.disable_submit_button;
        }
    }
    EaxUploader.BaseStrategy.apply(this, arguments);
};
EaxUploader.UploadOnSubmit.prototype = new EaxUploader.BaseStrategy();
EaxUploader.UploadOnSubmit.prototype.constructor = EaxUploader.UploadOnSubmit;

EaxUploader.UploadOnSubmit.prototype.init = function() {
    var form = this.widget.query.parents("form")[0];

    if ( ! form) {
        EaxUploader.alert("Could not find a suitable form. Please place the call to eaxUploader() after the form, or to be executed onload().");
        return false;
    }

    if (jQuery(form).find('[name=submit], #submit').length != 0) {
        EaxUploader.alert("An element of your file upload form is incorrect (most probably the submit button). Neither NAME nor ID can be set to \"submit\" on any field.");
        return false;
    }

    return EaxUploader.BaseStrategy.prototype.init.apply(this, arguments);
};

EaxUploader.UploadOnSubmit.prototype.disableSubmitButton = function(){
    jQuery(this.getSubmitButton()).attr('disabled', true);
};

EaxUploader.UploadOnSubmit.prototype.enableSubmitButton = function(){
    return jQuery(this.getSubmitButton()).removeAttr('disabled');
};

EaxUploader.UploadOnSubmit.prototype.getSubmitButton = function() {
    return jQuery(this.getForm()).find('input[type=submit]');
};

EaxUploader.UploadOnSubmit.prototype.getForm = function() {
    return this.widget.query.parents('form').get(0);
};


EaxUploader.UploadOnSubmit.prototype.onchange = function() {
    this.enableSubmitButton();
};

EaxUploader.UploadOnSubmit.prototype.onwidgetload = function() {
    if ( ! this.widget) {
      return;
    }

    var form = this.getForm();

    if ( ! form) {
      return;
    }

    jQuery(form).submit(EaxUploader.bind(this, 'onsubmit'));

    if(this.disable_submit_button) {
        this.disableSubmitButton();
    }
};

EaxUploader.UploadOnSubmit.prototype.onloadstart = function() {
    this.widget.disable();
    this.widget.options.progress_handler.reset();
    this.disableSubmitButton();
    if (this.widget.options.progress_handler) {
        this.widget.options.progress_handler.start(this.widget.getFile());
    }
};

EaxUploader.UploadOnSubmit.prototype.onsuccess = function(event) {
    this.getForm().submit();
};

EaxUploader.UploadOnSubmit.prototype.onerror = function() {
    this.widget.options.progress_handler.reset();
};

EaxUploader.UploadOnSubmit.prototype.onabort = function() {
    this.widget.enable();
    
    this.widget.options.progress_handler.reset();
    if (this.widget.options.disableSubmitButton) {
        this.disableSubmitButton();
    }
};

EaxUploader.UploadOnSubmit.prototype.onsubmit = function(event) {
    this.widget.start();
    return false;
};
