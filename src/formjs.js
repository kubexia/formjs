(function( $ ) {
    $.fn.formJS = function(config) {
        var $this = $(this);
        
        if(config === undefined){
            config = {};
        }
        var $config = config;
        
        var $handler = this.selector;
        
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
            
            var $form = null;
            
            var $modal = null;
            
            var $submitBtn = null;
            
            var $response = {
                data: null,
                message: null,
                errors: null,
                success: null
            };
            
            var $callbacks = {};
            
            var $validatorErrors = {};
            
            this.init = function(){
                this.setDefaultConfigs($defaultConfigs);
                
                this.bindEvents();
                this.bindResetButton();
                
                return this;
            };
            
            this.setDefaultConfigs = function(items){
                $.each(items,function(k,v){
                    if($config[k] === undefined){
                        $config[k] = v;
                    }
                });
            };
            
            this.bindEvents = function(){
                $(document).on('click','.formjs-event-binder',function(e){
                    e.preventDefault();
                    
                    return $instance['event_' + $(this).attr('data-event')]($(this));
                });
            };
            
            this.bindResetButton = function(){
                $('.form-control').keyup(function(){
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
            
            this.getConfig = function(name){
                return ($config[name] !== undefined ? $config[name] : null);
            };
            
            this.submitForm = function(form){
                if(form.attr('data-setup') !== undefined){
                    $config.formSetup = {};
                    $.each($.parseJSON($form.attr('data-setup')),function(key,val){
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
                    this.sendPost();
                }
                else{
                    if(this.validator()){
                        this.sendPost();
                    }
                }
            };
            
            this.event_submitForm = function(btn){
                $form = btn.closest($handler);
                $submitBtn = btn;
                
                this.submitForm($form);
            };
            
            this.event_submitModalForm = function(btn){
                $modal = btn.closest('.formjs-modal');
                $form = $modal.find($handler);
                $submitBtn = btn;
                
                this.submitForm($form);
            };
            
            this.event_resetModalForm = function(btn){
                $modal = btn.closest('.formjs-modal');
                $form = $modal.find($handler);
                this.resetForm($form);
                this.clearErrors($form);
            };
            
            this.event_resetForm = function(btn){
                $form = btn.closest($handler);
                this.resetForm($form);
                this.clearErrors($form);
                btn.addClass('hide');
            };
            
            this.sendPost = function(){
                if($submitBtn.attr('data-loading-text') === undefined){
                    $submitBtn.attr('data-loading-text',this.getConfig('loadingText'));
                }
                $submitBtn.button('loading');
                
                var method = $form.attr('method');
                var action = $form.attr('action');
                var data = $form.serialize();
                
                this.clearErrors($form);
                
                $.ajax({
                    type: method,
                    url: action,
                    dataType: 'json',
                    data: data,
                    success: function(data){
                        $instance.setResponse(data);
                        
                        if($instance.getResponseSuccess() === false){
                            $instance.addErrors($instance.getResponse('errors'));
                        }
                        else{
                            if($instance.getResponse('data')){
                                $instance.handleResponse();
                            }
                            else{
                                $instance.addMessage();
                            }
                        }
                        
                        $submitBtn.button('reset');
                    },
                    error: function(e){
                        console.log(e.responseText);
                        $form.append('ERROR: something went really wrong...');
                        $submitBtn.button('reset');
                    }
                });
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
                return ($response.data[name] !== undefined ? $response.data[name] : null);
            };
            
            this.hasResponseData = function(name){
                return ($response.data[name] !== undefined ? true : false);
            };
            
            this.getResponseErrors = function(){
                return $response.errors;
            };
            
            this.getResponseMessage = function(name){
                return ($response.message[name] !== undefined ? $response.message[name] : null);
            };
            
            this.addErrors = function(errors){
                $.each(errors,function(field,item){
                    if(item.message === undefined && item.code === undefined){
                        $.each(item,function(k,it){
                            $instance.addError(field,it);
                        });
                    }
                    else{
                        $instance.addError(field,item);
                    }
                });
                
                if($config.formSetup.onError !== undefined){
                    var fn = window[$config.formSetup.onError];
                    if (typeof fn === "function"){
                        return fn($instance,$form,$response);
                    }
                }
                
                if($callbacks['onError'] !== undefined){
                    return $callbacks['onError']($instance,$form,$response);
                }
            };
            
            this.addError = function(field,item){
                field = field.replace('[','\\[');
                field = field.replace(']','\\]');
                    
                var formgroup = $form.find('.form-group.'+field);
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
                    var customDiv = $form.find('.formjs-custom-message.'+field);
                    if(customDiv.is('*')){
                        customDiv.closest('.form-group').addClass('has-error');
                        customDiv.append('<p class="text-danger formjs-error-message">'+item+'</p>');
                    }
                }
            };
            
            this.addMessage = function(){
                this.addMessageNotification();
                var delay = (this.getResponseMessage('delay') ? this.getResponseMessage('delay') : this.getConfig('messageNotificationDelay'));
                var redirectTo = (this.getResponseMessage('redirect_to') ? this.getResponseMessage('redirect_to') : false);
                if(redirectTo){
                    $submitBtn.remove();
                }
                
                $form.find(".notification-message").delay(delay).fadeOut('slow',function(){
                    $(this).remove();
                    if(redirectTo){
                        window.location.href = redirectTo;
                    }
                });
                
                var hideFormAfterSuccess = (this.getResponseMessage('hide_form') ? this.getResponseMessage('hide_form') : this.getConfig('hideFormAfterSuccess'));
                if(hideFormAfterSuccess){
                    $form.addClass('hide');
                }
                
                var removeFormAfterSuccess = (this.getResponseMessage('remove_form') ? this.getResponseMessage('remove_form') : this.getConfig('removeFormAfterSuccess'));
                if(removeFormAfterSuccess){
                    $form.remove();
                }
                
                var resetFormAfterSuccess = (this.getResponseMessage('reset_form') ? this.getResponseMessage('reset_form') : this.getConfig('resetFormAfterSuccess'));
                if(resetFormAfterSuccess){
                    this.resetForm($form);
                }
                
                if($config.formSetup.onSuccess !== undefined){
                    var fn = window[$config.formSetup.onSuccess];
                    if (typeof fn === "function"){
                        return fn($instance,$form,$response);
                    }
                }
                
                if($callbacks['onSuccess'] !== undefined){
                    $callbacks['onSuccess']($instance,$form,$response);
                }
            };
            
            this.handleResponse = function(){
                this.addMessageNotification();
                var delay = (this.hasResponseData('delay') ? this.getResponseData('delay') : 0);
                var redirectTo = (this.getResponseData('redirect_to') ? this.getResponseData('redirect_to') : false);
                if(redirectTo){
                    $submitBtn.remove();
                }
                
                if(redirectTo){
                    setTimeout(function(){
                        window.location.href = redirectTo;
                    },delay);
                }
                
                var hideFormAfterSuccess = (this.getResponseData('hide_form') ? this.getResponseData('hide_form') : this.getConfig('hideFormAfterSuccess'));
                if(hideFormAfterSuccess){
                    $form.addClass('hide');
                }
                
                var removeFormAfterSuccess = (this.getResponseData('remove_form') ? this.getResponseData('remove_form') : this.getConfig('removeFormAfterSuccess'));
                if(removeFormAfterSuccess){
                    $form.remove();
                }
                
                var resetFormAfterSuccess = (this.getResponseData('reset_form') ? this.getResponseData('reset_form') : this.getConfig('resetFormAfterSuccess'));
                if(resetFormAfterSuccess){
                    this.resetForm($form);
                }
                
                if($config.formSetup.onSuccess !== undefined){
                    var fn = window[$config.formSetup.onSuccess];
                    if (typeof fn === "function"){
                        return fn($instance,$form,$response);
                    }
                }
                
                if($callbacks['onSuccess'] !== undefined){
                    $callbacks['onSuccess']($instance,$form,$response);
                }
            };
            
            this.addMessageNotification = function(){
                if(!this.getResponse('message')){
                    return false;
                }
                $form.find(".notification-message").remove();
                if(!$form.find('.formjs-notification-holder').is('*')){
                    $form.prepend('<div class="formjs-notification-holder"></div>');
                }
                var notificationHolder = $form.find('.formjs-notification-holder');
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
                var holder = el.closest('.form-group');
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