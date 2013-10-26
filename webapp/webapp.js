if (Meteor.isClient) {

  Template.mapbar.rendered = function() {
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
      var circle = L.circle([ geojson[i].features[0].geometry.coordinates[0], geojson[i].features[0].geometry.coordinates[1] ], 100000, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.2
      }).addTo(map);

      (function(title, pubmed_id){
        circle.bindPopup( title )

        circle.on('click', function() {
          console.log(["Circle clicked with paper: ", circle])
          var item = $("<div class='item'> <p class='pubmed-link'> <a href=''> </a> </p> <p class='title'> </p> </div>")
          item.find('p.pubmed-link a').attr('href', 'http://www.ncbi.nlm.nih.gov/pubmed/' + pubmed_id).text('PubMed Link')
          item.find('p.title').text('"' + title + '"')
          $("#information").prepend(item)
        })
      })(geojson[i].features[0].properties.title, geojson[i].features[0].properties.pubmed_id);
    }
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
