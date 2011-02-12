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
