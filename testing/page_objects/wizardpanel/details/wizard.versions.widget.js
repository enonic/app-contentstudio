/**
 * Created on 30/07/2018.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const xpath = {
    widget: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'VersionsWidgetItemView')]`,
    versionsList: `//ul[contains(@id,'VersionList')]`,
    versionItem: `//li[contains(@class,'content-version-item')]`,
};

class WizardVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return xpath.widget;
    }

    get versionItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionItem;
    }
};
module.exports = WizardVersionsWidget;

