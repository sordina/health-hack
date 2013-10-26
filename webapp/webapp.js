if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to webapp.";
  };

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });

  Template.hello.rendered = function() {
    // set up the map
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 12, attribution: osmAttrib});		

    // start the map in South-East England
    map.setView(new L.LatLng(51.3, 0.7),3);
    map.addLayer(osm);

    for(var i = 0; i < geojson.length; i++) {
      console.log(['Adding geojson point ', geojson[i]])
      var circle = L.circle([ geojson[i].features[0].geometry.coordinates[0], geojson[i].features[0].geometry.coordinates[1] ], 10000, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.8
      }).addTo(map);
      circle.bindPopup( geojson[i].features[0].properties.title )

      circle.onclick = function() {console.log('testing')}
    }
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
