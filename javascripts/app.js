var app = {}
var mustache = require('mustache')

render('loading', '.items')
loadUI()
fetchTrainList(function(err, trainList) {
  if (err) return console.error(err)
  renderTrainList(trainList)
})

function loadUI() {
  app.container = vk.container('.ui-content')

  app.nav = vk.navBar('.nav', 'topNav')

  var button = vk.actionButton({href: "#/submit!", id: "start", labelSprite: "sprite-icon-refresh-white sprite"})
  app.nav.add(button, "right")

  var button2 = vk.actionButton({"data-view": "list", href: "#/list", id: "list-button", text: "", className: "sprite-list-off"})
  app.nav.add(button2, "left")
  var button3 = vk.actionButton({"data-view": "map", href: "#/map", id: "map-button", text: "", className: "sprite-map-off"})
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

