var mainContainderDiv = document.getElementById('main-container');
var nearbyLocationsDiv = document.getElementById('results-list');
var searchForm = document.getElementById('search-form');
var searchButton = document.getElementById('search-button');
var stateSelect = document.getElementById('state-select');
var citySearch = document.getElementById('city-search');

var queryUrl = '';
var geocoderUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

var eventListings = [];

var geocoder;
var map;
var placesService;
var currentLocation;
var currentMarkers = [];
var venueMarkers = [];
var searchRadiusMin = 2000,
searchRadius = searchRadiusMin;

document.addEventListener('DOMContentLoaded', function() {
    searchForm.addEventListener('submit', submitHandler);
    $("#search-button").on("click", findEventVenues);
    $(document).on('click', '.event-listing', findAroundVenue);
    $('select').formSelect();
})

function submitHandler(submitEvent) {
    submitEvent.preventDefault();
}
  
function searchCityState() {
    let state = stateSelect.value;
    let city = citySearch.value.trim();
    let location;
    searchRadius = searchRadiusMin;
    if(city) {
        location = {city: city,  state: state};
        codeAddress(geocoder, location.city, + ', ' + location.state);
    } else {
        location = {city: undefined, state: state};
        codeAddress(geocoder, location.state);
    }
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

      let contentString = '<h6>' + place.name + '</h6>' +
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

function createVenueMarker(place) {
    let marker = new google.maps.Marker({
        title: place.name,
        map: map,
        position: place.location,
        icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
        zoom: 15
      });
      venueMarkers.push(marker);

      let contentString = '<h6>' + place.name + '</h6>';
      let infoWindow = new google.maps.InfoWindow({
          content: contentString
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

function codeAddress(geocoder, place) {
    if(place.location) {
        createVenueMarker(place);
    } else {
        geocoder.geocode({'address': place.address}, function(results, status) {
            if (status === 'OK') {
                place.location = results[0].geometry.location;
                createVenueMarker(place);
            } else {
                console.error('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
    
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

function findEventVenues(event) {
    event.preventDefault(); 
    $(".events-view").empty();
    var url;

    var keyword = $("#event-search").val(). trim();
    var cityInput = $("#city-search").val(). trim();
    var stateInput = $('#state-select').val().trim();   
    
    if(cityInput) {
        url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + "&city=" +cityInput+ "&stateCode=" + stateInput + "&radius=50&unit=miles&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    } else {
        url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + "&stateCode=" + stateInput + "&radius=50&unit=miles&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    }
    
    console.log(url);


    $.ajax({
        url: url,
        method: 'GET',
        async:true,
        dataType: "json",
    }).done(function(result) {
    

    while(nearbyLocationsDiv.firstChild) {
        nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
    }

    if(!result._embedded) {
        populateNoResultsMessage();
        return;
    }

    eventListings = result._embedded.events;
    venueMarkers = [];
    for (var i = 0; i < result._embedded.events.length; i++) {

        let event = result._embedded.events[i];
        let venue = result._embedded.events[i]._embedded.venues[0];

        var entireDiv = $("<div>");
        entireDiv.attr("data-latlng", JSON.stringify(venue.location));
        entireDiv.addClass('card');
        entireDiv.addClass('result');
        entireDiv.addClass("event-listing");
        entireDiv.addClass('card');
        
        var a = $("<p>");
        a.attr("data-name",event.name);
        a.text(event.name);
        entireDiv.append(a)

        if(venue.city) {
            var cityDiv = $("<p>");
            cityDiv.attr("data-name",venue.city.name);
            cityDiv.text(venue.city.name);
            entireDiv.append(cityDiv);
        }
        
        if(venue.state) {
            var stateDiv = $("<p>");
            stateDiv.attr("data-name",venue.state.name);
            stateDiv.text(venue.state.name);
            entireDiv.append(stateDiv);
        }
        
        
        if(venue.name) {
            var venueDiv= $("<p>");
            venueDiv.attr("data-name",venue.name);
            venueDiv.text(venue.name);
            entireDiv.append(venueDiv);
        }
        
        
        if(event.dates) {
            var dateDiv = $("<p>");
            dateDiv.attr("data-name",result._embedded.events[i].dates.start.localDate);
            dateDiv.text(result._embedded.events[i].dates.start.localDate);
            entireDiv.append(dateDiv);
        }
        
        if(event.dates) {
            var timeDiv = $("<p>");
            timeDiv.attr("data-name",result._embedded.events[i].dates.start.localTime);
            timeDiv.text(result._embedded.events[i].dates.start.localTime);
            entireDiv.append(timeDiv);
        }

        $('#results-list').append(entireDiv);

        let latLng;
        let address = venue.address + ', ' + venue.city;
        if(venue.state) address += ', ' + venue.state;
        address += ', ' + venue.country;
        
        if (venue.location) {
            latLng = new google.maps.LatLng(venue.location.latitude, venue.location.longitude);
        }
        
        
        let place = {
            name: venue.name, 
            location: latLng,
            address: address
        }

        codeAddress(geocoder, place);
    }  
    setMapBounds(venueMarkers);

    }).fail(function(err) {
        throw err;
    })
}

function findAroundVenue() {
    let location = JSON.parse($(this).attr('data-latlng'));
    let latlng = new google.maps.LatLng(location.latitude,location.longitude);
    getGooglePlaces(latlng);
}