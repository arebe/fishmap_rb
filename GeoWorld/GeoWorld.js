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

var dataSet = {}

// attach svg object to the DOM
var svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
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

var actualProjectionMethod = 4
var projection =  projectionMethods[actualProjectionMethod].method
var path = d3.geo.path().projection(projection)
var rScale = d3.scale.linear().range([1, 10])

// once page has loaded, display the map
$(document).ready(function(){
    displayMap()
    d3.select("body").append("button").text("changePro").on({
    "click":changePro
})
})

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
    path = d3.geo.path().projection(projection)
    $("#coastline").remove()
    svg.selectAll(".reading").attr({transform: function(d){
                return "translate(" + d.coordinates + ")"
            },})
    displayMap()
}

// load map data and display
function displayMap(){
    d3.json("../data/ne_50m_coastline.json", function(error, data) {
        var worldMap = topojson.feature(data,data.objects.ne_50m_coastline).features
        var coastline = svg.append("g")
            .attr("id", "coastline")
            .selectAll("path")
            .data(worldMap)
            .enter()
            .append("path")
            .attr({
                d: path,
            })
            .style({
                stroke: "none", 
                fill: "darkolivegreen",
            })

        // label projection on map
        var textLabel = svg.append("text")
              .text(projectionMethods[actualProjectionMethod].name)
              .attr({
                "transform":"translate(-40,-30)"
              })
              .style("fill", "white")
        loadData()
    })
}


var csData = []

function loadData(){
    d3.csv("../data/CLIVAR_profile_Cs.csv", function(error, data){
        // console.log("data: ", data)
        var cs137Min = 0
        var cs137Max = 0
        data.forEach(function(d){
            if(projection([d['Longitude'], d['Latitude']])){
                csData.push({
                    source: "CLIVAR",
                    coordinates: projection([d['Longitude'], d['Latitude']]),
                    cs134: d['Cs134 (Bq/m^3)'],
                    cs137: d['Cs137 (Bq/m^3)'],
                    date: d['Date'],
                })
                if(d['Cs137 (Bq/m^3)'] < cs137Min){
                    cs137Min = d['Cs137 (Bq/m^3)']
                }
                if(d['Cs137 (Bq/m^3)'] > cs137Max){
                    cs137Max = d['Cs137 (Bq/m^3)']
                }

            }
        })
        // console.log("csData: ", csData)
        // update circle radius scale
        rScale.domain([cs137Min, cs137Max])
        drawCircles(csData)
    })
}

function drawCircles(data){
    var readings = svg.append("g")
        .attr("id", "readings")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
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
}