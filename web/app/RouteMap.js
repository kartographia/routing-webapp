if(!com) var com={};
if(!com.kartographia) com.kartographia={};

com.kartographia.RouteMap = function(parent, config) {

    var me = this;


    var map, mapDiv;
    var drawingLayer;
    var player;


    var fps = 24;
    var runTime = 20; //seconds
    var refreshRate = 1/24;
    var tailLength = 60*12; //minutes

    var currAnimation = {};
    var mapOverlay = null;


    var style = javaxt.dhtml.style.default;


    var lineStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#FF3C38',
            width: 1
        })
    });


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


      //Create toolbar
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        createToolbar(td);



      //Create body
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        createMapPanel(td);


      //Create footer
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        createFooter(td);


      //Append table
        parent.appendChild(table);


        onRender(table, function(){
            createMap(mapDiv);
        });
    };


  //**************************************************************************
  //** createMap
  //**************************************************************************
    var createMap = function(parent){


      //Instantiate map
        map = new com.kartographia.Map(parent,{
            style: {
                info: "mapInfo",
                coord: "mapCoords"
            }
        });


        var layers = map.getLayers();
        for (var i=0; i<layers.length; i++){
            if (layers[i].get('name')==='drawingLayer'){
                drawingLayer = layers[i];
                break;
            }
        }
    };


  //**************************************************************************
  //** createMapPanel
  //**************************************************************************
    var createMapPanel = function(parent){

        var outerDiv = document.createElement('div');
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        parent.appendChild(outerDiv);

        var innerDiv = document.createElement('div');
        innerDiv.style.position = "absolute";
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.overflow = 'auto';
        innerDiv.style.overflowX = 'hidden';
        outerDiv.appendChild(innerDiv);

        mapDiv = document.createElement('div');
        mapDiv.style.width = "100%";
        mapDiv.style.height = "100%";
        innerDiv.appendChild(mapDiv);
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var toolbar = document.createElement("div");
        toolbar.className = "panel-toolbar";
        parent.appendChild(toolbar);



      //Select button
        var selectButton = createButton(toolbar, {
            label: "Select",
            icon: "pointerIcon",
            toggle: true
        });
        selectButton.onClick = function(){

        };



      //Draw button
        var drawButton = createButton(toolbar, {
            label: "Draw Line",
            icon: "polylineIcon",
            toggle: true
        });
        drawButton.onClick = function(){
            map.drawLine(lineStyle, function(){
                getRoute();
                drawButton.toggle();
            });
        };



      //Run button
        var buildButton = createButton(toolbar, {
            label: "Generate Animation",
            icon: "hammerIcon",
            disabled: false
        });
        buildButton.onClick = function(){
            getAnimationParams(function(params){
                currAnimation = params;
                mapOverlay = new com.kartographia.MapOverlay(map);
                player.play();
            });

        };
    };


  //**************************************************************************
  //** getRoute
  //**************************************************************************
    var getRoute = function(){

        var features = drawingLayer.getFeatures();
        for (var i=0; i<features.length; i++){
            var feature = features[i];
            var geom = feature.getGeometry().clone().transform('EPSG:3857','EPSG:4326');
            var coords = geom.getCoordinates();
            var start = coords[0];
            var end = coords[coords.length-1];


            start = start[1] + "," + start[0]; //lat,lon
            end = end[1] + "," + end[0]; //lat,lon

            get("route?start="+start+"&end="+end,{
                success: function(json){
                    var feature = JSON.parse(json).features[0].geometry;
                    if (feature.type.toLowerCase()==="linestring"){

                        var coords = [];
                        var isFirstXPositive = feature.coordinates[0][0]>=0;
                        var crossesDateLine=null;
                        for (var i=0; i<feature.coordinates.length; i++){
                            var coord = feature.coordinates[i];
                            var x = coord[0];
                            if (x<0 && isFirstXPositive){

                                if (i>0 && crossesDateLine===null){
                                    crossesDateLine = feature.coordinates[i-1][0]>90;
                                }

                                if (crossesDateLine){
                                    coord[0] = 180 + (180+x);
                                }
                            }

                            if (x>0 && !isFirstXPositive){

                                if (i>0 && crossesDateLine===null){
                                    crossesDateLine = feature.coordinates[i-1][0]<-90;
                                }

                                if (crossesDateLine){
                                    coord[0] = -180 - (180-x);
                                }
                            }
                            coords.push(coord);
                        }

                        var g = new ol.geom.LineString(coords);
                        g.transform('EPSG:4326', 'EPSG:3857');
                        drawingLayer.addFeature(g);
                    }

                }
            });
        }
    };


  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){


      //Create play controls for the map
        player = new com.kartographia.MediaPlayer(parent, {
            startDate: new Date("2019-03-08"),
            endDate: new Date("2019-03-09"),
            runTime: runTime,
            refreshRate: refreshRate
        });


        player.beforePlay = function(){

            if (!mapOverlay){
                mapOverlay = new com.kartographia.MapOverlay(map);
                getAnimationParams(function(params){
                    currAnimation = params;
                    player.play();
                });
                return false;
            }
        };


        player.onChange = function(currTime){

            if (!mapOverlay){
                mapOverlay = new com.kartographia.MapOverlay(map);
            }


            mapOverlay.clear();
            mapOverlay.renderTracks(currAnimation.tracks, currTime, tailLength);
        };

    };


  //**************************************************************************
  //** getAnimationParams
  //**************************************************************************
  /** Returns a json object with parameters needed to generate an animation
   */
    var getAnimationParams = function(callback){

        var wkt = map.getExtent();
        var canvas = map.getCanvas();
        var startDate = player.getStartDate();
        var endDate = player.getEndDate();

        var animationParams = {
            width: canvas.width,
            height: canvas.height,

            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            duration: runTime, //in seconds
            fps: fps,

            tracks: [],
            geom: wkt
        };



        var features = drawingLayer.getFeatures();
        if (features.length>0){
            animationParams.tracks = generateTracks(startDate, endDate);
            if (callback) callback.apply(me, [animationParams]);
        }

    };


  //**************************************************************************
  //** generateTracks
  //**************************************************************************
  /** Generates great-circle routes between line segments drawn on the map
   */
    var generateTracks = function(startDate, endDate){
        var diff = (endDate.getTime() - startDate.getTime())/1000;

        var tracks = [];
        var features = drawingLayer.getFeatures();
        for (var i=0; i<features.length; i++){
            var feature = features[i];
            var geom = feature.getGeometry().clone().transform('EPSG:3857','EPSG:4326');
            var coords = geom.getCoordinates();
            var numSegments = coords.length-1;
            var interval = diff/numSegments;
            var t = new Date(startDate.getTime());
            var arr = [];
            for (var j=0; j<coords.length; j++){
                var coord = coords[j];
                coord.push(t.getTime());
                arr.push(coord);
                t.setSeconds(t.getSeconds() + interval);
            }

            tracks.push({
               id: i,
               coords: arr
            });

        }
        return tracks;
    };




  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(toolbar, btn){

        btn.style = JSON.parse(JSON.stringify(style.toolbarButton)); //<-- clone the style config!
        if (btn.icon){
            btn.style.icon = "toolbar-button-icon " + btn.icon;
            delete btn.icon;
        }


        if (btn.menu===true){
            btn.style.arrow = "toolbar-button-menu-icon";
            btn.style.menu = "menu-panel";
            btn.style.select = "panel-toolbar-menubutton-selected";
        }

        return new javaxt.dhtml.Button(toolbar, btn);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;


    init();
};