/**
 * Created  on 20/11/2019
 */
const Page = require('./page');
const lib = require('../libs/elements');
const appConst = require('../libs/app_const');
const CompareDropdown = require('../page_objects/components/selectors/compare.versions.dropdown');
const XPATH = {
    container: `//div[contains(@id,'CompareContentVersionsDialog')]`,
    containerLeft: `//div[contains(@class,'container left')]`,
    containerRight: `//div[contains(@class,'container right')]`,
    containerBottom: `//div[@class='container bottom']`,
    restoreMenuButton: "//button[contains(@id,'Button') and descendant::li[contains(@id,'MenuItem') and text()='Restore']]",
    restoreMenuItem: "//ul[contains(@id,'Menu')]/li[contains(@id,'MenuItem') and text()='Restore']",
    showEntireContentCheckboxDiv: "//div[contains(@id,'Checkbox') and descendant::span[text()='Show the entire content']]",
    listItemNameAndIconView: "//div[contains(@id,'NamesAndIconView') and not(descendant::h6[contains(.,'version')])]",
    contentPanel: "//div[contains(@id,'ModalDialogContentPanel')]",
};

class CompareContentVersionsDialog extends Page {

    get leftRestoreMenuButton() {
        return XPATH.container + XPATH.containerLeft + XPATH.restoreMenuButton;
    }

    get leftDropdownHandle() {
        return XPATH.container + XPATH.containerLeft + lib.DROP_DOWN_HANDLE;
    }

    get rightRestoreMenuButton() {
        return XPATH.container + XPATH.containerRight + XPATH.restoreMenuButton;
    }

    get rightDropdownHandle() {
        return XPATH.container + XPATH.containerRight + lib.DROP_DOWN_HANDLE;
    }


    get olderVersionDropdownHandle() {
        return XPATH.container + XPATH.containerLeft + lib.DROP_DOWN_HANDLE;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get newerVersionDropdownHandle() {
        return XPATH.container + XPATH.containerRight + lib.DROP_DOWN_HANDLE;
    }

    get showEntireContentCheckbox() {
        return XPATH.container + XPATH.showEntireContentCheckboxDiv + '//label';
    }

    async expandLeftDropdownAndClickOnModifiedOption(index) {
        try {

            let locator = XPATH.container + XPATH.containerLeft +
                          "//div[contains(@id,'NamesAndIconView') and descendant::div[contains(@class,'version-modified')]]";
            await this.clickOnElement(this.leftDropdownHandle);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            let res = await this.findElements(locator);
            if (i >= res.length) {
                throw new Error(`Index ${index} is out of bounds for version items ,length: ${res.length}`);
            }
            await res[index].click();
            return await this.pause(500);
        } catch (err) {

        }
    }

    async clickOnOKAndApplySelection() {
        let compareDropdown = new CompareDropdown();
        await compareDropdown.clickOnApplySelectionButton(XPATH.container);
    }

    async clickOnLeftRestoreMenuButton() {
        await this.waitForLeftRestoreButtonDisplayed();
        await this.clickOnElement(this.leftRestoreMenuButton);
        return await this.pause(300);
    }

    async waitForLeftRestoreMenuItemDisplayed() {
        try {
            let selector = XPATH.container + XPATH.containerLeft + XPATH.restoreMenuItem;
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Compare content versions dialog, left menu item', 'err_left_restore_menu_item', err);
        }
    }

    async waitForLeftRestoreButtonDisplayed() {
        return await this.waitForElementDisplayed(this.leftRestoreMenuButton, appConst.mediumTimeout);
    }

    async waitForRightRestoreMenuButtonDisplayed() {
        return await this.waitForElementDisplayed(this.rightRestoreMenuButton, appConst.mediumTimeout);
    }

    async waitForRightRestoreMenuButtonDisabled() {
        return await this.waitForElementDisabled(this.rightRestoreMenuButton, appConst.mediumTimeout);
    }

    async waitForRightRestoreMenuButtonEnabled() {
        return await this.waitForElementEnabled(this.rightRestoreMenuButton, appConst.mediumTimeout);
    }

    async waitForLeftRestoreMenuButtonEnabled() {
        return await this.waitForElementEnabled(this.leftRestoreMenuButton, appConst.mediumTimeout);
    }

    async waitForLeftRestoreMenuButtonDisabled() {
        return await this.waitForElementDisabled(this.leftRestoreMenuButton, appConst.mediumTimeout);
    }

    async clickOnRightRevertButton() {
        await this.waitForElementDisplayed(this.leftRestoreMenuButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.leftRestoreMenuButton);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('CompareContentVersions Dialog', 'err_compare_content_versions_dialog_loaded', err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("CompareContentVersions Dialog must be closed " + err);
        })
    }

    async clickOnCancelButtonTop() {
        await this.clickOnElement(this.cancelButtonTop);
        return await this.waitForDialogClosed();
    }

    async clickOnShowEntireContentCheckbox() {
        await this.waitForElementDisplayed(this.showEntireContentCheckbox, appConst.mediumTimeout);
        await this.clickOnElement(this.showEntireContentCheckbox);
        await this.pause(500);
    }

    async getTypeProperty() {
        let locator = XPATH.container + "//li[@data-key='type']//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getChildOrderProperty() {
        let locator = XPATH.container + "//li[@data-key='childOrder']/div[contains(@class,'right-value')]//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnLeftDropdownHandle() {
        await this.waitForElementDisplayed(this.leftDropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.leftDropdownHandle);
        return await this.pause(300);
    }

    async getSortedOptionsInDropdownList() {
        let locator = XPATH.containerLeft + "//div[contains(@id,'NamesAndIconView')]//div[contains(@class,'icon-sort')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.findElements(locator);
    }

    async getPermissionsUpdatedOptionsInDropdownList() {
        let locator = XPATH.containerLeft + XPATH.listItemNameAndIconView + "//div[contains(@class, 'icon-masks')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.findElements(locator);
    }

    async clickOnRightDropdownHandle() {
        await this.waitForElementDisplayed(this.rightDropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.rightDropdownHandle);
        return await this.pause(300);
    }

    async getSortedOptionsInLeftDropdownList() {
        let locator = XPATH.containerLeft + XPATH.listItemNameAndIconView + "//div[contains(@class,'icon-sort')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.findElements(locator);
    }

    async getSortedOptionsInRightDropdownList() {
        let locator = XPATH.containerRight + XPATH.listItemNameAndIconView + "//div[contains(@class,'icon-sort')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.findElements(locator);
    }

    async getChangedOptionsInDropdownList() {
        let locator = XPATH.containerLeft + XPATH.listItemNameAndIconView + "//div[contains(@class, 'icon-checkmark')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.findElements(locator);
    }

    async waitForVersionsIdenticalMessage() {
        let locator = XPATH.container + XPATH.contentPanel + "//div[contains(@class,'jsondiffpatch-delta empty')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator + "//h3");
    }

    async isShowEntireContentCheckboxSelected() {
        let checkBoxInput = XPATH.container + XPATH.showEntireContentCheckboxDiv + lib.CHECKBOX_INPUT;
        await this.waitForElementDisplayed(this.showEntireContentCheckbox, appConst.mediumTimeout);
        return await this.isSelected(checkBoxInput);
    }
}

module.exports = CompareContentVersionsDialog;
