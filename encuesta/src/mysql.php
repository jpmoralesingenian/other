<?php
// a simple database connection function - returns a mysqli connection object
function connect_db() {
	$server = '127.0.0.1'; // e.g 'localhost' or '192.168.1.100'
	$user = 'joshua';
	$pass = 'joshua01';
	$database = 'joshua';
	$connection = new mysqli($server, $user, $pass, $database);
	if ($connection->connect_errno) {
    		echo "Failed to connect to MySQL: (" . $connection->connect_errno . ") " . $connection->connect_error;
		return false; 
	}
	return $connection;
}

/**
 *  $params is an array of parameters that will be bound in order
 */
function select_as_json($select, $params,$request,$response,$args) {
	$res2 = $response->withHeader("Access-Control-Allow-Origin", "*");
	$res2 = $res2->withHeader("Access-Control-Allow-Headers", "X-Requested-With, Origin, Content-Type, Accept");
	$res2 = $res2->withHeader("Content-Type", "application/json");
	$db = connect_db();
	$data = [];
	if(!$db) {
		//Failed, leave
		echo "{\"error\":\"Connection to the database failed\"}\n";
 		return;
	}
	if(!$params) {	
		$rs = $db->query($select);
		if(!$rs) { 
			echo "{\"error\":\"SELECT failed: (" . $db->errno . ") " . $db->error." ".$rs."\"}";	
			return;
		}
		while($row = $rs->fetch_assoc()) {
			array_push($data,$row);
		}
	} else {
		$prep = sql_prepare_and_execute($db,$select,$params); 
		if(!$prep) return;
		// This does not work because mysqlnd is not present
		//$rs = $prep->get_result();
		$md = $prep->result_metadata();
		$md_params = array();
		while($field = $md->fetch_field()) {
      		  $md_params[] = &$row[$field->name];
	    	}
		call_user_func_array(array($prep, 'bind_result'), $md_params);
		$prep->store_result();
		while($prep->fetch()) {
			$row2 = [];
			foreach( $row as $key => $val ) {
				$row2[$key] = $val;
			}
			array_push($data,$row2);
			$prep->store_result();
		}
		
	}
	
	if(is_array($data) && count($data)==1&&count($params)==1&&$args["id"]) {
		$data = $data[0];
	}
	
	echo json_encode($data, JSON_PRETTY_PRINT);
	if($db) $db->close();
	return $res2;
}
/**
 * Insert into a TABLE using JSON assoc array as the info to insert
 */ 
function insert_or_update_as_json($table, $json,$request,$response,$args, $is_insert) {
	error_log("Insert or update $is_insert" );	
	$res2 = $response->withHeader("Access-Control-Allow-Origin", "*");
	$res2 = $res2->withHeader("Access-Control-Allow-Headers", "X-Requested-With, Origin, Content-Type, Accept");
	$res2 = $res2->withHeader("Content-Type", "application/json");
	//mysqli_report(MYSQLI_REPORT_ALL);
	//Decode the JSON, if that fails there is nothing to do. 
	$json_decoded = json_decode($json,true);
	if(!$json_decoded) {
	//	$app->logger->warn("INSERT on $table. No valid JSON: [ $json ]");
		echo "{\"error\":\"";
		echo "INSERT on $table. No valid JSON: [ $json ] $json_decoded\n";
		echo "\"}";
		return;
	}
	if($json_decoded["when"]) {
		date_default_timezone_set("America/Bogota");
		$json_decoded["when"] = date('Y-m-d H:i:s',strtotime($json_decoded["when"]));
	}
	$values_array = array_values($json_decoded);
	if(count($values_array)==0) {
	//	$this->logger->warn("INSERT on $table. No fields: [ $json ]");
		echo "{\"error\":\"";
		echo "INSERT on $table. No fields: [ $json ]";
		echo "\"}";
		return;
	}
	if($is_insert>0) {
		$fields = implode(',',str_replace('when','_when',array_keys($json_decoded)));
		$question_marks = str_repeat("?,",count($values_array)-1)."?";
		$sql = "INSERT INTO $table ($fields) VALUES($question_marks)";
	} else {
		$sql = "UPDATE $table SET ";
		$has_some = false;
		foreach($json_decoded as $key=>$value) {
			if($has_some) $sql.=",";
			$sql.="$key = ?";
			$has_some = true;
		}
		$sql.= " WHERE _id = ".$json_decoded['_id'];
	}
	return other_as_json($sql, $values_array, $request, $response, $args);
}
function other_as_json($sql, $values_array, $request, $response, $args) {
	error_log("RUNNING $sql\n");
	$db = connect_db();
	if(!$db) {
		//Failed, leave
		echo "{\"error\":\"Connection to the database failed\"}\n";
 		return;
	}
	if(!sql_prepare_and_execute($db,$sql,$values_array)) {
		return;	
 	} else {
		$insert_id = $db->insert_id;
		echo "{\"result\":\"Sucessfully ran SQL on  $sql\",\"id\": $insert_id}";
	}
	if($db) $db->close();
	$response = $response->withHeader("Accept", "application/json, text/javascript, */*");
	return $response;
}
function refValues($arr)
{ 
        $refs = array();
        foreach ($arr as $key => $value)
        {
	    if(is_array($arr[$key])) {
		if(count($arr[$key])==0) {
			$arr[$key]=0;
		} else {
			if(is_integer($arr[$key][0])) {
				$arr[$key] = $arr[$key][0];
			} else {
				if(is_array($arr[$key][0]) && $arr[$key][0]["_id"]) {
					$arr[$key] = $arr[$key][0]["_id"];				
				}	
			}
		}
	    }
            $refs[$key] = &$arr[$key]; 
        }

        return $refs; 
}
/**
 * Given a databasse query and the parameters for it, execute the query. 
 * @return false if something happened, the prepared statement object otherwise
 */
