// version: 1.0.0
// name: eax_uploader

function EaxUploader(){}

EaxUploader.getHttpStatusText = function(statusCode) {
    return {
        400: "Bad Request",
        401: "Unauthorized",
        404: "Not Found",
        412: "Precondition Failed",
        415: "Unsupported Media Type",
        500: "Internal Server Error"
    }[statusCode*1]
};

EaxUploader.getEaxError = function(statusCode) {
    return {
        400: "BadRequest",
        401: "NotAuthorized",
        404: "RecordNotFound",
        412: "CannotDelete",
        415: "FormatNotRecognised",
        500: "ServerError"
    }[statusCode*1]
}

EaxUploader.supportFileAPI = function() {
    var fi = document.createElement('INPUT');
    fi.type = 'file';
    return 'files' in fi;
};

EaxUploader.supportAjaxUploadProgressEvents = function() {
    var xhr = EaxUploader.createXHRObject();
    return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
}

EaxUploader.supportCORS = function() {
    if (typeof XDomainRequest != 'undefined') {
        return true;
    }
    else if (typeof XMLHttpRequest != 'undefined') {
        var ret = new XMLHttpRequest()
        return 'withCredentials' in ret;
    }
    else {
        return null;
    }
};

EaxUploader.supportHTML5Widget = function() {
    return EaxUploader.supportFileAPI() &&
      EaxUploader.supportAjaxUploadProgressEvents() &&
      EaxUploader.supportCORS();
};

// A variation of PPK's http://www.quirksmode.org/js/xmlhttp.html
EaxUploader.createXHRObject = function() {
    if (typeof this.XMLHttpFactories == 'undefined') {
        this.XMLHttpFactories = [
            function () { return new XDomainRequest(); },
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
            function () { return new ActiveXObject("Msxml3.XMLHTTP"); },
            function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
        ];
    }

    var xmlhttp = null;
    for (var i = 0; i < this.XMLHttpFactories.length; i++) {
        try {
            xmlhttp = this.XMLHttpFactories[i]();
        }
        catch (e) {
            continue;
        }
        break;
    }
    
    return xmlhttp;
};

EaxUploader.bind = function(object, method_name) {
    return function() {
        var method = object[method_name];
        if (method) {
            return method.apply(object, arguments);
        }
    }
};

EaxUploader.alert = function(msg) {
    return alert(msg);
};

EaxUploader.parseJSON = function(json_str) {
  if (jQuery && jQuery.parseJSON) {
      return jQuery.parseJSON(json_str);
  }
  else {
      return eval('(' + json_str + ')');
  }
};

EaxUploader.toJSON = function(hash) {
    var pairs = [];
    jQuery.each(hash, function(key, value) {
        pairs.push('"' + escape(key) + '":"' + escape(value) + '"');
    });
    return '{' + pairs.join(',') + '}';
    
    function escape(string) {
        return string.replace(new RegExp('"', 'g'), '\\"');
    }
}

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

EaxUploader.SmartWidget = function(html5_opts, flash_opts) {
    if (EaxUploader.supportHTML5Widget()) {
        return new EaxUploader.HTML5Widget(html5_opts);
    }
    else {
        return new EaxUploader.FlashWidget(flash_opts);
    }
};
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

EaxUploader.HTML5Widget = function() {
};

EaxUploader.HTML5Widget.prototype = new EaxUploader.BaseWidget();
EaxUploader.HTML5Widget.prototype.constructor = EaxUploader.HTML5Widget;

EaxUploader.HTML5Widget.prototype.init = function() {
    EaxUploader.BaseWidget.prototype.init.apply(this, arguments);
    
    this.xhr = EaxUploader.createXHRObject();
    this.xhr.upload.addEventListener('loadstart', this.boundHandler('onloadstart'), false);
    this.xhr.upload.addEventListener('progress', this.boundHandler('onprogress'), false);
    this.xhr.upload.addEventListener('load', this.boundHandler('onload'), false);
    this.xhr.upload.addEventListener('error', EaxUploader.bind(this, 'onerror'), false);
    this.xhr.upload.addEventListener('abort', this.boundHandler('onabort'), false);

    this.createField();
    
    this.triggerEvent('onwidgetload');
};

