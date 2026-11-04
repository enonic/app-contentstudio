/**
 * Created on 09.07.2020.  updated on 04.11.2026
 */
const { BUTTONS } = require('../../libs/elements');
const BaseSelectorForm = require('./base.selector.form');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const { Key } = require('webdriverio');

const XPATH = {
    container: "//div[@data-component='FormRenderer']",
    selectorSelectionDiv: "//div[@data-component='SelectorSelection']",
    selectedItemByDisplayName: (displayName) =>
        `//div[@data-component='SelectorSelectionItem' and descendant::span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,
};

class ContentSelectorForm extends BaseSelectorForm {
    // The dropdown is stateless (holds only the container xpath), so one instance is shared by all methods
    #dropdown = new ContentSelectorDropdown(XPATH.container);

    get optionsFilterInput() {
        return this.#dropdown.optionsFilterInput();
    }

    async waitForOptionFilterInputDisplayed() {
        return await this.#dropdown.waitForOptionFilterInputDisplayed();
    }

    async clickOnModeTogglerButton() {
        await this.#dropdown.clickOnModeTogglerButton();
        await this.pause(1000);
    }

    async clickOnDropdownHandle() {
        await this.#dropdown.clickOnDropdownHandle();
        await this.pause(1000);
    }

    async clickOnCheckboxInDropdown(index) {
        await this.#dropdown.clickOnCheckboxInDropdown(index);
    }

    selectedOptionByDisplayName(displayName) {
        return (
            XPATH.selectorSelectionDiv +
            `/div[@role='button' and @aria-roledescription='sortable' and descendant::span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`
        );
    }

    async swapOptions(sourceName, destinationName) {
        try {
            const sortableLocator =
                XPATH.container +
                XPATH.selectorSelectionDiv +
                "/div[@role='button' and @aria-roledescription='sortable']";
            const items = await this.findElements(sortableLocator);
            let sourceIndex = -1;
            let destinationIndex = -1;
            for (let i = 0; i < items.length; i++) {
                const text = await items[i].getText();
                if (sourceIndex === -1 && text.includes(sourceName)) sourceIndex = i;
                if (destinationIndex === -1 && text.includes(destinationName)) destinationIndex = i;
            }
            if (sourceIndex === -1 || destinationIndex === -1) {
                throw new Error(
                    `Sortable item not found: source='${sourceName}'(${sourceIndex}), destination='${destinationName}'(${destinationIndex})`,
                );
            }
            if (sourceIndex === destinationIndex) {
                return;
            }
            const source = await this.findElement(XPATH.container + this.selectedOptionByDisplayName(sourceName));
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
                `Content selector form, tried to swap options: '${sourceName}' <-> '${destinationName}'`,
                'err_swap_options',
                err,
            );
        }
    }

    async getSelectedOptions() {
        return await this.#dropdown.getSelectedOptionsDisplayName();
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            await this.#dropdown.waitForAddNewContentButtonDisplayed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error(`'Add new' button is not displayed, screenshot:${screenshot} ` + err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            await this.#dropdown.waitForAddNewContentButtonNotDisplayed();
        } catch (err) {
            await this.handleError(
                `Content selector, 'Add new' button should not be displayed`,
                'err_add_new_btn',
                err,
            );
        }
    }

    async clickOnAddNewContentButton() {
        try {
            await this.#dropdown.waitForAddNewContentButtonDisplayed();
            await this.#dropdown.clickOnAddNewContentButton();
        } catch (err) {
            await this.handleError(`Content selector, 'Add new' button:`, 'err_click_add_new_btn', err);
        }
    }

    // Selects an option by the display-name then click on Apply selection  button:
    async clickOnOptionByDisplayNameAndApply(optionDisplayName) {
        try {
            await this.#dropdown.doFilterItem(optionDisplayName);
            await this.#dropdown.clickOnListItemOptionByDisplayName(optionDisplayName);
            await this.#dropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(
                `Content selector, tried to click on the option: ${optionDisplayName} and click on Apply button`,
                'err_combobox',
                err,
            );
        }
    }

    // if dropdown in three mode then after entering text it should automatically switch to flat mode.
    // Insert a text in Filter input, switches to flat mode, then click on the filtered by displayName item
    async doFilterOptionInTreeModeAndApply(optionDisplayName) {
        try {
            await this.#dropdown.clearOptionsFilterInput();
            await this.#dropdown.doFilterItem(optionDisplayName);
            let mode = await this.getOptionsMode();
            // TODO check the mode
            // 2. Wait for the required option is displayed then click on it:
            await this.#dropdown.clickOnTreeItemOptionByDisplayName(optionDisplayName);
            // 3. Click on 'Apply' button:
            return await this.#dropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(
                `Content selector, tried to select: ${optionDisplayName} in tree mode and Apply`,
                'err_combobox_tree_mode',
                err,
            );
        }
    }

    async clickOnApplySelectionButton() {
        try {
            await this.#dropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`Content selector, tried to click on Apply button`, 'err_apply_btn', err);
        }
    }

    async getOptionsDisplayNameInTreeMode() {
        try {
            return await this.#dropdown.getOptionsDisplayNameInTreeMode();
        } catch (err) {
            await this.handleError(
                `Content selector, tried to get options display name in tree mode`,
                'err_get_options_tree_mode',
                err,
            );
        }
    }

    async getOptionsDisplayNameInFlatMode() {
        try {
            return await this.#dropdown.getOptionsDisplayNameInFlatMode();
        } catch (err) {
            await this.handleError(
                `Content selector, tried to get options display name in flat mode`,
                'err_get_options_flat_mode',
                err,
            );
        }
    }

    async removeSelectedOption(displayName) {
        try {
            const locator = XPATH.container + XPATH.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError(
                `Content selector form, tried to remove the selected option: ${displayName}`,
                'err_remove_option',
                err,
            );
        }
    }

    async clickOnEditSelectedOption(displayName) {
        try {
            const locator = XPATH.container + XPATH.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_EDIT_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError(
                `Content selector , tried to edit the selected option: ${displayName}`,
                'err_edit_option',
                err,
            );
        }
    }

    async getOptionsMode() {
        return await this.#dropdown.getMode();
    }

    async getCheckedOptionsDisplayNameInDropdownList() {
        return await this.#dropdown.getCheckedOptionsDisplayNameInDropdownList();
    }
}

module.exports = ContentSelectorForm;
