## Mobile Train Finder for India

This app uses data from http://railradar.trainenquiry.com to show you train locations near your current location. The app itself is built using my open source mobile UI library [ViewKit](http://github.com/maxogden/viewkit), the [Leaflet](http://github.com/cloudmade/leaflet) mapping library and [Mapbox](http://mapbox.com) map tiles.

Note: if using this in production you should get a mapbox.com account and set the `tileURL` property in app.js to point to your mapbox account.

### Requirements

WebKit based mobile browser (Android, iOS). If you find bugs please open issues in this repository.

Only works with `touch` events at the moment, so for desktop browsers you are out of luck.

### Wishlist

It would be nice if RailRadar provided an API for getting train locations in a specific area. Currently the API returns all trains in the entire country.

### Why?

I thought the train data was really cool and saw it was provided by the government of India (http://www.indianrail.gov.in/). I used to work for Code for America and love making government data more useful. Maybe now the Indian rail authority will get on github! Total development time for this app was between 4 - 6 hours.

### License

BSD LICENSED

  