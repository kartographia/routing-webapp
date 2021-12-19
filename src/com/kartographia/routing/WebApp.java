package com.kartographia.routing;
import java.io.IOException;
import javaxt.express.*;
import javaxt.http.servlet.*;


public class WebApp extends HttpServlet {

    private javaxt.io.Directory web;
    private FileManager fileManager;
    private WebServices ws;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public WebApp(javaxt.io.Directory web) throws Exception {
        this.web = web;


      //Instantiate file manager
        fileManager = new FileManager(web);


      //Instantiate web services
        ws = new WebServices();


      //Start the server
        int threads = 50;
        javaxt.http.Server server = new javaxt.http.Server(8080, threads, this);
        server.start();
    }


  //**************************************************************************
  //** processRequest
  //**************************************************************************
  /** Used to process http get and post requests.
   */
    public void processRequest(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {



      //Get path from url, excluding servlet path and leading "/" character
        String path = request.getPathInfo();
        if (path!=null) path = path.substring(1);


      //Get first "directory" in the path
        String service = path==null ? "" : path.toLowerCase();
        if (service.contains("/")) service = service.substring(0, service.indexOf("/"));




      //Send static file if we can
        if (service.length()==0){

          //If the service is empty, send welcome file (e.g. index.html)
            fileManager.sendFile(request, response);
            return;
        }
        else{

          //Check if the service matches a file or folder in the web directory.
          //If so, send the static file as requested. Note that the current
          //implementation searches the web directory for each http request,
          //which is terribly inefficient. We need some sort of caching with
          //a file watcher...
            for (Object obj : web.getChildren()){
                String name = null;
                if (obj instanceof javaxt.io.File){
                    name = ((javaxt.io.File) obj).getName();
                }
                else{
                    name = ((javaxt.io.Directory) obj).getName();
                }
                if (service.equalsIgnoreCase(name)){
                    fileManager.sendFile(request, response);
                    return;
                }
            }
        }



      //If we're still here, we either have a bad file request or a web
      //service request. In either case, send the request to the
      //webservices endpoint to process.
        {
            ServiceResponse rsp = ws.getServiceResponse(new ServiceRequest(request), null);
            response.setContentType(rsp.getContentType());
            response.setStatus(rsp.getStatus());
            response.write((byte[]) rsp.getResponse(), true);
        }
    }
}