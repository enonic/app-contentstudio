/**
 * Created on 12.04.2019. updated on 11.02.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const {BUTTONS, COMMON} = require('../../../libs/elements');
const HtmlAreaForm = require('../htmlarea.form.panel');
const {Key} = require("webdriverio");

const xpath = {
    itemSet: "//div[@data-component='ItemSetView']",
    occurrenceView: "//div[@data-component='ItemSetOccurrenceView']",
    contextMenuTrigger: "//div[@data-component='ContextMenu.Trigger']",
    typeTextInHtmlArea: (id, text) => {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
    occurrenceByText: (text) => `//div[contains(@id,'FormOccurrenceDraggableLabel') and contains(.,'${text}')]//div[contains(@class, 'drag-control')]`,
    // The clickable label button that expands/collapses an occurrence:
    occurrenceLabelButton: (text) =>
        `//div[@data-component='ItemSetOccurrenceView']//button[descendant::span[contains(@class,'font-semibold') and contains(.,'${text}')]]`,
    // Validation message for the TextLine input inside an occurrence:
    textLineValidationRecording: "//div[@data-component='InputField' and descendant::input[@aria-label='TextLine']]//div[contains(@class,'text-error')]",
    // Validation message for the HtmlArea input inside an occurrence:
    htmlAreaValidationRecording: "//div[@data-component='InputField' and descendant::div[@data-name='CKEditorWrapper']]//div[contains(@class,'text-error')]",
};

class ItemSetFormView extends Page {

    get addItemSetButton() {
        return xpath.itemSet + BUTTONS.buttonAriaLabel('Add');
    }

    get itemSetMenuTriggerButton() {
        return xpath.itemSet + xpath.contextMenuTrigger;
    }

    get collapseAllButton() {
        return xpath.itemSet + "//button[@data-component='InlineButton' and text()='Collapse all']";
    }

    get deleteItemSetButton() {
        return "//div[contains(@data-component,'Button') and @aria-label='Delete']";
    }

    get expandAllButton() {
        return xpath.itemSet + "//button[@data-component='InlineButton' and text()='Expand all']";
    }

    get htmlAreaValidationRecording() {
        return xpath.htmlAreaValidationRecording;
    }

    get textLineValidationRecording() {
        return xpath.textLineValidationRecording;
    }

    async waitForDeleteItemSetButtonDisplayed() {
        return await this.waitForElementDisplayed(this.deleteItemSetButton);
    }

    async clickOnDeleteItemSetButton() {
        await this.waitForDeleteItemSetButtonDisplayed();
        await this.clickOnElement(this.deleteItemSetButton);
    }

    // Types the required text in the option filter input and select an option:
    async typeTextInHtmlArea(index, text) {
        let htmlAreaForm = new HtmlAreaForm();
        let ids = await htmlAreaForm.getIdOfHtmlAreas();
        await this.execute(xpath.typeTextInHtmlArea([].concat(ids)[index], text));
        return await this.pause(200);
    }

    async typeTextInTextLine(index, text) {
        let locator = xpath.itemSet + COMMON.INPUTS.DATA_COMPONENT_INPUT + "//input";
        let elements = this.findElements(locator);
        await elements[index].setValue(text);
        return await this.pause(300);
    }
    async clearTextLine(index) {
        let locator = xpath.itemSet + COMMON.INPUTS.DATA_COMPONENT_INPUT + "//input";
        let elements = this.findElements(locator);
        await elements[index].click();
        await this.browser.keys([Key.Ctrl, 'a']);
        await this.browser.keys('Delete');
        return await this.pause(300);
    }

    async waitForAddButtonDisplayed() {
        return await this.waitForElementDisplayed(this.addItemSetButton);
    }

    waitForItemSetFormNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.occurrenceView);
    }

    async clickOnAddButton() {
        await this.waitForAddButtonDisplayed();
        await this.clickOnElement(this.addItemSetButton);
        return await this.pause(500);
    }

    async waitForCollapseAllButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.collapseAllButton);
        } catch (err) {
            await this.handleError(`Collapse all button is not displayed!`, 'item_set_collapse_all_button');
        }
    }

    async waitForExpandAllButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.expandAllButton);
        } catch (err) {
            await this.handleError(`Expand all button is not displayed!`, 'item_set_expand_all_button');
        }
    }

    async clickOnCollapseAllButton() {
        await this.waitForCollapseAllButtonDisplayed();
        await this.clickOnElement(this.collapseAllButton);
    }

    async clickOnExpandAllButton() {
        await this.waitForExpandAllButtonDisplayed();
        await this.clickOnElement(this.expandAllButton);
    }

    async waitForCollapseAllButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.collapseAllButton);
        } catch (err) {
            await this.handleError(`Collapse all button should not be displayed!`, 'item_set_collapse_button');
        }
    }

    async waitForExpandAllButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.expandAllButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('item_set_expand_button');
            throw new Error(`Expand button is not displayed! Screenshot: ${screenshot}` + err);
        }
    }

    async waitForExpandAllButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.expandAllButton);
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
        let menuButtons = await this.findElements(this.itemSetMenuTriggerButton);

        await this.doRightClickOnElement(menuButtons[index]);
        //await menuButtons[index].click();
        await this.pause(400);
        let res = await this.getDisplayedElements(
            `//div[@role='menuitem' and child::span[text()='${menuItem}']]`);
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
        let locator = xpath.occurrenceLabelButton(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let elements = await this.findElements(locator);
        await elements[index].click();
        return await this.pause(300);
    }
}

module.exports = ItemSetFormView;
