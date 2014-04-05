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
        method: d3.geo.azimuthalEqualArea().translate([width / 2, height / 2]).rotate([-155, 0]).precision(9)
    },
    {
        name: "equirectangular Pacific",
        method: d3.geo.equirectangular().translate([width / 2, height / 2]).rotate([-155, 0]).precision(9)
    }
]

var actualProjectionMethod = 5
var path = d3.geo.path().projection(projectionMethods[actualProjectionMethod].method)

// load map data and display
d3.json("../data/world_data_topo.json", function(error, data) {
    var worldMap = topojson.feature(data,data.objects.world_data).features
    var countries = svg.append("g")
        .attr("id", "country")
        .selectAll("path")
        .data(worldMap)
        .enter()
        .append("path")
        .attr({
            d: path,
        })
        .style({
            stroke: "white", 
            fill: "steelblue",
        })

})

// label projection on map
var textLabel = svg.append("text").text(projectionMethods[actualProjectionMethod].name).attr({
    "transform":"translate(-40,-30)"
})
