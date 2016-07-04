<?php
require __DIR__ . '/../src/mysql.php';
// Routes
$locations = entity('locations');
$meseros = entity('meseros');
$encuestas = entity('encuestas');
$app->get('/api/locations', $locations["findAll"] );
$app->get('/api/locations/[{id}]', $locations["findById"] );
$app->post('/api/locations',$locations["insert"]);
$app->get('/api/meseros', $meseros["findAll"] );
$app->post('/api/meseros', $meseros["insert"] );
$app->post('/api/put/meseros', $meseros["update"] );
$app->get('/api/meseros/[{id}]', $meseros["findById"] );
$app->post('/api/delete/meseros/[{id}]', $meseros["delete"] );
$app->post('/api/picture', function ($request, $response, $args) {
	$storage = new \Upload\Storage\FileSystem('/Users/foxtrot/Documents/code/other/encuesta/public/meseros', true);
	$file = new \Upload\File('picture', $storage);
	$new_filename = $request->getParsedBody()['id'];
	$file->setName($new_filename);
	$file->setExtension("jpg");
	try {
	    // Success!
    	$file->upload();
	} catch (\Exception $e) {
    	// Fail!
	    $errors = $file->getErrors();
		error_log("Errors: ".print_r($errors, TRUE));
	}
	return $response->withRedirect('/');
});
$app->get('/api/encuestas', $encuestas["findAll"] );
$app->post('/api/encuestas', $encuestas["insert"] );
$app->get('/api/encuestas-report', $encuestas["runSQL"]("SELECT encuestas._id, encuestas.score, encuestas._when, encuestas.comments,encuestas.email,meseros._id as mesero_id, meseros.name as mesero_name, locations.name as mesero_location FROM encuestas inner join meseros on (meseros._id=encuestas.mesero) inner join locations on (locations._id=meseros.locattion)",false ));

$app->options('/api/encuestas', function($request,$response,$args) {
	$res2 = $response->withHeader("Access-Control-Allow-Origin", "*");
	$res2 = $res2->withHeader("Access-Control-Allow-Headers", "X-Requested-With, Origin, Content-Type, Accept");
	$res2 = $res2->withHeader("Content-Type", "application/json");
	return $res2;	
	});

$app->get('/[{name}]', function ($request, $response, $args) {
    // Sample log message
    $this->logger->info("Slim-Skeleton '/' route ".$args["name"]);

    // Render index view
    return $this->renderer->render($response, 'index.phtml', $args);
});

