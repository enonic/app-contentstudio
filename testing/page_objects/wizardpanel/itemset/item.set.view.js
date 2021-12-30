/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const studioUtils = require('../../../libs/studio.utils.js');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",
    occurrenceView: "//div[contains(@id,'FormItemSetOccurrenceView')]",
    addItemSetButton: "//div[contains(@class,'bottom-button-row')]//button[child::span[text()='Add'] and @title='Add ItemSet']",
    itemSetMenuButton: "//button[contains(@id,'MoreButton')]",
    typeTextInHtmlArea: (id, text) => {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },

    occurrenceByText: (text) => `//div[contains(@id,'FormOccurrenceDraggableLabel') and contains(.,'${text}')]//div[contains(@class, 'drag-control')]`
};

class ItemSetFormView extends Page {

    get addItemSetButton() {
        return lib.FORM_VIEW + xpath.addItemSetButton;
    }

    get itemSetMenuButton() {
        return xpath.occurrenceView + xpath.itemSetMenuButton;
    }

    get htmlAreaValidationRecording() {
        return "//div[contains(@id,'InputView') and descendant::div[contains(@id,'HtmlArea')]]" + lib.INPUT_VALIDATION_VIEW;
    }

    get textLineValidationRecording() {
        return "//div[contains(@id,'InputView') and descendant::div[contains(@id,'TextLine')]]" + lib.INPUT_VALIDATION_VIEW;
    }

    //Types the required text in the option filter input and select an option:
    async typeTextInHtmlArea(index, text) {
        let locator = xpath.itemSet + lib.TEXT_AREA;
        let ids = await studioUtils.getIdOfHtmlAreas();
        await this.execute(xpath.typeTextInHtmlArea([].concat(ids)[index], text));
        return await this.pause(200);
    }

    async typeTextInTextLine(index, text) {
        let locator = xpath.itemSet + lib.TEXT_INPUT;
        let elements = this.findElements(locator);
        await elements[index].setValue(text);
        return await this.pause(200);
    }

    waitForAddButtonDisplayed() {
        return this.waitForElementDisplayed(this.addItemSetButton, appConst.mediumTimeout);
    }

    waitForItemSetFormNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.occurrenceView, appConst.mediumTimeout);
    }

    async clickOnAddButton() {
        await this.waitForAddButtonDisplayed();
        await this.clickOnElement(this.addItemSetButton);
        return await this.pause(1000);
    }

    async getValidationRecordingForHtmlArea(index) {
        let occurrencesForm = await this.findElements(xpath.occurrenceView);
        let recordingElement = await occurrencesForm[index].$$(this.htmlAreaValidationRecording);
        return await recordingElement[0].getText();
    }

    async expandMenuClickOnDelete(index) {
        let menuButtons = this.findElements(this.itemSetMenuButton);

    }

    async swapItems(sourceName, destinationName) {
        let sourceElem = xpath.occurrenceByText(sourceName);
        let destinationElem = xpath.occurrenceByText(destinationName);
        let source = await this.findElement(sourceElem);
        let destination = await this.findElement(destinationElem);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    async getItemSetTitle(index) {
        let locator = xpath.itemSet + "//div[contains(@id,'FormOccurrenceDraggableLabel')]";
        let elements = await this.findElements(locator);
        let result = await elements[index].getText(locator);
        let tittle = result.split("\n");
        return tittle[0].trim();
    }
}

module.exports = ItemSetFormView;
