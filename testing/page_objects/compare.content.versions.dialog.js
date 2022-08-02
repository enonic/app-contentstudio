/**
 * Created  on 20/11/2019
 */
const Page = require('./page');
const lib = require('../libs/elements');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'CompareContentVersionsDialog')]`,
    containerLeft: `//div[contains(@class,'container left')]`,
    containerRight: `//div[contains(@class,'container right')]`,
    containerBottom: `//div[@class='container bottom']`,
    revertMenuButton: "//button[contains(@id,'Button') and descendant::li[contains(@id,'MenuItem') and text()='Revert']]",
    revertMenuItem: "//ul[contains(@id,'Menu')]/li[contains(@id,'MenuItem') and text()='Revert']",
    showEntireContent: "//div[contains(@id,'Checkbox') and child::label[text()='Show entire content']]",
    listItemNameAndIconView: "//div[contains(@id,'NamesAndIconView') and not(descendant::h6[contains(.,'version')])]"
};

class CompareContentVersionsDialog extends Page {

    get leftRevertMenuButton() {
        return XPATH.container + XPATH.containerLeft + XPATH.revertMenuButton;
    }

    get leftDropdownHandle() {
        return XPATH.container + XPATH.containerLeft + lib.DROP_DOWN_HANDLE;
    }

    get rightRevertMenuButton() {
        return XPATH.container + XPATH.containerRight + XPATH.revertMenuButton;
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

    get currentVersionDropdownHandle() {
        return XPATH.container + XPATH.containerRight + lib.DROP_DOWN_HANDLE;
    }

    get showEntireContent() {
        return XPATH.container + XPATH.showEntireContent + "//label";
    }

    async clickOnLeftRevertMenuButton() {
        await this.waitForLeftRevertButtonDisplayed();
        await this.clickOnElement(this.leftRevertMenuButton);
        return await this.pause(300);
    }

    async waitForLeftRevertMenuItemDisplayed() {
        let selector = XPATH.container + XPATH.containerRight + XPATH.revertMenuItem;
    }

    async waitForLeftRevertButtonDisplayed() {
        return await this.waitForElementDisplayed(this.leftRevertMenuButton, appConst.mediumTimeout);
    }

    async waitForRightRevertMenuButtonDisplayed() {
        return await this.waitForElementDisplayed(this.leftRevertMenuButton, appConst.mediumTimeout);
    }

    async waitForRightRevertMenuButtonDisabled() {
        return await this.waitForElementDisabled(this.rightRevertMenuButton, appConst.mediumTimeout);
    }

    async waitForLeftRevertMenuButtonEnabled() {
        return await this.waitForElementEnabled(this.leftRevertMenuButton, appConst.mediumTimeout);
    }

    async clickOnRightRevertButton() {
        await this.waitForElementDisplayed(this.leftRevertMenuButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.leftRevertMenuButton);
    }

    async clickOnCancelTopButton() {
        return await this.clickOnElement(this.leftRevertMenuButton);
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("CompareContentVersions Dialog is not loaded " + err);
        })
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
        return this.clickOnElement(this.showEntireContent);
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

    async getChangedOptionsInDropdownList() {
        let locator = XPATH.containerLeft + "//div[contains(@id,'NamesAndIconView')]//div[contains(@class, 'icon-checkmark')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.findElements(locator);
    }

    async clickOnLeftDropdownHandle() {
        await this.waitForElementDisplayed(this.leftDropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.leftDropdownHandle);
        return await this.pause(300);
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
}

module.exports = CompareContentVersionsDialog;
