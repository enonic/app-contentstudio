/**
 * Created on 24.11.2021 updated on 12.06.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const {COMMON} = require('../../../libs/elements');

const xpath = {
    contactInfoSetView: "//div[@data-component='ItemSetView' and child::div[@data-component='SetHeader']//span[text()='Contact Info']]",
    // direct child axis skips occurrences of the nested 'Phone Numbers' set:
    contactInfoOccurrenceView: "/div[@data-component='SortableList']/div/div[@data-component='ItemSetOccurrenceView']",
    // the header label(primary) of an item set occurrence, the typed text or 'Contact Info' as the fallback:
    occurrenceHeaderLabel: "//div[@data-component='ContextMenu.Trigger']//button[@aria-expanded]/span",
};

class SetInSetView extends Page {

    // 'Add' button of the 'Contact Info' item set, direct child axis skips the 'Add' button in the nested 'Phone Numbers' set:
    get addContactInfoButton() {
        return xpath.contactInfoSetView + "/div[contains(@class,'justify-end')]/button[@data-component='Button' and @aria-label='Add']";
    }

    get labelInput() {
        return xpath.contactInfoSetView + xpath.contactInfoOccurrenceView + COMMON.INPUTS.inputByAriaLabel('Label');
    }

    get streetInput() {
        return xpath.contactInfoSetView + xpath.contactInfoOccurrenceView + COMMON.INPUTS.inputByAriaLabel('Street');
    }

    get firstNameInput() {
        return COMMON.INPUTS.inputByAriaLabel('First Name');
    }

    get lastNameInput() {
        return COMMON.INPUTS.inputByAriaLabel('Last Name');
    }

    waitForAddContactInfoButtonDisplayed() {
        return this.waitForElementDisplayed(this.addContactInfoButton, appConst.mediumTimeout);
    }

    async clickOnAddContactInfoButton() {
        await this.waitForAddContactInfoButtonDisplayed();
        await this.clickOnElement(this.addContactInfoButton);
        return this.pause(300);
    }

    async typeTextInStreetInput(text) {
        await this.waitForElementDisplayed(this.streetInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.streetInput, text);
        return await this.pause(200);
    }

    async clearLabelInput(){
        await this.clearInputText(this.labelInput);
    }

    async typeTextInLabelInput(text) {
        await this.waitForElementDisplayed(this.labelInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.labelInput, text);
        return await this.pause(200);
    }

    // Returns the text in the header of the 'Contact Info' occurrence(the first non-empty input value or 'Contact Info'):
    async getItemSetTitle() {
        let locator = xpath.contactInfoSetView + xpath.contactInfoOccurrenceView + xpath.occurrenceHeaderLabel;
        let result = await this.getText(locator);
        return result.trim();
    }

    async typeTextInFirstNameInput(text) {
        await this.waitForElementDisplayed(this.firstNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.firstNameInput, text);
        return await this.pause(300);
    }

    async typeTextInLastNameInput(text) {
        await this.waitForElementDisplayed(this.lastNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.lastNameInput, text);
        return await this.pause(300);
    }
}

module.exports = SetInSetView;
