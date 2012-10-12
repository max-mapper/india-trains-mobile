// [
//   "11402", // trainNumber
//   "NAGPUR - MUMBAI CST Nandigram Express", // name
//   "2012-10-12", // startedOn
//   "SHSK", // lastUpdateShortName
//   "19.403135", // lat
//   "78.008423", // lon
//   "SAHARSRAKUND", // lastUpdateLongName
//   "40", // lastStatusDelayInMinutes
//   "19.417059", // previousLat
//   "77.869205", // previousLon
//   "HEM", // nextHaltShortName
//   "HIMAYATNAGAR", // nextHaltLongName
//   40, // lastStatusDelayInMinutesInt
//   533 // ?
// ]

var mustache = require('mustache')
var _ = require('underscore')

var app = {
  nearbyRadius: 100000,
  routes: {},
  currentView: 'list',
  retina: window.devicePixelRatio > 1 ? true : false
}

initializeList()

app.routes.map = function() {
  if (app.currentView !== 'map') {
    app.nav.switchNav('map')
    render('mapContainer', '.items')
    showMap()
    app.currentView = 'map'
  }
  var refreshIcon = $('.sprite-icon-refresh-white')
  refreshIcon.addClass('spinning')
  getNearbyTrains(app.nearbyRadius, function(err, trains) {
    refreshIcon.removeClass('spinning')
    app.nearbyTrains = trains
    if (app.currentView !== 'map') return
    renderTrainMap(trains)
  })
  return app.map.setView(new L.LatLng(12.972107449831794, 77.59265899658203), 12)
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

function getPosition(cb) {
  navigator.geolocation.getCurrentPosition(
    function(position) {
      cb(false, position)
    },
    function(error) {
      console.log('getCurrentPosition err', error)
      var code = error.code
      if (code === 1) error = "Not allowed for this application."
      if (code === 2) error = "Make sure location services are enabled on your phone."
      if (code === 3) error = "Getting a GPS fix took too long."
      cb(error)
    }
  )
}


function initializeList() {
  render('loading', '.items')
  loadUI()
  var viewState = app.currentView
  getNearbyTrains(app.nearbyRadius, function(err, trains) {
    app.nearbyTrains = trains
    if (app.currentView !== viewState) return
    renderTrainList(trains)
  })
}

app.container.on('modal', function(route) {
  if (route === "map") return app.routes.map()
  if (route === "list") return app.routes.list()
  if (route === "refresh") {
    if (app.currentView === "list") return initializeList()
    if (app.currentView === "map") return app.routes.map()
  }
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

function getNearbyTrains(distance, cb) {
  var trains, location
  fetchTrainList(function(err, trainList) {
    if (err) return cb(err)
    trains = trainList
    if (trains && location) gotData()
  })
  getPosition(function(err, position) {
    if (err) return cb(err)
    location = position
    if (trains && location) gotData()
  })
  function gotData() {
    var userLocation = new L.LatLng(location.coords.latitude, location.coords.longitude)
    userLocation = new L.LatLng(12.972107449831794, 77.59265899658203)
    trains = filterTrains(userLocation, trains, distance)
    cb(false, trains)
  }
}

// for specific train schedule: 
// http://coa-search-193678880.ap-southeast-1.elb.amazonaws.com/schedule/79304.json

function fetchTrainList(cb) {
  var trainList = "http://railradar.railyatri.in/coa/livetrainslist.json"
  var calledBack = false
  $.getJSON(
    trainList + '?callback=?',
    function(obj) {
      app.trainCache = obj[0]
      if (!calledBack) cb(false, obj[0])
      calledBack = true
    },
    function(err) {
      if (!calledBack) cb(err)
      calledBack = true
    }
  )
}

function filterTrains(userLocation, stations, distance) {
  var nearbyTrains = []
  Object.keys(stations).map(function(station) {
    if (station === "count") return
    _.each(stations[station], function(train, idx) {
      train.distance = userLocation.distanceTo(new L.LatLng(train[4], train[5]))
      if (train.distance < distance) {
        nearbyTrains.push(train)
      }
    })
  })
  nearbyTrains = _.sortBy(nearbyTrains, function(train) {
    return train.distance
  })
  return nearbyTrains
}

function renderTrainList(trains) {
  app.trains = trains
  if (trains.length === 0) return render('noNearbyTrains', '.items')
  var list = vk.list('.items')
  var rowTemplate = getTemplate('row')
  list.add(trains.map(function(item) {
    var distance = Math.floor(item.distance / 1000)
    var item = vk.item({title: item[1], distance: distance})
    item.template = rowTemplate // todo better api for defining templates
    return item
  }))
}

function getDirection(e, t, n, r) {
  var i = 0;
  return i = Math.atan2(
    Math.sin(r - t) * Math.cos(n),
    Math.cos(e) * Math.sin(n) - Math.sin(e) * Math.cos(n) * Math.cos(r - t)
  ) % (2 * Math.PI), i = i * 180 / Math.PI, i
}

function renderTrainMap(trains) {
  trains.map(function(item) {
    showTrain([item[4], item[5]], getDirection(item[4], item[5], item[8], item[9]))
  })
  // leaflet clobbers our webkit-transform rotate :(
  app.map.on('viewreset', function() {
    $('.trainArrow').each(function(i, train) {
      rotateIcon($(train))
    })
  })
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

function showTrain(location, direction) {
  var TrainIcon = L.Icon.extend({
    options: {
      iconSize:     [33, 33],
      shadowSize:   [0, 0],
      iconAnchor:   [16, 16],
      shadowAnchor: [8, 9],
      popupAnchor:  [-3, -20]
    }
  })
  var iconOptions = {iconUrl: './images/arrow.png', className: "trainArrow"}
  if (app.retina) iconOptions.iconUrl = './images/arrow@2x.png'
  var trainIcon = new TrainIcon(iconOptions)
  var marker = L.marker(location, {icon: trainIcon}).addTo(app.map)
  rotateIcon($(marker._icon), direction)
}

function rotateIcon(icon, degrees) {
  if (degrees) icon.attr('data-degrees', degrees)
  else degrees = icon.attr('data-degrees')
  var transformSettings = icon.css('-webkit-transform')
  // dont remove existing webkit transform properties
  transformSettings = transformSettings.replace(/\s?rotate\(.+\)/, '')
  icon.css('-webkit-transform', transformSettings + ' rotate(' + Math.floor(degrees) + 'deg)')
}

function showMap(container) {
  app.map = new L.Map(container || 'mapbox', {zoom: 12, attributionControl: true, zoomControl: false})
  var tiles ="http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png"
  // if (app.retina) tiles = ""
  var layer = new L.TileLayer(tiles, {maxZoom: 17, minZoom: 3, detectRetina: true})
  app.map.addLayer(layer)
}