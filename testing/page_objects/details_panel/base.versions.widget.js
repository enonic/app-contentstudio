/**
 * Created on 04/07/2018. updated on 12.05.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {BUTTONS} = require('../../libs/elements');

const xpath = {
    extensionViewDiv: "//div[contains(@id,'ExtensionView') and contains (@class,'versions-widget')]",
    versionsListComponent: "//div[@data-component='VersionsListContent']",
    versionsListItemComponent: "//div[@data-component='VersionsListItem']",
    versionsListItemByName: name => {
       return  `//div[@data-component='VersionsListItem' and descendant::span[contains(.,'${name}')]]`
    },
    versionItemExpanded: "//div[@data-component='VersionsListItem' and descendant::button[@aria-label='Restore']]",
    publishMessageDiv: "//div[contains(@class, 'publish-message')]",
    selectionToolbar: "//div[@data-component='VersionSelectionToolbar']",
    // Compare checkbox inside a version item (relative locator, the input itself is hidden):
    compareCheckboxDiv: ".//div[@data-component='Checkbox']",
};

class BaseVersionsWidget extends Page {

    get extensionView() {
        return this._parentElement + xpath.extensionViewDiv;
    }

    get showChangesButton() {
        return this.extensionView + BUTTONS.buttonByLabel('Show changes');
    }

    get versionItems() {
        return this.extensionView + xpath.versionsListItemComponent;
    }

    get publishedItems() {
        return this.extensionView + xpath.versionsListItemByName('Published');
    }

    get markedAsReadyItems() {
        return this.extensionView + xpath.versionsListItemByName('Marked as ready');
    }

    get unpublishedItems() {
        return this.extensionView + xpath.versionsListItemByName('Unpublished');
    }

    //Gets items with headers - Sorted
    get sortedItems() {
        return this.extensionView + xpath.versionsListItemByName('Sorted');
    }

    get editedItems() {
        return this.extensionView + xpath.versionsListItemByName('Edited');
    }

    get createdItems() {
        return this.extensionView + xpath.versionsListItemByName('Created');
    }

    get permissionsUpdatedItems() {
        return this.extensionView + xpath.versionsListItemByName('Permissions updated');
    }

    get movedItems() {
        return this.extensionView + xpath.versionsListItemByName('Moved');
    }

    get renamedItems() {
        return this.extensionView + xpath.versionsListItemByName('Renamed');
    }

    get restoreButton() {
        return this.extensionView + xpath.versionItemExpanded + BUTTONS.buttonByLabel('Restore');
    }

    // 'Show changes' button in the selection toolbar (gets visible when versions are selected for comparing):
    get showChangesButton() {
        return this.extensionView + xpath.selectionToolbar + BUTTONS.buttonByLabel('Show changes');
    }

    // 'Cancel' button in the selection toolbar - resets the selection of versions:
    get cancelSelectionButton() {
        return this.extensionView + xpath.selectionToolbar + BUTTONS.buttonByLabel('Cancel');
    }

    //Count version items that contain 'Revert' button
    async countVersionItems() {
        let items = await this.findElements(this.versionItems);
        return items.length;
    }

    async waitForPermissionsUpdatedItemDisplayed() {
        try {
            await this.waitForElementDisplayed(this.permissionsUpdatedItems);
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
        await this.waitForElementDisplayed(this.sortedItems);
        let items = await this.findElements(this.sortedItems);
        return items.length;
    }

    async waitForPublishedItemDisplayed() {
        try {
            await this.waitForElementDisplayed(this.publishedItems);
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
            await this.waitForElementDisplayed(this.unpublishedItems);
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
        await this.waitForElementDisplayed(this.markedAsReadyItems);
        let items = await this.findElements(this.markedAsReadyItems);
        return items.length;
    }

    async countMovedItems() {
        await this.waitForElementDisplayed(this.movedItems);
        let items = await this.findElements(this.movedItems);
        return items.length;
    }

    async countRenamedItems() {
        await this.waitForElementDisplayed(this.renamedItems);
        let items = await this.findElements(this.renamedItems);
        return items.length;
    }

    async countEditedItems() {
        await this.waitForElementDisplayed(this.editedItems);
        let items = await this.findElements(this.editedItems);
        return items.length;
    }

    async countCreatedItems() {
        await this.waitForElementDisplayed(this.createdItems);
        let items = await this.findElements(this.createdItems);
        return items.length;
    }

    // click on a version and expand the content-version-item
    async clickAndExpandVersion(index) {
        try {
            await this.waitForElementDisplayed(this.versionItems);
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
            await this.waitForElementDisplayed(this.versionItems);
            //get all version items with the header:
            let locator = xpath.versionsListItemByName(versionHeader);
            await this.waitForElementDisplayed(locator);
            let items = await this.findElements(locator);
            //click on the item:
            await items[i].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Version Widget - error during clicking on the version : ${versionHeader}`, 'err_expand_version', err);
        }
    }

    async getPublishMessagesFromPublishedItems() {
        await this.waitForElementDisplayed(this.versionItems);
        //get all version items with the header:
        let locator = xpath.versionsListItemByName(appConst.VERSIONS_ITEM_HEADER.PUBLISHED) + xpath.publishMessageDiv;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickAndExpandVersionItemByHeader(versionHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            await this.waitForElementDisplayed(this.versionItems);
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
    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.extensionView);
        } catch (err) {
            await this.handleError('Version Widget was not loaded', 'err_load_versions_widget', err);
        }
    }

    // waits for Version Widget is loaded, returns false after the timeout exceeded
    async isWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(this.extensionView);
        } catch (err) {
            return false;
        }
    }

    async waitForRestoreButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.restoreButton);
        } catch (err) {
            await this.handleError('Restore button should not be displayed', 'err_restore_button', err);
        }
    }

    async waitForRestoreButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.restoreButton);
        } catch (err) {
            await this.handleError('Restore button should be displayed', 'err_restore_button', err);
        }
    }

    async clickOnRestoreButton() {
        try {
            let aa = await this.findElements(this.restoreButton);
            await this.waitForElementDisplayed(this.restoreButton);
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
            return await this.waitForElementDisplayed(this.movedItems);
        } catch (err) {
            await this.handleError('Versions Widget, Moved item should be displayed', 'err_moved_item', err);
        }
    }

    async waitForRenamedItemDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.renamedItems);
        } catch (err) {
            await this.handleError('Versions Widget, Renamed item should be displayed', 'err_renamed_item', err);
        }
    }

    async moveCursorToVersionItemByHeader(itemHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            let itemLocator = this.extensionView + xpath.versionsListItemByName(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            await this.doPerformMoveToAction(versionItems[i]);
            return await this.pause(200);
        } catch (err) {
            await this.handleError(`Version Widget - moving cursor to version item: ${itemHeader}`, 'err_move_cursor_to_version', err);
        }
    }

    async waitForCompareChangesCheckboxDisplayed(itemHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            let itemLocator = this.extensionView + xpath.versionsListItemByName(itemHeader);
            await this.waitForElementDisplayed(itemLocator, appConst.mediumTimeout);
            let versionItems = await this.findElements(itemLocator);
            let checkboxElements = await versionItems[i].$$(xpath.compareCheckboxDiv);
            if (checkboxElements.length === 0) {
                throw new Error(`No 'compare changes' checkbox found for itemHeader: ${itemHeader} at index: ${i}`);
            }
            await checkboxElements[0].waitForDisplayed({timeout: appConst.shortTimeout});
        } catch (err) {
            await this.handleError(`Version Widget - compare changes checkbox should be displayed: ${itemHeader}`,
                'err_compare_ch_checkbox', err);
        }
    }

    async clickOnCompareChangesCheckboxByHeader(itemHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            let itemLocator = this.extensionView + xpath.versionsListItemByName(itemHeader);
            await this.waitForElementDisplayed(itemLocator);
            let versionItems = await this.findElements(itemLocator);
            // the checkbox input is hidden, so click on its label element:
            let labelElements = await versionItems[i].$$(xpath.compareCheckboxDiv + '//label');
            if (labelElements.length === 0) {
                throw new Error(`No 'compare changes' checkbox found for itemHeader: ${itemHeader} at index: ${i}`);
            }
            await labelElements[0].click();
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Versions Widget, tried to click on the compare changes checkbox...', 'err_click_on_show_changes', err);
        }
    }

    async isCompareChangesCheckboxSelectedByHeader(itemHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            let itemLocator = this.extensionView + xpath.versionsListItemByName(itemHeader);
            let versionItems = await this.findElements(itemLocator);
            let checkboxElements = await versionItems[i].$$(xpath.compareCheckboxDiv + "//input[@type='checkbox']");
            if (checkboxElements.length === 0) {
                throw new Error(`No 'compare changes' checkbox found for itemHeader: ${itemHeader} at index: ${i}`);
            }
            return await checkboxElements[0].isSelected();
        } catch (err) {
            await this.handleError('Versions Widget, tried to check if the compare changes checkbox is selected...',
                'err_check_show_changes_selected', err);
        }
    }

    // Returns the user-name line ('by Super User') for the version item with the header ('Sorted', 'Edited'...):
    async getUserNameInItemByHeader(itemHeader, index) {
        try {
            let i = index === undefined ? 0 : index;
            let itemLocator = this.extensionView + xpath.versionsListItemByName(itemHeader);
            await this.waitForElementDisplayed(itemLocator, appConst.mediumTimeout);
            let versionItems = await this.findElements(itemLocator);
            if (versionItems.length === 0 || versionItems[i] === undefined) {
                throw new Error(`No version item found for the header: ${itemHeader} at index: ${i}`);
            }
            let elements = await versionItems[i].$$(".//div[contains(@class,'text-xs')]");
            if (elements.length === 0) {
                throw new Error(`No user name found in the version item with the header: ${itemHeader} at index: ${i}`);
            }
            return await elements[0].getText();
        } catch (err) {
            await this.handleError('Versions Widget, tried to get user name...', 'err_version_username', err);
        }
    }

    // Headers or displayNames :Created, Edited.  Permissions Updated is excluded
    versionItemByDisplayName(displayName) {
        return this.extensionView + xpath.versionsListItemByName(displayName);
    }

    // Checkbox for Edited, Created, Moved, Renamed version items.
    // Returns false when the checkbox is not rendered (the version is not comparable):
    async isCompareVersionCheckboxDisplayed(itemHeader, index) {
        let i = index === undefined ? 0 : index;
        let itemLocator = this.extensionView + xpath.versionsListItemByName(itemHeader);
        let elements = await this.findElements(itemLocator);
        if (elements.length === 0 || elements[i] === undefined) {
            throw new Error(`No version item found for the header: ${itemHeader} at index: ${i}`);
        }
        let checkboxElements = await elements[i].$$(xpath.compareCheckboxDiv);
        if (checkboxElements.length === 0) {
            return false;
        }
        return await checkboxElements[0].isDisplayed();
    }

    async clickOnShowChangesButton() {
        try {
            await this.waitForElementDisplayed(this.showChangesButton);
            return await this.clickOnElement(this.showChangesButton);
        } catch (err) {
            await this.handleError('Version Widget - Compare versions button', 'err_compare_versions_button', err);
        }
    }

    async clickOnCancelSelectionOfVersionItemButton() {
        try {
            await this.waitForElementDisplayed(this.cancelSelectionButton);
            return await this.clickOnElement(this.cancelSelectionButton);
        } catch (err) {
            await this.handleError('Version Widget - Reset Compare versions button', 'err_cancel_selection_versions_button', err);
        }
    }
}

module.exports = BaseVersionsWidget;
