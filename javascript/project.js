var mainContainderDiv = document.getElementById('main-container');
var nearbyLocationsDiv = document.getElementById('results-list');
var searchForm = document.getElementById('search-form');
var searchButton = document.getElementById('search-button');
var stateSelect = document.getElementById('state-select');
var citySearch = document.getElementById('city-search');

var geocoderUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

var geocoder;
var map;
var placesService;

var eventListings;
var placeListings;
var placeMarkers = [];
var venueMarkers = [];
var searchRadiusMin = 2000,
searchRadius = searchRadiusMin;

var currentLocation;
var chosenEvent;
var chosenBar;

document.addEventListener('DOMContentLoaded', function() {
    $('select').formSelect();
    searchForm.addEventListener('submit', submitHandler);
    $("#search-button").on("click", findEvents);
    $(document).on('click', '.select-event-link', selectEvent);
    $(document).on('click', '.select-place-link', getChosenPlaceDetails);
});

function submitHandler(submitEvent) {
    submitEvent.preventDefault();
}

function findEvents(event) {
    event.preventDefault();
    $(".events-view").empty();
    var url;

    var keyword = $("#event-search").val(). trim();
    var cityInput = $("#city-search").val(). trim();
    var stateInput = $('#state-select').val().trim();
    let endDate = getEndDate();
    
    if(cityInput) {
        url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + 
        "&city=" +cityInput + 
        "&stateCode=" + stateInput + 
        "&endDateTime=" + endDate + 
        "&radius=50" +
        "&unit=miles" +
        "&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    } else {
        url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + 
        "&stateCode=" + stateInput + 
        "&endDateTime=" + endDate + 
        "&radius=50" +
        "&unit=miles" +
        "&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    }
    console.log(url);

    $.ajax({
        url: url,
        method: 'GET',
        async:true,
        dataType: "json",
    }).done(function(result) {
        if(!result._embedded) {
            populateNoResultsMessage();
            return;
        } else {
            eventListings = result._embedded.events;
            populateEvents(result._embedded.events);
        }
        

    }).fail(function(err) {
        throw err;
    })
}

function selectEvent(event) {
    event.stopPropagation();
    let location = JSON.parse($(this).parent().attr('data-latlng'));
    let eventId = $(this).parent().attr('data-event-id');

    chosenEvent = eventListings.filter(event => event.id === eventId)[0];

    removeMapMarkersByType('venue');
    createMapMarker(createPlaceFromEventVenue(chosenEvent._embedded.venues[0]), null, 'venue', 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png');
    
    let latlng = new google.maps.LatLng(location.latitude,location.longitude);
    getGooglePlacesAroundEventVenue(latlng);
}

function getGooglePlacesAroundEventVenue(location) {
    currentLocation = location;
    let locationRequest = {
        location: currentLocation,
        radius: searchRadius,
        type: ['bar']
    };

    placesService = new google.maps.places.PlacesService(map);
    placesService.nearbySearch(locationRequest, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK && results.length >= 6) {
            placeMarkers = [];
            populateLocations(results);
            setMapBounds(placeMarkers);
        } else if(status == google.maps.places.PlacesServiceStatus.OK && results.length < 6) {
            searchRadius+= 2000;
            getGooglePlacesAroundEventVenue(location);
        } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            populateNoResultsMessage();
        }
    })
}

function populateEvents(events) {
    while(nearbyLocationsDiv.firstChild) {
        nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
    }

    let sortedEvents = sortEventsByDate(events);
    venueMarkers = [];
    for (var i = 0; i < sortedEvents.length; i++) {

        let event = sortedEvents[i];
        let venue = sortedEvents[i]._embedded.venues[0];

        let entireDiv = document.createElement('div');
        entireDiv.setAttribute("data-latlng", JSON.stringify(venue.location));
        entireDiv.setAttribute('data-event-id', event.id)
        entireDiv.classList.add('card');
        entireDiv.classList.add('result');

        if(event.images[0]) {
            let eventImage = document.createElement('img');
            eventImage.setAttribute('src', event.images[0].url);
            eventImage.classList.add('event-image');
            entireDiv.appendChild(eventImage);
        }
        
        
        let a = document.createElement('p');
        a.setAttribute("data-name",event.name);
        a.textContent = event.name;
        a.classList.add('card-title');
        entireDiv.appendChild(a)

        if(venue.city) {
            let cityDiv = document.createElement('p');
            cityDiv.setAttribute("data-name",venue.city.name);
            cityDiv.textContent = venue.city.name;
            entireDiv.appendChild(cityDiv);
        }
        
        if(venue.state) {
            let stateDiv = document.createElement('p');
            stateDiv.setAttribute("data-name",venue.state.name);
            stateDiv.textContent = venue.state.name;
            entireDiv.appendChild(stateDiv);
        }
        
        
        if(venue.name) {
            let venueDiv= document.createElement('p');
            venueDiv.setAttribute("data-name",venue.name);
            venueDiv.textContent = venue.name;
            entireDiv.appendChild(venueDiv);
        }
        
        
        if(event.dates) {
            let dateDiv = document.createElement('p');
            dateDiv.setAttribute("data-name",event.dates.start.localDate);
            dateDiv.textContent = event.dates.start.localDate;
            entireDiv.appendChild(dateDiv);
        }
        
        if(event.dates) {
            let timeDiv = document.createElement('p');
            timeDiv.setAttribute("data-name",event.dates.start.localTime);
            timeDiv.textContent = event.dates.start.localTime;
            entireDiv.appendChild(timeDiv);
        }

        let selectLink = document.createElement('a');
        selectLink.textContent = 'Select this location';
        selectLink.classList.add('select-event-link');
        entireDiv.appendChild(selectLink);


        $('#results-list').append(entireDiv);

        let place = createPlaceFromEventVenue(venue);
        

        codeAddress(geocoder, place, entireDiv);
    }  
    setMapBounds(venueMarkers);
}

