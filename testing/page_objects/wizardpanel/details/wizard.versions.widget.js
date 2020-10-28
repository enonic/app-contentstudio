/**
 * Created on 30/07/2018.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action'))]]",
    publishActionItems: "//li[contains(@class,'version-list-item')and child::div[contains(@class,'publish-action')]]",

};

class WizardVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return xpath.widget;
    }

    get versionItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionItem;
    }

    get publishActionItems() {
        return this.versionsWidget + xpath.versionsList + xpath.publishActionItems;
    }

}
module.exports = WizardVersionsWidget;
