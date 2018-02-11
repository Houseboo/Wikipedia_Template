
/*
Copyright (c) 2016 Vizrt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

(MIT License)

*/

//Variable used in $("#results").change, findPages and setResults. Used to store all Q IDs in a search.
let dropdownOptionId = [];

/**
 * @description Use searchValue to find different results on Wikipedia. Sets variable searchResultId to the page's Q ID.
 * 				Example: The wiki page for Politics is Q7163
 * @param {String} searchValue - The string value from the input text box
 */
function findPages(searchValue) {

    let urlParameters = {action: "query", list: "search", srsearch: searchValue, format: "json"};

    $.getJSON("https://www.wikidata.org/w/api.php?callback=?", urlParameters, function (data) {

        let length = data.query.search.length;

        if(length !== 0) {

            for (let i = 0; i < length; i++) {

                let searchResultId = data.query.search[i].title;
                setResults(searchResultId);
            }
        } else {

            dropdownOptionId[0] = "";
            $('#results')[0].options[0] = new Option("No Search Results");
        }
    });
}

/**
 * @description Takes a search result ID and stores that ID inside dropdownOptionId list, and stores the
 * 				title of the page inside dropdownList as one of the options.
 * @param {String} searchResultId - ID of the Wikipedia page in the results
 */
function setResults(searchResultId) {

    let urlParameters = {action: "wbgetentities", ids: searchResultId, format: "json"};

    //Sends request to retrieve information about each individual search result
    $.getJSON("https://www.wikidata.org/w/api.php?callback=?", urlParameters, function (data) {

        try {
            //Variable dropdownOption is the title of pages that generates from the search results (i.e America or Barack Obama)
            let dropdownOption = data.entities[searchResultId].labels.en.value;

            //Variable dropdownList is set to the dropdown box where search results are stored
            let dropdownList = $('#results')[0];
            let j = dropdownList.length;

            //Reserves the first index in the dropdown box so that we can still change search results even if it's only one
            //search result. This makes it possible to still activate the "change" function further down in the code.
            if (j === 0) {

                dropdownOptionId[j] = "";
                dropdownList.options[j] = new Option("Search Results:");
                j = dropdownList.length;
            }

            //Variable dropdownOptionId is a way to store the ID value of the search result page.
            //We use this ID to access all information on the page about the subject.
            dropdownOptionId[j] = searchResultId;

            //Puts the search result title in the dropdown list
            dropdownList.options[j] = new Option(dropdownOption);
        }

        catch(e) {
            console.log("Error inside setResults function, which stores search results inside the dropdownlist.")
        }
    });
}

