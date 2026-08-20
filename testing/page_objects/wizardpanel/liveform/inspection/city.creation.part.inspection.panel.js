/**
 * Created on 08.11.2023 updated on 19.08.2026
 */
const appConst = require('../../../../libs/app_const');
const { DROPDOWN, BUTTONS } = require('../../../../libs/elements');
const ImageSelectorDropdown = require('../../../components/selectors/image.selector.dropdown');
const PartInspectionPanel = require('./part.inspection.panel');

const xpath = {
    imageSelectorDiv: "//div[@data-component='ImageSelector']",
    contentComboboxDiv: "//div[@data-component='ContentCombobox']",
    selectorSelectionDiv: "//div[@data-component='SelectorSelection']",
    uploadButton: "//div[@data-component='SelectorUploadButton']//button",
    // 'Combobox.Apply' button is rendered in the Combobox.Search (not in the portaled popup) when there are staged changes:
    applySelectionButton: "//button[@data-component='Combobox.Apply']",
    // Selected image view: holds the display name(span.font-semibold), the path(bdi) and the status(StatusBadge):
    selectionItemView: "//div[@data-component='SelectorSelectionItem']//div[@data-component='ImageSelectorItemView']",
    displayNameSpan: "//span[contains(@class,'font-semibold')]",
    fieldErrorSpan: "//div[@data-component='FieldError']//span",
};

// Context Window, Inspect tab for City Creation Part Component
class CityCreationPartInspectionPanel extends PartInspectionPanel {
    get imageSelector() {
        return this.container + xpath.imageSelectorDiv;
    }

    get imageContentCombobox() {
        return this.imageSelector + xpath.contentComboboxDiv;
    }

    get imageComboBoxDropdownHandle() {
        return this.imageSelector + DROPDOWN.DROPDOWN_HANDLE;
    }

    get imageSelectorModeToggleButton() {
        return this.imageSelector + DROPDOWN.MODE_TOGGLE;
    }

    get imageSelectorOptionsFilterInput() {
        return this.imageSelector + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
    }

    get imageSelectorUploadButton() {
        return this.imageSelector + xpath.uploadButton;
    }

    get applySelectionButton() {
        return this.imageSelector + xpath.applySelectionButton;
    }

    async clickOnImageSelectorModeTogglerButton() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(this.container);
            await imageSelectorDropdown.clickOnModeTogglerButton();
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                'City Creation Part Inspection Panel',
                'err_inspect_panel_selector_mode_toggle',
                err,
            );
        }
    }

    async getTreeModeOptionsImagesDisplayName() {
        let imageSelectorDropdown = new ImageSelectorDropdown(this.container);
        return await imageSelectorDropdown.getOptionsDisplayNameInTreeMode();
    }

    async getFlatModeOptionsImagesDisplayName() {
        let imageSelectorDropdown = new ImageSelectorDropdown(this.container);
        return await imageSelectorDropdown.getOptionsDisplayNameInFlatMode();
    }

    async selectImage(displayName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(this.container);
            await this.doFilterImages(displayName);
            await imageSelectorDropdown.clickOnOptionByDisplayName(displayName);
            // 'Apply' button appears in the multiple selection mode only:
            if (await this.isElementDisplayed(this.applySelectionButton)) {
                await this.clickOnElement(this.applySelectionButton);
            }
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                `City Creation Part Inspection Panel, tried to select the image: ${displayName}`,
                'err_inspect_panel_select_image',
                err,
            );
        }
    }

    async doFilterImages(displayName) {
        await this.waitForElementDisplayed(this.imageSelectorOptionsFilterInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.imageSelectorOptionsFilterInput, displayName);
        return await this.pause(700);
    }

    async removeSelectedImage(displayName) {
        try {
            let locator =
                this.container +
                xpath.selectorSelectionDiv +
                DROPDOWN.selectedItemByDisplayName(displayName) +
                BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                `City Creation Part Inspection Panel, tried to remove the image: ${displayName}`,
                'err_inspect_panel_remove_image',
                err,
            );
        }
    }

    async getSelectedImagesDisplayName() {
        let locator = this.container + xpath.selectionItemView + xpath.displayNameSpan;
        await this.waitForElementDisplayed(locator);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnImageDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.imageComboBoxDropdownHandle);
            await this.clickOnElement(this.imageComboBoxDropdownHandle);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('City Creation Part Inspection Panel', 'err_inspect_panel_img_dropdown', err);
        }
    }

    async waitForUploadButtonDisplayed() {
        return await this.waitForElementDisplayed(this.imageSelectorUploadButton, appConst.mediumTimeout);
    }

    // Gets the validation message under the image-selector, e.g. 'Min 2 valid occurrence(s) required':
    async getValidationMessage() {
        let locator = this.container + xpath.fieldErrorSpan;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForValidationMessageNotDisplayed() {
        return this.waitForElementNotDisplayed(this.container + xpath.fieldErrorSpan, appConst.mediumTimeout);
    }

    async waitForLoaded() {
        try {
            return await this.waitForElementDisplayed(this.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('City Creation Part Inspection Panel', 'err_city_creation_part_inspect_panel', err);
        }
    }
}

module.exports = CityCreationPartInspectionPanel;
