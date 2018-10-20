var mainContainderDiv = document.getElementById('main-container');
var breweryListDiv = document.getElementById('brewery-list');
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

    
    getStateResults();
}

function getStateResults() {
    console.log(queryUrl);
    $.ajax({
        url: queryUrl,
        method: 'GET'
    }).then(function(response) {
        populateBreweries(response);
    });
}

function populateBreweries(locations) {
    currentMarkers.splice(0, currentMarkers.length);
    while(breweryListDiv.firstChild) {
        breweryListDiv.removeChild(breweryListDiv.firstChild);
    }

    let citySort = sortByCity(locations);
    console.log(citySort);
    for(let i = 0; i < citySort.length; i++) {
        let current = citySort[i];
        

        if(current.status = 'Brewery') {
            let container = document.createElement('div');
            container.classList.add('brewery-container');

            let name = document.createElement('h4');
            name.textContent = current.name;
            container.appendChild(name);

            
            if (current.overall != 0 ) {
                let rating = document.createElement('p');
                rating.textContent = 'Rated: ' + current.overall;
                container.appendChild(rating);
            }

            let streetAddress = document.createElement('p');
            streetAddress.textContent = current.street;
            container.appendChild(streetAddress);

            let cityAddress = document.createElement('p');
            cityAddress.textContent = current.city + ', ' + current.state + ' ' + current.zip;
            container.appendChild(cityAddress);

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

            breweryListDiv.appendChild(container);
            codeAddress(geocoder, map, streetAddress.textContent + ', ' + cityAddress.textContent);
        }
    }
}

function sortByCity(breweries) {
    return breweries.sort((a,b) => {
        let cityA = a.city.toLowerCase(); 
        let cityB = b.city.toLowerCase();
        if (cityA < cityB) return -1;
        if (cityA > cityB) return 1;
        return 0;
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
        console.log(marker);
        currentMarkers.push(marker);
        setMapBounds(currentMarkers);
      } else {
        console.error('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

  function setMapBounds(markers) {
    var bounds = new google.maps.LatLngBounds();
    console.log(markers);
    console.log(markers.length);

    for (let i = 0; i < 6; i++) {
        console.log('hi');
        bounds.extend(markers[i].getPosition());
    }
    console.log(bounds);
    
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  }