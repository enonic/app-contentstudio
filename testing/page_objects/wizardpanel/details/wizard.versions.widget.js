/**
 * Created on 30/07/2018.
 */
const baseVersionsWidget = require('../../details_panel/base.versions.widget');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'VersionsWidgetItemView')]`,
    versionsList: `//ul[contains(@id,'VersionsView')]`,
    versionItem: `//li[contains(@class,'content-version-item')]`,
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
    //waits for Version Widget is loaded, Exception will be thrown after the timeout exceeded
    waitForVersionsLoaded: {
        value: function () {
            return this.waitForVisible(this.versionsWidget, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Content Wizard: Version Widget was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
    //waits for Version Widget is loaded, returns false after the timeout exceeded
    isWidgetLoaded: {
        value: function () {
            return this.waitForVisible(this.versionsWidget, appConst.TIMEOUT_2).catch(err => {
                return false;
            });
        }
    },
    clickOnRestoreThisVersion: {
        value: function () {
            let selector = xpath.versionItem + "//button";
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getDisplayedElements(selector)
            }).then(result => {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).catch(err => {
                throw new Error("Version Widget - error when clicking on 'Restore Version' button " + err);
            });
        }
    }
});
module.exports = wizardVersionsWidget;


