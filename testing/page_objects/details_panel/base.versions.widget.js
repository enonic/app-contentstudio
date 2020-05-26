/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    versionsList: `//ul[contains(@id,'VersionsView')]`,
    versionItem: `//li[contains(@class,'content-version-item')]`,
    versionItemExpanded: `//li[contains(@class,'content-version-item expanded')]`,
};

class BaseVersionsWidget extends Page {

    get compareWithCurrentVersionButton() {
        return this.versionsWidget + lib.COMPARE_WITH_CURRENT_VERSION;
    }

    //click on a version and expand the content-version-item
    clickAndExpandVersion(index) {
        return this.waitForElementDisplayed(this.versionItems, 2000).then(() => {
            return this.findElements(this.versionItems);
        }).then(items => {
            return this.getBrowser().elementClick(items[index].elementId);
        }).catch(err => {
            throw new Error("Version Widget - error when clicking on version " + err);
        }).then(() => {
            return this.pause(400);
        })
    }

    //waits for Version Widget is loaded, Exception will be thrown after the timeout exceeded
    waitForVersionsLoaded() {
        return this.waitForElementDisplayed(this.versionsWidget, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_load_versions_widget");
            throw new Error('Version Widget was not loaded in ' + appConst.TIMEOUT_2);
        });
    }

    //waits for Version Widget is loaded, returns false after the timeout exceeded
    isWidgetLoaded() {
        return this.waitForElementDisplayed(this.versionsWidget, appConst.TIMEOUT_2).catch(err => {
            return false;
        });
    }

    async clickOnRevertButton() {
        try {
            let selector = xpath.versionItemExpanded + "//button/span[text()='Revert']";
            await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
            await this.clickOnElement(selector);
            return await this.pause(2000);
        } catch (err) {
            throw new Error("Version Widget - error when clicking on 'Restore' button " + err);
        }
    }

    async waitForVersionItemPublished(index) {
        try {
            await this.waitForElementDisplayed(this.versionItems, 2000);
            let elements = await this.findElements(this.versionItems);
            await this.getBrowser().waitUntil(async () => {
                let result = await elements[index].getAttribute("class");
                return result.includes('online');
            }, appConst.TIMEOUT_3);
        } catch (err) {
            this.saveScreenshot("err_wait_for_published_status");
            throw new Error("Version Panel - error when waiting for published status: " + err);
        }
    }

    async isEditButtonDisplayed(index) {
        try {
            await this.waitForElementDisplayed(this.versionItems, 2000);
            let elements = await this.findElements(this.versionItems);
            let result = await elements[index].$$(".//button/span[text()='Edit']");
            return result.length > 0;
        } catch (err) {
            this.saveScreenshot("err_versions_widget_active_version");
            throw new Error("Version Panel - error when trying to find 'Edit' button: " + err);
        }
    }

    async clickOnEditButton() {
        await this.waitForElementDisplayed(this.versionItems, 2000);
        let elements = await this.findElements(this.versionItems);
        let result = await elements[0].$$(".//button/span[text()='Edit']");
        if (!result.length) {
            this.saveScreenshot("err_versions_widget_edit_button_not_found");
            throw new Error("Versions Widget - Edit button was not found!");
        }
        return await result[0].click();
    }

    async getContentStatus(index) {
        let elements = await this.findElements(this.versionItems);
        let statusElements = await elements[index].$$("./div[contains(@class,'status')]");
        if (statusElements.length === 0) {
            return ""
        }
        return await statusElements[0].getText();
    }

    async clickOnCompareWithCurrentVersionButton(index) {
        try {
            //wait for the list of versions is loaded:
            await this.waitForElementDisplayed(this.versionsWidget + xpath.versionsList, appConst.TIMEOUT_2);
            let elements = await this.findElements(this.compareWithCurrentVersionButton);
            await elements[index].click();
            return await this.pause(400);
        } catch (err) {
            throw new Error("Version Widget - error when clicking on CompareWithCurrentVersionButton " + err);
        }
    }
};
module.exports = BaseVersionsWidget;


