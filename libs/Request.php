<?php
class Request{
    
    protected $data = [];
    
    public function __construct() {
        $this->data = $_POST;
    }
    
    public function get($name){
        return (isset($this->data[$name]) && strlen($this->data[$name]) > 0 ? $this->data[$name] : FALSE);
    }
    
    public function all(){
        return $this->data;
    }
    
}