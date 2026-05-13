/**
 * Created on 28/02/2020.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

class BrowseVersionsWidget extends BaseVersionsWidget {

    constructor() {
        super();
        this._parentElement = "//div[contains(@id,'ContentBrowsePanel')]";
    }
}

module.exports = BrowseVersionsWidget;
