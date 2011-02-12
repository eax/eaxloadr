
EaxUploader.SmartWidget = function(html5_opts, flash_opts) {
    if (EaxUploader.supportHTML5Widget()) {
        return new EaxUploader.HTML5Widget(html5_opts);
    }
    else {
        return new EaxUploader.FlashWidget(flash_opts);
    }
};