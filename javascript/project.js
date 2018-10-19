var queryUrl = 'http://beermapping.com/webservice/locstate/ec947effd0571340a08a8db7eb1723a6/nj&s=json';
//const responseDiv = document.getElementById('response');
var breweryNamesDiv = document.getElementById('names');

function getStateResults(state) {
    console.log(queryUrl);
    $.ajax({
        url: queryUrl,
        method: 'GET'
    }).then(function(response) {
        console.log(response);
        //$('#response').text(JSON.stringify(response));
        populateNames(response);
    });
}

function populateNames(locations) {
    for(let i = 0; i < locations.length; i++) {
        if(locations[i].status = 'Brewery') {
            let name = document.createElement('p');
            name.textContent = locations[i].name;
            breweryNamesDiv.appendChild(name);
        }
    }
}

getStateResults('NJ');