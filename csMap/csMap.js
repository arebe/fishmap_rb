/* originally HW4, GeoWorld.js */

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

// once page has loaded, display the map
$(document).ready(function(){
    displayMap()
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
function displayMap(){
    d3.json("../data/ne_50m_coastline.json", function(error, data) {
        var worldMap = topojson.feature(data,data.objects.ne_50m_coastline).features
        var coastline = svg_map.append("g")
            .attr("id", "coastline")
            .selectAll("path")
            .data(worldMap)
            .enter()
            .append("path")
            .attr({
                d: path_map,
            })
            .style({
                stroke: "none", 
                fill: "darkolivegreen",
            })

        // label projection on map
        var textLabel = svg_map.append("text")
              .text(projectionMethods[actualProjectionMethod].name)
              .attr({
                "transform":"translate(-40,-30)"
              })
              .style("fill", "white")
        loadData()
    })
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
                date: d['date'],
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
        drawCircles(csData)
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
            stroke: "none"
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