/**
 * @description Get request to find title of page based on Id (Q****)
 * @param {String} Id - Wikipedia page ID
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function getPage(Id, callback) {

    //Avoid unnecessary JSON calls if ID wasn't found
    if(Id !== null) {

        let urlParameters = {action: "wbgetentities", ids: Id, format: "json"};

        $.getJSON("https://www.wikidata.org/w/api.php?callback=?", urlParameters, function (data) {

            try {
                //Search for title in English
                let title = data.entities[Id].labels.en.value;
                callback(title);
            }
            catch (e) {
                console.log("Error inside getPage function. Can't find name or title of the Wikipedia page.");
                callback("unavailable");
            }
        });
    }
}

/**
 * @description Replaces all spaces with an underscore in the given string.
 * @param {String} title - Title of image
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function updateTitle(title, callback) {

    let newTitle = title.split(' ').join('_');
    callback(newTitle);
}

/**
 * @description Locates the URL of the first image inside the list of images on a Wikipedia page.
 * @param {object} data - Data with all properties of a Wikipedia page
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function findImg(data, callback) {

    try {
        let pageId = Object.keys(data.entities)[0];
        let title = data.entities[pageId].claims.P18["0"].mainsnak.datavalue.value;

        updateTitle(title, function(value) {

            let urlParameters = {action: "query", prop: "imageinfo", iiprop: "url", format: "json", titles: "File:" + value};

            $.getJSON("https://commons.wikimedia.org/w/api.php?callback=?", urlParameters, function (data) {

                let firstPage = Object.keys(data.query.pages)[0];

                let img = data.query.pages[firstPage].imageinfo["0"].url;
                callback(img);
            });
        });

    } catch(e) {
        console.log("Error inside findImg function. Can't find an URL for any images inside Wikidata for the selected Wikipedia page.");
        callback("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Wikipedia-logo-v2-en.svg/1200px-Wikipedia-logo-v2-en.svg.png");
    }
}

/**
 * @description Substrings some irrelevant letters.
 * @param {object} date - Birthdate or the date when person died
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function dateSubstring(date, callback) {

    callback(date.substring(1, 11));
}

/**
 * @description Finds birthdate of person and time of death if it exists.
 * @param {object} resultData - Data with all properties of a Wikipedia page
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function getBirthdate(resultData, callback) {

    //Sometimes a person has multiple dates for birthdate it seems. P569["0"], P569["1"], P569["2"], etc)
    //Solution used: Take last registered birthdate
    try {

        let pageId = Object.keys(resultData.entities)[0];
        let birthdateId = resultData.entities[pageId].claims.P569.length - 1;
        let birthdate = resultData.entities[pageId].claims.P569[birthdateId].mainsnak.datavalue.value.time;

        dateSubstring(birthdate, function(substringedBirthdate) {

            try {

                let deathId = resultData.entities[pageId].claims.P570.length - 1;
                let death = resultData.entities[pageId].claims.P570[deathId].mainsnak.datavalue.value.time;

                dateSubstring(death, function(substringedDeath) {

                    let birthdateAndDeath = substringedBirthdate + " - " + substringedDeath;
                    callback(birthdateAndDeath);
                });
            }
            catch(e) {
                console.log("No date found for persons time of death.");
                callback(substringedBirthdate);
            }
        });
    }

    catch(e) {
        console.log("Error inside getBirthdate function. Can't find any values for birthdate or time of death for the selected" +
            "Wikipedia page.");
        callback("unavailable");
    }
}

/**
 * @description Finds population of a country
 * @param {object} resultData - Data with all properties of a Wikipedia page
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function getPopulation(resultData, callback) {

    try {

        let pageId = Object.keys(resultData.entities)[0];

        //Property P1082 gives multiple numbers, probably being updated in a given interval.
        //Taking the property length minus one to get the latest update and stores it as populationId.
        let  populationId = resultData.entities[pageId].claims.P1082.length - 1;
        let population = resultData.entities[pageId].claims.P1082[populationId].mainsnak.datavalue.value.amount;

        callback (population);
    }
    catch(e) {
        console.log("Error inside getPopulation function. Can't find the population inside the selected Wikipedia page of a territory");
        callback("unavailable");
    }
}

/**
 * @description Finds the size of a country. Stores the number as size, and sends a new get-request through
 getPage to find the unit for that number (ie Squere Kilometres). Substrings path to ID of unit in variable unitId.
 * @param {object} resultData - Data with all properties of a Wikipedia page
 * @param {function} callback - Callback used to find value before executing the rest of the code
 */
function getSize(resultData, callback) {

    try {
        let pageId = Object.keys(resultData.entities)[0];
        let size = resultData.entities[pageId].claims.P2046["0"].mainsnak.datavalue.value.amount;
        let unitId = resultData.entities[pageId].claims.P2046["0"].mainsnak.datavalue.value.unit;
        let substringedUnitId = unitId.substring(31, unitId.length);

        getPage(substringedUnitId, function(unit) {

            let sizeAndUnit = size + " " + unit;

            callback(sizeAndUnit);
        });
    }
    catch(e) {
        console.log("Error inside getSize function. Can't find the size and a unit of that size for a subject inside the " +
            "selected Wikipedia page");
        callback("unavailable");
    }
}

