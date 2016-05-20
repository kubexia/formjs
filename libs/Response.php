<?php
class Response{
    
    protected $response = NULL;
    
    protected $errors = NULL;
    
    protected $message = NULL;
    
    protected $success = FALSE;
    
    protected $options = [
        'json' => 0
    ];
    
    public function setResponse($data = array()){
        if(is_null($this->response)){
            $this->response = array();
        }
        
        $this->response = (is_array($data) ? array_merge($this->response,(array) $data) : $data);
        return $this;
    }
    
    public function setMessage($data = NULL){
        if(is_array($this->message) || is_array($data)){
            $this->message = (is_array($this->message) ? array_merge($data,$this->message) : $data);
        }
        else{
            $this->message = $data;
        }
        return $this;
    }
    
    public function setSuccess($success = FALSE){
        $this->success = $success;
        return $this;
    }
    
    public function addError($name, $message){
        if(isset($this->errors[$name])){
            $this->errors[$name][] = $message;
        }
        else{
            $this->errors[$name] = [$message];
        }
        
        return $this;
    }
    
    public function hasErrors(){
        return (count($this->errors) > 0 ? TRUE : FALSE);
    }
    
    /**
     * 
     * @param type constant $options JSON_NUMERIC_CHECK
     */
    public function setOptions($type,$options){
        $this->options[$type] = $options;
        return $this;
    }
    
    protected function getOptions($type){
        return (isset($this->options[$type]) ? $this->options[$type] : NULL);
    }
    
    public function toJson(){
        $response = [
            'response' => $this->response,
            'message' => $this->message,
            'errors' => $this->errors,
            'success' => $this->success
        ];
        
        header('Content-Type: application/json');
        
        return json_encode($response);
    }
    
}

