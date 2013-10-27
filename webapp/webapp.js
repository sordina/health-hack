if (Meteor.isClient) {

  history = new Meteor.Collection()

  Template.sidebar.items  = function() { return history.find().fetch().reverse() }
  Template.sidebar.get_id = function(e) { return e["Pubmed id"] }
  Template.sidebar.events({
    'click .info': function (event) {
      Session.set("pubmed_id", this["Pubmed id"])
      console.log(["event", event, this]) } })

  Template.paper_info.get_paper = function(e) {
    console.log("Getting Paper");
    return papers.find({"Pubmed id": Session.get("pubmed_id")})
  }
  Template.paper_info.grab = function(k) { return this[k] }
  Template.paper_info.events( {
    'click .close': function (event) { Session.set("pubmed_id", 0) }, } )

  Template.main_table.section = function(v) { return( Session.get("section") == v) }

  Template.main_table.created = function() {
    Session.set("section", "map")
  }

  Template.main_table.events({
    'click .section-link': function (event) {
      var foo = event.srcElement.href.match(/#(.*)/)[1]
      Session.set("section",foo)
      console.log(["section link event", foo, event, this]) } })

  Template.bubbles.rendered = function() { run_vis() }

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
        var citations = p.Citations.citations
        for(var ci = 0; ci < citations.length; ci++) {
          cid = citations[ci].id
          if(cid != p["Pubmed id"]) {
            var found = papers.find({"Pubmed id": cid})
            found.forEach(function(ee){
              console.log(["Citation-Found ", cid, p["Pubmed id"]], ee)
              var res2 = ee["Info"].location.results[0]
              if(res2) {
                var loc2 = res2.geometry.location
                var line = L.polyline([[loc.lat, loc.lng], [loc2.lat, loc2.lng]], {color: 'blue', weight: 2})
                line.addTo(map)
              }
            })
          }
        }
        console.log('Adding Paper')
        var circle = L.circle([loc.lat, loc.lng], 100000, { color: 'red', fillColor: '#f03', fillOpacity: 0.2 })
        circle.addTo(map)
        circle.bindPopup(p["Title"])
        circle.on("click",function(){
          console.log(p)
          // Session.set('pubmed_id', p["Pubmed id"])
          history.insert(p)
        })
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
