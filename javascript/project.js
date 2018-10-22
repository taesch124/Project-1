var mainContainderDiv = document.getElementById('main-container');
var nearbyLocationsDiv = document.getElementById('brewery-list');
var searchForm = document.getElementById('search-form');
var searchButton = document.getElementById('search-button');
var stateSelect = document.getElementById('state-select');
var citySearch = document.getElementById('city-search');

var queryUrl = '';
var geocoderUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

var geocoder;
var map;
var placesService;
var currentLocation;
var currentMarkers = [];

document.addEventListener('DOMContentLoaded', function() {
    searchForm.addEventListener('submit', submitHandler);
    searchButton.addEventListener('click', searchCityState);
})

function submitHandler(submitEvent) {
    submitEvent.preventDefault();
}
  
function searchCityState() {
    let state = stateSelect.value;
    let city = citySearch.value.trim();
    let location;
    if(city) {
        location = city + ', ' + state;
    } else {
        location = state;
    }

    codeAddress(geocoder, location);
}

function getGooglePlaces(location) {
    console.log('calling google places');
    currentLocation = location;
    let locationRequest = {
        location: currentLocation,
        radius: 2000,
        type: ['bar']
    };

    placesService = new google.maps.places.PlacesService(map);
    placesService.nearbySearch(locationRequest, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            currentMarkers = [];
            populateLocations(results);
            for (var i = 0; i < results.length; i++) {
              var place = results[i];
              createMapMarker(place);
              setMapBounds(currentMarkers);
            }
        } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            populateNoResultsMessage();
        }

    })
}

function populateLocations(locations) {
    console.log(locations);
    while(nearbyLocationsDiv.firstChild) {
        nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
    }

    let ratingSort = sortByRating(locations);
    for(let i = 0; i < ratingSort.length; i++) {
        let current = ratingSort[i];
        

        if(current.status = 'Brewery') {
            let container = document.createElement('div');
            container.classList.add('brewery-container');

            let name = document.createElement('h4');
            name.textContent = current.name;
            container.appendChild(name);

            
            if (current.overall != 0 ) {
                let rating = document.createElement('p');
                rating.textContent = 'Rated: ' + current.rating;
                container.appendChild(rating);
            }

            let address = document.createElement('p');
            address.textContent = current.vicinity;
            container.appendChild(address);

            nearbyLocationsDiv.appendChild(container);
        }
    }

}

function populateNoResultsMessage() {
    let container = document.createElement('div');
    container.classList.add('brewery-container');

    let message = document.createElement('h3');
    message.textContent = 'Could not find any results for selected location.';
    container.appendChild(message);

    nearbyLocationsDiv.appendChild(container);
}

function createMapMarker(place) {
    let marker = new google.maps.Marker({
        title: place.name,
        map: map,
        position: place.geometry.location,
        zoom: 15
      });
      currentMarkers.push(marker);

      let infoWindow = new google.maps.InfoWindow({
          content: place.name
      });

      google.maps.event.addListener(marker, 'click', function() {
          infoWindow.open(map, marker);
      });
}

function sortByRating(locations) {
    return locations.sort((a,b) => {
        return b.rating - a.rating;
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 39.8283, lng: -98.5795},
        zoom: 4
    });

    geocoder = new google.maps.Geocoder();
}

function codeAddress(geocoder, address) {
    geocoder.geocode({'address': address}, function(results, status) {
        if (status === 'OK') {
            console.log(results[0].geometry.location);
            getGooglePlaces(results[0].geometry.location); 
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function setMapBounds(markers) {
var bounds = new google.maps.LatLngBounds();

for (let i = 0; i < markers.length; i++) {
    bounds.extend(markers[i].getPosition());
}

map.setCenter(bounds.getCenter());
map.fitBounds(bounds);
}

var countryForMap

 var eventVenue = []

 var keyword; 
 var cityInput; 



 $("#search-event").on("click", function(event){ 
event.preventDefault(); 
$(".events-view").empty()

var keyword = $("#event-input").val(). trim();
var cityInput = $("#city-input").val(). trim();

console.log(keyword)
console.log(cityInput)

 var url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword="+ keyword + "&city=" +cityInput+ "&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";



  $.ajax({
    url: url,
    method: 'GET',
    async:true,
    dataType: "json",
  }).done(function(result) {
    console.log(result);
    console.log(result._embedded.events[0].name)
    var results = result.data;

     for (var i = 0; i < result._embedded.events.length; i++) {

                var entireDiv = $("<div>");
                entireDiv.attr("class", "style-of-div")
                
                var a = $("<p>");
                a.attr("data-name",result._embedded.events[i].name);
                a.text(result._embedded.events[i].name);


                var cityDiv = $("<p>");
                cityDiv.attr("data-name",result._embedded.events[i]._embedded.venues[0].city.name);
                console.log(result._embedded.events[i]._embedded.venues[0].city.name)
                cityDiv.text(result._embedded.events[i]._embedded.venues[0].city.name);

                var stateDiv = $("<p>");
                stateDiv.attr("data-name",result._embedded.events[i]._embedded.venues[0].state.name);
                console.log(result._embedded.events[i]._embedded.venues[0].state.name)
                stateDiv.text(result._embedded.events[i]._embedded.venues[0].state.name);
                
                
                var venueDiv= $("<p>");
                venueDiv.attr("data-name",result._embedded.events[i]._embedded.venues[0].name);
                console.log(result._embedded.events[i]._embedded.venues[0].name)
                venueDiv.text(result._embedded.events[i]._embedded.venues[0].name);
                

                var dateDiv = $("<p>");
                dateDiv.attr("data-name",result._embedded.events[i].dates.start.localDate);
                console.log(result._embedded.events[i].dates.start.localDate)
                dateDiv.text(result._embedded.events[i].dates.start.localDate);
                

                var timeDiv = $("<p>");
                timeDiv.attr("data-name",result._embedded.events[i].dates.start.localTime);
                console.log(result._embedded.events[i].dates.start.localTime)
                timeDiv.text(result._embedded.events[i].dates.start.localTime);
                
                eventVenue.push({ 
                
                latting:(result._embedded.events[i]._embedded.venues[0].location), 
                address: (result._embedded.events[i]._embedded.venues[0].address.line1), 

                })

               
                entireDiv.append(a)
                entireDiv.append(venueDiv)
                entireDiv.append(cityDiv)
                entireDiv.append(stateDiv)
                entireDiv.append(dateDiv)
                entireDiv.append(timeDiv)
                $(".events-view").append(entireDiv);
}

  }).fail(function(err) {
    throw err;
  })

 }); 