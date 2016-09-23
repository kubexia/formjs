(function( $ ) {
    $.fn.formJS = function(config) {
        
        if(config === undefined){
            config = {};
        }
        var $config = config;
        
        var $handler = this;
        
        return new function(){
            
            var $instance = this;
            
            var $defaultConfigs = {
                messageNotificationDelay: 3000,
                hideFormAfterSuccess: false,
                removeFormAfterSuccess: false,
                resetFormAfterSuccess: false,
                onFieldFocusRemoveError: true,
                validateBeforeSubmit: false,
                loadingText: '<i class="fa fa-spin fa-spinner fa-fw"></i> Please wait...'
            };
            
            var $response = {
                data: null,
                message: null,
                errors: null,
                success: null
            };
            
            var $callbacks = {};
            
            var $validatorErrors = {};
            
            var $storedFiles = [];
            
            this.init = function(){
                this.setDefaultConfigs();
                
                this.bindEvents();
                this.bindResetButton();
                this.fixAutocompleteOff();
                this.enableSelect2();
                this.enableDatePicker();
                this.enableFileUploads();
                
                return this;
            };
            
            this.setDefaultConfigs = function(){
                $.each($defaultConfigs,function(k,v){
                    if($config[k] === undefined){
                        $config[k] = v;
                    }
                });
            };
            
            this.bindEvents = function(){
                $('.formjs-event-binder').click(function(e){
                    e.preventDefault();
                    return $instance['event_' + $(this).attr('data-event')]($(this));
                });
                
                /*
                $(document).on('click','.formjs-event-binder', function(e){
                    e.preventDefault();
                    return $instance['event_' + $(this).attr('data-event')]($(this));
                });
                */
            };
            
            this.bindResetButton = function(){
                $handler.find('.form-control').keyup(function(){
                    var form = $(this).closest($handler);
                    var btnReset = form.find('.btn-reset-form');
                    
                    var showResetBtn = false;
                    $.each(form.find('.form-control'),function(){
                        if($(this).val() !== ''){
                            showResetBtn = true;
                            return;
                        }
                    });
                    
                    if(showResetBtn){
                        btnReset.removeClass('hide');
                    }
                    else{
                        btnReset.addClass('hide');
                    }
                });
            };
            
            this.fixAutocompleteOff = function(){
                var items = $($handler).find('input[autocomplete="off"]');
                $.each(items,function(){
                    if($(this).attr('value') === ''){
                        $(this).val('');
                    }
                });
            };
            
            this.enableSelect2 = function(){
                var sel2 = function(_this){
                    _this.select2({
                        placeholder: _this.attr('placeholder'),
                        allowClear: (_this.attr('data-allow-clear') ? true : false),
                        tags: (_this.attr('data-with-tags') ? true : false),
                        maximumSelectionLength: (_this.attr('data-max-tags') ? _this.attr('data-max-tags') : 0)
                    });
                    if(_this.attr('multiple') === 'multiple'){
                        _this.attr('data-name', _this.attr('name'));
                        _this.removeAttr('name');
                    }
                    if(_this.attr('data-name') !== undefined && _this.attr('multiple') === 'multiple'){
                        var selected = _this.attr('data-selected').split(',');
                        var id = 'selectedMultiple_'+_this.attr('data-name');

                        _this.after('<input type="hidden" id="'+id+'" name="'+_this.attr('data-name')+'" value="'+_this.attr('data-selected')+'">');
                        if(_this.attr('data-selected').length > 0){
                            _this.val(selected).change();
                        }

                        _this.on('change',function(item){
                            $('#'+id).val($(this).val());
                        });
                    }
                    else{
                        if(_this.attr('data-selected') !== undefined){
                            if(_this.attr('data-name') !== undefined){
                                var id = 'selectedSingle_'+_this.attr('data-name');
                                _this.after('<input type="hidden" id="'+id+'" name="'+_this.attr('data-name')+'" value="'+_this.attr('data-selected')+'">');
                            }
                            
                            var selected = _this.attr('data-selected').split(',');
                            _this.val(selected).change();

                            _this.on('change',function(item){
                                $('#'+id).val($(this).val());
                            });
                        }
                    }
                    $('.select2').css('width','100%');
                    
                    _this.on('select2:open',function(){
                        $instance.clearElementErrors($(this));
                    });
                }
                
                $.each($handler.find(".sel2"),function(){
                    var _this = $(this);
                    sel2(_this);
                });
            };
            
            this.enableDatePicker = function(){
                $.each($handler.find('.pickdate'), function(){
                    var _this = $(this);
                    $(this).datepicker({
                        format: (_this.data('format') ? _this.data('format') : 'mm/dd/yyyy'),
                        autoclose: true,
                        todayHighlight: true
                    });
                });
            };
            
            this.enableFileUploads = function(){
                var input = $handler.find('.file-upload-input');
                if(!input.is('*')){
                    return false;
                }
                
                input.on('change',function(e){
                    var files = e.target.files;
                    var filesArr = Array.prototype.slice.call(files);
                    var _this = $(this);
                    
                    $.each(filesArr, function(i, f){
                        $storedFiles.push({name: _this.attr('name'), file: f});
                        $instance.handleImageStored(_this, f);
                    });
                });
                this.handleDeleteImageStored();
                this.enableFileDrops();
            };
            
            this.enableFileDrops = function(){
                window.addEventListener("dragover",function(e){
                    e = e || event;
                    e.preventDefault();
                },false);
                window.addEventListener("drop",function(e){
                    e = e || event;
                    e.preventDefault();
                },false);
                
                var box = $handler.find('.file-upload-box');
                $.each(box, function(){
                    var _this = $(this);
                    var btnFile = _this.find('.btn-file');
                    var dropZone = _this.find('.file-upload-drop');
                    _this.on('dragover dragenter', function(){
                        btnFile.addClass('hide');
                        dropZone.removeClass('hide');
                        _this.find('.image-upload-preview ').addClass('hide');
                        _this.find('.image-upload-preview ').addClass('hide');
                        _this.find('.image-upload-remove').addClass('hide');
                    })
                    .on('dragleave dragend drop', function(){
                        btnFile.removeClass('hide');
                        dropZone.addClass('hide');
                        _this.find('.image-upload-preview ').removeClass('hide');
                        _this.find('.image-upload-remove').removeClass('hide');
                    })
                    .on('drop', function(e){
                        var files = e.originalEvent.dataTransfer.files;
                        var filesArr = Array.prototype.slice.call(files);
                        var _this = $(this);

                        $.each(filesArr, function(i, f){
                            $storedFiles.push({name: box.find('.file-upload-input').attr('name'), file: f});
                            $instance.handleImageStored(_this, f);
                        });
                    });
                });
            };
            
            this.handleDeleteImageStored = function(){
                $('.image-upload-remove').click(function(e){
                    e.preventDefault();
                    var _this = $(this);
                    var fileUploadBox = _this.closest('.file-upload-box');
                    var input = fileUploadBox.find('.file-upload-input');
                    var imagePreviewBox = fileUploadBox.find('.image-upload-preview');
                    if(imagePreviewBox.is('*')){
                        imagePreviewBox.html('');
                        imagePreviewBox.addClass('hide');
                        $(this).addClass('hide');
                        
                        if(input.attr('data-image-delete-url') === '' || input.attr('data-image-delete-url') === '#' || input.attr('data-image-delete-url') === undefined){
                            //remove from array
                            for(var i=0;i<$storedFiles.length;i++) {
                                if($storedFiles[i].name === input.attr('name')) {
                                    $storedFiles.splice(i,1);
                                    break;
                                }
                            }
                        }
                        else{
                            $.ajax({
                                type: "POST",
                                url: input.attr('data-image-delete-url'),
                                dataType: 'json',
                                data: {
                                    '_method': 'DELETE'
                                },
                                success: function(data){
                                    var returnUrl = (input.attr('data-return-url') === undefined ? false : input.attr('data-return-url'));
                                    if(returnUrl){
                                        document.location.href = (returnUrl ? returnUrl : document.location.href);
                                    }
                                    
                                    if(input.attr('data-callback-success') !== undefined){
                                        var fn = window[input.attr('data-callback-success')];
                                        if (typeof fn === "function"){
                                            return fn(_this,data);
                                        }
                                    }
                                },
                                error: function(xhr, textStatus, errorThrown){
                                    console.log(xhr.responseText);
                                }
                            });
                            
                            input.removeAttr('data-image-delete-url');
                            input.removeAttr('data-image-url');
                        }
                    }
                });
                
                $handler.on('click','.image-upload-remove-from-gallery',function(e){
                    e.preventDefault();
                    
                    var element = $(this).closest('.image-upload-gallery-element');
                    for(var i=0;i<$storedFiles.length;i++) {
                        if($storedFiles[i].file.name === $(this).attr('data-image-name')) {
                            $storedFiles.splice(i,1);
                            break;
                        }
                    }
                    element.remove();
                });
            };
            
            this.handleImageStored = function(input, image){
                var fileUploadBox = input.closest('.file-upload-box');
                
                var imagePreviewBox = fileUploadBox.find('.image-upload-preview');
                if(imagePreviewBox.is('*')){
                    var btnDeleteImage = fileUploadBox.find('.image-upload-remove');
                    imagePreviewBox.removeClass('hide');
                    btnDeleteImage.removeClass('hide');
                    imagePreviewBox.html(this.getConfig('loadingText'));

                    loadImage(
                        image,
                        function (img) {
                            imagePreviewBox.html(img);
                            var imageContainer = imagePreviewBox.find('img');
                            if(!input.attr('data-max-width')){
                                imageContainer.removeAttr('width');
                                imageContainer.removeAttr('height');
                                imageContainer.addClass('img-responsive');
                            }
                        },
                        {maxWidth: input.attr('data-max-width')} // Options
                    );
                }
                
                var imagePreviewGalleryBox = fileUploadBox.find('.image-upload-preview-gallery');
                if(imagePreviewGalleryBox.is('*')){
                    var gallery = imagePreviewGalleryBox.find('ul');
                    if(!gallery.is('*')){
                        imagePreviewGalleryBox.html('<ul class="formjs-image-gallery"></ul>');
                        gallery = imagePreviewGalleryBox.find('ul');
                    }
                    
                    loadImage(
                        image,
                        function (img) {
                            gallery.append($('<li class="image-upload-gallery-element">').html(img).append('<a href="#" data-image-name="'+image.name+'" class="image-upload-remove-from-gallery"><i class="fa fa-times-circle"></i></a>'));
                        },
                        {maxWidth: (input.attr('data-max-width') ? input.attr('data-max-width') : 150)} // Options
                    );
                }
            };
            
            this.getConfig = function(name){
                return ($config[name] !== undefined ? $config[name] : null);
            };
            
            this.submitForm = function(form, btn){
                if(form.attr('data-setup') !== undefined){
                    $config.formSetup = {};
                    $.each($.parseJSON(form.attr('data-setup')),function(key,val){
                        $config.formSetup[key] = val;
                    });
                }
                else{
                    $config.formSetup = {};
                }
                
                form.find('.form-control').focus(function(){
                    if($callbacks['onFieldFocus'] !== undefined){
                        $callbacks['onFieldFocus']($(this),$instance,form);
                    }
                    else{
                        $instance.clearElementErrors($(this));
                    }
                });
                
                if($config.validateBeforeSubmit === false){
                    this.sendPost(form, btn);
                }
                else{
                    if(this.validator()){
                        this.sendPost(form, btn);
                    }
                }
            };
            
            this.event_submitForm = function(btn){
                var form = btn.closest($handler);
                this.submitForm(form, btn);
            };
            
            this.event_submitModalForm = function(btn){
                var modal = btn.closest('.formjs-modal');
                var form = modal.find($handler);
                this.submitForm(form, btn);
            };
            
            this.event_resetModalForm = function(btn){
                var modal = btn.closest('.formjs-modal');
                var form = modal.find($handler);
                this.resetForm(form);
                this.clearErrors(form);
            };
            
            this.event_resetForm = function(btn){
                var form = btn.closest($handler);
                this.resetForm(form);
                this.clearErrors(form);
                btn.addClass('hide');
            };
            
            this.event_clearErrorsModalForm = function(btn){
                var modal = btn.closest('.formjs-modal');
                var form = modal.find($handler);
                this.clearErrors(form);
            };
            
            this.event_itemDelete = function(btn){
                var form = btn.closest($handler);
                var returnUrl = (btn.data('return-url') !== undefined && btn.data('return-url') !== '' ? btn.data('return-url') : document.location.href);
                
                if(btn.attr('data-loading-text') === undefined){
                    btn.attr('data-loading-text',this.getConfig('loadingText'));
                }
                btn.button('loading');
                
                if(confirm(btn.data('message'))){
                    $.ajax({
                        type: "POST",
                        url: btn.data('request-url'),
                        dataType: 'json',
                        data: {'_method': 'DELETE'},
                        success: function(data){
                            $instance.setResponse(data);
                            
                            if($instance.getResponseSuccess() === true){
                                if(btn.data('callback-success') !== undefined){
                                    var cb = window[object.data('callback-success')];
                                    if (typeof cb === "function"){
                                        return cb($instance,form,data, btn);
                                    }
                                }
                                else{
                                    if($instance.getResponseData('redirect_to')){
                                        returnUrl = $instance.getResponseData('redirect_to');
                                    }
                                    document.location.href = (returnUrl ? returnUrl : document.location.href);
                                }
                            }
                        },
                        error: function(xhr, textStatus, errorThrown){
                            console.log(xhr.responseText);
                        }
                    });
                }
                else{
                    btn.button('reset');
                }
            };
            
            this.event_itemDeleteModal = function(btn){
                var form = btn.closest($handler);
                var returnUrl = (btn.data('return-url') !== undefined && btn.data('return-url') !== '' ? btn.data('return-url') : document.location.href);
                
                if(btn.attr('data-loading-text') === undefined){
                    btn.attr('data-loading-text',this.getConfig('loadingText'));
                }
                btn.button('loading');
                
                alert('todo');
                
            };
            
            this.sendPost = function(form, btn){
                form.on('submit',function(e){
                    e.preventDefault();
                    if(btn.attr('data-loading-text') === undefined){
                        btn.attr('data-loading-text',$instance.getConfig('loadingText'));
                    }
                    btn.button('loading');

                    var method = form.attr('method');
                    var action = form.attr('action');
                    //var data = form.serializeArray();
                    
                    $instance.clearErrors(form);
                    
                    var fd = new FormData();
                    $.each($storedFiles,function(i, item){
                        fd.append(item.name, item.file);
                    });
                    
                    $.each(form.serializeArray(), function(i, input){
                        fd.append(input.name, input.value);
                    })
                    
                    $.ajax({
                        type: method,
                        url: action,
                        dataType: 'json',
                        contentType: false,
                        processData: false,
                        data: fd,
                        success: function(data){
                            $instance.setResponse(data);

                            if($instance.getResponseSuccess() === false){
                                $instance.addErrors(form, btn, $instance.getResponse('errors'));
                            }
                            else{
                                $instance.addMessage(form, btn);
                                /*
                                 * dont know why i did this... they look the same :)
                                 * 
                                if($instance.getResponse('data')){
                                    $instance.handleResponse(form, btn);
                                }
                                else{
                                    $instance.addMessage(form, btn);
                                }
                                */
                            }
                        },
                        error: function(e){
                            console.log(e.responseText);
                            form.find(".notification-message").remove();
                            if(!form.find('.formjs-notification-holder').is('*')){
                                form.prepend('<div class="formjs-notification-holder"></div>');
                            }
                            var notificationHolder = form.find('.formjs-notification-holder');
                            notificationHolder.html('<div class="notification-message alert alert-danger">'+e.responseText+'</div>');
                            btn.button('reset');
                        }
                    });
                });
                
                form.submit();
                form.unbind('submit');
            }
            
            this.setResponse = function(r){
                $response.success = r.success;
                $response.message = r.message;
                $response.errors = r.errors;
                $response.data = r.response;
            };
            
            this.getResponse = function(name){
                return ($response[name] !== undefined ? $response[name] : null);
            };
            
            this.getResponseSuccess = function(){
                return ($response.success ? true : false);
            };
            
            this.getResponseData = function(name){
                return ($response.data !== null && $response.data[name] !== undefined ? $response.data[name] : null);
            };
            
            this.hasResponseData = function(name){
                return ($response.data !== null && $response.data[name] !== undefined ? true : false);
            };
            
            this.getResponseErrors = function(){
                return $response.errors;
            };
            
            this.getResponseMessage = function(name){
                return ($response.message !== null && $response.message[name] !== undefined ? $response.message[name] : null);
            };
            
            this.addErrors = function(form, btn, errors){
                $.each(errors,function(field,item){
                    if(item.message === undefined && item.code === undefined){
                        $.each(item,function(k,it){
                            $instance.addError(form, field,it);
                        });
                    }
                    else{
                        $instance.addError(form, field,item);
                    }
                });
                
                if($config.formSetup !== undefined && $config.formSetup.onError !== undefined){
                    var fn = window[$config.formSetup.onError];
                    if (typeof fn === "function"){
                        return fn($instance,form,$response);
                    }
                }
                
                if($callbacks['onError'] !== undefined){
                    return $callbacks['onError']($instance,form,$response);
                }
                
                btn.button('reset');
            };
            
            this.addError = function(form, field,item){
                field = field.replace('[','\\[');
                field = field.replace(']','\\]');
                
                var formgroup = form.find('.form-group.'+field);
                if($(formgroup).is('*')){
                    var inputgroup = $(formgroup).find('.input-group');

                    $(formgroup).addClass('has-error');

                    var customMsg = $(formgroup).find('.formjs-custom-message');
                    if($(customMsg).is('*')){
                        $(customMsg).append('<p class="text-danger formjs-error-message">'+item+'</p>');
                    }
                    else{
                        if($(inputgroup).is('*')){
                            $(inputgroup).after('<p class="text-danger formjs-error-message">'+item+'</p>');
                        }
                        else{
                            if($(formgroup).find('.form-control').is('*')){
                                $($(formgroup).find('.form-control')).after('<p class="text-danger formjs-error-message">'+item+'</p>');
                            }
                            else{
                                $(formgroup).append('<p class="text-danger formjs-error-message">'+item+'</p>');
                            }
                        }
                    }
                }
                else{
                    var customDiv = form.find('.formjs-custom-message.'+field);
                    if(customDiv.is('*')){
                        var fgroup = (customDiv.closest('.form-group-item').is('*') ? customDiv.closest('.form-group-item') : customDiv.closest('.form-group'));
                        fgroup.addClass('has-error');
                        customDiv.append('<p class="text-danger formjs-error-message">'+item+'</p>');
                    }
                }
            };
            
            this.addMessage = function(form, btn){
                this.addMessageNotification(form, btn);
                var delay = (this.getResponseMessage('delay') ? this.getResponseMessage('delay') : this.getConfig('messageNotificationDelay'));
                var redirectTo = (this.getResponseMessage('redirect_to') ? this.getResponseMessage('redirect_to') : false);
                if(redirectTo){
                    //btn.remove();
                }
                else{
                    if(this.getResponseMessage('remove_form')){
                        btn.remove();
                    }
                    else{
                        btn.button('reset');
                    }
                }
                
                form.find(".notification-message").delay(delay).fadeOut('slow',function(){
                    $(this).remove();
                    if(redirectTo){
                        window.location.href = redirectTo;
                    }
                });
                
                var hideFormAfterSuccess = (this.getResponseMessage('hide_form') ? this.getResponseMessage('hide_form') : this.getConfig('hideFormAfterSuccess'));
                var hideFormAfterSuccessText = (this.getResponseMessage('hide_form') && this.getResponseMessage('hide_form').text !== undefined ? this.getResponseMessage('hide_form').text : false);
                if(hideFormAfterSuccess){
                    setTimeout(function(){
                        if(hideFormAfterSuccessText){
                            //form.after(hideFormAfterSuccessText);
                            var formContainer = form.parent();
                            formContainer.html(hideFormAfterSuccessText);
                            formContainer.find('.formjs').formJS();
                        }
                        form.addClass('hide');
                    },delay);
                }
                
                var removeFormAfterSuccess = (this.getResponseMessage('remove_form') ? this.getResponseMessage('remove_form') : this.getConfig('removeFormAfterSuccess'));
                var removeFormAfterSuccessText = (this.getResponseMessage('remove_form') && this.getResponseMessage('remove_form').text !== undefined ? this.getResponseMessage('remove_form').text : false);
                if(removeFormAfterSuccess){
                    setTimeout(function(){
                        if(removeFormAfterSuccessText){
                            //form.after(removeFormAfterSuccessText);
                            var formContainer = form.parent();
                            formContainer.html(removeFormAfterSuccessText);
                            formContainer.find('.formjs').formJS();
                        }
                        form.remove();
                    },delay);
                }
                
                var resetFormAfterSuccess = (this.getResponseMessage('reset_form') ? this.getResponseMessage('reset_form') : this.getConfig('resetFormAfterSuccess'));
                if(resetFormAfterSuccess){
                    this.resetForm(form);
                }
                
                if($config.formSetup.onSuccess !== undefined){
                    var fn = window[$config.formSetup.onSuccess];
                    if (typeof fn === "function"){
                        return fn($instance,form,$response, btn);
                    }
                }
                
                if($callbacks['onSuccess'] !== undefined){
                    $callbacks['onSuccess']($instance,form,$response, btn);
                }
                
                if(this.getResponseData('appendAttributesTo')){
                    $.each(this.getResponseData('appendAttributesTo'), function(item, attr){
                        $.each(attr, function(k,v){
                            if(k === 'class'){
                                $(item).addClass(v);
                            }
                            else{
                                $(item).attr(k,v);
                            }
                        });
                    })
                }
                
                if(this.getResponseData('replaceElementsWith')){
                    $.each(this.getResponseData('replaceElementsWith'), function(item, value){
                        $(item).html(value);
                    })
                }
            };
            
            this.handleResponse = function(form, btn){
                this.addMessageNotification(form, btn);
                var delay = (this.hasResponseData('delay') ? this.getResponseData('delay') : 0);
                var redirectTo = (this.getResponseData('redirect_to') ? this.getResponseData('redirect_to') : false);
                if(redirectTo){
                    //btn.remove();
                }
                else{
                    btn.button('reset');
                }
                
                if(redirectTo){
                    setTimeout(function(){
                        window.location.href = redirectTo;
                    },delay);
                }
                
                var hideFormAfterSuccess = (this.getResponseData('hide_form') ? this.getResponseData('hide_form') : this.getConfig('hideFormAfterSuccess'));
                if(hideFormAfterSuccess){
                    form.addClass('hide');
                }
                
                var removeFormAfterSuccess = (this.getResponseData('remove_form') ? this.getResponseData('remove_form') : this.getConfig('removeFormAfterSuccess'));
                if(removeFormAfterSuccess){
                    form.remove();
                }
                
                var resetFormAfterSuccess = (this.getResponseData('reset_form') ? this.getResponseData('reset_form') : this.getConfig('resetFormAfterSuccess'));
                if(resetFormAfterSuccess){
                    this.resetForm(form);
                }
                
                form.find(".notification-message").delay(delay).fadeOut('slow',function(){
                    $(this).remove();
                });
                
                if($config.formSetup.onSuccess !== undefined){
                    var fn = window[$config.formSetup.onSuccess];
                    if (typeof fn === "function"){
                        return fn($instance,form,$response, btn);
                    }
                }
                
                if($callbacks['onSuccess'] !== undefined){
                    $callbacks['onSuccess']($instance,form,$response,btn);
                }
            };
            
            this.addMessageNotification = function(form, btn){
                if(!this.getResponse('message')){
                    return false;
                }
                form.find(".notification-message").remove();
                if(!form.find('.formjs-notification-holder').is('*')){
                    form.prepend('<div class="formjs-notification-holder"></div>');
                }
                var notificationHolder = form.find('.formjs-notification-holder');
                var messageType = this.getResponseMessage('type');
                
                if(this.getResponseMessage('text')){
                    var messageText = this.getResponseMessage('text');
                    
                    switch(messageType){
                        case "success":
                            notificationHolder.html('<div class="notification-message alert alert-success text-center"><i class="fa fa-check fa-fw"></i> '+messageText+'</div>');
                            break;

                        case "warning":
                            notificationHolder.html('<div class="notification-message alert alert-warning text-center">'+messageText+'</div>');
                            break;

                        case "danger":
                            notificationHolder.html('<div class="notification-message alert alert-danger text-center">'+messageText+'</div>');
                            break;

                        case "info":
                            notificationHolder.html('<div class="notification-message alert alert-info text-center">'+messageText+'</div>');
                            break;

                        default:
                            notificationHolder.html('<div class="notification-message">'+messageText+'</div>');
                            break;
                    }
                }
                else{
                    if(this.getResponse('message')){
                        var messageText = this.getResponse('message');
                        notificationHolder.html('<div class="notification-message">'+messageText+'</div>');
                    }
                }
            };
            
            this.resetForm = function(form){
                form.find('input:text, input:password, input:file, select, textarea').val('');
                form.find('input:radio, input:checkbox').removeAttr('checked').removeAttr('selected');
            };
            
            this.clearErrors = function(form){
                form.find('.formjs-error-message').remove();
                form.find('.has-error').removeClass('has-error');
            };
            
            this.clearElementErrors = function(el){
                var holder = (el.closest('.form-group-item').is('*') ? el.closest('.form-group-item') : el.closest('.form-group'));
                holder.find('.formjs-error-message').remove();
                holder.removeClass('has-error');
            };
            
            /**
             * EVENTS
             */
            this.onInit = function(cb){
                $.each($($handler),function(){
                    cb($instance,$(this));
                });
                
                return this;
            };
            
            this.onSuccess = function(cb){
                $callbacks['onSuccess'] = cb;
                return this;
            };
            
            this.onError = function(cb){
                $callbacks['onError'] = cb;
                return this;
            };
            
            this.onFieldFocus = function(cb){
                $callbacks['onFieldFocus'] = cb;
                return this;
            };
            
            /**
             * VALIDATE BEFORE SUBMIT
             */
            this.validateBeforeSubmit = function(items,cfg){
                $config.validateBeforeSubmit = true;
                if(cfg.map !== undefined){
                    $config.validateMapElements = cfg.map[cfg.language];
                }
                return this;
            };
            
            this.validator = function(){
                this.clearErrors($form);
                $validatorErrors = {};
                $.each($form.find('input,select,textarea'),function(){
                    if($(this).attr('data-validate') !== undefined){
                        $instance.validateElement($(this));
                    }
                });
                
                if(Object.keys($validatorErrors).length > 0){
                    this.addErrors($validatorErrors);
                    return false;
                }
                
                return true;
            };
            
            this.validateElement = function(el){
                var rules = el.attr('data-validate').split('|');
                var name = el.attr('name');
                var value = el.val();
                $.each(rules,function(i,rule){
                    switch(rule){
                        case "required":
                            if(value === '' || value.length === 0){
                                var text = $instance.validatorTranslation('required');
                                var res = text.replace(':name',$instance.validatorMapElement(name));
                                $validatorErrors[name] = [res];
                            }
                            break;
                            
                        case "date":
                            break;
                            
                        case "dateformat":
                            break;
                            
                        case "max":
                            break;
                            
                        case "min":
                            break;
                    }
                });
            };
            
            this.validatorTranslation = function(attr){
                var value = null;
                if($config.validatorSetup !== undefined){
                    if($config.validatorSetup.attributes[attr] !== undefined){
                        value = $config.validatorSetup.attributes[attr];
                    }
                }
                
                return value;
            };
            
            this.validatorMapElement = function(name){
                if($config.validateMapElements !== undefined){
                    name = ($config.validateMapElements[name] !== undefined ? $config.validateMapElements[name] : name);
                }
                return name;
            };
            
            return this.init();
        };
    };
})( jQuery );