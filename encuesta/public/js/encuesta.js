var rootURL = "/api/";
findPuntos();
$("#section_table").hide();
$("#section_form").hide();

function findPuntos() {
	$.ajax({
		type: 'GET',
		url: rootURL + "locations",
		dataType: "json",
		success: renderPuntos,
		error: error_alert
	});	
}
function renderPuntos(data) {
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
	$("#section_table").show();
	$("#section_form").hide();
	$("#title_punto_nombre").html(punto.name);
	$("#mesero_locattion").val(punto._id);
	$.ajax({
		type: 'GET',
		url: rootURL + "meseros?locattion="+punto._id,
		dataType: "json",
		success: renderMesero,
		error: error_alert
	});
}
function renderMesero(data) {
	console.log("Rendering mesero!");

	$('#meserosHere').html("");
	$.each(data, function(index, record) {
		buttons =  "<a class='btn btn-danger' id='mesero_del_"+record._id+ "'><span class='glyphicon glyphicon-trash'></span>Borrar</a>";
		
		fields = [record._id, record.name, buttons];	
		text = '<tr id="mesero_'+record._id+ '">'
		fields.forEach(function(field) {
			text = text + '<td>'+ field + '</td>';
		});
		text = text + '</tr>';
		console.log("Text is "+ text);
		$('#meserosHere').append(text);
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
	$("#section_form").show();
	$("#mesero_id").val(record._id);
	$("#mesero_name").val(record.name);
	$("#mesero_fileinput").fileinput('clear');
	$("#mesero_image").attr("src","/meseros/"+record._id+ ".jpg");
	$("#mesero_save").unbind("click");
	$("#mesero_save").click(function() {
		record.name = $("#mesero_name").val();
		meseroSave(record)
	})
}
function meseroDelete(record) {
	$.ajax({
		type: 'DELETE',
		url: rootURL + "meseros/"+record._id,
		dataType: "json",
		success: function() {
			alert("Mesero borrado correctamente");
			$("#section_table").hide();
			$("#section_form").hide();
		},
		error: error_alert
	});
}
function meseroSave(record) {
	name = $("#mesero_name");
	locattion = $("#mesero_locattion").val();
	name = $("#mesero_name").val();
	id = $("#mesero_id").val();
	data = JSON.stringify({"name": name, "locattion": locattion, "_id":id});
	$.ajax({
		type: 'PUT',
		url: rootURL + "meseros",
		dataType: "json",
		data: data,
		success: function() {
			alert("Mesero modificado correctamente");
			//Now do the upload
			meseroUploadPicture(id);
			$("#section_table").hide();
			$("#section_form").hide();
		},
		error: error_alert
	});
}
function meseroAdd() {
	/* Show an empty form to add a new mesero */
	$("#section_form").show();
	$("#mesero_id").val("");
	$("#mesero_name").val("");
	$("#mesero_fileinput").fileinput('clear');
	$("#mesero_image").attr("src","");
	$("#mesero_save").unbind("click");
	$("#mesero_save").click(function() {
		name = $("#mesero_name").val();
		locattion = $("#mesero_locattion").val();
		data = JSON.stringify({ "name": name, "locattion": locattion });
		$.ajax({
			type: 'POST',
			url: rootURL + "meseros",
			dataType: "json",
			data: data,
			success: function(data) {
				meseroUploadPicture(data.id);
				alert("Mesero ingresado correctamente");
				$("#section_table").hide();
				$("#section_form").hide();
			},
			error: error_alert
		});	
	});
}
function meseroUploadPicture(id) {
	$("#mesero_id").val(id);
	$("#meseroForm").submit();
}
function error_alert(xhr, status, error) {
  var err = xhr.responseText;
  alert(err);
}