(function($) {

    $(document).ready(function() {

        let pl = vizrt.payloadhosting;

        pl.initialize();

        /**
         * @description Makes it possible to press enter to get search results, instead of clicking the search button.
         */
        $("#searchInput").keyup(function(event) {
            if (event.keyCode === 13) {
                $("#search.btn").click();
            }
        });

        /**
         * @description Clears everything when the clear button is clicked.
         */
        $("#clear.btn").on("click", function() {

            $("#searchInput").val("");
            $("#results").empty();
            pl.setFieldText("wiki/author", "");
            pl.setFieldText("wiki/info1", "");
            pl.setFieldText("wiki/info2", "");
            pl.setFieldText("wiki/info3", "");
            pl.setFieldText("wiki/title", "");
            $("#image").attr("src", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Wikipedia-logo-v2-en.svg/1200px-Wikipedia-logo-v2-en.svg.png");
        });

        /**
         * @description Triggers a new search based on category when category is changed
         */
        $("#category").change(function() {

            $('#results').trigger('change');
        });

        /**
         * @description Everything inside this click method happens when you press the search button in TemplateBuilder.
         */
        $("#search.btn").on("click", function() {

            //Sets variable searchValue equals to the string input from the user.
            let searchValue = $("#searchInput").val();

            if (searchValue !== "") {

                //Empties the results if there has been searched for something else before.
                $("#results").empty();
                findPages(searchValue);
            }
        });

        /**
         * @description Function runs when you select one of the search results in the dropdownlist.
         */
        $("#results").change(function() {

            //Variable selctedIndex is the index of the selected option in the dropdown list
            let selectedIndex = document.getElementById('results').selectedIndex;

            //Doesn't do anything if the first index is chosen (Search Results:)
            if (selectedIndex !== 0) {

                let urlParameters = {action: "wbgetentities", ids: dropdownOptionId[selectedIndex], format: "json"};

                //Uses variable dropdownOptionId with selectedIndex to find the ID of the wiki article page of the selected search result.
                //All methods after this uses the results from the ID (resultData) to access the information they want, IF it has been created by Wikipedia.
                //To learn more about how this works, read the wikipedia_readme.txt file in the folder.
                $.getJSON("https://www.wikidata.org/w/api.php?callback=?", urlParameters, function (resultData) {

                    //This is just to show the user the data so that they can navigate themselves. Can be removed.
                    console.log(resultData);

                    let pageId = Object.keys(resultData.entities)[0];

                    let selectedCategory = $("#category").val();

                    try {
                        //Sets the first field name to the selected Wikipedia-page title.
                        pl.setFieldText("wiki/author", $('#results')[0].options[selectedIndex].value);
                    }
                    catch(e) {
                        console.log("No search results are selected");
                    }

                    findImg(resultData, function(value) {

                        $("#image").attr("src", value);
                    });

                    //Following methods are used to find information about a person.
                    if (selectedCategory === "person") {

                        getBirthdate(resultData, function(value) {

                            pl.setFieldText("wiki/info1", "Birthdate: " + value);
                        });

                        try {
                            let genderId = resultData.entities[pageId].claims.P21["0"].mainsnak.datavalue.value.id;
                            getPage(genderId, function(value) {

                                pl.setFieldText("wiki/info2", "Gender: " + value);
                            });
                        }
                        catch(e) {
                            console.log("Can't find an ID of property 21 (gender) inside Wikidata of the selected Wikipedia page.");
                            pl.setFieldText("wiki/info2", "Gender: unavailable");
                        }

                        try {
                            let citizenshipId = resultData.entities[pageId].claims.P27["0"].mainsnak.datavalue.value.id;
                            getPage(citizenshipId, function(value) {

                                pl.setFieldText("wiki/info3", "Citizenship: " + value);
                            });
                        }
                        catch(e) {
                            console.log("Can't find an ID of property 27 (citizenship) inside Wikidata of the selected Wikipedia page.");
                            pl.setFieldText("wiki/info3", "Citizenship: unavailable");
                        }

                        try {
                            let fieldOfWorkId = resultData.entities[pageId].claims.P106["0"].mainsnak.datavalue.value.id;
                            getPage(fieldOfWorkId, function(value) {

                                pl.setFieldText("wiki/title", "Field of Work: " + value);
                            });
                        }
                        catch(e) {
                            console.log("Can't find an ID of property 106 (field of work) inside Wikidata of the selected Wikipedia page.");
                            pl.setFieldText("wiki/title", "Field of Work: unavailable");
                        }

                        //Following methods are used to find information about a country
                    } else if (selectedCategory === "country") {

                        getPopulation(resultData, function(value) {

                            pl.setFieldText("wiki/info1", "Population: " + value);
                        });

                        getSize(resultData, function(value) {

                            pl.setFieldText("wiki/info2", "Size: " + value);
                        });

                        //Trying to find currency in given country. Find ID for the currency, and send a new get-request through getPage
                        try {

                            let currencyId = resultData.entities[pageId].claims.P38["0"].mainsnak.datavalue.value.id;
                            getPage(currencyId, function(value) {

                                pl.setFieldText("wiki/info3", "Currency: " + value);
                            });
                        }
                        catch(e) {
                            console.log("Can't find an ID of property 38 (currency) inside Wikidata of the selected Wikipedia page.");
                            pl.setFieldText("wiki/info3", "Currency: unavailable");
                        }

                        //Trying to find which continent the given country is placed in (i.e Europe).
                        try {
                            let partOfContinentId = resultData.entities[pageId].claims.P30["0"].mainsnak.datavalue.value.id;
                            getPage(partOfContinentId, function(value) {

                                pl.setFieldText("wiki/title", "Part of Continent: " + value);
                            });
                        }
                        catch(e) {
                            console.log("Can't find an ID of property 30 (part of continent) inside Wikidata of the selected Wikipedia page.");
                            pl.setFieldText("wiki/title", "Part of Continent: unavailable");
                        }

                    }

                    //Continue with more else if methods here if you want to add more categories. Remember to add an option in the HTML file under "category".
                    //else if (selectedCategory === ***) {

                });

            }

        });

    });

})(jQuery);