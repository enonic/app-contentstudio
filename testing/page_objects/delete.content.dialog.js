const Page = require('./page');
const appConst = require('../libs/app_const');
const {BUTTONS, TREE_GRID} = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@role,'dialog') and descendant::h2[contains(.,'Delete item')]]`,
    inboundErrorStateEntry: "//div[contains(@id,'DialogStateEntry')]/span[text()='Inbound references']",
    itemToDeleteList: `//ul[contains(@id,'DialogWithRefsItemList')]`,
    itemViewer: `//div[contains(@id,'DeleteItemViewer']`,
    dependantListUl: "//ul[contains(@id,'DialogWithRefsDependantList')]",
    dependantsHeader: "//div[@class='dependants-header']/span[@class='dependants-title']",
    contentStatusBadge: "//span[@data-component='StatusBadge']",
    inboundLink: `//a[contains(@class,'inbound-dependency')]`,
    mainListItemsDisplayName: `//div[@role='separator']/preceding::div[@role='listitem'][ancestor::div[@role='dialog' and @data-component='DeleteDialogMainContent']]//div[@data-component='ContentLabel']//span[following-sibling::small]`,

    getShowReferencesButtonLocator(displayName) {
        return XPATH.container +
               TREE_GRID.listItemByDisplayNameAndDataComponent('ContentListItemWithReference', displayName) +
               "//a[text()='Show references']";
    }
};

// it appears when select a content and click on  'Delete' button on the toolbar
class DeleteContentDialog extends Page {

    get dependentsHeader() {
        return XPATH.container + XPATH.dependantsHeader;
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get deleteButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Delete');
    }

    get hideDependantItemsLink() {
        return XPATH.container + XPATH.hideDependantItemsLink;
    }

    get showDependantItemsLink() {
        return XPATH.container + XPATH.showDependantItemsLink;
    }

    get ignoreInboundReferencesButton() {
        return XPATH.container + "//div[@data-component='StatusBarErrorEntry']" + BUTTONS.button('Ignore inbound references');
    }

    async waitForCloseButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete Content Dialog, Close button should be displayed', 'err_close_button_displayed', err);
        }
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(this.deleteButton, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_delete_dialog_opened', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Delete content dialog must be closed ', 'err_close_delete_content_dialog', err);
        }
    }

    async clickOnCloseButton() {
        return await this.clickOnElement(this.closeButton);
    }

    // Clicks on 'Archive' button.(Confirm Archive dialog can appear)
    async clickOnDeleteButton() {
        try {
            await this.waitForElementDisplayed(this.deleteButton, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout);
            await this.clickOnElement(this.deleteButton);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_click_on_delete_button', err);
        }
    }

    async clickOnShowReferencesButton(itemDisplayName) {
        let buttonLocator = XPATH.getShowReferencesButtonLocator(itemDisplayName);
        await this.waitForSpinnerNotVisible();
        //await this.waitForInboundReferencesEntryDisplayed();
        await this.waitForElementDisplayed(buttonLocator, appConst.mediumTimeout);
        await this.clickOnElement(buttonLocator);
        return await this.pause(2000);
    }

    async getNumberInDeleteButton() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getText(this.deleteButton);
                return text.includes('(');
            }, {timeout: appConst.mediumTimeout});
            let result = await this.getText(this.deleteButton);
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        } catch (err) {
            await this.handleError('Tried to get the number id items in Delete button', 'err_get_number_in_archive_button', err);
        }
    }

    async getContentStatus(displayName) {
        let selector = XPATH.container + TREE_GRID.listItemByDisplayName(displayName) + XPATH.contentStatusBadge;
        return await this.getText(selector);
    }

    async isDeleteButtonDisplayed() {
        return this.isElementDisplayed(this.deleteButton);
    }

    async waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    async waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout);
    }

    async getMainItemsToDeleteDisplayName() {
        try {
            let selector = XPATH.container + XPATH.mainListItemsDisplayName;
            return await this.getTextInElements(selector);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_display_names', err);
        }
    }

    async getDependantItemsName() {
        let locator = XPATH.container + XPATH.dependantListUl + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForDependantsHeaderDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependentsHeader, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_dependants_header_displayed', err);
        }
    }

    async waitForShowReferencesButtonDisplayed(displayName) {
        try {
            //let locator = XPATH.container + TREE_GRID.listItemByDisplayNameAndDataComponent('ContentListItemWithReference', displayName) +
            //             "//a[text()='Show references']";
            let locator = XPATH.getShowReferencesButtonLocator(displayName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_show_references_button_displayed', err);
        }
    }

    async clickOnIgnoreInboundReferences() {
        try {
            await this.waitForIgnoreInboundReferencesButtonDisplayed();
            await this.clickOnElement(this.ignoreInboundReferencesButton);
            return await this.waitForIgnoreInboundReferencesButtonNotDisplayed();
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_ignore_inbound_ref', err);
        }
    }

    waitForIgnoreInboundReferencesButtonDisplayed() {
        return this.waitForElementDisplayed(this.ignoreInboundReferencesButton, appConst.mediumTimeout);
    }

    waitForIgnoreInboundReferencesButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.ignoreInboundReferencesButton, appConst.mediumTimeout);
    }

    async waitForInboundReferencesEntryDisplayed() {
        return await this.waitForElementDisplayed(XPATH.inboundErrorStateEntry, appConst.mediumTimeout)
    }

}

module.exports = DeleteContentDialog;