function populateLocations(locations) {
    while(nearbyLocationsDiv.firstChild) {
        nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
    }

    let ratingSort = sortPlacesByRating(locations);
    for(let i = 0; i < ratingSort.length; i++) {
        let current = ratingSort[i];

        if(current.status = 'Brewery') {
            let container = document.createElement('div');
            container.classList.add('card', 'activator');

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

            let selectLink = document.createElement('a');
            selectLink.textContent = 'Select this location';
            selectLink.classList.add('select-place-link');
            selectLink.setAttribute('data-id', current.place_id);
            container.appendChild(selectLink);

            nearbyLocationsDiv.appendChild(container);
            createMapMarker(current, container, 'place');
        }
    }

}

function populateUserChoices() {
    console.log(chosenEvent);
    console.log(chosenBar);

    while(nearbyLocationsDiv.firstChild) {
        nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
    }
    nearbyLocationsDiv.classList.remove('m6');
    nearbyLocationsDiv.classList.add('m12');
    $('#map').addClass('hidden');

    let eventContainer = document.createElement('div');
    eventContainer.classList.add('card');

    let eventName = document.createElement('h3');
    eventName.textContent = chosenEvent.name;
    eventName.classList.add('card-title');
    eventContainer.appendChild(eventName);

    nearbyLocationsDiv.appendChild(eventContainer);

    let barContainer = document.createElement('div');
    barContainer.classList.add('card');

    let barName = document.createElement('h3');
    barName.textContent = chosenBar.name;
    barName.classList.add('card-title');
    barContainer.appendChild(barName);

    nearbyLocationsDiv.appendChild(barContainer);
}

function populateNoResultsMessage() {
    while(nearbyLocationsDiv.firstChild) {
        nearbyLocationsDiv.removeChild(nearbyLocationsDiv.firstChild);
    }
    let container = document.createElement('div');
    container.classList.add('card');

    let message = document.createElement('h3');
    message.textContent = 'Could not find any results for selected location.';
    container.appendChild(message);

    nearbyLocationsDiv.appendChild(container);
}

function createPlaceFromEventVenue(venue) {
    let latLng;
    let address = venue.address.line1 + ', ' + venue.city.name;
    if(venue.state) address += ', ' + venue.state.name;
    address += ', ' + venue.country.countryCode;
    
    if (venue.location) {
        latLng = new google.maps.LatLng(venue.location.latitude, venue.location.longitude);
    }
    
    let place = {
        name: venue.name, 
        geometry:  {
            location: latLng,
        },
        address: address
    }
    return place;
}

function getChosenPlaceDetails(event) {
    event.stopPropagation();
    let id = this.getAttribute('data-id');
    placesService = new google.maps.places.PlacesService(map);

    placesService.getDetails({
        placeId: id
    }, function(place, status) {
        if(status === google.maps.places.PlacesServiceStatus.OK) {
            chosenBar = place;
            console.log(chosenBar);
            populateUserChoices();
        } else {
            console.error('Could not find place. ' + status);
        }
    });

}

function createMapMarker(place, placeCard, type, icon) {
    let marker = new google.maps.Marker({
        title: place.name,
        map: map,
        position: place.geometry.location,
        icon: icon,
        zoom: 15
    });

    let contentString = '<h6>' + place.name + '</h6>'
                        
    if(type === 'place') {
        contentString += '<p>Distance from venue: ' +  
                        convertKmToMi(getDistanceFromLatLonInKm(
                            currentLocation.lat(), 
                            currentLocation.lng(), 
                            marker.position.lat(), 
                            marker.position.lng()))
                        .toFixed(2) + 
                        'mi</p>';
        placeMarkers.push(marker);
    } else if (type === 'venue') {
        venueMarkers.push(marker);
    }

    let infoWindow = new google.maps.InfoWindow({
        content: contentString
    });

    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.open(map, marker);
    });

    if(placeCard) {
        placeCard.addEventListener('click', function() {
            infoWindow.open(map, marker);
        });
    }
    
}

function removeMapMarkersByType(type) {
    if(type === 'venue') {
        for (var i = 0; i < venueMarkers.length; i++ ) {
            venueMarkers[i].setMap(null);
        }
        venueMarkers = [];
    }
    if(type === 'place') {
        for (var i = 0; i < placeMarkers.length; i++ ) {
            placeMarkers[i].setMap(null);
        }
        placeMarkers = [];
    }

}

function getEndDate() {
    let today = new Date();
    let searchEndDate = today.setMonth(today.getMonth() + 2);
    return formatDateForQuery(searchEndDate);
}

function formatDateForQuery(d) {
    let date = new Date(d);
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + 'T23:59:59Z';
}

function sortPlacesByRating(locations) {
    return locations.sort((a,b) => {
        return b.rating - a.rating;
    });
}

function sortEventsByDate(events) {
    return events.sort((a,b) => {
        return new Date(a.dates.start.localDate) - new Date(b.dates.start.localDate);
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 39.8283, lng: -98.5795},
        zoom: 4
    });

    geocoder = new google.maps.Geocoder();
}

function codeAddress(geocoder, place, placeCard) {
    if(place.geometry) {
        createMapMarker(place, placeCard, 'venue', 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png');
    } else {
        geocoder.geocode({'address': place.address}, function(results, status) {
            if (status === 'OK') {
                place.geometry.location = results[0].geometry.location;
                createMapMarker(place, placeCard, 'venue', 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png');
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