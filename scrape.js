var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

// store presidents and dates of death in an Object, used as a dictionary
var presidents = new Object();

app.get('/scrape', function(req, res) {
    // The OG President
    page = "https://en.wikipedia.org/wiki/George_Washington";
    make_request(page);
    res.send('Check Terminal for output');
});

function make_request(url) {
    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
    request(url, function(error, response, html) {
        // check to make sure no errors occurred when making the request
        if(!error) {
            // utilize the cheerio library on the returned html which will essentially give us jQuery functionality
            var $ = cheerio.load(html);

            // get name
            name = $('table.infobox.vcard').first().find('span.fn').text();

            // get death date
            date = $('span.dday.deathdate').first().text();

            // store president and date
            presidents[name] = date;

            // iterate through rows of table
            var rows = $('table.infobox.vcard').find("tr");
            for (var i = 0; i < rows.length; i++) {
                // if last president, write all to file
                if ($(rows[i]).children('th').text().indexOf("President of the United States") > -1) {
                    if ($(rows[i+1]).children('td').text().indexOf("Incumbent") > -1) {
                        create_output();
                        break; // exit loop; last president has been found
                    }
                }
                // otherwise, navigate to next president
                if ($(rows[i]).children('th').text() === "Succeeded by") {
                    display_progress();
                    next_pres_href = $(rows[i]).children('td').first().children('a').first().attr('href');
                    page = "https://en.wikipedia.org" + next_pres_href;
                    make_request(page);
                    break; // exit loop; first instance is what we're looking for
                }
            }
        }
    });
}

// just displays " working..." with progressive ellipsis
function display_progress() {
    if ( typeof display_progress.counter == 'undefined' ) {
        display_progress.counter = 0;
    }
    display_progress.counter++;
    process.stdout.write(" working"
        + function(){
            var ellipsis = "";
            for (var i = 0; i < display_progress.counter % 4; i++) {
                ellipsis += ".";
            }
            return ellipsis;
        }()
        + "   "  // add spaces to clear previous periods
        + "\r"); // add return carriage to move cursor to the beginning of the line
}

function create_output() {
    fs.writeFile("presideaths.json", JSON.stringify(presidents, null, 4), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Data saved in presideaths.json");
        process.exit();
    });
}

app.listen('8081');
console.log('Open your port 8081');
exports = module.exports = app;
