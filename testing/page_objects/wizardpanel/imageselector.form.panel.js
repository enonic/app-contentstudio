/**
 * Created on 18.12.2017.
 */
const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
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
        return lib.IMAGE_CONTENT_COMBOBOX.DIV + lib.DROP_DOWN_HANDLE;
    }

    get modeTogglerButton() {
        return lib.IMAGE_CONTENT_COMBOBOX.DIV + lib.COMBOBOX.MODE_TOGGLER_BUTTON;
    }

    get optionsFilterInput() {
        return lib.FORM_VIEW + XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
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
            throw  new Error('image combobox dropdown handle not found ' + err);
        }
    }

    async clickOnModeTogglerButton() {
        await this.clickOnElement(this.modeTogglerButton);
        return await this.pause(1500);
    }

    // Expands a folder in Tree Mode:
    async expandFolderInOptions(folderName) {
        let locator = lib.expanderIconByName(folderName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async getTreeModeOptionDisplayNames() {
        let options = lib.IMAGE_CONTENT_COMBOBOX.DIV + lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(options, appConst.mediumTimeout);
        return await this.getTextInElements(options);
    }

    async getTreeModeOptionStatus() {
        let options = lib.IMAGE_CONTENT_COMBOBOX.DIV + lib.SLICK_VIEW_PORT + "//div[contains(@class,'r1')]";
        await this.waitForElementDisplayed(options, appConst.mediumTimeout);
        return await this.getTextInElements(options);
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

    clickOnOptions(elements, viewport) {
        let result = Promise.resolve();
        let i = 0;
        elements.forEach(el => {
            result = result.then(() => {
                return el.click();
            }).then(() => {
                return this.pause(500);
            }).then(() => {
                i++;
                if (i === 3) {
                    return this.doScroll(viewport, 180);
                }
            }).then(() => {
                return this.pause(500);
            });
        });
        return result;
    }

    // Expand the dropdown then click on checkboxes in the dropdown-options:
    async clickOnDropDownHandleAndSelectImages(numberImages) {
        await this.clickOnDropdownHandle();
        await this.pause(700);
        let selector = lib.IMAGE_CONTENT_COMBOBOX.DIV + lib.SLICK_ROW + "//div[contains(@class,'checkboxsel')]";
        let elems = await this.findElements(selector);
        let viewportElement = await this.findElements(
            lib.IMAGE_CONTENT_COMBOBOX.DIV + "//div[contains(@id,'OptionsTreeGrid')]" + "//div[contains(@class, 'slick-viewport')]");
        // Scrolls and clicks on options in the dropdown:
        await this.clickOnOptions(elems.slice(0, numberImages), viewportElement[0]);
        await this.clickOnApplyButton();
        return await this.pause(1000);
    }

    // Scrolls viewport in the dropdown:
    doScroll(viewportElement, step) {
        return this.getBrowser().execute("arguments[0].scrollTop=arguments[1]", viewportElement, step);
    }

    async clickOnApplyButton() {
        let selector = lib.IMAGE_CONTENT_COMBOBOX.DIV + "//span[text()='Apply']";
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.clickOnElement(selector);
    }

    async filterOptionsAndSelectImage(displayName) {
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.optionsFilterInput, displayName);
        return await loaderComboBox.selectOption(displayName);
    }

    async expandDropdownClickOnImage(displayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            await this.clickOnDropdownHandle();
            return await loaderComboBox.selectOption(displayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('img_selector_option');
            throw new Error('Image -Selector , error during selecting the option: screenshot ' + screenshot + ' ' + err);
        }
    }

    async doFilterOptions(displayName) {
        await this.typeTextInInput(this.optionsFilterInput, displayName);
        return await this.pause(600);
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(XPATH.container + lib.EMPTY_OPTIONS_DIV, appConst.longTimeout);
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

    async clickOnExpanderIconInOptions(name) {
        let expanderIcon = lib.IMAGE_CONTENT_COMBOBOX.DIV + XPATH.expanderIconByName(name);
        await this.clickOnElement(expanderIcon);
        return await this.pause(700);
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
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.optionsFilterInput, imagePath);
        await loaderComboBox.selectOption(imageDisplayName);
        return await loaderComboBox.pause(300);
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

    // Edit image button
    waitForEditButtonDisplayed() {
        return this.waitForElementDisplayed(this.editButton, appConst.mediumTimeout);
    }

    async getNumberItemInRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        let locator = this.removeButton + "/span";
        return await this.getText(locator);
    }
}

module.exports = ImageSelectorForm;