EaxUploader.HTML5Widget.prototype.start = function() {
    var file = this.getFile();
    this.xhr.open('POST', this.options.api_url, true);
    this.xhr.setRequestHeader("Cache-Control", "no-cache");
    this.xhr.setRequestHeader("Content-Type", "application/octet-stream");
    this.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    this.xhr.setRequestHeader("X-File-Name", file.name || file.fileName);
    this.bindRSCEvent();
    
    this.errorCalled = false;
    if ('name' in file) {
        // W3C-blessed interface
        this.xhr.send(file);
    }
    else {
        // Firefox 3.5
        this.xhr.sendAsBinary(file.getAsBinary());
    }
};

EaxUploader.HTML5Widget.prototype.abort = function() {
    this.xhr.abort();
}

EaxUploader.HTML5Widget.prototype.getFile = function() {
    return jQuery(this.getField()).get(0).files[0];
};

EaxUploader.HTML5Widget.prototype.setValue = function(value) {
    return this.query.val(value);
};

EaxUploader.HTML5Widget.prototype.disable = function() {
    jQuery(this.getField()).attr('disabled', true);
};

EaxUploader.HTML5Widget.prototype.enable = function() {
    jQuery(this.getField()).removeAttr('disabled');
};

EaxUploader.HTML5Widget.prototype.createField = function() {
    this.query.after('<input type="file"/>');
    jQuery(this.getField()).change(EaxUploader.bind(this, 'onchange'))
}

EaxUploader.HTML5Widget.prototype.getField = function() {
    return this.query.next().get(0);
};

EaxUploader.HTML5Widget.prototype.onerror = function(event) {
    this.notifyError(event);
};

EaxUploader.HTML5Widget.prototype.notifyError = function(event) {
    if (this.errorCalled) {
        return;
    }
    this.errorCalled = true;
    this.triggerEvent('onerror', [event, this.getFile()]);
}

EaxUploader.HTML5Widget.prototype.onreadystatechange = function(event) {
    this.triggerEvent('onreadystatechange', arguments);

    var status = null;

    try {
        status = event.target.status;
    }
    catch(e) {
        this.bindRSCEvent();
        return;
    }

    if (status == '200' && event.target.responseText) {
        var response = EaxUploader.parseJSON(event.target.responseText);
        this.setValue(response.id);
        this.triggerEvent('onsuccess', [event]);
    }
    else {
      if (status != '200') {
        this.notifyError(event);
      }
      this.bindRSCEvent();
    }
}

EaxUploader.HTML5Widget.prototype.bindRSCEvent = function() {
  jQuery(this.xhr).one('readystatechange', EaxUploader.bind(this, 'onreadystatechange'));
}

EaxUploader.HTML5Widget.prototype.onchange = function() {
    if (this.validateFileExtension() && this.validateFileSize()) {
        this.triggerEvent('onchange');
    }
    else {
        this.query.next('[type=file]').remove();
        this.createField();
    }
    
}

EaxUploader.HTML5Widget.prototype.validateFileExtension = function() {
    var ok = false;
    var that = this;
    jQuery.each(this.options.allowed_extensions, function(i, ext) {
        var re = new RegExp('\\.' + ext + '$');
        if (re.test(that.getFile().fileName)) {
            ok = true;
        }
    });
    if ( ! ok) {
        EaxUploader.alert("You did not select a valid file. Please select a valid file.");
    }
    return ok;
}

EaxUploader.HTML5Widget.prototype.validateFileSize = function() {
    var size = this.getFile().size || this.getFile().fileSize;
    var ok = size < 5368709120;
    if ( ! ok) {
        EaxUploader.alert("The file you are trying to upload is too large. The limit is 5GB");
    }
    return ok;
}

