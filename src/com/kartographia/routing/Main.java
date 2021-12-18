package com.kartographia.routing;
import com.kartographia.utils.Python;
import javaxt.io.Jar;
import static javaxt.utils.Console.*;
import java.util.*;


//******************************************************************************
//**  Main
//******************************************************************************
/**
 *   Command line interface used to start the web server
 *
 ******************************************************************************/

public class Main {

    public static void main(String[] arr) throws Exception {
        HashMap<String, String> args = console.parseArgs(arr);

      //Get jar file
        Jar jar = new Jar(Main.class);
        javaxt.io.File jarFile = new javaxt.io.File(jar.getFile());
        javaxt.io.Directory jarDir = jarFile.getDirectory();



      //Set path to the web directory
        javaxt.io.Directory web = jarDir.getName().equals("dist") ?
        new javaxt.io.Directory(jarDir.getParentDirectory() + "web") : //dev
        new javaxt.io.Directory(jarDir + "web"); //prod


      //Set path to the scripts directory
        javaxt.io.Directory scriptDir = new javaxt.io.Directory(web.getParentDirectory() + "scripts");
        Python.setScriptDir(scriptDir);


      //Start the web server
        new WebApp(web);
    }
}