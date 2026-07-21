/**
 * Created  on 20/11/2019 updated on 20.07.2026
 */
const Page = require('./page');
const appConst = require('../libs/app_const');

const XPATH = {
    container: `//div[@data-component='CompareVersionsDialog']`,
    dialogTitle: `//h2[@data-component='Dialog.Title']`,
    closeButton: `//button[@data-component='Dialog.DefaultClose']`,
    dialogBody: `//div[@data-component='Dialog.Body']`,
    dialogFooter: `//footer[@data-component='Dialog.Footer']`,
    // Version card in the dialog body - the column with 'Older' or 'Newer' label:
    versionCardByLabel: label => `//div[child::span[text()='${label}']]`,
    showEntireContentCheckboxDiv: `//div[@data-component='Checkbox' and descendant::span[text()='Show the entire content']]`,
    versionsIdenticalMessage: `//div[@data-component='Dialog.Body']//h3[text()='Versions are identical']`,
    // Diff entries - located by the exact 'data-key' attribute ('_name', 'language', 'workflow'...):
    modifiedProperty: key => `//li[contains(@class,'jsondiffpatch-modified') and @data-key='${key}']`,
    addedProperty: key => `//li[contains(@class,'jsondiffpatch-added') and @data-key='${key}']`,
    unchangedProperty: key => `//li[contains(@class,'jsondiffpatch-unchanged') and @data-key='${key}']`,
    // Diff entry that contains nested properties ('x', 'page'...):
    nodeProperty: key => `//li[contains(@class,'jsondiffpatch-child-node-type-object') and @data-key='${key}']`,
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
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError('CompareContentVersions Dialog', 'err_compare_content_versions_dialog_loaded', err);
        }
    }


    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError('CompareContentVersions Dialog', 'err_compare_content_versions_dialog_closed', err);
        }
    }

    async getDialogTitle() {
        let locator = XPATH.container + XPATH.dialogTitle;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
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
        let locator = XPATH.container + XPATH.versionsIdenticalMessage;
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async waitForModifiedPropertyDisplayed(propertyKey) {
        try {
            let locator = XPATH.container + XPATH.modifiedProperty(propertyKey);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Compare Versions dialog, modified property: ' + propertyKey, 'err_modified_prop', err);
        }
    }

    async waitForModifiedPropertyNotDisplayed(propertyKey) {
        try {
            let locator = XPATH.container + XPATH.modifiedProperty(propertyKey);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Compare Versions dialog, modified property: ' + propertyKey, 'err_modified_prop', err);
        }
    }

    async waitForAddedPropertyDisplayed(propertyKey) {
        try {
            let locator = XPATH.container + XPATH.addedProperty(propertyKey);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Compare Versions dialog, added property: ' + propertyKey, 'err_added_prop', err);
        }
    }

    async waitForAddedPropertyNotDisplayed(propertyKey) {
        try {
            let locator = XPATH.container + XPATH.addedProperty(propertyKey);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Compare Versions dialog, added property: ' + propertyKey, 'err_added_prop', err);
        }
    }

    async waitForUnchangedPropertyDisplayed(propertyKey) {
        try {
            let locator = XPATH.container + XPATH.unchangedProperty(propertyKey);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Compare Versions dialog, unchanged property: ' + propertyKey, 'err_unchanged_prop', err);
        }
    }

    // Returns the left (old) value of a modified property:
    async getModifiedPropertyOldValue(propertyKey) {
        let locator = XPATH.container + XPATH.modifiedProperty(propertyKey) + "//div[contains(@class,'left-value')]//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Returns the right (new) value of a modified property:
    async getModifiedPropertyNewValue(propertyKey) {
        let locator = XPATH.container + XPATH.modifiedProperty(propertyKey) + "//div[contains(@class,'right-value')]//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getAddedPropertyValue(propertyKey) {
        let locator = XPATH.container + XPATH.addedProperty(propertyKey) + "//div[contains(@class,'jsondiffpatch-value')]//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getUnchangedPropertyValue(propertyKey) {
        let locator = XPATH.container + XPATH.unchangedProperty(propertyKey) + "//div[contains(@class,'jsondiffpatch-value')]//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Returns the value of a property added inside a nested node, e.g. ('x', 'com-enonic-uitest-contenttypes'):
    async getAddedPropertyValueInNode(nodeKey, propertyKey) {
        let locator = XPATH.container + XPATH.nodeProperty(nodeKey) + XPATH.addedProperty(propertyKey) +
                      "//div[contains(@class,'jsondiffpatch-value')]//pre";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Returns the time (e.g. '13:06:12') shown in the 'Older' version card:
    async getOlderVersionTime() {
        return await this.getVersionCardTime('Older');
    }

    // Returns the time (e.g. '13:06:12') shown in the 'Newer' version card:
    async getNewerVersionTime() {
        return await this.getVersionCardTime('Newer');
    }

    async getVersionCardTime(cardLabel) {
        let locator = XPATH.container + XPATH.dialogBody + XPATH.versionCardByLabel(cardLabel) +
                      "//div[contains(@class,'gap-1')]/span[1]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
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

    // Returns the modifier text (e.g. 'By Super User') shown in the 'Older' version card:
    async getOlderVersionModifier() {
        return await this.getVersionCardModifier('Older');
    }

    // Returns the modifier text (e.g. 'By Super User') shown in the 'Newer' version card:
    async getNewerVersionModifier() {
        return await this.getVersionCardModifier('Newer');
    }

    async getVersionCardModifier(cardLabel) {
        let locator = XPATH.container + XPATH.dialogBody + XPATH.versionCardByLabel(cardLabel) +
                      "//div[contains(@class,'text-xs')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Returns the status badge text (e.g. 'Online') shown in the 'Older' version card:
    async getOlderVersionStatus() {
        return await this.getVersionCardStatus('Older');
    }

    // Returns the status badge text (e.g. 'Online') shown in the 'Newer' version card:
    async getNewerVersionStatus() {
        return await this.getVersionCardStatus('Newer');
    }

    async getVersionCardStatus(cardLabel) {
        let locator = XPATH.container + XPATH.dialogBody + XPATH.versionCardByLabel(cardLabel) +
                      "//div[contains(@class,'truncate')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CompareContentVersionsDialog;
