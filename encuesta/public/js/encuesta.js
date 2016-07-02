var rootURL = "/api/";
findPuntos();

function findPuntos() {
	console.log("findPuntos()");
	$.ajax({
		type: 'GET',
		url: rootURL + "locations",
		dataType: "json",
		success: renderPuntos,
		error: function(xhr, status, error) {
		  var err = eval("(" + xhr.responseText + ")");
		  alert(err.Message);
		}
	});	
}
function renderPuntos(data) {
	console.log("renderPuntos");
	//$('#puntosHere').remove();
	$.each(data, function(index, record) {					
		fields = [record._id, record.name, record.latitude, record.longitude, record.code];	
		text = '<tr id="punto_'+record._id+ '">'
		fields.forEach(function(field) {
			text = text + '<td>'+ field + '</td>';
		});
		text = text + '</tr>';
		$('#puntosHere').append(text);
		$("#punto_"+record._id).click(function () {
			renderMeseros(record);
		});
	});
}
/**
 * Display the list of waiters for the point
 */
function renderMeseros(punto) {
	$.ajax({
		type: 'GET',
		url: rootURL + "meseros?locattion="+punto._id,
		dataType: "json",
		success: renderMesero,
		error: function(xhr, status, error) {
		  var err = eval("(" + xhr.responseText + ")");
		  alert(err.Message);
		}
	});
}
function renderMesero(data) {
	console.log("Rendering mesero!");
	$.each(data, function(index, record) {
		buttons =  "<a class='btn btn-danger' id='mesero_del_"+record._id+ "'><span class='glyphicon glyphicon-trash'></span>Borrar</a>";
		
		fields = [record._id, record.name, buttons];	
		text = '<tr id="mesero_'+record._id+ '">'
		fields.forEach(function(field) {
			text = text + '<td>'+ field + '</td>';
		});
		text = text + '</tr>';
		console.log("Text is "+ text);
		$('#meserosHere').html(text);
		$("#mesero_del_"+record._id).click(function () {
			$("#mesero_"+ record._id).remove();
			meseroDelete(record);
		});
		$("#mesero_"+record._id).click(function () {
			meseroForm(record);
		});
	});
}
function meseroForm(record) {
	$("#mesero_id").val(record._id);
	$("#mesero_name").val(record.name);
	$("#mesero_save").click(function() {
		record.name = $("#mesero_name").val();
		meseroSave(record)
	})
}
function meseroDelete(record) {
	alert("Borrando mesero "+record._id);
}
function meseroSave(record) {
	alert("Guardando mesero "+ record.name);
	//Do some picture shit as well
}
