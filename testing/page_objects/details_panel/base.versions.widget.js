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
    showChangesButtonLocator: ".//button[@title='Show changes']",
    publishMessageDiv: "//div[contains(@class, 'publish-message')]",
};

class BaseVersionsWidget extends Page {

    get compareWithCurrentVersionButton() {
        return this.versionsWidget + lib.VERSIONS_SHOW_CHANGES_BUTTON;
    }

    get revertButton() {
        return this.versionsWidget + xpath.versionItemExpanded + "//button[child::span[text()='Revert']]";
    }

    //Count version items that contain 'Revert' button
    async countVersionItems() {
        let items = await this.findElements(this.versionItems);
        return items.length;
    }

    async waitForPermissionsUpdatedItemDisplayed() {
        try {
            await this.waitForElementDisplayed(this.permissionsUpdatedItems, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_perm_updated');
            throw new Error("'Permissions updated' items are not displayed in the widget, screenshot: " + screenshot + " " + err);
        }
    }

    async countPermissionsUpdatedItems() {
        try {
            await this.waitForPermissionsUpdatedItemDisplayed();
            let items = await this.findElements(this.permissionsUpdatedItems);
            return items.length;
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_perm_updated');
            throw new Error("Error when counting 'Permissions updated' items, screenshot: " + screenshot + " " + err);
        }
    }

    async countSortedItems() {
        await this.waitForElementDisplayed(this.sortedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.sortedItems);
        return items.length;
    }

    async waitForPublishedItemDisplayed() {
        try {
            await this.waitForElementDisplayed(this.publishedItems, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_published_item');
            throw new Error("'Published' items are not displayed in the widget, screenshot: " + screenshot + " " + err);
        }
    }

    async countPublishedItems() {
        await this.waitForPublishedItemDisplayed();
        let items = await this.findElements(this.publishedItems);
        return items.length;
    }

    async waitForUnpublishedItemDisplayed() {
        try {
            await this.waitForElementDisplayed(this.unpublishedItems, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_unpublished_item');
            throw new Error("'Unpublished' items are not displayed in the widget, screenshot: " + screenshot + " " + err);
        }
    }

    async countUnpublishedItems() {
        await this.waitForUnpublishedItemDisplayed();
        let items = await this.findElements(this.unpublishedItems);
        return items.length;
    }

    async countMarkedAsReadyItems() {
        await this.waitForElementDisplayed(this.markedAsReadyItems, appConst.mediumTimeout)
        let items = await this.findElements(this.markedAsReadyItems);
        return items.length;
    }

    async countMovedItems() {
        await this.waitForElementDisplayed(this.movedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.movedItems);
        return items.length;
    }

    async countRenamedItems() {
        await this.waitForElementDisplayed(this.renamedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.renamedItems);
        return items.length;
    }

    async countEditedItems() {
        await this.waitForElementDisplayed(this.editedItems, appConst.mediumTimeout)
        let items = await this.findElements(this.editedItems);
        return items.length;
    }

    async countCreatedItems() {
        await this.waitForElementDisplayed(this.createdItems, appConst.mediumTimeout)
        let items = await this.findElements(this.createdItems);
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
            let screenshot = await this.saveScreenshotUniqueName('err_expand_version');
            throw new Error(`Error occurred in Version Widget -  screenshot: ${screenshot} ` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_expand_version');
            throw new Error(`Error occurred in Version Widget -  screenshot: ${screenshot} ` + err);
        }
    }

    async getPublishMessagesFromPublishedItems() {
        await this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout);
        //get all version items with the header:
        let locator = this.versionsWidget + xpath.anyItemByHeader(appConst.VERSIONS_ITEM_HEADER.PUBLISHED) + xpath.publishMessageDiv;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
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
            let screenshot = await this.saveScreenshotUniqueName('err_expand_version');
            throw new Error(`Error occurred in Version Widget -  screenshot: ${screenshot} ` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_revert_button');
            throw new Error(`Revert button should not be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async waitForRevertButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.revertButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_revert_button');
            throw new Error(`Revert button should be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnRevertButton() {
        try {
            await this.waitForElementDisplayed(this.revertButton, appConst.mediumTimeout);
            await this.clickOnElement(this.revertButton);
            return await this.pause(2000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_revert_button');
            throw new Error("Version Widget - error when clicking on 'Revert' button, screenshot: " + screenshot + " " + err);
        }
    }

    async waitForRevertButtonDisabled() {
        try {
            let res = await this.getDisplayedElements(this.revertButton);
            await res[0].waitForEnabled({timeout: 2000, reverse: true});
            return await this.pause(appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_revert_button');
            throw new Error(`Version Widget -  'Revert' button is not disabled, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForMovedItemDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.movedItems, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_moved_item');
            throw new Error("'Moved' items are not displayed in the widget, screenshot: " + screenshot + " " + err);
        }
    }

    async waitForRenamedItemDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.renamedItems, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_renamed_item');
            throw new Error("'Renamed' items are not displayed in the widget, screenshot: " + screenshot + " " + err);
        }
    }

    async getContentStatus() {
        let locator = this.versionsWidget + "/div[contains(@class,'status')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnOnShowChangesButton(index) {
        try {
            //wait for the list of versions is loaded:
            await this.waitForElementDisplayed(this.versionsWidget + xpath.versionsList, appConst.mediumTimeout);
            let buttons = await this.findElements(this.compareWithCurrentVersionButton);
            await buttons[index].click();
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_show_changes');
            throw new Error(`Version Widget - error when clicking on Show changes button, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnShowChangesButtonByHeader(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let buttonElements = await versionItems[index].$$(xpath.showChangesButtonLocator);
            await buttonElements[0].click();
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_compare');
            throw new Error(`Version Widget - error when clicking on Show changes button, screenshot: ${screenshot} ` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_expand_version');
            throw new Error(`Error when expand the version, screenshot: ${screenshot} ` + err);
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
            let screenshot = await this.saveScreenshotUniqueName("active_version_button");
            throw new Error(`Version Widget -  'Active version' button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForActiveVersionButtonNotDisplayed() {
        try {
            let locator = xpath.versionItemExpanded + "//button[child::span[text()='Active version']]";
            await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('active_version_button');
            throw new Error(`Version Widget -  'Active version' button should not be displayed, screenshot:  ${screenshot} ` + err);
        }
    }

    async isShowChangesInVersionButtonDisplayed(itemHeader, index) {
        let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
        let elements = await this.findElements(itemLocator);
        let buttonElements = await elements[index].$$(xpath.showChangesButtonLocator);
        return buttonElements.length > 0;
    }
}

module.exports = BaseVersionsWidget;
