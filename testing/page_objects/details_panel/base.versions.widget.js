/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionItemExpanded: "//li[contains(@class,'version-list-item expanded')]",
    versionItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action')) ] and not(descendant::h6[contains(.,'Permissions updated')])]",
    itemByDisplayName: displayName => `${lib.itemByDisplayName(displayName)}`,
    anyItemByHeader: header => `//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'${header}')]]`,
    compareWithCurrentVersionButtonLocator: ".//button[@title='Compare with current version']",
};

class BaseVersionsWidget extends Page {

    get compareWithCurrentVersionButton() {
        return this.versionsWidget + lib.COMPARE_WITH_CURRENT_VERSION;
    }

    get revertButton() {
        return this.versionsWidget + xpath.versionItemExpanded + "//button[child::span[text()='Revert']]";
    }

    //Count version items that contain 'Revert' button
    async countVersionItems() {
        let items = await this.findElements(this.versionItems);
        return items.length;
    }

    async countPermissionsUpdatedItems() {
        await this.waitForElementDisplayed(this.permissionsUpdatedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.permissionsUpdatedItems);
        return items.length;
    }

    async countSortedItems() {
        await this.waitForElementDisplayed(this.sortedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.sortedItems);
        return items.length;
    }

    async countChangedItems() {
        await this.waitForElementDisplayed(this.changedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.changedItems);
        return items.length;
    }

    //click on a version and expand the content-version-item
    async clickAndExpandVersion(index) {
        try {
            await this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout);
            //get clickable items:
            let items = await this.findElements(this.versionItems);
            //click on the item:
            await this.getBrowser().elementClick(items[index].elementId);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_expand_version"));
            throw new Error("Version Widget - error when clicking on the version " + err);
        }
    }

    //get all version items with the header then click on required item:
    async clickOnVersionItemByHeader(versionHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            await this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout);
            //get all version items with the header:
            let locator = xpath.anyItemByHeader(versionHeader);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            let items = await this.findElements(locator);
            //click on the item:
            await items[i].click();
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_expand_version"));
            throw new Error("Error when expand the version: " + err);
        }
    }

    async clickAndExpandVersionItemByHeader(versionHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            await this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout);
            //get clickable items:
            let locator = this.versionItemByDisplayName(versionHeader);
            let items = await this.findElements(locator);
            //click on the item:
            await items[i].click();
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_expand_version"));
            throw new Error("Error when expand the version: " + err);
        }
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

    async waitForRevertButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.revertButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_revert_button"));
            throw new Error("Revert button should not be displayed! " + err);
        }
    }

    async waitForRevertButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.revertButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_revert_button"));
            throw new Error("Revert button should be displayed! " + err);
        }
    }

    async clickOnRevertButton() {
        try {
            await this.waitForElementDisplayed(this.revertButton, appConst.mediumTimeout);
            await this.clickOnElement(this.revertButton);
            return await this.pause(2000);
        } catch (err) {
            throw new Error("Version Widget - error when clicking on 'Revert' button " + err);
        }
    }

    async waitForRevertButtonDisabled() {
        try {
            let res = await this.getDisplayedElements(this.revertButton);
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
            let buttons = await this.findElements(this.compareWithCurrentVersionButton);
            await buttons[index].click();
            return await this.pause(400);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_click_on_compare"));
            throw new Error("Version Widget - error when clicking on CompareWithCurrentVersionButton " + err);
        }
    }

    async clickOnCompareWithCurrentVersionButtonByHeader(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let buttonElements = await versionItems[index].$$(xpath.compareWithCurrentVersionButtonLocator);
            await buttonElements[0].click();
            return await this.pause(200);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_click_on_compare"));
            throw new Error("Version Widget - error when clicking on CompareWithCurrentVersionButton " + err);
        }
    }

    async getUserNameInItemByHeader(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let locator = ".//p[contains(@class,'xp-admin-common-sub-name')]";
            let elements = await versionItems[index].$$(locator);
            return await elements[0].getText();
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_expand_version"));
            throw new Error("Error when expand the version: " + err);
        }
    }

    // Headers or displayNames :Created, Edited.  Permissions Updated is excluded
    versionItemByDisplayName(displayName) {
        return this.versionsWidget + xpath.versionItem + xpath.itemByDisplayName(displayName);
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

    async isCompareWithCurrentVersionButtonDisplayed(itemHeader, index) {
        let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
        let elements = await this.findElements(itemLocator);
        let buttonElements = await elements[index].$$(xpath.compareWithCurrentVersionButtonLocator);
        return buttonElements.length > 0;
    }
}

module.exports = BaseVersionsWidget;
