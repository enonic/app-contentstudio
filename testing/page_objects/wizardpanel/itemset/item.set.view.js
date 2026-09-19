/**
 * Created on 12.04.2019. updated on 11.02.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const { BUTTONS, COMMON } = require('../../../libs/elements');
const { Key } = require('webdriverio');

const xpath = {
    itemSet: "//div[@data-component='ItemSetView']",
    occurrenceView: "//div[@data-component='ItemSetOccurrenceView']",
    contextMenuTrigger: "//div[@data-component='ContextMenu.Trigger']",
    sortableOccurrence:
        "//div[@data-component='SortableList']/div[@role='button' and @aria-roledescription='sortable' and descendant::div[@data-component='ItemSetOccurrenceView']]",
    // The red validation icon - it is rendered inside the occurrence's label button, next to the title.
    invalidIcon: "//*[contains(@class,'octagon-alert')]",
    occurrenceLabel:
        "//div[@data-component='ContextMenu.Trigger']//button[@aria-expanded]//span[contains(@class,'font-semibold')]",
    // The clickable label button that expands/collapses an occurrence:
    occurrenceLabelButton: (text) =>
        `//div[@data-component='ItemSetOccurrenceView']//button[descendant::span[contains(@class,'font-semibold') and contains(.,'${text}')]]`,
    // Validation message for the TextLine input inside an occurrence:
    textLineValidationRecording:
        "//div[@data-component='InputField' and descendant::input[@aria-label='TextLine']]//div[contains(@class,'text-error')]",
    // Validation message for the HtmlArea input inside an occurrence:
    htmlAreaValidationRecording:
        "//div[@data-component='InputField' and descendant::div[@data-name='CKEditorWrapper']]//div[contains(@class,'text-error')]",
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
        return "//button[@data-component='Button' and @aria-label='Delete']";
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

    // CKEditor ids are not unique across ItemSet occurrences (all get 'htmlarea-<name>-0'),
    // so CKEDITOR.instances[id] always resolves to the same editor. Type the text with real
    // keyboard input inside the occurrence's iframe instead of the CKEDITOR API:
    async typeTextInHtmlArea(index, text) {
        let frameLocator = xpath.occurrenceView + "//div[@data-name='CKEditorWrapper']//iframe";
        await this.waitForElementDisplayed(frameLocator, appConst.mediumTimeout);
        let frames = await this.findElements(frameLocator);
        if (index >= frames.length) {
            throw new Error(
                `ItemSet form - html area with index ${index} was not found, total areas: ${frames.length}`,
            );
        }
        await this.getBrowser().switchFrame(frames[index]);
        try {
            await this.clickOnElement('//body');
            await this.browser.keys(text);
        } finally {
            await this.switchToParentFrame();
        }
        return await this.pause(200);
    }

    async typeTextInTextLine(index, text) {
        let locator = xpath.itemSet + COMMON.INPUTS.DATA_COMPONENT_INPUT + '//input';
        let elements = this.findElements(locator);
        await elements[index].setValue(text);
        return await this.pause(300);
    }
    async clearTextLine(index) {
        let locator = xpath.itemSet + COMMON.INPUTS.DATA_COMPONENT_INPUT + '//input';
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
        await this.pause(500);
    }

    async waitForCollapseAllButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.collapseAllButton);
        } catch (err) {
            await this.handleError(`Collapse all button should not be displayed!`, 'item_set_collapse_button');
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
        let res = await this.getDisplayedElements(`//div[@role='menuitem' and child::span[text()='${menuItem}']]`);
        await res[0].waitForEnabled({
            timeout: appConst.shortTimeout,
            timeoutMsg: 'Option Set - Delete menu item should be enabled!',
        });
        await res[0].click();
        return await this.pause(300);
    }

    async swapItems(sourceName, destinationName) {
        try {
            let items = await this.findElements(xpath.sortableOccurrence);
            let sourceIndex = -1;
            let destinationIndex = -1;
            for (let i = 0; i < items.length; i++) {
                let text = await items[i].getText();
                if (sourceIndex === -1 && text.includes(sourceName)) {
                    sourceIndex = i;
                }
                if (destinationIndex === -1 && text.includes(destinationName)) {
                    destinationIndex = i;
                }
            }
            if (sourceIndex === -1 || destinationIndex === -1) {
                throw new Error(
                    `Occurrence not found - source: '${sourceName}'(${sourceIndex}), destination: '${destinationName}'(${destinationIndex})`,
                );
            }
            if (sourceIndex === destinationIndex) {
                return;
            }
            let source = items[sourceIndex];
            // Focus the wrapper itself - a click would land on the label button and expand the occurrence:
            await this.getBrowser().execute((el) => el.focus(), source);
            await this.pause(200);
            // Pick the occurrence up:
            await this.keys('Space');
            await this.getBrowser().waitUntil(
                async () => {
                    let dragging = await source.getAttribute('data-dragging');
                    return dragging === 'true';
                },
                {
                    timeout: appConst.shortTimeout,
                    timeoutMsg: `DnD - the occurrence '${sourceName}' was not picked up`,
                },
            );
            // Move it towards the destination position, one slot per arrow press:
            let steps = destinationIndex - sourceIndex;
            let arrowKey = steps > 0 ? 'ArrowDown' : 'ArrowUp';
            for (let i = 0; i < Math.abs(steps); i++) {
                await this.keys(arrowKey);
                await this.pause(300);
            }
            // Drop the occurrence in its new position:
            await this.keys('Space');
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                `Item Set - error during items swap: '${sourceName}' and '${destinationName}'`,
                'err_item_set_swap',
                err,
            );
        }
    }

    // Labels of all occurrences, in the order they are displayed in the form:
    async getOccurrenceLabels() {
        let locator = xpath.itemSet + xpath.occurrenceView + xpath.occurrenceLabel;
        return await this.getTextInDisplayedElements(locator);
    }

    async getOccurrenceLabel(index) {
        let labels = await this.getOccurrenceLabels();
        if (index >= labels.length) {
            throw new Error(
                `Item Set - occurrence with the index ${index} was not found, total occurrences: ${labels.length}`,
            );
        }
        return labels[index].trim();
    }

    // Returns true when the occurrence shows the red validation icon next to its title.
    // Same parameters as 'clickOnFormOccurrence': the label narrows the occurrences down, the index
    // picks one of them - occurrences with empty required inputs all fall back to the same default
    // label (the set name), so the label alone is not unique exactly in the invalid state:
    async isOccurrenceInvalid(label, index = 0) {
        try {
            let locator = await this.buildInvalidIconLocator(label, index);
            return await this.isElementDisplayed(locator);
        } catch (err) {
            await this.handleError(
                `Item Set - tried to check the validation icon in the occurrence '${label}'(${index})`,
                'err_item_set_occurrence_icon',
                err,
            );
        }
    }

    async waitForOccurrenceInvalidIconDisplayed(label, index = 0) {
        try {
            let locator = await this.buildInvalidIconLocator(label, index);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Item Set - the validation icon should be displayed in the occurrence '${label}'(${index})`,
                'err_item_set_occurrence_icon',
                err,
            );
        }
    }

    async waitForOccurrenceInvalidIconNotDisplayed(label, index = 0) {
        try {
            let locator = await this.buildInvalidIconLocator(label, index);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Item Set - the validation icon should not be displayed in the occurrence '${label}'(${index})`,
                'err_item_set_occurrence_icon',
                err,
            );
        }
    }

    async isOccurrenceExpanded(label, index = 0) {
        let locator = `(${xpath.occurrenceLabelButton(label)})[${index + 1}]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let button = await this.findElement(locator);
        let expanded = await button.getAttribute('aria-expanded');
        return expanded === 'true';
    }

    // The validation icon is rendered in the header of collapsed occurrences only (an expanded one shows
    // the errors in its inputs instead), so the state has to be ensured before checking the icon.
    // Does nothing when the occurrence is already collapsed:
    async collapseOccurrence(label, index = 0) {
        if (await this.isOccurrenceExpanded(label, index)) {
            await this.clickOnFormOccurrence(label, index);
        }
        return await this.pause(300);
    }

    // The label button is expected to exist - otherwise a missing occurrence would look like a valid one:
    async buildInvalidIconLocator(label, index) {
        let labelButton = xpath.occurrenceLabelButton(label);
        let buttons = await this.findElements(labelButton);
        if (index >= buttons.length) {
            throw new Error(
                `occurrence '${label}' with the index ${index} was not found, total occurrences with this label: ${buttons.length}`,
            );
        }
        return `(${labelButton})[${index + 1}]` + xpath.invalidIcon;
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
