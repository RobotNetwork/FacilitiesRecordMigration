(function () {
    // Explanation:
    // stores user data within Chrome's temporary storage as a custom property called "top.CustomPropStorage" (i.e. window.top.CustomPropStorage)
    // runs only if props don't exist or has been one full week since last update

    function nextWeek(storedDate) {
        // calculates the date 1 week from now
        // takes an optional argument: a previously stored date (top.whenToNextUpdateProps)
        // returns the stored date + 7 days |OR| today's date + 7 days
        var workingDate = storedDate ? new Date(storedDate) : new Date();

        var add7Days = new Date(workingDate.getFullYear(), workingDate.getMonth(), workingDate.getDate() + 7);
        return add7Days;
    }

    // used to temporarily store data about the user
    var output = {};

    function ajaxResponse(serverResponse) {

        // get custom XML elements and add it to `output`
        var data = serverResponse.responseXML.getElementsByTagName("dataPoint");

        // loop over `data`, which is an XML Object
        // as data is grabbed, add it to the `output` Object
        for (var i = 0; i < data.length; i++) {
            var name = data[i].getAttribute("name");
            var value = data[i].getAttribute("value");
            output[name] = value;
        }
        // add data to browser storage
        top.CustomPropStorage = output;
        return output;
    }

    if (typeof jQuery !== 'function')
        return;

    jQuery(document).ready(function () {

        var storage = top.CustomPropStorage;

        // only run if props haven't updated in 7+ days
        // or if stored data does not exist, or is undefined
        if (!storage || typeof storage === 'undefined' || storage.whenToNextUpdateProps > nextWeek(storage.whenToNextUpdateProps)) {

            // to get the display value of reference fields, a script include is called to pull this information
            // which is then passed back into this UI Script
            var ga = new GlideAjax("storeUserDataInBrowser");
            ga.addParam("sysparm_name", "getData");

            // submit request to server, call ajaxResponse function with server response
            ga.getXML(ajaxResponse);
        }
    });
})();