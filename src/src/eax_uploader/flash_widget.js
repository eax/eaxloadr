
EaxUploader.FlashWidget = function(options) {
  options = typeof options == 'undefined' ? {} : options;
  this.add_filename_field = true;
  if (typeof options.add_filename_field != 'undefined') {
    this.add_filename_field = options.add_filename_field;
  }
  this.swfupload_options = options === undefined ? {} : options;
}

EaxUploader.FlashWidget.prototype = new EaxUploader.BaseWidget();
EaxUploader.FlashWidget.prototype.constructor = EaxUploader.FlashWidget;

EaxUploader.FlashWidget.prototype.init = function() {
    EaxUploader.BaseWidget.prototype.init.apply(this, arguments);

    var field_id = this.query.attr('id');
    var placeholder_id = field_id + '_eaxuploader-flashwidget-placeholder';
    this.filename_field_id = field_id + '_orig-filename';
    this.query.after('<span id="' + placeholder_id + '"></span>');
    if (this.add_filename_field) {
      jQuery('#' + placeholder_id).after('<input type="text" style="position: relative; top: -8px; margin-left: .5em;" disabled="disabled" id="' + this.filename_field_id + '" />');
    }

    this.swfupload = this.query.swfupload(jQuery.extend({
        upload_url: this.options.api_url,
        file_size_limit : 0,
        file_types: this.allowedFileTypes(),
        file_types_description : "All Files",
        file_upload_limit : 0,
        flash_url : this.options.uploader_dir + "/swfupload.swf",
        button_image_url : this.options.uploader_dir + "/choose_file_button.png",
        button_width : 87,
        button_height : 27,
        button_placeholder_id: placeholder_id,
        file_post_name: "file",
        debug: false
    }, this.swfupload_options));

    this.swfupload.bind('swfuploadLoaded', this.boundHandler('onwidgetload'));
    this.swfupload.bind('fileQueued', EaxUploader.bind(this, 'fileQueued'));
    this.swfupload.bind('uploadStart', EaxUploader.bind(this, 'uploadStart'));
    this.swfupload.bind('uploadProgress', EaxUploader.bind(this, 'uploadProgress'));
    this.swfupload.bind('uploadSuccess', EaxUploader.bind(this, 'uploadSuccess'));
    this.swfupload.bind('uploadError', EaxUploader.bind(this, 'uploadError'));
};


EaxUploader.FlashWidget.prototype.fileQueued = function(evt, file) {
    this.file = file;
    jQuery('#' + this.filename_field_id).val(file.name);
    this.triggerEvent('onchange');
};
EaxUploader.FlashWidget.prototype.uploadStart = function(_file) {
    this.triggerEvent('onloadstart');
};
EaxUploader.FlashWidget.prototype.uploadProgress = function(evt, _file, bytesLoaded, bytesTotal) {
    evt.loaded = bytesLoaded;
    evt.total = bytesTotal;
    this.triggerEvent('onprogress', [evt]);
};
EaxUploader.FlashWidget.prototype.uploadSuccess = function(evt, file, response) {
    var resObj = EaxUploader.parseJSON(response);
    this.setValue(resObj.id);

    var event = {
        target: {
            status: '200',
            responseText: response
        }
    };
    this.triggerEvent('onreadystatechange', [event]);
    this.triggerEvent('onsuccess', [event]);
};

EaxUploader.FlashWidget.prototype.uploadError = function(evt, file, swfCode, httpCode) {
    this.triggerEvent('onerror', [createW3CEvent(evt, httpCode), createW3CFile(file)]);
    
    function createW3CEvent(evt) {
        var httpMsg  = EaxUploader.getHttpStatusText(httpCode);
        var eaxMsg = EaxUploader.getEaxError(httpCode);
        return {
            target: {
                status: httpCode,
                statusText: httpMsg,
                responseText: '{"message":"' + httpMsg + '",error:"' + eaxMsg + '"}'
            }
        }
    }
    
    function createW3CFile(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type
        }
    }
};

EaxUploader.FlashWidget.prototype.getFile = function() {
    return this.file;
};

EaxUploader.FlashWidget.prototype.start = function() {
    return this.swfupload.swfupload('startUpload');
};

EaxUploader.FlashWidget.prototype.disable = function() {
    return this.swfupload.swfupload('setButtonDisabled', true);
};

EaxUploader.FlashWidget.prototype.enable = function() {
    return this.swfupload.swfupload('setButtonDisabled', false);
};

EaxUploader.FlashWidget.prototype.abort = function() {
    this.swfupload.swfupload('cancelUpload', '', false);
    this.triggerEvent('onabort');
};

EaxUploader.FlashWidget.prototype.setValue = function(value) {
    return this.swfupload.val(value);
};

EaxUploader.FlashWidget.prototype.getValue = function() {
    return this.swfupload.val();
};

EaxUploader.FlashWidget.prototype.allowedFileTypes = function() {
    if (! this.options.allowed_extensions) {
        return '*.*';
    }
    var ret = '';
    return jQuery.map(this.options.allowed_extensions, function(e){
        return '*.' + e;
    }).join(';');
};
