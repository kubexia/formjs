<?php
error_reporting(E_ALL);
ini_set('display_errors', TRUE);

require __DIR__.'/../libs/Request.php';
require __DIR__.'/../libs/Response.php';

$request = new Request();
$response = new Response();

switch($_GET['action']){
    case "contact":
        if(!$request->get('first_name')){
            $response->addError('first_name', 'First name is required');
        }
        
        if(!$request->get('last_name')){
            $response->addError('last_name', 'Last name is required');
        }
        
        if(!$response->hasErrors()){
            $response->setSuccess(TRUE);
            $response->setMessage([
                'type' => 'success',
                'text' => 'Thank you for contacting us...',
            ]);
        }
        
        echo $response->toJson();
        break;
}

exit;

