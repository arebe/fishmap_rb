// create D3 visualization viewport parameters
var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
}

var width = 960 - margin.left - margin.right
var height = 700 - margin.bottom - margin.top

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
}

// attach svg object to the DOM
var svg_map = d3.select("#fishmap").append("svg")
    .attr({
        width: width + margin.left + margin.right,
        height: height + margin.top + margin.bottom
    })


// give the SVG a background color
svg_map.append("rect")
   .attr({
    class: "map_background",
    width: "100%",
    height: "100%",
    fill: "aliceblue",
   })

svg_map.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    })


// a variety of map projection methods
var projectionMethods = [
    {
        name:"mercator",
        method: d3.geo.mercator().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"equiRect",
        method: d3.geo.equirectangular().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"stereo",
        method: d3.geo.stereographic().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"aziumuthal equal area",
        method: d3.geo.azimuthalEqualArea().clipAngle(180 - 1e-3).scale(237).translate([width / 2, height / 2])//.precision(.1)
    },{
        name: "aziumuthal equal area Pacific",
        method: d3.geo.azimuthalEqualArea().translate([(width / 2) - 50, (height / 2) +50]).rotate([-180, 0]).scale(400).precision(.01)
    },
    {
        name: "equirectangular Pacific",
        method: d3.geo.equirectangular().translate([(width / 2) - 100, height / 2]).rotate([-160, 0]).scale(280).precision(.01)
    }
]

// base map parameters
var actualProjectionMethod = 4
var projection =  projectionMethods[actualProjectionMethod].method
var path_map = d3.geo.path().projection(projection)
var rScale = d3.scale.linear().range([2, 15])

// slider & bar chart params
var parseDate = d3.time.format("%m/%e/%y").parse
var formatDate = d3.time.format("%b %Y")
var slider_x = d3.time.scale().range([0, width]).clamp(true)
// circle transparency scales
var fillOpScale = d3.scale.linear().range([0, 0.5])
var strokeOpScale = d3.scale.linear().range([0, 1])
var one_day = 1000*60*60*24   // in milliseconds
fillOpScale.domain([90*one_day, 0])
strokeOpScale.domain([90*one_day, 0])

// once page has loaded, display the map ** do we need this still? **//
$(document).ready(function(){
    // displayMap()
    // d3.select("body").append("button").text("changePro").on({"click":changePro})
})

// change the projection interactively --- under development!
var changePro = function(){
    if (actualProjectionMethod === 4) {
        actualProjectionMethod = 5
    }
    else if(actualProjectionMethod === 5){
        actualProjectionMethod = 4
    }
    else{
        console.log("wtf: ", actualProjectionMethod)
    }
    projection =  projectionMethods[actualProjectionMethod].method
    path_map= d3.geo.path().projection(projection)
    $("#coastline").remove()
    svg_map.selectAll(".reading").attr({transform: function(d){
                return "translate(" + d.coordinates + ")"
            },})
    displayMap()
}

// load map data and display
queue().defer(d3.json, "../data/ne_50m_coastline.json")
       .defer(d3.json, "../data/ne_50m_populated_places.json")
       .await(displayMap)

function displayMap(error, coastline_data, cities_data){
        var worldCoasts = topojson.feature(coastline_data,coastline_data.objects.ne_50m_coastline).features
        var worldCities = topojson.feature(cities_data, cities_data.objects.ne_50m_populated_places).features
        var coastline = svg_map.append("g")
            .attr("id", "coastline")
            .selectAll("path")
            .data(worldCoasts)
            .enter()
            .append("path")
            .attr({
                d: path_map,
            })
            .style({
                stroke: "none", 
                fill: "darkolivegreen",
            })
        // city markers
        var cities = svg_map.append("g")
            .attr("id", "cities")
            .selectAll("path")
            .data(worldCities)
            .enter()
            .append("circle")
            .filter(function(d){
                return d.properties.SCALERANK <=1
            })
            .attr({
                transform: function(d){
                    return "translate(" + projection(d.geometry.coordinates) + ")"
                },
                r: 3,
            })
            .style({
                stroke: "black",
                "stroke-width": 0,
                fill: "#1A1A1E",
                "fill-opacity": 0.5,
                r: 1,
            })


        // city names
        var city_labels = svg_map.append("g")
            .attr("id", "city_labels")
            .selectAll("text")
            .data(worldCities)
            .enter()
            .append("text")
            .filter(function(d){
                return d.properties.SCALERANK <=1
            })
            .text(function(d){
                return d.properties.NAME
            })
            .attr({
                transform: function(d){
                    return "translate(" + projection(d.geometry.coordinates) + ")"
                },
                dx: 5,
                dy: 1,
                r: 3,
            })
            .style({
                stroke: "black",
                "stroke-width": 0,
                fill: "#1A1A1E",
                "fill-opacity": 0.5,
                r: 1,
            })

        console.log("worldCities", worldCities)

        // label projection on map
        var textLabel = svg_map.append("text")
              .text(projectionMethods[actualProjectionMethod].name)
              .attr({
                "transform":"translate(-40,-30)"
              })
              .style("fill", "white")
        loadData()
}

