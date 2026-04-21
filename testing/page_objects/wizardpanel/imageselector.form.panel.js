/**
 * Created on 18.12.2017.
 */
const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements-old');
const ImageSelectorDropdown = require('../components/selectors/image.selector.dropdown');
const appConst = require('../../libs/app_const');
const {DROPDOWN} = require('../../libs/elements');

const XPATH = {
    container: "//div[@data-component='FormRenderer']",
    selectorSelectionDiv: "//div[@data-component='SelectorSelection']",
    selectedOption: "//div[@data-component='ImageSelectorItemView']",

    wizardStep: "//li[contains(@id,'TabBarItem')]/a[text()='Image selector']",
    uploaderButton: "//a[@class='dropzone']",
    flatOptionView: "//div[contains(@id,'ImageSelectorViewer')]",
    editButton: "//div[contains(@id,'SelectionToolbar')]//button[child::span[contains(.,'Edit')]]",
    removeButton: "//div[contains(@id,'SelectionToolbar')]//button[child::span[contains(.,'Remove')]]",
    selectedImageByDisplayName(imageDisplayName) {
        return `//div[contains(@id,'ImageSelectorSelectedOptionView') and descendant::div[contains(@class,'label') and text()='${imageDisplayName}']]`
    },
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


    // Edit image button - SelectionToolbar
    get editButton() {
        return lib.FORM_VIEW + XPATH.editButton;
    }

    // Remove image button - SelectionToolbar
    get removeButton() {
        return lib.FORM_VIEW + XPATH.removeButton;
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
        let locator = lib.FORM_VIEW + XPATH.selectedOption + lib.itemByName('Image is not available');
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let elements = await this.findElements(locator);
        return elements.length;
    }

    async clickOnSelectedOptionByIndex(index) {
        let locator = lib.FORM_VIEW + XPATH.selectedOption + "//div[contains(@class,'squared-content')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let imagesEl = await this.findElements(locator);
        if (index > imagesEl.length) {
            throw new Error('Image selector form, the number of selected options less than the index');
        }
        return await this.doTouchActionOnElement(imagesEl[index]);
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
            let locator = "//div[@data-combobox-popup]//span[contains(@class,'text-subtle') and contains(text(),'No matching items')]"
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError(`Image Selector - 'No matching items' text should appear`, 'err_img_sel_empty_opt', err);
        }
    }

    waitForUploaderButtonEnabled() {
        return this.waitForElementEnabled(this.uploaderButton);
    }

    waitForOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.optionsFilterInput);
    }

    async waitForOptionsFilterInputNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.optionsFilterInput);
        } catch (err) {
            await this.handleError('Image selector - options filter input should not be displayed', 'err_img_selector_filter_input', err);
        }
    }


    async clickOnSelectedImage(displayName) {
        let locator = XPATH.selectedImageByDisplayName(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }

    async clickOnCheckboxInSelectedImage(displayName) {
        let locator = XPATH.selectedImageByDisplayName(displayName) + "//div[contains(@id,'Checkbox')]//label";
        return await this.doTouchAction(locator);
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

    //Remove image button:
    waitForRemoveButtonDisplayed() {
        return this.waitForElementDisplayed(this.removeButton, appConst.mediumTimeout);
    }

    waitForRemoveButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.removeButton, appConst.mediumTimeout);
    }

    async clickOnRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        await this.clickOnElement(this.removeButton);
        return await this.pause(300);
    }

    //Edit image button
    waitForEditButtonDisplayed() {
        return this.waitForElementDisplayed(this.editButton);
    }

    async getNumberItemInRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        let locator = this.removeButton + '/span';
        return await this.getText(locator);
    }

    async clickOnExpanderIconInOptionsList(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown(XPATH.container);
        await imageSelectorDropdown.clickOnExpanderIconInOptionsList(displayName);
        await imageSelectorDropdown.pause(300);
    }

    async waitForToggleIconNotDisplayed() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown();
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
            await imageSelectorDropdown.clickOnImageInDropdownListTreeMode(displayName );
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

    // Wait for 'Edit image' button is enabled - SelectionToolbar
    waitForEditButtonDisabled() {
        return this.waitForElementDisabled(this.editButton, appConst.mediumTimeout);
    }

    // Wait for 'Remove image' button is enabled - SelectionToolbar
    waitForRemoveButtonEnabled() {
        return this.waitForElementEnabled(this.removeButton, appConst.mediumTimeout);
    }
}

module.exports = ImageSelectorForm;
