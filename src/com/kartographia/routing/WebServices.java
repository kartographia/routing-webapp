package com.kartographia.routing;
import com.kartographia.utils.Routing;

import javaxt.express.*;
import javaxt.http.servlet.*;
import javaxt.sql.*;
import javaxt.json.*;

import java.util.*;
import java.math.BigDecimal;

public class WebServices extends WebService {

    

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public WebServices(){
    }


  //**************************************************************************
  //** getRoute
  //**************************************************************************
  /** Used to compute an transportation route between 2 points on the earth
   *  for a given mode of transport (land, sea, air)
   */
    public ServiceResponse getRoute(ServiceRequest request, Database database)
        throws ServletException {

      //Parse params
        String type = request.getParameter("type").toString();
        if (type==null) type = "GreatCircle"; //vs Shipping

        String start = request.getParameter("start").toString();
        if (start==null) return new ServiceResponse(400, "start coordinate is required");

        String end = request.getParameter("end").toString();
        if (end==null) return new ServiceResponse(400, "end coordinate is required");

        String method = request.getParameter("shippingMethod").toString();
        if (method==null) method = request.getParameter("method").toString();
        if (method==null && type.equalsIgnoreCase("Shipping")){
            return new ServiceResponse(400, "shippingMethod is required");
        }

      //Parse coords
        String[] s = start.split(",");
        String[] e = end.split(",");

        BigDecimal[] c1 = new BigDecimal[]{
            new BigDecimal(Double.parseDouble(s[0])),
            new BigDecimal(Double.parseDouble(s[1]))
        };

        BigDecimal[] c2 = new BigDecimal[]{
            new BigDecimal(Double.parseDouble(e[0])),
            new BigDecimal(Double.parseDouble(e[1]))
        };


      //Get route
        try{
            JSONObject geoJson = null;
            if (type.equalsIgnoreCase("Shipping")){
                geoJson = Routing.getShippingRoute(c1, c2, method);
            }
            else{
                geoJson = Routing.getGreatCircleRoute(c1, c2, 50);
            }
            return new ServiceResponse(geoJson);
        }
        catch(Exception ex){
            return new ServiceResponse(ex);
        }
    }


}