// cesium data loaded into an array
var csData = []
var fukushimaCoord = projection([141.0329, 37.4230])

function loadData(){
    d3.json("../data/allCsData.json", function(error, data){
        var cs137Min = 0
        var cs137Max = 0
        // this is super janky - need to find a better solution than all these parseFloats..
        data.forEach(function(d){
            // console.log("cs137: ", parseFloat(d['cs137'].replace(/,/g,'')))
            csData.push({
                source: d['source'],
                coordinates: projection([d.coordinates[0], d.coordinates[1]]),
                cs134: d['cs134'],
                cs137: parseFloat(d['cs137'].replace(/,/g,'')),
                date: parseDate(d['date']),
                temp: d['temp'],
                salinity: d['salinity'],
                depth: d['depth']
            })
            if(parseFloat(d['cs137'].replace(/,/g,'')) < cs137Min){
                cs137Min = parseFloat(d['cs137'].replace(/,/g,''))
            }
            if(parseFloat(d['cs137'].replace(/,/g,'')) > cs137Max){
                cs137Max = parseFloat(d['cs137'].replace(/,/g,''))
            } 
        })
        // update circle radius scale
        rScale.domain([cs137Min, cs137Max])
        // update slider scale
        slider_x.domain(d3.extent(csData, function(d){ return d.date }))
        // display data on map
        drawCircles(csData)
        drawSlider()
    })
}

function drawCircles(data){

    var readings = svg_map.append("g")
        .attr("id", "readings")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .filter(function(d){ return d.cs137 > 0 })
        .attr("class", "reading")
        .attr({
            transform: function(d){
                return "translate(" + d.coordinates + ")"
            },
            r: function(d){ return rScale(d.cs137) },
        })
        .style({
            fill: "darkblue",
            stroke: "darkblue"
        })

    var fukushima = svg_map.append("g")
        .attr("id", "fukushima")
        .append("circle")
        .attr({
            transform: "translate(" + fukushimaCoord + ")",
            r: "3",
        })
        .style({
            fill: "orange",
            stroke: "darkred",
            "stroke-width": "2",
        })
    //-- concentric circles emanating from a point from: http://bl.ocks.org/mbostock/4503672
    setInterval(function(){
        svg_map.append("circle")
           .attr({
            class: "ring",
            transform: "translate(" + fukushimaCoord + ")",
            r: "10",
           })
           .style({
            "stroke-width": 3,
            stroke: "darkred",
           })
           .transition()
           .ease("linear")
           .duration(2000)
           .style({
            fill: "none",
            "stroke-opacity": "1e-6",
            "stroke-width": 1,
            stroke: "brown"
           })
           .attr("r", 50)
           .remove()
       }, 1200)
    //---------------------------------------------------------------------//
}

function drawSlider(){
    //-- borrowed from http://bl.ocks.org/mbostock/6452972 ---//
    var brush = d3.svg.brush().x(slider_x).extent([0,0]).on("brush", brushed)
    svg_map.append("g")
           .attr({
            class: "x axis",
            transform: "translate(" + margin.left + "," + (height - margin.bottom) + ")",
           })
           .call(d3.svg.axis()
              .scale(slider_x)
              .orient("bottom")
              .tickFormat(function(d){ return formatDate(d) })
              .tickSize(0)
              .tickPadding(12))
           .select(".domain")
           .select(function(){ return this.parentNode.appendChild(this.cloneNode(true)) })
           .attr("class", "halo")

    var slider = svg_map.append("g")
        .attr("class", "slider")
        .call(brush)

    slider.selectAll(".background")
          .attr("height", height)

    var handle = slider.append("circle")
        .attr({
            class: "handle",
            transform: "translate(" + margin.left + "," + (height - margin.bottom) + ")",
            r: 9,
        })

    slider.call(brush.event)
          .transition()
          .duration(750)
          .call(brush.extent([0, 0]))
          .call(brush.event)

    function brushed(){
        var value = brush.extent()[0]

        if(d3.event.sourceEvent){
            value = slider_x.invert(d3.mouse(this)[0])
            brush.extent([value, value])
        }

        handle.attr("cx", slider_x(value))
        d3.selectAll(".reading").attr({
            "fill-opacity": function(d){ return fillOpScale(Math.abs(value - d.date)) },
            "stroke-opacity": function(d){ return strokeOpScale(Math.abs(value - d.date)) }
        })
    }
}