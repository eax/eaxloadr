
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
