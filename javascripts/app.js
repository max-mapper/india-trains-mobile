var mustache = require('mustache')
var _ = require('underscore')

var app = {
  routes: {},
  currentView: 'list'
}

initializeList()

app.routes.map = function() {
  if (app.currentView === 'map') return
  app.currentView = 'map'
  app.nav.switchNav('map')
  render('mapContainer', '.items')
  showMap()
  locateAndSetMap(function(err) {
    if (err) {
      // there was an error finding the users location
      // so we fell back to a default location
    }
  })
}

app.routes.list = function() {
  if (app.currentView === 'list') return
  app.currentView = 'list'
  app.nav.switchNav('list')
  initializeList()
}

function initializeList() {
  render('loading', '.items')
  loadUI()
  var viewState = app.currentView
  fetchTrainList(function(err, trainList) {
    if (err) return console.error(err)
    if (app.currentView !== viewState) return
    renderTrainList(trainList)
  })
}

app.container.on('modal', function(route) {
  if (route === "map") return app.routes.map()
  if (route === "list") return app.routes.list()
  if (route === "refresh") return initializeList()
})

function loadUI() {
  app.container = vk.container('.ui-content')

  app.nav = vk.navBar('.nav', 'topNav')

  var button = vk.actionButton({href: "#/refresh!", id: "start", labelSprite: "sprite-icon-refresh-white sprite"})
  app.nav.add(button, "right")

  var button2 = vk.actionButton({"data-view": "list", href: "#/list!", id: "list-button", text: "", className: "sprite-list-on active"})
  app.nav.add(button2, "left")
  var button3 = vk.actionButton({"data-view": "map", href: "#/map!", id: "map-button", text: "", className: "sprite-map-off"})
  app.nav.add(button3, "left")
}

function fetchTrainList(cb) {
  var trainList = "http://railradar.railyatri.in/coa/livetrainslist.json"
  var calledBack = false
  $.getJSON(
    trainList + '?callback=?',
    function(obj) {
      if (!calledBack) cb(false, obj[0])
      calledBack = true
    },
    function(err) {
      if (!calledBack) cb(err)
      calledBack = true
    }
  )
}

function renderTrainList(items) {
  var list = vk.list('.items')   
  list.add(Object.keys(items).map(function(item) {
    return vk.item({'title': item})
  }))
}

function render( template, target, data, partials ) {
  target = $( target ).first()
  target.html( buildTemplate(template, data, partials) )
}

function buildTemplate(template, data, partials) {
  return mustache.to_html( getTemplate(template), data || {}, partials )
}

function getTemplate(template) {
  return $( "." + template + "Template" ).first().html()
}

function locateAndSetMap(callback) {
  locateMap(function(err, data) {
    if (err) {
      // bangalore
      app.map.setView(new L.LatLng(12.972107449831794, 77.59265899658203), 12)
      return callback(true)
    } 
    app.map.setView(data.latlng, 12)
    showUserLocation(data.latlng)
    if (callback) callback()
  })
}

function locateMap(callback) {
  app.map.on('locationfound', function(data) {
    if (!data) return callback('NO DATA IN LOCATIONFOUND')
    if (callback) callback(false, data)
  })
  app.map.on('locationerror', callback)
  app.map.locate()
}

function showUserLocation(userLocation) {
  return
  var UserIcon = L.Icon.extend({
    options: {
      iconSize:     [16, 18],
      shadowSize:   [0, 0],
      iconAnchor:   [8, 9],
      shadowAnchor: [8, 9],
      popupAnchor:  [-3, -20]
    }
  })
  var iconOptions = {iconUrl: './images/map-userlocation.png', className: "userLocationMarker"}
  if (!app.compassEnabled) iconOptions.iconUrl = './images/map-userlocation-nocompass.png'
  if (app.retina) iconOptions.iconUrl = './images/map-userlocation@2x.png'
  if (app.retina && !app.compassEnabled) iconOptions.iconUrl = './images/map-userlocation-nocompass@2x.png'
  var userIcon = new UserIcon(iconOptions)
  L.marker([userLocation.lat, userLocation.lng], {icon: userIcon}).addTo(app.map)
}

function showMap(container) {
  app.map = new L.Map(container || 'mapbox', {zoom: 12, attributionControl: true, zoomControl: false})
  var tiles ="http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png"
  // if (app.retina) tiles = ""
  var layer = new L.TileLayer(tiles, {maxZoom: 17, minZoom: 8, detectRetina: true})
  app.map.addLayer(layer)
}