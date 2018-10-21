var mainContainderDiv = document.getElementById('main-container');
var nearbyLocationsDiv = document.getElementById('brewery-list');
var searchForm = document.getElementById('search-form');
var searchButton = document.getElementById('search-button');
var stateSelect = document.getElementById('state-select');
var citySearch = document.getElementById('city-search');

var queryUrl = '';

var stateUrl = 'http://beermapping.com/webservice/locstate/ec947effd0571340a08a8db7eb1723a6/';
var cityUrl = 'http://beermapping.com/webservice/loccity/ec947effd0571340a08a8db7eb1723a6/';
var geocoderUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
var jsonAppender = '&s=json';

var geocoder;
var map;
var placesService;
var currentMarkers = [];

//initMap();

document.addEventListener('DOMContentLoaded', function() {
    searchForm.addEventListener('submit', submitHandler);
    searchButton.addEventListener('click', searchBreweries);
})

function submitHandler(submitEvent) {
    submitEvent.preventDefault();
  }

function searchBreweries() {
    let state = stateSelect.value;

    let city = citySearch.value.trim();
    if(city) {
        queryUrl = cityUrl + city + ',' + state + jsonAppender;
    } else {
        queryUrl = stateUrl + state + jsonAppender;
    }

    
    //getStateResults();
    getGooglePlaces();
}

function getGooglePlaces() {
    console.log('calling google places');
    let locationSearch = new google.maps.LatLng(40.7196062, -74.0426357);
    let locationRequest = {
        location: locationSearch,
        radius: 2000,
        type: ['bar']
    };

    placesService = new google.maps.places.PlacesService(map);
    placesService.nearbySearch(locationRequest, function(results, status) {
        console.log(status);
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            currentMarkers = [];
            console.log(results);
            populateLocations(results);
            for (var i = 0; i < results.length; i++) {
              var place = results[i];
              let marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                zoom: 15
              });
              currentMarkers.push(marker);
            }

            //console.log(currentMarkers);
            setMapBounds(currentMarkers);
        } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            populateNoResultsMessage();
        }

    })
}

//Beer Mapping API - DEPRECATED
/*
function getStateResults() {
    console.log(queryUrl);
    currentMarkers = [];
    $.ajax({
        url: queryUrl,
        method: 'GET'
    }).then(function(response) {
        populateLocations(response);
    });
}
*/

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

            //No website data or phone data
            /*
            let website = document.createElement('a');
            if (current.url) {
                website.setAttribute('href', 'http://www.' + current.url);
                website.setAttribute('target', '_blank');
                website.textContent = 'Vist their site';
                container.appendChild(website);
            }
            

            let phone = document.createElement('p');
            phone.textContent = current.phone;
            container.appendChild(phone);
            */

            nearbyLocationsDiv.appendChild(container);
            //codeAddress(geocoder, map, address.textContent + ', ' + cityAddress.textContent);
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

function codeAddress(geocoder, map, address) {
    geocoder.geocode({'address': address}, function(results, status) {
      if (status === 'OK') {
        let marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
          zoom: 15
        });
        currentMarkers.push(marker);
        console.log(currentMarkers);
        setMapBounds(currentMarkers);
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