EaxUploader.BaseStrategy = function() {
};
EaxUploader.BaseStrategy.prototype = {
    setUploadWidget: function (upload_widget) {
        this.widget = upload_widget;
    },

    init: function () {
        return true;
    },
    
    // The widget has been set, about to return control to caller
    onwidgetload: function() {
    },
    
    // A file has been selected and the widget is ready to upload it
    onchange: function() {
    },
    
    // Upload commences
    onloadstart: function() {
    },
    
    // Upload progresses. Called zero or more times
    onprogress: function(event) {
        try {
            if (this.widget.options.progress_handler) {
                this.widget.options.progress_handler.setProgress(this.widget.getFile(), event.loaded, event.total);
            }
        } catch (ex) {
        }
    },

    // Upload succeeded
    onload: function() {
    },
    
    // Upload failed
    onerror: function() {
    },
    
    // Upload was aborted by the user
    onabort: function() {
    }
};

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
(function(){


jQuery.fn.checkEaxUploaderOptions = function(options) {
    if (options === undefined) {
        EaxUploader.alert("There was an error setting up the upload form. (The upload parameters were not specified).");
        return false;
    }
    
    if (this.size() == 0) {
        EaxUploader.alert("The jQuery element is empty. Method eaxUploader() cannot be executed");
        return false;
    }
    
    return true;
}

jQuery.fn.eaxUploader = function(options) {
    options = options === undefined ? {} : options;
    if ( ! this.checkEaxUploaderOptions(options)) {
        return false;
    }
    
    options = jQuery.extend({
        upload_progress_id: null,
        api_host: null,
        progress_handler: null,
        uploader_dir: "/eax_uploader",
        upload_strategy: null,
        widget: null,
        allowed_extensions: ['*']
    }, options);
    options['api_url'] = options['api_url'] || 'http://' + options['api_host'];
    
    if ( ! options.progress_handler) {
        options.progress_handler = new ProgressUpload(options);
    }
    
    var widget = options.widget;
    if ( ! widget) {
        widget = new EaxUploader.SmartWidget();
    }
    
    if ( ! options.upload_strategy) {
        options.upload_strategy = new EaxUploader.UploadOnSubmit();
    }
    options.upload_strategy.setUploadWidget(widget)
    
    widget.init(this, options);
    
    var $cancel_button = jQuery('#' + options.upload_cancel_button_id);
    if ($cancel_button) {
        $cancel_button.click(EaxUploader.bind(this.upload_strategy, 'onCancel'));
    }
    
    return this;
};


//
// A simple progress bar
//

function ProgressUpload(options) {
    this.options = options;
    this.$p = jQuery('#' + this.options.upload_progress_id);
    this.$p.css({
        display: 'none',
        width: '250px',
        height: '26px',
        border: '1px solid #0c3c7e',
        background: 'url(' + this.options.uploader_dir + '/progress_bg.gif) repeat scroll left top'
    });
    this.count = 0;
    this.fileSize = 0;
};

ProgressUpload.prototype = {
    start: function(file) {
        this.count = 0
        if (this.$p.size() == 0) {
            return;
        }
        
        if (this.$p.find('.progress-inside').size() == 0) {
            this.$p.append('<div class="progress-inside"></div>');
        }
        
        this.progress = this.$p.find('.progress-inside');
        this.progress.css({
            height: '100%',
            backgroundImage: 'url(' + this.options.uploader_dir + '/progress_fg.gif)'
        });
        this.fileSize = file.size;
        this.setProgress(file, 0, this.fileSize);
        this.$p.css('display', 'block');
        var self = this;
        this.timer = setInterval(function(){ self.animateBarBg() }, 20);
    },
    
    setProgress: function(file, loaded, total) {
        if ( ! this.progress) {
            return;
        }
        var percent = Math.ceil(loaded*100/this.fileSize);
        if (percent > 100) {
            percent = 100;
        }
        jQuery(this.progress).css('width', percent + '%');
    },
    
    animateBarBg: function() {
        this.count++;
        var bpos = this.$p.css("background-position");
        var currentOffset = bpos ? bpos.split(' ') : 0;
        if (this.count == 37) {
            this.count = 0;
            this.$p.css("background-position", (currentOffset + 36) + "px 0px");
        }
        else {
            this.$p.css("background-position", (currentOffset - 1) + "px 0px");
        }
    },
    
    reset: function(){
        clearInterval(this.timer)
        jQuery(this.progress).css('width', '0%');
        this.$p.css('display', 'none');
    }
};


})();