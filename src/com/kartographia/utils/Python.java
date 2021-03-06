package com.kartographia.utils;
import javaxt.json.JSONObject;
import java.util.*;

public class Python {

    private static String python = getPythonCommand();
    private static javaxt.io.Directory scriptDir;

  //**************************************************************************
  //** getPythonCommand
  //**************************************************************************
    public static String getPythonCommand() {

        for (String python : new String[]{"python3", "python"}){
            String[] cmdarray = new String[]{python, "--version"};

            javaxt.io.Shell cmd = new javaxt.io.Shell(cmdarray);
            cmd.run();

            try{
                parseErrors(cmd.getErrors());
                return python;
            }
            catch(Exception e){
                //e.printStackTrace();
            }
        }

        return null;
    }


  //**************************************************************************
  //** executeScript
  //**************************************************************************
    public static JSONObject executeScript(javaxt.io.File script, ArrayList<String> params)
    throws Exception {

        String[] cmdarray = new String[params.size()+2];
        cmdarray[0] = getPythonCommand();
        cmdarray[1] = script.toString();
        int i = 2;
        for (String param : params){
            cmdarray[i] = param;
            i++;
        }

        javaxt.io.Shell cmd = new javaxt.io.Shell(cmdarray);
        cmd.run();
        List<String> output = cmd.getOutput();
        List<String> errors = cmd.getErrors();


      //Check if there are any errors
        parseErrors(errors);


      //Parse output
        try{
            return new JSONObject(output.get(0));
        }
        catch(Exception e){
            StringBuilder err = new StringBuilder();
            err.append("Error parsing script output");
            StringBuffer result = new StringBuffer();
            Iterator<String> i2 = output.iterator();
            while (i2.hasNext()){
                String out = i2.next();
                if (out!=null) result.append(out + "\r\n");
            }
            err.append(":\r\n" + result);
            throw new Exception(err.toString());
        }
    }


  //**************************************************************************
  //** parseErrors
  //**************************************************************************
  /** Throws an exception if there are error messages in the standard error
   *  output string
   */
    private static void parseErrors(List<String> errors) throws Exception{
        if (errors.size()>0){
            StringBuilder err = new StringBuilder();
            Iterator<String> i2 = errors.iterator();
            while (i2.hasNext()){
                String error = i2.next();
                if (error!=null) err.append(error + "\r\n");
            }
            if (err.length()>0){
                throw new Exception(err.toString());
            }
        }
    }


    public static javaxt.io.Directory getScriptDir(){
        return scriptDir;
    }

    public static void setScriptDir(javaxt.io.Directory dir){
        scriptDir = dir;
    }    
}