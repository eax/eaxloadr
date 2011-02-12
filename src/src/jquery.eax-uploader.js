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