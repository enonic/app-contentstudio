/**
 * Created on 18.12.2017.  updated on 20.07.2026
 */
const BaseSelectorForm = require('./base.selector.form');
const ImageSelectorDropdown = require('../components/selectors/image.selector.dropdown');
const appConst = require('../../libs/app_const');
const {DROPDOWN, BUTTONS} = require('../../libs/elements');

const XPATH = {
    container: "//div[@data-component='FormRenderer']",
    selectorSelectionDiv: "//div[@data-component='SelectorSelection']",
    selectedOption: "//div[@data-component='ImageSelectorItemView']",
    imageNotAvailableText: "//div[@data-component='ImageSelectorItemView']//span[contains(@class,'text-error')]",
    // A selected item whose image is not available (e.g. the referenced image content was deleted):
    notAvailableSelectionItem: "//div[@data-component='SelectorSelectionItem' and descendant::span[contains(@class,'text-error') and contains(.,'Image is not available')]]",
    wizardStep: "//li[contains(@id,'TabBarItem')]/a[text()='Image selector']",
    uploaderButton: "//a[@class='dropzone']",
    flatOptionView: "//div[contains(@id,'ImageSelectorViewer')]",
};

class ImageSelectorForm extends BaseSelectorForm {

    get optionsFilterInput() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return imageSelectorDropdown.optionsFilterInput();
    }

    async waitForOptionFilterInputDisplayed() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.waitForOptionFilterInputDisplayed();
    }

    get uploaderButton() {
        return XPATH.container + XPATH.uploaderButton;
    }

    type(contentData) {
        return this.selectImages(contentData.images);
    }

    async getSelectedImagesDisplayNames() {
        let locator = XPATH.selectorSelectionDiv + `//div[@data-component='ImageSelectorItemView']` +
                      `//span[contains(@class,'font-semibold')]`;
        await this.waitForElementDisplayed(locator);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnDropdownHandle() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.clickOnDropdownHandle();
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Image selector -  clicked on dropdown handle', 'err_img_sel_dropdown_handle', err);
        }
    }

    async waitForImageNotAvailableTextDisplayed() {
        let locator = XPATH.container + XPATH.imageNotAvailableText;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let actualText = await this.getText(locator);
        return actualText === 'Image is not available';
    }

    async clickOnModeTogglerButton() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.clickOnModeTogglerButton();
        return await this.pause(1000);
    }

    async getTreeModeContentStatus(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.getTreeModeContentStatus(displayName)
    }

    async getImagesStatusInOptions(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.getImagesStatusInOptions(displayName)
    }

    async getFlatModeOptionImageNames() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.getOptionsDisplayNameInFlatMode();
    }

    async getImageItemsPathsInFlatMode() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.getImageItemsPathsInFlatMode();
    }

    selectImages(imgNames) {
        let result = Promise.resolve();
        imgNames.forEach(name => {
            result = result.then(() => this.filterOptionsSelectImageAndClickOnApply(name));
        });
        return result;
    }

    async clickOnDropDownHandleAndSelectImages(numberImages) {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        // 1. Click on the dropdown-handler and expand the selector:
        await this.clickOnDropdownHandle();
        await this.pause(700);
        // 2. Select a number of images:
        await imageSelectorDropdown.clickOnImagesInDropdownList(numberImages);
        // 3. Click on "OK" and apply the selection:
        await imageSelectorDropdown.clickOnApplySelectionButton();
        return await this.pause(1000);
    }

    // Click on Apply button:
    async clickOnApplyButton() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.clickOnApplySelectionButton();
    }

    // Do filter an image then click the option ('Apply' button does not appear in this case):
    async filterOptionsAndSelectImage(displayName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            //await this.typeTextInInput(this.optionsFilterInput, displayName);
            await imageSelectorDropdown.doFilterItem(displayName);
            return await imageSelectorDropdown.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError('Image -Selector , tried to click on filtered option', 'err_img_selector_option', err)
        }
    }

    async filterOptionsSelectImageAndClickOnApply(displayName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.doFilterItem(displayName);
            await imageSelectorDropdown.clickOnOptionByDisplayName(displayName);
            return await imageSelectorDropdown.clickOnApplySelectionButton(displayName);
        } catch (err) {
            await this.handleError('Image -Selector , tried to select the filtered option', 'err_img_selector_option', err);
        }
    }

    async doFilterOptions(displayName) {
        await this.typeTextInInput(this.optionsFilterInput, displayName);
        return await this.pause(600);
    }

    async waitForEmptyOptionsMessage() {
        try {
            let locator = "//div[@data-component='Combobox.Popup']//span[contains(@class,'text-subtle') and contains(text(),'No matching items')]"
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError(`Image Selector - 'No matching items' text should appear`, 'err_img_sel_empty_opt', err);
        }
    }

    async waitForUploaderButtonEnabled() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.waitForUploadButtonEnabled();
    }

    async waitForUploaderButtonDisabled() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.waitForUploadButtonDisabled();
    }

    async waitForUploaderButtonDisplayed() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.waitForUploadButtonDisplayed();
    }

    async waitForUploaderButtonNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.uploaderButton);
    }

    async waitForOptionsFilterInputDisplayed() {
        return await this.waitForElementDisplayed(this.optionsFilterInput);
    }

    async waitForOptionsFilterInputNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.optionsFilterInput);
        } catch (err) {
            await this.handleError('Image selector - options filter input should not be displayed', 'err_img_selector_filter_input', err);
        }
    }

    async selectOptionByImagePath(imagePath, imageDisplayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.doFilterItem(imagePath);
        // 2. Wait for the required option is displayed then click on it:
        await imageSelectorDropdown.clickOnOptionByDisplayName(imageDisplayName);
        // 3. Click on 'OK' button:
        await imageSelectorDropdown.clickOnApplySelectionButton();
        return await imageSelectorDropdown.pause(300);
    }

    async expandDropdownAndClickOnImage(displayName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.clickOnDropdownHandle();
            await imageSelectorDropdown.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError('Tried to click on the option in the expanded dropdown', 'err_img_selector_option', err);
        }
    }

    // Wait for 'Remove image' button is enabled - SelectionToolbar
    async waitForRemoveButtonEnabled(displayName) {
        let removeIcon = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
        return await this.waitForElementEnabled(removeIcon);
    }

    //Remove image button:
    async waitForRemoveButtonDisplayed(displayName) {
        try {
            let removeIcon = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
            return await this.waitForElementDisplayed(removeIcon);
        } catch (err) {
            await this.handleError(`Image Selector - Remove button for image '${displayName}' should be displayed`,
                'err_img_sel_remove_btn', err);
        }
    }

    async waitForRemoveButtonNotDisplayed(displayName) {
        let removeIcon = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
        return await this.waitForElementNotDisplayed(removeIcon);
    }

    async clickOnRemoveButton(displayName) {
        let removeIcon = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
        await this.waitForElementDisplayed(removeIcon);
        return await this.clickOnElement(removeIcon);
    }

    // Wait for the Remove button is enabled for a selected image that is not available (deleted image):
    async waitForRemoveButtonForNotAvailableImageEnabled() {
        let removeIcon = XPATH.selectorSelectionDiv + XPATH.notAvailableSelectionItem + BUTTONS.BUTTON_REMOVE_ICON;
        return await this.waitForElementEnabled(removeIcon);
    }

    // Click on the Remove button of a selected image that is not available (deleted image):
    async clickOnRemoveButtonForNotAvailableImage() {
        let removeIcon = XPATH.selectorSelectionDiv + XPATH.notAvailableSelectionItem + BUTTONS.BUTTON_REMOVE_ICON;
        await this.waitForElementDisplayed(removeIcon);
        return await this.clickOnElement(removeIcon);
    }

    async waitForItemNotDisplayedInSelectedOptions(displayName) {
        let item = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName);
        await this.waitForElementNotDisplayed(item);
    }

    // Edit image button
    async waitForEditButtonDisplayed(displayName) {
        try {
            let editButton = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_EDIT_ICON;
            return await this.waitForElementDisplayed(editButton);
        } catch (err) {
            await this.handleError(`Image Selector - Edit button for image '${displayName}' should be displayed`,
                'err_img_sel_edit_btn', err);
        }
    }

    async waitForEditButtonNotDisplayed(displayName) {
        try {
            let editButton = XPATH.selectorSelectionDiv + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_EDIT_ICON;
            return await this.waitForElementNotDisplayed(editButton);
        } catch (err) {
            await this.handleError(`Image Selector - Edit button for image '${displayName}' should not be displayed`,
                'err_img_sel_edit_btn', err);
        }
    }

    // The Edit button should not be displayed for a selected image that is not available (deleted image):
    async waitForEditButtonForNotAvailableImageNotDisplayed() {
        try {
            let editButton = XPATH.selectorSelectionDiv + XPATH.notAvailableSelectionItem + BUTTONS.BUTTON_EDIT_ICON;
            return await this.waitForElementNotDisplayed(editButton);
        } catch (err) {
            await this.handleError(`Image Selector - Edit button for the not available image should not be displayed`,
                'err_img_sel_edit_btn', err);
        }
    }

    async clickOnExpanderIconInOptionsList(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.clickOnExpanderIconInOptionsList(displayName);
        await imageSelectorDropdown.pause(300);
    }

    async waitForToggleIconNotDisplayed() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.waitForToggleIconNotDisplayed();
        } catch (err) {
            await this.handleError('Image Selector - toggle icon should not be displayed', 'err_img_selector_toggle_icon', err);
        }
    }

    async waitForToggleIconDisplayed() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown();
            await imageSelectorDropdown.waitForToggleIconDisplayed(XPATH.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_selector_toggle_icon');
            throw new Error(`Image Selector - toggle icon should be displayed!  screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnImageOptionInTreeMode(displayName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.clickOnImageInDropdownListTreeMode(displayName);
        } catch (err) {
            await this.handleError('Tried to click on the option in the expanded dropdown in tree mode',
                'err_img_selector_option_tree_mode', err);
        }
    }

    async clickOnOptionByDisplayName(displayName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError('ImageSelector - Tried to click on the option in filtered dropdown', 'err_img_selector_option', err);
        }
    }

    async clickOnApplySelectionButton() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
            await imageSelectorDropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError('Tried to click on Apply button in Image Selector dropdown', 'err_img_selector_apply_btn', err);
        }
    }

    async getTreeModeOptionDisplayNames() {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        return await imageSelectorDropdown.getOptionsDisplayNameInTreeMode();
    }
}

module.exports = ImageSelectorForm;
