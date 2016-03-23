var xhr;
(function( $ ) {
    $.fn.formjs = function(config) {
        var handler = this.selector;
        
        $.each($(handler),function(){
             if(config !== undefined && typeof config.onInit === 'function'){
                config.onInit($(this));
            }
            
            var disableFormSubmit = false;

            if($(this).find('.single-fileupload').is('*')){
                if ( $.isFunction($.fn.fileupload) ) {
                    disableFormSubmit = true;
                    submitFormWithFile($(this));
                }
            }
            
            if(disableFormSubmit === false){
                $(this).on('submit',function(e){
                    e.preventDefault();
                    var form = $(this);
                    return submitForm(form);
                });
            }
        });
        
        var cb = function(callback,form,data){
            if(callback !== undefined){
                var fn = window[callback];
                if (typeof fn === "function"){
                    return fn(form,data);
                }
            }
            
            return false;
        };
        
        var addError = function(form,field,item){
            var formgroup = $(form).find('.form-group.'+field);
            if($(formgroup).is('*')){
                var inputgroup = $(formgroup).find('.input-group');

                $(formgroup).addClass('has-error');

                var customMsg = $(formgroup).find('.formjs-custom-message');
                if($(customMsg).is('*')){
                    $(customMsg).append('<p class="text-danger error-message">'+item+'</p>');
                }
                else{
                    if($(inputgroup).is('*')){
                        $(inputgroup).after('<p class="text-danger error-message">'+item+'</p>');
                    }
                    else{
                        if($(formgroup).find('.form-control').is('*')){
                            $($(formgroup).find('.form-control')).after('<p class="text-danger error-message">'+item+'</p>');
                        }
                        else{
                            $(formgroup).append('<p class="text-danger error-message">'+item+'</p>');
                        }
                    }
                }
            }
            else{
                field = field.replace('[','\\[');
                field = field.replace(']','\\]');
                var customDiv = $(form).find('.formjs-custom-message.'+field);
                if($(customDiv).is('*')){
                    $(customDiv).append('<p class="text-danger error-message">'+item+'</p>');
                }
            }
        };
        
        var messageNotification = function(form,data,submitbtn){
            $(form).find(".notification-message").remove();
            var delay = (data.message.delay !== undefined ? data.message.delay : 3000);
            var notificationHolder = (data.message.holder !== undefined ? data.message.holder : '.notification-holder');
            if(data.message.formholder !== undefined){
                form = data.message.form_holder;
            }
            if(data.message.text !== undefined){
                switch(data.message.type){
                    case "success":
                        $(form).find(notificationHolder).html('<div class="notification-message alert alert-success text-center">'+data.message.text+'</div>');
                        break;
                        
                    case "warning":
                        $(form).find(notificationHolder).html('<div class="notification-message alert alert-warning text-center">'+data.message.text+'</div>');
                        break;
                    
                    case "danger":
                        $(form).find(notificationHolder).html('<div class="notification-message alert alert-danger text-center">'+data.message.text+'</div>');
                        break;
                        
                    case "info":
                        $(form).find(notificationHolder).html('<div class="notification-message alert alert-info text-center">'+data.message.text+'</div>');
                        break;
                        
                    default:
                        $(form).find(notificationHolder).html('<div class="notification-message">'+data.message.text+'</div>');
                        break;
                }
            }
            else{
                $(form).find(notificationHolder).html('<div class="notification-message">'+data.message+'</div>');
            }
            
            if(data.message.redirect_to !== undefined){
                submitbtn.remove();
            }
            $('html,body').animate({
                scrollTop: $(form).find(".notification-message").offset().top - 10
            }, 500);
            
            if(data.message.hold_message === undefined || data.message.hold_message === false){
                $(form).find(".notification-message").delay(delay).fadeOut('slow',function(){
                    $(this).remove();
                    if(data.message.redirect_to !== undefined){
                        window.location.href = data.message.redirect_to;
                        return false;
                    }
                });
            }
            
            if(data.message.hide_form !== undefined && data.message.hide_form === true){
                $(form).find('.form-group').addClass('hide');
            }
            
            if(data.message.remove_form !== undefined && data.message.remove_form === true){
                $(form).find('.form-group').remove();
            }
            
            if(data.message.reset_form !== undefined && data.message.reset_form === true){
                resetForm($(form));
            }
            
            if(data.response !== null){
                if(data.response.append_to !== undefined){
                    appendTo(form,data);
                }
            }
        }
        
        var appendTo = function(form,data){
            var items = data.response.append_to;
            
            $.each(items, function (item, value) {
                var el = $(document).find(item);
                if(el.is('input')){
                    el.attr('value',value);
                }
                else{
                    el.html(value);
                }
            });
        };
        
        var doAfterSuccess = function(form, data, submitbtn){
            if($(form).attr('data-form-reset') === 'y'){
                resetForm(form);
            }

            if($(form).attr('data-callback-success') !== undefined){
                cb($(form).attr('data-callback-success'),form,data);
                $(submitbtn).button('reset');
            }
            
            if(data.response !== null && data.response.redirect_to !== undefined){
                window.location.href = data.response.redirect_to;
                return false;
            }
            
            if(data.response !== null && data.response.content !== undefined){
                $(submitbtn).button('reset');
                $(form).after(data.response.content);
                $(form).remove();
            }

            if(data.message){
                messageNotification(form,data,submitbtn);
                $(submitbtn).button('reset');
            }

            if(data.response !== null && data.response.append_to !== undefined){
                appendTo(form,data);
            }
            
            if(config !== undefined && typeof config.onSuccess === 'function'){
                $(submitbtn).button('reset');
                return config.onSuccess(form,data);
            }
            
            $(submitbtn).button('reset');
            
            return true;
        };
        
        var doAfterError = function(form,data,submitbtn){
            $(submitbtn).button('reset');
            cb($(form).attr('data-callback-error'),form,data);
            
            if(data.message){
                messageNotification(form,data,submitbtn);
                $(submitbtn).button('reset');
            }
            
            if(data.response !== null && data.response.redirect_to !== undefined){
                window.location.href = data.response.redirect_to;
                return false;
            }
            
            if(data.response !== null && data.response.append_to !== undefined){
                appendTo(form,data);
            }
            
            if(config !== undefined && typeof config.onError === 'function'){
                $(submitbtn).button('reset');
                return config.onError(form,data);
            }
            
            return false;
        };
        
        function resetForm($form) {
            $form.find('input:text, input:password, input:file, select, textarea').val('');
            $form.find('input:radio, input:checkbox').removeAttr('checked').removeAttr('selected');
        }
        
        function submitForm(form){
            $(form).attr('data-type','json');
            
            if(config !== undefined && typeof config.onSubmit === 'function'){
                config.onSubmit(form);
            }
            
            var action = $(form).attr('action');
            var data = $(form).serialize();
            var method = $(form).attr('method');
            var data_type = $(form).attr('data-type');
            
            var submitbtn = $(form).find('button.submit-btn');
            if($(submitbtn).attr('data-loading-text') === undefined || $(submitbtn).attr('data-loading-text') === ''){
                $(submitbtn).attr('data-loading-text',"<i class='fa fa-spinner fa-spin'></i> Please wait...");
            }
            else{
                $(submitbtn).attr('data-loading-text',"<i class='fa fa-spinner fa-spin'></i> " + ($(submitbtn).attr('data-loading-text') !== '' && $(submitbtn).attr('data-loading-text') !== undefined ? $(submitbtn).attr('data-loading-text') : 'Loading...'));
            }
            $(submitbtn).button('loading');
            
            $(form).find('.form-group.has-error').removeClass('has-error');
            $(form).find('p.error-message').remove();
            
            $.ajax({
                type: method,
                url: action,
                dataType: data_type,
                data: data,
                success: function(data){
                    if(data.success === false){
                        $.each(data.errors,function(field,item){
                            if(item.message === undefined && item.code === undefined){
                                $.each(item,function(k,it){
                                    addError(form,field,it);
                                });
                            }
                            else{
                                addError(form,field,item);
                            }
                        });
                        
                        doAfterError(form,data,submitbtn);
                        
                    }
                    else{
                        doAfterSuccess(form,data,submitbtn);
                    }
                    
                },
                error: function(e){
                    console.log(e.responseText);
                    $(form).append('ERROR: something went really wrong...');
                    $(submitbtn).button('reset');
                }
            });
            
            return false;
        }
        
        function submitFormWithFile(form){
            var submitbtn = $(form).find('button.submit-btn');
            
            var triggerNormalSubmit = true;
            
            $('.single-fileupload').fileupload({
                dataType: 'json',
                previewMaxWidth: 220,
                previewMaxHeight: 220,
                autoUpload: false,
                disableExifThumbnail: true,
                replaceFileInput: false,
                success: function(data){
                    if(data.success === false){
                        $.each(data.errors,function(field,item){
                            if(item.message === undefined && item.code === undefined){
                                $.each(item,function(k,it){
                                    addError(form,field,it);
                                });
                            }
                            else{
                                addError(form,field,item);
                            }
                        });
                        
                        doAfterError(form,data,submitbtn);
                        
                    }
                    else{
                        doAfterSuccess(form,data,submitbtn);
                    }
                },
                error: function(e){
                    console.log(e.responseText);
                    $(form).append('ERROR: something went really wrong...');
                    $(submitbtn).button('reset');
                }
            })
            .on('fileuploadadd', function (e, data) {
                triggerNormalSubmit = false;
                
                $("#cancelUpload").remove();
                
                form.find('.submit-btn').off('click').on('click', function () {
                    data.submit();
                });
                
                //var filename = data.files[0].name;
                //form.find('.single-fileupload-uploaded-filename').html(filename);
                
                if($(form).find('.single-fileupload-preview').is('*')){
                    loadImage(
                        data.files[0],
                        function (img) {
                            $(form).find('.single-fileupload-remove-preview').removeClass('hide');
                            $(form).find('.single-fileupload-preview-text').hide();
                            $(form).find('.single-fileupload-preview').html(img);
                        },
                        {maxWidth: 600} // Options
                    );
                }
            });
            
            $(document).on('submit',handler,function(e){
                e.preventDefault();
                
                if(triggerNormalSubmit){
                    submitForm(form);
                }
                else{
                    var submitbtn = $(form).find('button.submit-btn');
                    if($(submitbtn).attr('data-loading-text') === undefined || $(submitbtn).attr('data-loading-text') === ''){
                        $(submitbtn).attr('data-loading-text',"<i class='fa fa-spinner fa-spin'></i> Please wait...");
                    }
                    else{
                        $(submitbtn).attr('data-loading-text',"<i class='fa fa-spinner fa-spin'></i> " + ($(submitbtn).attr('data-loading-text') !== '' && $(submitbtn).attr('data-loading-text') !== undefined ? $(submitbtn).attr('data-loading-text') : 'Loading...'));
                    }
                    $(submitbtn).button('loading');

                    $(form).find('.form-group.has-error').removeClass('has-error');
                    $(form).find('p.error-message').remove();
                }
            });
            /*
            $(document).on('click','.single-fileupload-remove-preview',function(e){
                e.preventDefault();
                $(this).addClass('hide');
                $(form).find('.single-fileupload-preview-text').show();
                $(form).find('.single-fileupload-preview').html('');
                $(form).find('.single-fileupload-uploaded-filename').html('');
            });
            */
        }
    };
})( jQuery );