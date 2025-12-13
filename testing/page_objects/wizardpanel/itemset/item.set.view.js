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
        return xpath.occurrenceView + lib.BUTTONS.MORE_BUTTON;
    }

    get collapseButton() {
        return xpath.itemSet + lib.BUTTONS.COLLAPSE_BUTTON_BOTTOM;
    }

    get collapseAllButton() {
        return xpath.itemSet + lib.BUTTONS.COLLAPSE_ALL_BUTTON_BOTTOM;
    }

    get deleteItemSetButton() {
        return "//div[contains(@id,'ConfirmationMask')]" + lib.actionButton('Delete ItemSet');
    }

    get expandButton() {
        return xpath.itemSet + lib.BUTTONS.EXPAND_BUTTON_BOTTOM;
    }

    get htmlAreaValidationRecording() {
        return lib.FORM_VIEW_PANEL.HTML_AREA_INPUT + lib.INPUT_VALIDATION_VIEW;
    }

    get textLineValidationRecording() {
        return lib.FORM_VIEW_PANEL.TEXT_LINE_INPUT + lib.INPUT_VALIDATION_VIEW;
    }

    async waitForDeleteItemSetButtonDisplayed() {
        return await this.waitForElementDisplayed(this.deleteItemSetButton, appConst.mediumTimeout);
    }

    async clickOnDeleteItemSetButton() {
        await this.waitForDeleteItemSetButtonDisplayed();
        await this.clickOnElement(this.deleteItemSetButton);
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
        return await this.pause(300);
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
    }

    async waitForCollapseButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.collapseButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('item_set_collapse_button');
            throw new Error(`Collapse button is not displayed! Screenshot: ${screenshot}`);
        }
    }

    async waitForCollapseAllButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.collapseAllButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('item_set_collapse_all_button');
            throw new Error(`Collapse all button is not displayed! Screenshot: ${screenshot}`);
        }
    }

    async clickOnCollapseButton() {
        await this.waitForCollapseButtonDisplayed();
        await this.clickOnElement(this.collapseButton);
    }

    async clickOnExpandButton() {
        await this.waitForExpandButtonDisplayed();
        await this.clickOnElement(this.expandButton);
    }

    async waitForCollapseButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(lib.BUTTONS.COLLAPSE_BUTTON_BOTTOM, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('item_set_collapse_button');
            throw new Error(`Collapse button should not be displayed! Screenshot: ${screenshot}`);
        }
    }

    async waitForExpandButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(lib.BUTTONS.EXPAND_BUTTON_BOTTOM, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('item_set_expand_button');
            throw new Error(`Expand button is not displayed! Screenshot: ${screenshot}` + err);
        }
    }

    async waitForExpandButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(lib.BUTTONS.EXPAND_BUTTON_BOTTOM, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('item_set_expand_button');
            throw new Error(`Expand button should not be  displayed! Screenshot: ${screenshot}`);
        }
    }

    async getValidationRecordingForHtmlArea(index) {
        let occurrencesForm = await this.findElements(xpath.occurrenceView);
        let recordingElement = await occurrencesForm[index].$$(this.htmlAreaValidationRecording);
        return await recordingElement[0].getText();
    }

    async getValidationRecordingForTextInput(index) {
        let occurrencesForm = await this.findElements(xpath.occurrenceView);
        let recordingElement = await occurrencesForm[index].$$(this.textLineValidationRecording);
        return await recordingElement[0].getText();
    }

    async expandMenuClickOnMenuItem(index, menuItem) {
        let menuButtons = await this.findElements(this.itemSetMenuButton);
        await menuButtons[index].click();
        await this.pause(400);
        let res = await this.getDisplayedElements(
            `//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='${menuItem}']`);
        await res[0].waitForEnabled({timeout: appConst.shortTimeout, timeoutMsg: "Option Set - Delete menu item should be enabled!"});
        await res[0].click();
        return await this.pause(300);
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

    async isItemSetFormInvalid(index) {
        let locator = xpath.occurrenceView;
        let elements = await this.findElements(locator);
        let attr = await elements[index].getAttribute('class');
        return attr.includes('invalid');
    }

    async clickOnFormOccurrence(label, index) {
        let locator = xpath.occurrenceByText(label);
        let element = await this.findElements(locator);
        await element[index].click();
        return await this.pause(300);
    }
}

module.exports = ItemSetFormView;
