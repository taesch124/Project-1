var mainContainderDiv = document.getElementById('main-container');
var resultsListDiv = document.getElementById('results-list');

var searchForm = document.getElementById('search-form');
var searchButton = document.getElementById('search-button');

var stateSelect = document.getElementById('state-select');
var citySearch = document.getElementById('city-search');
var startOverButton = document.getElementById('start-over');

var sectionOne = document.getElementById('section1');
var mapElement = document.getElementById('map');

var dateSelectDiv = document.getElementById('date-select');
var startDatePicker = document.getElementById('start-date-picker');
var endDatePicker = document.getElementById('end-date-picker');

var geocoderUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

var geocoder;
var map;
var placesService;
var openWindow;

var eventListings;
var placeListings;
var placeMarkers = [];
var venueMarkers = [];

var startDate;
var endDate;
var searchRadiusMin = 2000,
searchRadius = searchRadiusMin;

var currentLocation;
var chosenEvent;
var chosenBar;
var test= 0

document.addEventListener('DOMContentLoaded', function() {
    $('select').formSelect();
    searchForm.addEventListener('submit', submitHandler);
    startOverButton.addEventListener('click', startOver);
    $("#search-button").on('click ', findEvents);
    $(document).on('click', '.select-event-link', selectEvent);
    $(document).on('click', '.select-place-link', getChosenPlaceDetails);

    startDate = getStartDate();
    endDate = getEndDate();
    let options = M.Datepicker;
    options.minDate = new Date();
    options.format = ('mm/dd/yyyy');
    options.onSelect = parsePickerDate;
    options.container = dateSelectDiv;
    //options.onClose = setBodyOverFlow;
    startDatePicker = M.Datepicker.init(startDatePicker, options);
    endDatePicker = M.Datepicker.init(endDatePicker, options); 
    console.log(startDatePicker);
});


$("#clicker").on("click", function(){
    $("body").css({"overflow":"visible"})
    $(".line").css({
        'position': 'relative',
        'top': '50%', 
        'margin': '0 auto',  
        'border-right': '2px solid rgba(255,255,255, 0.75)', 
        'font-size': '40px',  
        'white-space': 'nowrap', 
        'overflow': 'hidden', 'transform': 'translateY(-50%)'
    })
    $(".anim-typewriter").css({
        'animation': 'typewriter 4s steps(28) 1s 1 normal both, blinkTextCursor 500ms steps(28) infinite normal'
    })
    console.log("Button Clicked")
})

function setBodyOverFlow() {
    setTimeout(() => {
        $("body").css({"overflow":"visible"});
    }, 250);
}

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
    
    if(cityInput) {
        url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + 
        "&city=" +cityInput + 
        "&stateCode=" + stateInput + 
        "&startDateTime=" + startDate +
        "&endDateTime=" + endDate + 
        "&radius=50" +
        "&unit=miles" +
        "&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    } else {
        url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + 
        "&stateCode=" + stateInput +
        "&startDateTime=" + startDate +
        "&endDateTime=" + endDate + 
        "&radius=50" +
        "&unit=miles" +
        "&apikey=A16slcgq1hEalk1fxoMzQE4ByKDVYvCS";
    }
    console.log(url);
    document.getElementById('section4').scrollIntoView();

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
    let location = JSON.parse($(this).parent().parent().attr('data-latlng'));
    let eventId = $(this).attr('data-event-id');

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

async function populateEvents(events) {
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
        await sleep(100);
    }  
    setMapBounds(venueMarkers);
}

async function populateLocations(locations) {
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }

    let ratingSort = sortPlacesByRating(locations);
    for(let i = 0; i < ratingSort.length; i++) {
        let current = ratingSort[i];
        let card = createPlaceCard(current);

        resultsListDiv.appendChild(card);
        createMapMarker(current, card, 'place');
        await sleep(100);
    }
    resultsListDiv.scrollTo(0,0);
}

