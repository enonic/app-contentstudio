/**
 * Created on 03.06.2019.
 */
const BaseSelectorForm = require('./base.selector.form');
const CustomSelectorComboBox = require('../components/selectors/custom.selector.combobox');
const {Key} = require('webdriverio');

const XPATH = {
    container: "//div[@data-component='FormRenderer']",
    selectedOptionByName: option => {
        return `//div[contains(@id,'CustomSelectorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
    },
    removeButtonByDisplayName: displayName =>
        `//div[@data-component='SortableGridList']//div[@data-component='ItemLabel' and descendant::span[contains(.,'${displayName}')]]/following-sibling::button[@data-component='IconButton']`,
    sortableItems: "//div[@data-component='SortableGridList']/div[@aria-roledescription='sortable']",
    sortableItemByDisplayName: displayName =>
        `//div[@data-component='SortableGridList']/div[@aria-roledescription='sortable' and descendant::span[contains(.,'${displayName}')]]`,
};

class CustomSelectorForm extends BaseSelectorForm {

    selectedOptionByDisplayName(displayName) {
        return `//div[@data-component='SortableGridList']//div[@data-component='ItemLabel' and descendant::span[contains(.,'${displayName}')]]//button`;
    }

    getSelectedOptions() {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        return customSelectorComboBox.getSelectedOptionsDisplayName();
    }

    async selectOptionByDisplayName(optionDisplayName) {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        return await customSelectorComboBox.selectFilteredOptionAndClickOnApply(optionDisplayName);
    }

    // Clicks on the option in expanded dropdown list
    async clickOnOptionByDisplayName(optionDisplayName) {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        return await customSelectorComboBox.clickOnOptionByDisplayName(optionDisplayName);
    }

    async waitForApplyButtonDisplayed() {
        try {
            let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
            return await customSelectorComboBox.waitForApplySelectionButtonDisplayed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_button');
            throw new Error(`Custom Selector - Apply button is not visible, screenshot: ${screenshot}`  + err);
        }
    }

    async typeTextInOptionsFilterInput(text) {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        await customSelectorComboBox.doFilterItem(text);
    }

    async getDropDownListOptions() {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        return await customSelectorComboBox.getOptionsName();
    }

    async removeSelectedOption(displayName) {
        try {
            const locator = XPATH.container + XPATH.removeButtonByDisplayName(displayName);
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Custom selector form, tried to remove the selected option: ${displayName}`, 'err_remove_option', err);
        }
    }

    isOptionsFilterInputDisplayed() {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        return customSelectorComboBox.isOptionsFilterInputDisplayed();
    }

    async clickOnDropdownHandle() {
        let customSelectorComboBox = new CustomSelectorComboBox(XPATH.container);
        return await customSelectorComboBox.clickOnDropdownHandle();
    }

    // Reorders selected options via @dnd-kit's keyboard sensor:
    // focus the source row, Space to pick up, Arrow keys to step toward the destination row, Space to drop.
    async swapOptions(sourceName, destinationName) {
        try {
            const items = await this.findElements(XPATH.sortableItems);
            let sourceIndex = -1;
            let destinationIndex = -1;
            for (let i = 0; i < items.length; i++) {
                const text = await items[i].getText();
                if (sourceIndex === -1 && text.includes(sourceName)) {
                    sourceIndex = i;
                }
                if (destinationIndex === -1 && text.includes(destinationName)) {
                    destinationIndex = i;
                }
            }
            if (sourceIndex === -1 || destinationIndex === -1) {
                throw new Error(
                    `Sortable item not found: source='${sourceName}'(${sourceIndex}), destination='${destinationName}'(${destinationIndex})`);
            }
            if (sourceIndex === destinationIndex) {
                return;
            }
            const source = await this.findElement(XPATH.sortableItemByDisplayName(sourceName));
            await source.click();
            await this.pause(300);
            await this.keys(Key.Space);
            await this.pause(500);
            const steps = Math.abs(destinationIndex - sourceIndex);
            const moveKey = destinationIndex > sourceIndex ? Key.ArrowDown : Key.ArrowUp;
            for (let i = 0; i < steps; i++) {
                await this.keys(moveKey);
                await this.pause(400);
            }
            await this.keys(Key.Space);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                `Custom selector form, tried to swap selected options: '${sourceName}' <-> '${destinationName}'`,
                'err_swap_options', err);
        }
    }

    async waitForEmptyOptionsMessage() {
        try {
            let locator = "//div[@data-component='Combobox.Popup']//div[contains(@class,'text-subtle') and contains(text(),'No matching items')]";
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError(`Custom Selector - 'No matching items' text should appear`, 'err_img_sel_empty_opt', err);
        }
    }
}

module.exports = CustomSelectorForm;
