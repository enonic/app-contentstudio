/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionItemExpanded: "//li[contains(@class,'version-list-item expanded')]",
    versionItem: "//li[contains(@class,'version-list-item') and not(contains(@class,'publish-action'))]",
    versionItemByDisplayName: displayName => `${lib.itemByDisplayName(displayName)}`,
};

class BaseVersionsWidget extends Page {

    get compareWithCurrentVersionButton() {
        return this.versionsWidget + lib.COMPARE_WITH_CURRENT_VERSION;
    }

    async countVersionItems() {
        let items = await this.findElements(xpath.versionItem);
        return items.length;
    }

    //click on a version and expand the content-version-item
    clickAndExpandVersion(index) {
        return this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout).then(() => {
            return this.findElements(this.versionItems);
        }).then(items => {
            return this.getBrowser().elementClick(items[index].elementId);
        }).catch(err => {
            throw new Error("Version Widget - error when clicking on version " + err);
        }).then(() => {
            return this.pause(400);
        })
    }

    async clickAndExpandVersionByName(versionDislayName) {
        await this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout);
        let locator = this.versionItemByDisplayName(versionDislayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    //waits for Version Widget is loaded, Exception will be thrown after the timeout exceeded
    waitForVersionsLoaded() {
        return this.waitForElementDisplayed(this.versionsWidget, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_load_versions_widget");
            throw new Error('Version Widget was not loaded in ' + appConst.mediumTimeout + " " + err);
        });
    }

    //waits for Version Widget is loaded, returns false after the timeout exceeded
    isWidgetLoaded() {
        return this.waitForElementDisplayed(this.versionsWidget, appConst.mediumTimeout).catch(err => {
            return false;
        });
    }

    async clickOnRevertButton() {
        try {
            let selector = xpath.versionItemExpanded + "//button/span[text()='Revert']";
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(2000);
        } catch (err) {
            throw new Error("Version Widget - error when clicking on 'Revert' button " + err);
        }
    }

    async waitForRevertButtonDisabled() {
        try {
            let selector = xpath.versionItemExpanded + "//button[child::span[text()='Revert']]";
            let res = await this.getDisplayedElements(selector);
            await res[0].waitForEnabled({timeout: 2000, reverse: true});
            return await this.pause(appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Version Widget -  'Revert' button is not disabled " + err);
        }
    }

    async waitForPublishedWidgetItemVisible() {
        return await this.waitForElementDisplayed(this.publishActionItems, appConst.mediumTimeout);
    }

    async getContentStatus() {
        let locator = this.versionsWidget + "/div[contains(@class,'status')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnCompareWithCurrentVersionButton(index) {
        try {
            //wait for the list of versions is loaded:
            await this.waitForElementDisplayed(this.versionsWidget + xpath.versionsList, appConst.mediumTimeout);
            let elements = await this.findElements(this.compareWithCurrentVersionButton);
            await elements[index].click();
            return await this.pause(400);
        } catch (err) {
            throw new Error("Version Widget - error when clicking on CompareWithCurrentVersionButton " + err);
        }
    }

    versionItemByDisplayName(displayName) {
        return this.versionsWidget + xpath.versionsList + xpath.versionItemByDisplayName(displayName);
    }

    async waitForActiveVersionButtonDisplayed() {
        try {

            let locator = xpath.versionItemExpanded + "//button[child::span[text()='Active version']]";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot("active_version_button");
            throw new Error("Version Widget -  'Active version' button is not displayed " + err);
        }
    }

    async waitForActiveVersionButtonNotDisplayed() {
        try {
            let locator = xpath.versionItemExpanded + "//button[child::span[text()='Active version']]";
            await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot("active_version_button");
            throw new Error("Version Widget -  'Active version' button should not be displayed " + err);
        }
    }
}

module.exports = BaseVersionsWidget;