async function populateUserChoices() {
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }

    console.log(chosenEvent);
    console.log(chosenBar);

    resultsListDiv.classList.remove('m6');
    resultsListDiv.classList.add('m12');
    resultsListDiv.classList.remove('cards-container');
    resultsListDiv.classList.add('details-container');
    mapElement.classList.add('hidden');

    let eventHeader = document.createElement('h3');
    eventHeader.textContent = 'Event';
    resultsListDiv.appendChild(eventHeader);

    let eventCard = createEventCard(chosenEvent, chosenEvent._embedded.venues[0], true);
    eventCard.classList.add('horizontal');
    resultsListDiv.appendChild(eventCard);

    let placeHeader = document.createElement('h3');
    placeHeader.textContent = 'After';
    resultsListDiv.appendChild(placeHeader);

    await sleep(500);

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
    container.classList.add('card');

    if(event.images[0]) {
        let eventImage = document.createElement('img');
        eventImage.setAttribute('src', event.images[0].url);
        eventImage.classList.add('event-image');
        
        container.appendChild(eventImage);
    }

    let detailsDiv = document.createElement('div');
    detailsDiv.classList.add('card-details');
    
    let a = document.createElement('p');
    a.setAttribute("data-name",event.name);
    a.textContent = event.name;
    a.classList.add('card-title');
    detailsDiv.appendChild(a);

    if(chosen && venue.name) {
        if(venue.name) {
            let venueDiv= document.createElement('p');
            venueDiv.setAttribute("data-name",venue.name);
            venueDiv.textContent = venue.name;
            detailsDiv.appendChild(venueDiv);
        }
    }
    
    if(venue.state && venue.city) {
        let location = document.createElement('p');
        location.setAttribute("data-name",venue.state.name);
        location.classList.add('event-location');
        location.textContent = venue.city.name + ', ' + venue.state.name;
        detailsDiv.appendChild(location);
    } else if (venue.state) {
        let location = document.createElement('p');
        location.setAttribute("data-name",venue.state.name);
        location.classList.add('event-location');
        location.textContent = venue.state.name;
        detailsDiv.appendChild(location);
    }
    
    if(event.dates) {
        let dateDiv = document.createElement('p');
        dateDiv.setAttribute("data-name",event.dates.start.localDate);
        dateDiv.textContent = event.dates.start.localDate;
        detailsDiv.appendChild(dateDiv);
    }

    if(!chosen) {
        detailsDiv.appendChild(document.createElement('br'));

        let selectLink = document.createElement('a');
        selectLink.setAttribute('data-event-id', event.id)
        selectLink.textContent = 'SELECT';
        selectLink.classList.add('select-event-link');
        detailsDiv.appendChild(selectLink);

        container.classList.add('result');
    } else {

        if(event.dates) {
            let timeDiv = document.createElement('p');
            timeDiv.setAttribute("data-name",event.dates.start.localTime);
            timeDiv.textContent = formatTime(event.dates.start.localTime);
            detailsDiv.appendChild(timeDiv);
        }

        if (event.priceRanges) {
            let usdRange = event.priceRanges.filter(range => range.currency === 'USD')[0];
            let priceRange = document.createElement('p');
            priceRange.textContent = '$' + usdRange.min + ' - $' + usdRange.max;
            detailsDiv.appendChild(priceRange);
        }

        detailsDiv.appendChild(document.createElement('br'));

        if(event.url) {
            let ticketSales = document.createElement('a');
            ticketSales.textContent = 'Get Tickets';
            ticketSales.setAttribute('href', event.url);
            ticketSales.setAttribute('target', '_blank');
            detailsDiv.appendChild(ticketSales);
        }

        if (event.seatmap) {
            let seatmap = document.createElement('a');
            seatmap.textContent = 'View Seats';
            seatmap.setAttribute('href', event.seatmap.staticUrl);
            seatmap.setAttribute('target', '_blank');
            detailsDiv.appendChild(seatmap);
        }
    }

    container.appendChild(detailsDiv);
    return container;
}

function createPlaceCard(current, chosen) {
    let container = document.createElement('div');
    container.classList.add('card');

    let detailsDiv = document.createElement('div');
    detailsDiv.classList.add('card-details');
    

    let name = document.createElement('p');
    name.classList.add('card-title');
    name.textContent = current.name;
    detailsDiv.appendChild(name);

    
    if (current.overall != 0 ) {
        let rating = document.createElement('p');
        rating.textContent = 'Rated: ' + current.rating;
        detailsDiv.appendChild(rating);
    }

    let address = document.createElement('p');
    address.textContent = current.vicinity;
    detailsDiv.appendChild(address);

    if(!chosen) {
        detailsDiv.appendChild(document.createElement('br'));

        let selectLink = document.createElement('a');
        selectLink.textContent = 'SELECT';
        selectLink.classList.add('select-place-link');
        selectLink.setAttribute('data-id', current.place_id);
        detailsDiv.appendChild(selectLink);

        detailsDiv.classList.add('result');
    } else {
        let phone = document.createElement('p');
        phone.textContent = current.formatted_phone_number;
        detailsDiv.appendChild(phone);

        if(current.website) {
            let website = document.createElement('a');
            website.textContent = current.website;
            website.setAttribute('href', current.website);
            website.setAttribute('target', '_blank');
            detailsDiv.appendChild(website);
        }
        
    }

    container.appendChild(detailsDiv);
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
            populateUserChoices();
        } else {
            console.error('Could not find place. ' + status);
        }
    });

}

function startOver() {
    while(resultsListDiv.firstChild) {
        resultsListDiv.removeChild(resultsListDiv.firstChild);
    }

    removeMapMarkersByType('venue');
    removeMapMarkersByType('place');

    if(resultsListDiv.classList.contains('m12')) {
        resultsListDiv.classList.remove('m12');
        resultsListDiv.classList.add('m6');
        resultsListDiv.classList.remove('details-container');
        resultsListDiv.classList.add('cards-container');
        mapElement.classList.remove('hidden');
    }
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
        if(openWindow) {
            openWindow.close();
        }
        openWindow = infoWindow;
        infoWindow.open(map, marker);
    });

    if(placeCard) {
        placeCard.addEventListener('click', function() {
            if(openWindow) {
                openWindow.close();
            }
            openWindow = infoWindow;
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

function parsePickerDate() {
    let pickerDate = new Date(this.date);
    let pickerId = this.$el[0].id;

    if(pickerId === 'start-date-picker') {
        startDate = formatDateForQuery(pickerDate, true);
        endDatePicker.options.defaultDate = pickerDate;
        endDatePicker.options.minDate = pickerDate;
        console.log(startDate);
    } else {
        endDate = formatDateForQuery(pickerDate, false);
        console.log(endDate);
    }
}

function getEndDate() {
    let today = new Date();
    let searchEndDate = today.setMonth(today.getMonth() + 2);
    return formatDateForQuery(searchEndDate, false);
}

function getStartDate() {
    let today = new Date();
    let searchStartDate = today.setMonth(today.getMonth() );
    return formatDateForQuery(searchStartDate, true);
}

function formatDateForQuery(d, start) {
    let date = new Date(d);
    let result = date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);

    if (start) {
        result += 'T05:00:00Z';
    } else {
        result += 'T23:59:59Z';
    }
    
    return result;
}

function formatDate(d) {
    let dateParts = d.split('-');
    let month = dateParts[1];
    let day = dateParts[2];
    let year = dateParts[0];

    return month + '/' + day + '/' + year;
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

function sleep (milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }