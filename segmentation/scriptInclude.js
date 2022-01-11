var storeUserDataInBrowser = Class.create();
storeUserDataInBrowser.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getData: function () {
        var userDetails = new GlideRecord('sys_user');
        userDetails.addQuery('sys_id', gs.getUserID());
        userDetails.query();

        while (userDetails.next()) {
            var city = userDetails.city.getDisplayValue();
            var company = userDetails.company.getDisplayValue();
            var cost_center = userDetails.cost_center.getDisplayValue();
            var location = userDetails.location.getDisplayValue();
            var manager = userDetails.manager.getDisplayValue();
            var department = userDetails.department.getDisplayValue();
            var name = userDetails.name.getDisplayValue();
            var workdayID = userDetails.employee_number.getDisplayValue();
            var title = userDetails.title.getDisplayValue();
            var roles = userDetails.roles.getDisplayValue();
            var email = userDetails.email.getDisplayValue();
            var whenToNextUpdateProps = this._nextWeek();
        }

        this._addData("city", city, "dataPoint");
        this._addData("company", company, "dataPoint");
        this._addData("cost_center", cost_center, "dataPoint");
        this._addData("location", location, "dataPoint");
        this._addData("manager", manager, "dataPoint");
        this._addData("department", department, "dataPoint");
        this._addData("name", name, "dataPoint");
        this._addData("workdayID", workdayID, "dataPoint");
        this._addData("title", title, "dataPoint");
        this._addData("roles", roles, "dataPoint");
        this._addData("email", email, "dataPoint");
        this._addData("whenToNextUpdateProps", whenToNextUpdateProps, "dataPoint");
    },

    _addData: function (name, value, dataPoint) {
        var data = this.newItem(dataPoint);
        data.setAttribute("name", name);
        data.setAttribute("value", value);
    },

    _nextWeek: function (storedDate) {
        // calculates the date 1 week from now
        // takes an optional argument: a previously stored date (top.whenToNextUpdateProps)
        // returns storedDate + 7 days OR today's date + 7 days
        var workingDate = storedDate ? new Date(storedDate) : new Date();

        var add7Days = new Date(workingDate.getFullYear(), workingDate.getMonth(), workingDate.getDate() + 7);
        return add7Days;
    },

    type: 'storeUserDataInBrowser'
});