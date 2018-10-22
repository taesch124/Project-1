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
var searchRadiusMin = 2000,
searchRadius = searchRadiusMin;

document.addEventListener('DOMContentLoaded', function() {
    searchForm.addEventListener('submit', submitHandler);
    //searchButton.addEventListener('click', searchCityState);
    //$('document').on('click', '.event-listing', findAroundVenue);
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

var countryForMap

 var eventVenue = []

 var keyword; 
 var cityInput; 



 $("#search-button").on("click", function(event){ 
    event.preventDefault(); 
    $(".events-view").empty()

    var keyword = $("#event-search").val(). trim();
    var cityInput = $("#city-search").val(). trim();
    var stateInput = $('#state-select').val().trim();   

    var url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword="+ keyword + "&city=" +cityInput+ "&state=" + stateInput + "&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    console.log(url);


    $.ajax({
        url: url,
        method: 'GET',
        async:true,
        dataType: "json",
    }).done(function(result) {
        console.log(result);
        

        while(nearbyLocationsDiv.firstChild) {
            nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
        }

        if(!result._embedded) {
            populateNoResultsMessage();
            return;
        }

        eventListings = result._embedded.events;
        console.log(eventListings);

        for (var i = 0; i < result._embedded.events.length; i++) {

                    var entireDiv = $("<div>");
                    entireDiv.attr("data-latlng", JSON.stringify(result._embedded.events[i]._embedded.venues[0].location));
                    entireDiv.attr("class", "style-of-div")
                    entireDiv.addClass("event-listing");
                    
                    var a = $("<p>");
                    a.attr("data-name",result._embedded.events[i].name);
                    a.text(result._embedded.events[i].name);


                    var cityDiv = $("<p>");
                    cityDiv.attr("data-name",result._embedded.events[i]._embedded.venues[0].city.name);
                    cityDiv.text(result._embedded.events[i]._embedded.venues[0].city.name);

                    var stateDiv = $("<p>");
                    stateDiv.attr("data-name",result._embedded.events[i]._embedded.venues[0].state.name);
                    stateDiv.text(result._embedded.events[i]._embedded.venues[0].state.name);
                    
                    
                    var venueDiv= $("<p>");
                    venueDiv.attr("data-name",result._embedded.events[i]._embedded.venues[0].name);
                    venueDiv.text(result._embedded.events[i]._embedded.venues[0].name);
                    

                    var dateDiv = $("<p>");
                    dateDiv.attr("data-name",result._embedded.events[i].dates.start.localDate);
                    dateDiv.text(result._embedded.events[i].dates.start.localDate);
                    

                    var timeDiv = $("<p>");
                    timeDiv.attr("data-name",result._embedded.events[i].dates.start.localTime);
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
                    $('#results-list').append(entireDiv);
    }

    }).fail(function(err) {
        throw err;
    })

 }); 
 $(document).on('click', '.event-listing', findAroundVenue);

function findAroundVenue() {
    let location = JSON.parse($(this).attr('data-latlng'));
    console.log(location);
    let latlng = new google.maps.LatLng(location.latitude,location.longitude);
    getGooglePlaces(latlng);
}