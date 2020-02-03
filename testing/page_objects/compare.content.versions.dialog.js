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
    revertButton: "//button[contains(@id,'Button') and child::span[text()='Revert']]",
};

class CompareContentVersionsDialog extends Page {

    get leftRevertButton() {
        return XPATH.container + XPATH.containerLeft + XPATH.revertButton;
    }

    get rightRevertButton() {
        return XPATH.container + XPATH.containerRight + XPATH.revertButton;
    }

    get olderVersionDropdownHandle() {
        return XPATH.container + XPATH.containerLeft + lib.DROP_DOWN_HANDLE;
    }

    get cancelButtonTop() {
        return XPATH.container + +lib.CANCEL_BUTTON_TOP;
    }

    get currentVersionDropdownHandle() {
        return XPATH.container + XPATH.containerRight + lib.DROP_DOWN_HANDLE;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    async

    clickOnLeftRevertButton() {
        await
        this.waitForLeftRevertButtonDisplayed();
        return await
        this.clickOnElement(this.leftRevertButton);
    }

    async

    waitForLeftRevertButtonDisplayed() {
        return await
        this.waitForElementDisplayed(this.leftRevertButton, appConst.TIMEOUT_2);
    }

    async

    waitForRightRevertButtonDisplayed() {
        return await
        this.waitForElementDisplayed(this.leftRevertButton, appConst.TIMEOUT_2);
    }

    async

    waitForRightRevertButtonDisabled() {
        return await
        this.waitForElementDisabled(this.rightRevertButton, appConst.TIMEOUT_2);
    }

    async

    waitForLeftRevertButtonEnabled() {
        return await
        this.waitForElementEnabled(this.leftRevertButton, appConst.TIMEOUT_2);
    }


    async

    clickOnRightRevertButton() {
        await
        this.waitForElementDisplayed(this.leftRevertButton, appConst.TIMEOUT_2);
        return await
        this.clickOnElement(this.leftRevertButton);
    }

    async

    clickOnCancelTopButton() {

        return await
        this.clickOnElement(this.leftRevertButton);
    }


    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err = > {
            throw new Error("CompareContentVersions Dialog is not loaded " + err);
    })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err = > {
            throw new Error("CompareContentVersions Dialog must be closed " + err);
    })
    }

    async

    clickOnCancelButtonTop() {
        await
        this.clickOnElement(this.cancelButtonTop);
        return await
        this.waitForDialogClosed();
    }
};
module.exports = CompareContentVersionsDialog;
