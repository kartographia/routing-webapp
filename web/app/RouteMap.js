if(!com) var com={};
if(!com.kartographia) com.kartographia={};

com.kartographia.RouteMap = function(parent, config) {

    var me = this;

    var waitmask;
    var map, mapDiv;
    var drawingLayer, featureLayer;
    var player;


    var fps = 24;
    var runTime = 20; //seconds
    var refreshRate = 1/24;
    var tailLength = 60*12; //minutes

    var currAnimation = {};
    var mapOverlay = null;

    var routingOptions;

    var style = javaxt.dhtml.style.default;

    var straightLine = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#000000', //3399cc
            width: 2,
            lineDash: [.1, 5]
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
        waitmask = new javaxt.express.WaitMask(td);


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
            center: [40, -100], //lat, lon (center of the US)
            zoom: 3, //initial zoom
            style: {
                info: "mapInfo",
                coord: "mapCoords"
            }
        });


      //Get layers
        map.getLayers().forEach((layer)=>{
            var name = layer.get("name");
            if (name==="drawingLayer") drawingLayer = layer;
            if (name==="featureLayer") featureLayer = layer;
        });
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
            drawingLayer.clear();
            featureLayer.clear();
            map.drawLine(straightLine, function(){
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


        createSpacer(toolbar);


        var div = document.createElement("div");
        div.style.display = "inline-block";
        div.style.width = "200px";
        div.style.height = "32px";
        toolbar.appendChild(div);

        routingOptions = new javaxt.dhtml.ComboBox(div, {
            style: style.combobox,
            readOnly: true
        });
        routingOptions.add("Great Circle", "");
        routingOptions.add("Air", "air");
        routingOptions.add("Sea", "sea");
        routingOptions.add("Rail", "rail");
        routingOptions.add("Road", "road");
        routingOptions.setValue("Great Circle");
        routingOptions.onChange = function(name, value){
            console.log("onChange!");
            featureLayer.clear();
            getRoute();
        };
    };


  //**************************************************************************
  //** getRoute
  //**************************************************************************
    var getRoute = function(){
        waitmask.show(500);
        drawingLayer.getFeatures().forEach((feature)=>{
            var geom = feature.getGeometry().clone().transform('EPSG:3857','EPSG:4326');
            var coords = geom.getCoordinates();
            var start = coords[0];
            var end = coords[coords.length-1];

            if (routingOptions.getValue()==='') {
                console.log(routingOptions.getValue());
                // if the value is empty, we are doing great circle. Lat, lon
                start = start[1] + "," + start[0];
                end = end[1] + "," + end[0];
            } else {
                console.log(routingOptions.getValue());
                // if we are specifying a mode, we need to pass Lon, Lat
                start = start[0] + "," + start[1];
                end = end[0] + "," + end[1];
            }

            get("route?start="+start+"&end="+end+"&method="+routingOptions.getValue(),{
                success: function(json){
                    JSON.parse(json).features.forEach((f)=>{
                        var geometry = f.geometry;
                        if (geometry.type.toLowerCase()==="linestring"){

                            var coords = [];
                            var isFirstXPositive = geometry.coordinates[0][0]>=0;
                            var crossesDateLine=null;
                            for (var i=0; i<geometry.coordinates.length; i++){
                                var coord = geometry.coordinates[i];
                                var x = coord[0];
                                if (x<0 && isFirstXPositive){

                                    if (i>0 && crossesDateLine===null){
                                        crossesDateLine = geometry.coordinates[i-1][0]>90;
                                    }

                                    if (crossesDateLine){
                                        coord[0] = 180 + (180+x);
                                    }
                                }

                                if (x>0 && !isFirstXPositive){

                                    if (i>0 && crossesDateLine===null){
                                        crossesDateLine = geometry.coordinates[i-1][0]<-90;
                                    }

                                    if (crossesDateLine){
                                        coord[0] = -180 - (180-x);
                                    }
                                }
                                coords.push(coord);
                            }

                            var g = new ol.geom.LineString(coords);
                            g.transform('EPSG:4326', 'EPSG:3857');
                            featureLayer.addFeature(g);
                        }
                    });
                    
                    map.setExtent(featureLayer.getExtent());  
                    updateExtents(featureLayer);
                    waitmask.hide();
                },
                failure: function(request){
                    alert(request);
                    waitmask.hide();
                }
            });
        });
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
  //** updateExtents
  //**************************************************************************
  /** Adds 2 transparent points to the given map layer. Used to circumvent a
   *  rendering bug in OpenLayers.
   */
    var updateExtents = function(layer){
        var source = layer.getSource();
        if (source instanceof ol.source.Vector){
            var style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: ol.color.asString([0,0,0,0])
                })
            });
            source.addFeature(new ol.Feature({
                geometry: new ol.geom.Point([-20026376.39, -20048966.10]),
                style: style
            }));
            source.addFeature(new ol.Feature({
                geometry: new ol.geom.Point([20026376.39, 20048966.10]),
                style: style
            }));
        }
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
  //** createSpacer
  //**************************************************************************
    var createSpacer = function(toolbar){
        var spacer = document.createElement('div');
        spacer.className = "toolbar-spacer";
        spacer.style.height = "30px";
        toolbar.appendChild(spacer);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;


    init();
};