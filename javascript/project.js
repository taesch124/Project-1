var queryUrl = 'http://beermapping.com/webservice/locstate/ec947effd0571340a08a8db7eb1723a6/nj&s=json';
//const responseDiv = document.getElementById('response');
var breweryNamesDiv = document.getElementById('main-container');

function getStateResults(state) {
    console.log(queryUrl);
    $.ajax({
        url: queryUrl,
        method: 'GET'
    }).then(function(response) {
        populateNames(response);
    });
}

function populateNames(locations) {

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

            breweryNamesDiv.appendChild(container);
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

getStateResults('NJ');