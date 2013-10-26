if (Meteor.isClient) {

  history = new Meteor.Collection()

  Template.sidebar.items  = function() { return history.find().fetch().reverse() }
  Template.sidebar.get_id = function(e) { return e["Pubmed id"] }

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

    papers.find().forEach(function(p){
      var res = p["Info"].location.results[0]
      if(res) {
        var loc = res.geometry.location
        console.log(['Adding paper', p])
        var circle = L.circle([loc.lat, loc.lng], 100000, { color: 'red', fillColor: '#f03', fillOpacity: 0.2 })
        circle.addTo(map)
        circle.bindPopup(p["Title"])
        circle.on("click",function(){history.insert(p)})
      }
    })
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

papers = new Meteor.Collection("papers")
