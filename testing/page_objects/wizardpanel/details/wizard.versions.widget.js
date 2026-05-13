/**
 * Created on 30/07/2018.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');


class WizardVersionsWidget extends BaseVersionsWidget {

    constructor() {
        super();
        this._parentElement = "//div[contains(@id,'ContentWizardPanel')]";
    }

    //Gets items with all headers - Edited, Sorted, Marked as Ready,Created...
}

module.exports = WizardVersionsWidget;
