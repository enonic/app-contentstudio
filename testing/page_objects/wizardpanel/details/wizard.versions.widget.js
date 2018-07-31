/**
 * Created on 30/07/2018.
 */
const baseVersionsWidget = require('../../details_panel/base.versions.widget');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'VersionsWidgetItemView')]`,
    versionsList: `//ul[contains(@id,'VersionsView')]`,
    versionItem: `/li[contains(@class,'content-version-item')]`,
};
const wizardVersionsWidget = Object.create(baseVersionsWidget, {

    versionsWidget: {
        get: function () {
            return `${xpath.widget}`;
        }
    },
    versionItems: {
        get: function () {
            return this.versionsWidget + `${xpath.versionsList}` + `${xpath.versionItem}`;
        }
    },
    isWidgetVisible: {
        value: function () {
            return this.isVisible(xpath.widget);
        }
    },
    waitForVersionsLoaded: {
        value: function () {
            return this.waitForVisible(this.versionsWidget, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Content Wizard: Version Widget was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
});
module.exports = wizardVersionsWidget;


