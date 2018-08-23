const express = require('express');
const router = express.Router();

// import required npm modules
const colors = require('colors'); // For colorising text logged to the console
const moment = require('moment'); // For date and time
const fs = require('fs'); // For accessing the file system
const httpreq = require('request'); // For making http requests
const cheerio = require('cheerio'); // Cheerio takes raw HTML, parses it, and returns a jQuery object so you may traverse the DOM


router.get('/', (req, res) => {
  // global variables
  const today = moment().local().format("YYYY-MM-DD");  // get today's date in the local time zone
  const timeNow = moment().local().format("h:mm:ssa");  // get the current time in the local time zone
  const baseURL = "http://shirts4mike.com/"; // base URL which is common to all pages we want to scrape
  const errorFile = "scraper-error.log"; // name of file where errors will be logged
  let errorMessage; // variable for storing an error message
  const dataForCSV = []; // empty array for storing the data for creating the CSV file
  dataForCSV.push([['Title'], ['Price'], ['ImageURL'], ['URL'], ['Time']]); // add the headers


  // http request to the Single Entry Point webpage then loop over each shirt page to populate a csv file
  httpreq(`${baseURL}shirts.php`, function (error, response, body) {
    if (error !== null) {
      errorMessage = `There's been an error; cannot connect to ${error.host}`;
      console.log(errorMessage.red);
    } else if (response.statusCode == 200) {
      console.log(`Good news! Connected to ${baseURL}shirts.php, the csv file is in the "data" sub-directory.`.green);
      // use Cheerio to get the html from the body of the Single Entry Point webpage
      // $ convention per jQuery
      const $ = cheerio.load(body);
      // select all <a> elements whose href attribute starts with 'shirt.php?id=10'
      // each one is a link to a 'shirt page' that needs scraping
      const shirtPageLinks = $("a[href^='shirt.php?id=10']");
      let counter = 0;
      const numberOfShirts = shirtPageLinks.length;
      // for each page, use Cheerio again to access the html of the page, and scrape the data we need from it

      shirtPageLinks.each(function () {
        const shirtURL = baseURL + $(this).attr('href');

        let p = new Promise(
          function (resolve, reject) {
            httpreq(shirtURL, function (error, response, body) {
              const $ = cheerio.load(body);
              const price = $('span.price').text().trim();
              const title = $('title').text().replace(',', ' -');
              const url = shirtURL;
              const imageElement = $("img[src^='img/shirts/shirt']");
              const imgURL = baseURL + imageElement.attr('src');
              const time = moment().local().format("HH:mm");
              // if resolved, return the 5 data items, otherwise return an error message
              resolve([[title], [price], [imgURL], [url], [time]]);
              reject(`Error getting data from ${shirtURL}`);
            }); // end of httpreq
          }); // end of Promise p

        p
          .then(function (result) {
            dataForCSV.push(result);
            counter += 1;
            // render the HTML template only when all the shirt pages have been scraped
            if (counter === numberOfShirts) {
              res.render('main', { data: dataForCSV });
            }
          })
          .catch(function (error) {
            console.log(error);
          });

      }); // end of .each function


    } else {
      errorMessage = `There's been a ${response.statusCode} error when trying to connect to ${baseURL}`;
      console.log(errorMessage.red);
    }

    // if there was an error, append the appropriate error message to the "errorFile"
    if (error !== null || response.statusCode !== 200) {
      fs.appendFileSync(`${errorFile}`, `${today} ${timeNow}: ${errorMessage}\n`);
    }

  }); // end of httpreq to Single Entry Point webpage

}); // end of GET '/' route

module.exports = router;


