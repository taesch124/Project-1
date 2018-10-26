var mainContainderDiv = document.getElementById('main-container');
var resultsListDiv = document.getElementById('results-list');
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
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }

    let sortedEvents = sortEventsByDate(events);
    venueMarkers = [];
    for (var i = 0; i < sortedEvents.length; i++) {
        let event = sortedEvents[i];
        let venue = sortedEvents[i]._embedded.venues[0];
        let card = createEventCard(event, venue);
        resultsListDiv.appendChild(card);

        let place = createPlaceFromEventVenue(venue);
        codeAddress(geocoder, place, card);
    }  
    setMapBounds(venueMarkers);
}

function populateLocations(locations) {
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }

    let ratingSort = sortPlacesByRating(locations);
    for(let i = 0; i < ratingSort.length; i++) {
        let current = ratingSort[i];
        let card = createPlaceCard(current);

        resultsListDiv.appendChild(card);
        createMapMarker(current, card, 'place');
    }
}

function populateUserChoices() {
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }
    resultsListDiv.classList.remove('m6');
    resultsListDiv.classList.add('m12');
    $('#map').addClass('hidden');

    let eventCard = createEventCard(chosenEvent, chosenEvent._embedded.venues[0], true);
    resultsListDiv.appendChild(eventCard);

    let barCard = createPlaceCard(chosenBar, true);
    resultsListDiv.appendChild(barCard);
}

function populateNoResultsMessage() {
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }
    let container = document.createElement('div');
    container.classList.add('card');

    let message = document.createElement('h3');
    message.textContent = 'Could not find any results for selected location.';
    container.appendChild(message);

    resultsListDiv.appendChild(container);
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

function createEventCard(event, venue, chosen) {
    let container = document.createElement('div');
    container.setAttribute("data-latlng", JSON.stringify(venue.location));
    container.setAttribute('data-event-id', event.id)
    container.classList.add('card');
    container.classList.add('result');

    if(event.images[0]) {
        let eventImage = document.createElement('img');
        eventImage.setAttribute('src', event.images[0].url);
        eventImage.classList.add('event-image');
        container.appendChild(eventImage);
    }
    
    
    let a = document.createElement('p');
    a.setAttribute("data-name",event.name);
    a.textContent = event.name;
    a.classList.add('card-title');
    container.appendChild(a);
    
    if(venue.state && venue.city) {
        let location = document.createElement('p');
        location.setAttribute("data-name",venue.state.name);
        location.textContent = venue.city.name + ', ' + venue.state.name;
        container.appendChild(location);
    } else if (venue.state) {
        let location = document.createElement('p');
        location.setAttribute("data-name",venue.state.name);
        location.textContent = venue.state.name;
        container.appendChild(location);
    }
    
    
    if(venue.name) {
        let venueDiv= document.createElement('p');
        venueDiv.setAttribute("data-name",venue.name);
        venueDiv.textContent = venue.name;
        container.appendChild(venueDiv);
    }
    
    
    if(event.dates) {
        let dateDiv = document.createElement('p');
        dateDiv.setAttribute("data-name",event.dates.start.localDate);
        dateDiv.textContent = event.dates.start.localDate;
        container.appendChild(dateDiv);
    }
    
    if(event.dates) {
        let timeDiv = document.createElement('p');
        timeDiv.setAttribute("data-name",event.dates.start.localTime);
        timeDiv.textContent = formatTime(event.dates.start.localTime);
        container.appendChild(timeDiv);
    }

    if (event.priceRanges) {
        let usdRange = event.priceRanges.filter(range => range.currency === 'USD')[0];
        let priceRange = document.createElement('p');
        priceRange.textContent = '$' + usdRange.min + ' - $' + usdRange.max;
        container.appendChild(priceRange);
    }

    if(!chosen) {
        let selectLink = document.createElement('a');
        selectLink.textContent = 'Select this location';
        selectLink.classList.add('select-event-link');
        container.appendChild(selectLink);
    }

    return container;
}

function createPlaceCard(current, chosen) {
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

    if(!chosen) {
        let selectLink = document.createElement('a');
        selectLink.textContent = 'Select this location';
        selectLink.classList.add('select-place-link');
        selectLink.setAttribute('data-id', current.place_id);
        container.appendChild(selectLink);
    } else {
        let phone = document.createElement('p');
        phone.textContent = current.formatted_phone_number;
        container.appendChild(phone);

        if(current.website) {
            let website = document.createElement('a');
            website.textContent = current.website;
            website.setAttribute('href', current.website);
            container.appendChild(website);
        }
        
    }

    return container
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

function formatTime(timeString) {
    let parts = timeString.split(':');
    let hour = parts[0];
    let dayPart;
    if (hour > 12) {
        hour -= 12;
        dayPart = 'PM';
    } else {
        dayPart = 'AM';
    }

    return hour + ':' + parts[1] + ' ' + dayPart;
}