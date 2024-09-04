/**
 * Created on 18.12.2017.
 */
const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const ImageSelectorDropdown = require('../components/image.selector.dropdown');

const XPATH = {
    container: "//div[contains(@id,'ImageSelector')]",
    wizardStep: "//li[contains(@id,'TabBarItem')]/a[text()='Image selector']",
    uploaderButton: "//a[@class='dropzone']",
    flatOptionView: "//div[contains(@id,'ImageSelectorViewer')]",
    selectedOption: "//div[contains(@id,'ImageSelectorSelectedOptionView')]",
    selectedOptions: "//div[contains(@id,'ImageSelectorSelectedOptionsView')]",
    editButton: "//div[contains(@id,'SelectionToolbar')]//button[child::span[contains(.,'Edit')]]",
    removeButton: "//div[contains(@id,'SelectionToolbar')]//button[child::span[contains(.,'Remove')]]",
    selectedImageByDisplayName: function (imageDisplayName) {
        return `//div[contains(@id,'ImageSelectorSelectedOptionView') and descendant::div[contains(@class,'label') and text()='${imageDisplayName}']]`
    },
    expanderIconByName: function (name) {
        return lib.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
};

class ImageSelectorForm extends BaseSelectorForm {

    get imageComboBoxDropdownHandle() {
        return lib.FORM_VIEW + XPATH.container + lib.DROP_DOWN_HANDLE;
    }

    get optionsFilterInput() {
        return lib.FORM_VIEW + XPATH.container + lib.OPTION_FILTER_INPUT;
    }

    get uploaderButton() {
        return XPATH.container + XPATH.uploaderButton;
    }

    get validationRecord() {
        return lib.FORM_VIEW + lib.inputView + lib.validationRecording;
    }

    get editButton() {
        return lib.FORM_VIEW + XPATH.editButton;
    }

    get removeButton() {
        return lib.FORM_VIEW + XPATH.removeButton;
    }

    type(contentData) {
        return this.selectImages(contentData.images);
    }

    async getSelectedImages() {
        let locator = XPATH.selectedOption + "//div[@class='label']";
        return await this.getTextInElements(locator);
    }

    async clickOnDropdownHandle() {
        try {
            await this.clickOnElement(this.imageComboBoxDropdownHandle);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_img_sel_dropdown_handle');
            throw new Error('image combobox dropdown handle not found ' + err);
        }
    }

    async clickOnModeTogglerButton() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.clickOnModeTogglerButton(XPATH.container);
        return await this.pause(1500);
    }

    async getTreeModeContentStatus(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        return await imageSelectorDropdown.getTreeModeContentStatus(displayName)
    }

    async getImagesStatusInOptions(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        return await imageSelectorDropdown.getImagesStatusInOptions(displayName)
    }


    async getFlatModeOptionImageNames() {
        let titles = [];
        let imgSelector = XPATH.flatOptionView;
        await this.waitForElementDisplayed(imgSelector, appConst.mediumTimeout);
        let result = await this.findElements(imgSelector);
        for (const item of result) {
            titles.push(await this.getBrowser().getElementAttribute(item.elementId, 'title'));
        }
        return titles;
    }

    selectImages(imgNames) {
        let result = Promise.resolve();
        imgNames.forEach(name => {
            result = result.then(() => this.filterOptionsAndSelectImage(name));
        });
        return result;
    }

    async clickOnDropDownHandleAndSelectImages(numberImages) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        // 1. Click on the dropdown-handler and expand the selector:
        await this.clickOnDropdownHandle();
        await this.pause(700);
        // 2. Select a number of images:
        await imageSelectorDropdown.clickOnImagesInDropdownList(numberImages);
        // 3. Click on "OK" and apply the selection:
        await imageSelectorDropdown.clickOnApplySelectionButton();
        return await this.pause(1000);
    }

    async clickOnApplyButton() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        return await imageSelectorDropdown.clickOnApplySelectionButton();
    }

    async filterOptionsAndSelectImage(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await this.typeTextInInput(this.optionsFilterInput, displayName);
        return await imageSelectorDropdown.clickOnFilteredItemAndClickOnOk(displayName, XPATH.container);
    }

    async doFilterOptions(displayName) {
        await this.typeTextInInput(this.optionsFilterInput, displayName);
        return await this.pause(600);
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(XPATH.container + lib.EMPTY_OPTIONS_DIV, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_empty_opt');
            throw new Error("Image Selector - Empty options text should appear visible, screenshot: " + screenshot + ' ' + err);
        }
    }

    waitForUploaderButtonEnabled() {
        return this.waitForElementEnabled(this.uploaderButton, appConst.mediumTimeout);
    }

    waitForOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.optionsFilterInput, appConst.mediumTimeout);
    }

    waitForOptionsFilterInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.optionsFilterInput, appConst.mediumTimeout);
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
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.filterItem(imagePath);
        // 2. Wait for the required option is displayed then click on it:
        await imageSelectorDropdown.clickOnOptionByDisplayName(imageDisplayName);
        // 3. Click on 'OK' button:
        await imageSelectorDropdown.clickOnApplySelectionButton();
        return await imageSelectorDropdown.pause(300);
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
        return this.waitForElementDisplayed(this.editButton, appConst.mediumTimeout);
    }

    async getNumberItemInRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        let locator = this.removeButton + "/span";
        return await this.getText(locator);
    }

    async clickOnExpanderIconInOptionsList(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.clickOnOptionExpanderIcon(displayName);
        await imageSelectorDropdown.pause(300);
    }

    async clickOnImageOptionInTreeMode(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.clickOnImageInDropdownListTreeMode(displayName, XPATH.container);
    }

    async clickOnOkAndApplySelectionButton() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown();
            await imageSelectorDropdown.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error("Error occurred in Content combobobox, OK button, screenshot: " + screenshot + ' ' + err);
        }
    }

    async getTreeModeOptionDisplayNames() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        return await imageSelectorDropdown.getOptionsDisplayNameInTreeMode(XPATH.container);
    }
}

module.exports = ImageSelectorForm;
