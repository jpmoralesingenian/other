queue()
    .defer(d3.json, "/api/encuestas-report")
    .await(makeGraphs);

function makeGraphs(error, apiData) {
	
//Start Transformations
	var dataSet = apiData;
	var dateFormat = d3.time.format("%Y-%m-%d");
	dataSet.forEach(function(d) {
		if(d.when) 
			d.when= dateFormat.parse(d.when.substring(0,10));
		else
			d.when= dateFormat.parse(d._when.substring(0,10));
	
	});
	//Create a Crossfilter instance
	var ndx = crossfilter(dataSet);

	//Define Dimensions
	var when = ndx.dimension(function(d) { return d.when; });
	var score = ndx.dimension(function(d) { return d.score; });
	var mesero = ndx.dimension(function(d) { return (d.mesero_name?d.mesero_name:d.mesero[0].name);});
	var locattion = ndx.dimension(function(d) { return d.mesero_location;	});
	var totalScore  = ndx.dimension(function(d) { return d.score; });


	//Calculate metrics
	var encuestasByDate = when.group(); 
	var encuestasByScore = score.group(); 
	var meseroGroup = mesero.group();
	var locattionGroup = locattion.group();
	var all = ndx.groupAll();
	//Calculate Groups
	var totalScoreMesero = mesero.group().reduceCount();
	var netScoreAverage = ndx.groupAll().reduce(function(p,v) {++p.count,p.total+=v.score; return p;},function(p,v) {--p.count,p.total-=v.score; return p;},function() {return {count:0,total:0};});

	//Define threshold values for data
	var minDate = when.bottom(1)[0].when;
	var maxDate = when.top(1)[0].when;

    //Charts
	var dateChart = dc.lineChart("#date-chart");
	var scoreChart = dc.rowChart("#score-chart");
	var totalProjects = dc.numberDisplay("#total-projects");
	var scoreAverage = dc.numberDisplay("#score-average");
	var meseroDonations = dc.rowChart("#mesero-donations");
	var commentsTable = dc.dataTable("#comments-table");

  selectField = dc.selectMenu('#menuselect')
        .dimension(mesero)
        .group(meseroGroup); 

  selectField2 = dc.selectMenu('#menulocation')
        .dimension(locattion)
        .group(locattionGroup); 

       dc.dataCount("#row-selection")
        .dimension(ndx)
        .group(all);


	totalProjects
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	scoreAverage
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d.total/d.count; })
		.group(netScoreAverage)
		.formatNumber(d3.format(".3"));

	dateChart
		//.width(600)
		.height(220)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(when)
		.group(encuestasByDate)
		.renderArea(true)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.renderHorizontalGridLines(true)
    	.renderVerticalGridLines(true)
		.xAxisLabel("Fecha")
		.yAxis().ticks(6);

	scoreChart
		//.width(300)
		.height(220)
        .dimension(score)
        .group(encuestasByScore)
        .xAxis().ticks(4);

  

    meseroDonations
    	//.width(800)
        .height(220)
        .dimension(mesero)
        .group(totalScoreMesero)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
	dimTable = ndx.dimension(function(d) { return d._id;}) 
	groupTable = function (d) { return d.mesero_location; }
    commentsTable
	.dimension(dimTable)
	.group(groupTable)
	.columns([
		{ label: "Fecha",
		  format: function (d) { return d._when.substring(0,16); } 
		},
		{ label: "Puntaje",
		  format: function (d) { return d.score; }
		}, 
		{ label: "Punto",
		  format: function (d) { return d.mesero_location; }
		},
		{ label: "Mesero", 
		  format: function(d) { return d.mesero_name; }
		},
		{ label: "Correo",
		  format: function(d) { return d.email; }
		},
		{ label: "Comentarios",
		  format: function(d) { return d.comments; }
		}
	])	

    dc.renderAll();

};
