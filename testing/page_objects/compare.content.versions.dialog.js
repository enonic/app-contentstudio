/**
 * Created  on 20/11/2019 updated on 11.06.2026
 */
const Page = require('./page');
const appConst = require('../libs/app_const');

const XPATH = {
    container: `//div[@data-component='CompareVersionsDialog']`,
    closeButton: `//button[@data-component='Dialog.DefaultClose']`,
    dialogBody: `//div[@data-component='Dialog.Body']`,
    dialogFooter: `//footer[@data-component='Dialog.Footer']`,
    // Version card in the dialog body - the column with 'Older' or 'Newer' label:
    versionCardByLabel: label => `//div[child::span[text()='${label}']]`,
    showEntireContentCheckboxDiv: `//div[@data-component='Checkbox' and descendant::span[text()='Show the entire content']]`,
    versionsIdenticalDiv: `//div[contains(@class,'jsondiffpatch-delta') and contains(@class,'empty')]`,
};

class CompareContentVersionsDialog extends Page {

    get closeButton() {
        return XPATH.container + XPATH.closeButton;
    }

    get showEntireContentCheckbox() {
        return XPATH.container + XPATH.showEntireContentCheckboxDiv + '//label';
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

    // Clicks on the 'Close' button in the dialog header:
    async clickOnCancelButtonTop() {
        await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
        await this.clickOnElement(this.closeButton);
        return await this.waitForDialogClosed();
    }

    async clickOnShowEntireContentCheckbox() {
        await this.waitForElementDisplayed(this.showEntireContentCheckbox, appConst.mediumTimeout);
        await this.clickOnElement(this.showEntireContentCheckbox);
        await this.pause(500);
    }

    async isShowEntireContentCheckboxSelected() {
        let checkBoxInput = XPATH.container + XPATH.showEntireContentCheckboxDiv + "//input[@type='checkbox']";
        await this.waitForElementDisplayed(this.showEntireContentCheckbox, appConst.mediumTimeout);
        return await this.isSelected(checkBoxInput);
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

    // Returns the message that is displayed when the compared versions are identical:
    async waitForVersionsIdenticalMessage() {
        let locator = XPATH.container + XPATH.versionsIdenticalDiv;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator + "//h3");
    }

    // Returns the operation label ('Edited', 'Renamed'...) shown in the 'Older' version card:
    async getOlderVersionOperation() {
        return await this.getVersionCardOperation('Older');
    }

    // Returns the operation label ('Edited', 'Renamed'...) shown in the 'Newer' version card:
    async getNewerVersionOperation() {
        return await this.getVersionCardOperation('Newer');
    }

    async getVersionCardOperation(cardLabel) {
        let locator = XPATH.container + XPATH.dialogBody + XPATH.versionCardByLabel(cardLabel) +
                      "//div[contains(@class,'gap-1')]/span[last()]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CompareContentVersionsDialog;
