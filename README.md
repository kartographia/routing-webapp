# Introduction
Web app used to generate and visualize routes between 2 points on the earth with the following modes:
 - Great Circle (shortest surface route)
 - Ocean Route
 - Air Route
 - Land Route

## Using the app
 1. Start the web server (e.g. `java -jar kartographia-routing.jar`)
 2. Open a browser and go to http://localhost:8080
 3. Click the "Draw Line" to draw a straight line between 2 points

## Maven Quickstart
```
git clone https://github.com/kartographia/routing-webapp.git
cd routing-webapp
mvn install
java -jar dist/kartographia-routing.jar
```
