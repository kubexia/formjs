(function($) {
    
    var language = 'en';
    var attributes = {
        'required': ':name is required'
    };
    
    var formJsValidator = $.fn.formJS;
    $.fn.formJS = function(options) {
        if(typeof options === "object") {
            options = $.extend(true, options, {
                validatorSetup: {
                    language: language,
                    attributes: attributes
                }
            });
        }

        var args = Array.prototype.slice.call(arguments,0);
        return formJsValidator.apply(this, args);
    }

})(jQuery);