if(!com) var com={};
if(!com.kartographia) com.kartographia={};

//******************************************************************************
//**  MediaPlayer
//******************************************************************************
/**
 *   Simple media player with play/pause controls, slider, and elapsed time.
 *   When coupled with a map, it can be used to render incident data.
 *   Extends javaxt.dhtml.PlayControl which requires
 *
 ******************************************************************************/

com.kartographia.MediaPlayer = function(parent, config) {
    this.className = "com.kartographia.MediaPlayer";

    var me = this;
    var table, leftCol, center;
    var playControl, playerText;


    var startDate, endDate, diff;
    var getDiff = function(){return (endDate.getTime() - startDate.getTime())/1000;};
    var setStartEndDates = function(){
        var numDays = 7;
        endDate = new Date();
        startDate = new Date(endDate.getTime());
        startDate.setDate(startDate.getDate() - numDays);
        diff = getDiff();
    };
    setStartEndDates();



    var defaultConfig = {
        startDate: startDate,
        endDate: endDate,
        runTime: 60, //seconds
        refreshRate: 0.05
    };

    var playPauseClass = "media-player-paused";


  //**************************************************************************
  //** Constructor
  //**************************************************************************

    var init = function(){


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;



      //Set start/end dates
        startDate = config.startDate;
        endDate = config.endDate;
        diff = getDiff();



      //Create table
        table = document.createElement('table');
        table.className = "media-player";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        table.style.border = "0px";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        var row = document.createElement('tr');


      //Play/Pause Button
        leftCol = document.createElement('td');
        leftCol.className = "media-player-button";
        var link = document.createElement('a');
        //link.href="#";
        //link.title="Play";
        link.className = "media-player-play-button";

        var div = document.createElement('div');
        div.className = "media-player-play-left";
        link.appendChild(div);

        var div = document.createElement('div');
        div.className = "media-player-play-right";
        link.appendChild(div);

        var div = document.createElement('div');
        div.className = "media-player-play-triangle-1";
        link.appendChild(div);

        var div = document.createElement('div');
        div.className = "media-player-play-triangle-2";
        link.appendChild(div);

        leftCol.appendChild(link);
        row.appendChild(leftCol);


      //Main slider
        center = document.createElement('td');
        center.style.padding="4px 7px 0px 20px";
        row.appendChild(center);



      //Elapsed Time
        var col3 = document.createElement('td');
        col3.style.minWidth=col3.style.maxWidth=col3.style.width="85px";
        col3.style.padding="0 5px 0 0";

        var div = document.createElement('div');
        div.style.maxWidth="85px";
        div.style.overflowX="hidden";
        div.style.whiteSpace="nowrap";
        col3.appendChild(div);

        playerText = document.createElement('div');
        playerText.className = "media-player-text";
        div.appendChild(playerText);

        row.appendChild(col3);



      //Zoom control
        var col4 = document.createElement('td');
        col4.className = "media-player-button";
        var zoom = document.createElement('div');
        zoom.className = "media-player-zoomin";
        col4.appendChild(zoom);
        row.appendChild(col4);


      //Add table to parent
        tbody.appendChild(row);
        parent.appendChild(table);





      //Extend the javaxt.dhtml.PlayControl class
        playControl = new javaxt.dhtml.PlayControl(center, {
            startTime: 0, //seconds
            speed: config.refreshRate, //seconds
            totalTime: config.runTime //seconds
        });



      //onChange event handler
        playControl.onChange = function(elapsedTime){



          //Update text
            var secondsSinceStartDate = (diff/config.runTime)*elapsedTime;
            var date = new Date(startDate.getTime());
            date.setSeconds(date.getSeconds() + secondsSinceStartDate);
            var month = date.getMonth()+1;
            var day = date.getDate();
            var hour = date.getHours();
            var minutes = date.getMinutes();
            var meridian = "AM";

            if (hour==0) hour = 12;
            else{
                if (hour>=12){
                    meridian = "PM";
                    if (hour>12) hour = hour-12;
                }
            }
            if (minutes<10) minutes = "0"+minutes;

            playerText.innerHTML = month + "/" + day + " " + hour + ":" + minutes +
            '<span class="media-player-text-meridian">' + meridian + "</span>";

            me.onChange(date.getTime());
        };



      //onEnd event handler
        playControl.onEnd = function(){
            me.onEnd();
        };




      //Process play/pause button events

        toggleClass(leftCol, playPauseClass);
        link.onclick = function() {
            if (playControl.isPlaying()){
                var b = me.beforePause();
                if (b!=false){
                    toggleClass(leftCol, playPauseClass);
                    playControl.pause();
                    me.onPause();
                }
            }
            else {
                me.play();
            }
        };



        zoom.onclick = function() {
            toggleClass(this, "media-player-zoomout");
        };

    };


    this.play = function(){
        if (playControl.isPlaying()){
            return;
        }
        else{
            var b = me.beforePlay();
            if (b!=false){
                toggleClass(leftCol, playPauseClass);
                playControl.play();
                me.onPlay();
            }
        }
    };


    this.onPlay = function(){

    };

    this.onPause = function(){

    };

    this.beforePlay = function(){
        return true;
    };


    this.beforePause = function(){
        return true;
    };


  //**************************************************************************
  //** onEnd
  //**************************************************************************
  /** Called when the player reaches the end. By default, the play control
   *  loops to the beginning.
   */
    this.onEnd = function(){
        playControl.stop();
        playControl.play();
    };


  //**************************************************************************
  //** getStartDate
  //**************************************************************************
    this.getStartDate = function(){
        return new Date(startDate.getTime());
    };


  //**************************************************************************
  //** setStartDate
  //**************************************************************************
    this.setStartDate = function(d){
        startDate = d;
        diff = getDiff();
    };


  //**************************************************************************
  //** getEndDate
  //**************************************************************************
    this.getEndDate = function(){
        return new Date(endDate.getTime());
    };


  //**************************************************************************
  //** setEndDate
  //**************************************************************************
    this.setEndDate = function(d){
        endDate = d;
        diff = getDiff();
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var toggleClass = function(el, className){
        if (el.className){
            var idx = el.className.indexOf(className);
            if (idx==-1) el.className += " " + className;
            else el.className = el.className.replace(className,"");
        }
        else{
            el.className = className;
        }
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;


    init();

};