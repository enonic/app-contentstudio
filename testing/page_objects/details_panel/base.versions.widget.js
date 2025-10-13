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
    compareVersionsDiv: ".//div[@name='compare-version-checkbox']",
    publishMessageDiv: "//div[contains(@class, 'publish-message')]",
};

class BaseVersionsWidget extends Page {

    get compareVersionsButton() {
        return this.versionsWidget + lib.actionButton('Compare versions');
    }

    get compareWithCurrentVersionButton() {
        return this.versionsWidget + lib.VERSIONS_SHOW_CHANGES_BUTTON;
    }

    get restoreButton() {
        return this.versionsWidget + xpath.versionItemExpanded + "//button[child::span[text()='Restore']]";
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
            await this.handleError(`'Permissions updated' items are not displayed in the widget`, 'err_perm_updated', err);
        }
    }

    async countPermissionsUpdatedItems() {
        try {
            await this.waitForPermissionsUpdatedItemDisplayed();
            let items = await this.findElements(this.permissionsUpdatedItems);
            return items.length;
        } catch (err) {
            await this.handleError(`Error when counting 'Permissions updated' items`, 'err_perm_updated', err);
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
            await this.handleError(`'Published' items are not displayed in the widget`, 'err_published_item', err);
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
            await this.handleError(`'Unpublished' items are not displayed in the widget`, 'err_unpublished_item', err);
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

    // click on a version and expand the content-version-item
    async clickAndExpandVersion(index) {
        try {
            await this.waitForElementDisplayed(this.versionItems, appConst.mediumTimeout);
            //get clickable items:
            let items = await this.findElements(this.versionItems);
            //click on the item:
            await this.getBrowser().elementClick(items[index].elementId);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Version Widget - error during expanding version item at index: ${index}`, 'err_expand_version', err);
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
            await this.handleError(`Version Widget - error during clicking on the version : ${versionHeader}`, 'err_expand_version', err);
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
            // get clickable items:
            let locator = this.versionItemByDisplayName(versionHeader);
            let items = await this.findElements(locator);
            // click on the item:
            await items[i].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Version Widget - Version iten has been clicked : ${versionHeader}`, 'err_expand_version', err);
        }
    }

    // waits for Version Widget is loaded, Exception will be thrown after the timeout exceeded
    async waitForVersionsLoaded() {
        try {
            await this.waitForElementDisplayed(this.versionsWidget, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Version Widget was not loaded', 'err_load_versions_widget', err);
        }
    }

    // waits for Version Widget is loaded, returns false after the timeout exceeded
    isWidgetLoaded() {
        return this.waitForElementDisplayed(this.versionsWidget, appConst.mediumTimeout).catch(err => {
            return false;
        });
    }

    async waitForRestoreButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.restoreButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Restore button should not be displayed', 'err_restore_button', err);
        }
    }

    async waitForRestoreButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.restoreButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Restore button should be displayed', 'err_restore_button', err);
        }
    }

    async clickOnRestoreButton() {
        try {
            await this.waitForElementDisplayed(this.restoreButton, appConst.mediumTimeout);
            await this.clickOnElement(this.restoreButton);
            return await this.pause(2000);
        } catch (err) {
            await this.handleError(`Version Widget - clicked on 'Restore' button`, 'err_restore_button', err);
        }
    }

    async waitForRestoreButtonDisabled() {
        try {
            let res = await this.getDisplayedElements(this.restoreButton);
            await res[0].waitForEnabled({timeout: 2000, reverse: true});
            return await this.pause(appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Version Widget - Restore button should be disabled', 'err_restore_button', err);
        }
    }

    async waitForMovedItemDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.movedItems, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Versions Widget, Moved item should be displayed', 'err_moved_item', err);
        }
    }

    async waitForRenamedItemDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.renamedItems, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Versions Widget, Renamed item should be displayed', 'err_renamed_item', err);
        }
    }

    async getContentStatus() {
        let locator = this.versionsWidget + "/div[contains(@class,'status')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async moveCursorToVersionItemByHeader(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            await this.doPerformMoveToAction(versionItems[index]);
            return await this.pause(200);
        } catch (err) {
            await this.handleError(`Version Widget - moving cursor to version item: ${itemHeader}`, 'err_move_cursor_to_version', err);
        }
    }

    async waitForCompareChangesCheckboxDisplayed(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let compareVersionsDivElements = await versionItems[index].$$(xpath.compareVersionsDiv);
            await compareVersionsDivElements[0].waitForDisplayed({timeout: appConst.shortTimeout});
        } catch (err) {
            await this.handleError(`Version Widget - compare changes checkbox should be displayed: ${itemHeader}`,
                'err_compare_ch_checkbox', err);
        }
    }

    async clickOnCompareChangesCheckboxByHeader(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let buttonElements = await versionItems[index].$$(xpath.compareVersionsDiv);
            if (buttonElements.length === 0) {
                throw new Error(`No 'compare changes' checkbox found for itemHeader: ${itemHeader} at index: ${index}`);
            }
            await buttonElements[0].click();
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Versions Widget, tried to click on Show changes button...', 'err_click_on_show_changes', err);
        }
    }

    async isCompareChangesCheckboxSelectedByHeader(itemHeader, index) {
        try {
            let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let buttonElements = await versionItems[index].$$(xpath.compareVersionsDiv);
            if (buttonElements.length === 0) {
                throw new Error(`No 'compare changes' checkbox found for itemHeader: ${itemHeader} at index: ${index}`);
            }
            return await buttonElements[0].$('input').isSelected();
        } catch (err) {
            await this.handleError('Versions Widget, tried to check if Show changes checkbox is selected...', 'err_check_show_changes_selected', err);
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
            await this.handleError('Versions Widget, tried to get user name...', 'err_version_username', err);
        }
    }

    // Headers or displayNames :Created, Edited.  Permissions Updated is excluded
    versionItemByDisplayName(displayName) {
        return this.versionsWidget + xpath.versionItem + xpath.itemByDisplayName(displayName);
    }

    // Checkbox for Edited, Created, Moved, Renamed version items:
    async isCompareVersionCheckboxDisplayed(itemHeader, index) {
        let itemLocator = this.versionsWidget + xpath.anyItemByHeader(itemHeader);
        let elements = await this.findElements(itemLocator);
        let buttonElements = await elements[index].$$(xpath.compareVersionsDiv);
        let result = await buttonElements[0].isDisplayed();
        return result;
    }

    async clickOnCompareVersionsButton() {
        try {
            await this.waitForElementDisplayed(this.compareVersionsButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.compareVersionsButton);
        } catch (err) {
            await this.handleError('Version Widget - Compare versions button', 'err_compare_versions_button', err);
        }
    }

    async clickOnCancelSelectionOfVersionItemButton() {
        try {
            let locator = this.versionsWidget + `//button[contains(@class,'reset-compare-button')]`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError('Version Widget - Reset Compare versions button', 'err_cancel_selection_versions_button', err);
        }
    }
}

module.exports = BaseVersionsWidget;
