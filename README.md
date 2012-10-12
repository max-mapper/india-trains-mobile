## Mobile Train Finder for India

This app uses data from http://railradar.trainenquiry.com to show you train locations near your current location. The app itself is built using my open source mobile UI library [ViewKit](http://github.com/maxogden/viewkit), the [Leaflet](http://github.com/cloudmade/leaflet) mapping library and [Mapbox](http://mapbox.com) map tiles.

Note: if using this in production you should get a mapbox.com account and set the `tileURL` property in app.js to point to your mapbox account.

### Requirements

WebKit based browser (Android, iOS). If you find bugs please open issues in this repository.

### Wishlist

It would be nice if RailRadar provided an API for getting train locations in a specific area. Currently the API returns all trains in the entire country.

### License

BSD LICENSED

  