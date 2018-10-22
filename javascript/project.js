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
var searchRadiusMin = 2000,
searchRadius = searchRadiusMin;

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
    
    searchRadius = searchRadiusMin;

    codeAddress(geocoder, location);
}

function getGooglePlaces(location) {
    currentLocation = location;
    let locationRequest = {
        location: currentLocation,
        radius: searchRadius,
        type: ['bar']
    };

    placesService = new google.maps.places.PlacesService(map);
    placesService.nearbySearch(locationRequest, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK && results.length >= 6) {
            currentMarkers = [];
            populateLocations(results);
            setMapBounds(currentMarkers);
        } else if(status == google.maps.places.PlacesServiceStatus.OK && results.length < 6) {
            searchRadius+= 2000;
            getGooglePlaces(location);
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
            createMapMarker(current, container);
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

function createMapMarker(place, placeCard) {
    let marker = new google.maps.Marker({
        title: place.name,
        map: map,
        position: place.geometry.location,
        zoom: 15
      });
      currentMarkers.push(marker);

      let contentString = '<h2>' + place.name + '</h2>' +
                          '<p>' +  convertKmToMi(getDistanceFromLatLonInKm(
                                                    currentLocation.lat(), 
                                                    currentLocation.lng(), 
                                                    marker.position.lat(), 
                                                    marker.position.lng()))
                                    .toFixed(2) + 'mi</p>';
      let infoWindow = new google.maps.InfoWindow({
          content: contentString
      });

      google.maps.event.addListener(marker, 'click', function() {
          infoWindow.open(map, marker);
      });
      placeCard.addEventListener('click', function() {
          infoWindow.open(map, marker);
      })
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
            console.log(results[0]);
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

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function convertKmToMi(km) {
    return (1/0.621371) * km;
}