function sql_prepare_and_execute($db,$select,$params) {
	$prep = $db->prepare($select);
	if(!$prep){
		echo "{\"error\":\"";
		echo "PREPARE failed: (" . $db->errno . ") " . $db->error." [".$select."]\"}";	
		return;
	}
	//Find the parameter type. We only support int and string
	$types = "";
	foreach($params as $param) {
		$types.=(is_array($param)?"i":(is_integer($param))?"i":(is_float($param)?"d":"s"));
	}
	$parameters = array_merge(array($types),$params);
	$answer = call_user_func_array(array($prep,"bind_param"), refValues($parameters));
	if(!$answer) {
		echo "{\"error\":\"";
		echo "BIND failed: (" . $db->errno . ") " . $db->error."\"}";	
		return false;
	}
	if(!$prep->execute()) {
		echo "{\"error\":\"";
		echo "EXECUTE failed: (" . $db->errno . ") " . $db->error."\"}";	
		return false;
		
	}
	return $prep;
}
function entity($table) {
	$answer = array (
		"findAll" => function($request, $response, $args) use($table) {
			error_log("FindAll on $table\n");
			$queryParams = $request->getQueryParams();
			$where = "";
			$params = false;	
			//locattionId is called locattion
			$keys = preg_replace("/_id$/","",array_keys($queryParams));
			if(count($queryParams)>0) {
				$where = "WHERE ";
				$where.= implode('= ? AND ',$keys);
				$where.="= ?";
				$params = array_values($queryParams);
			}
			return select_as_json("SELECT * FROM $table $where ;",$params,$request,$response,$args);
		},
		"findById"=> function($request, $response, $args) use($table) {
			error_log("FindById on $table\n");
			return select_as_json("SELECT * FROM  ".$table." WHERE _id = ?",array($args["id"]),$request,$response,$args);
		},
		"update"=> function($request, $response, $args) use($table) {
			error_log("Update on $table\n");
			return insert_or_update_as_json($table, $request->getBody(), $request, $response, $args, 0);
		},
		"insert"=> function($request, $response, $args) use($table) {	
			error_log("Insert on $table\n");
			return insert_or_update_as_json($table, $request->getBody(),$request,$response,$args, 1);
		},
		"delete"=> function($request, $response, $args) use($table) {
			return other_as_json("DELETE FROM $table WHERE _id=?",array($args["id"]), $request, $response, $args);
		},
		"runSQL"=> function($sql,$params) {
			$f = function($request,$response,$args) use($sql,$params) {
				error_log("runSQL on $sql\n");
				return select_as_json($sql,$params,$request,$response,$args);	
			};
			return $f;
		}
		);
	return $answer;
}
