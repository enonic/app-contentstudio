/**
 * Created on 18.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const XPATH = {
    wizardStep: `//li[contains(@id,'TabBarItem')]/a[text()='Image selector']`,
    imageContentComboBox: `//div[contains(@id,'ImageContentComboBox')]`,
    flatOptionView: `//div[contains(@id,'ImageSelectorViewer')]//img`,
    modeTogglerButton: `//button[contains(@id,'ModeTogglerButton')]`,
    selectedOption: "//div[contains(@id,'ImageSelectorSelectedOptionView')]",
    selectedOptions: "//div[contains(@id,'ImageSelectorSelectedOptionsView')]",
    selectedImageByName: function (imageName) {
        return `//div[contains(@id,'ImageSelectorSelectedOptionView') and descendant::div[contains(@class,'label') and text()='${imageName}']]`
    },
    expanderIconByName: function (name) {
        return lib.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
}

class ImageSelectorForm extends Page {

    get imageComboBoxDrppdownHandle() {
        return XPATH.imageContentComboBox + lib.DROP_DOWN_HANDLE;
    }

    get modeTogglerButton() {
        return XPATH.imageContentComboBox + XPATH.modeTogglerButton;
    }

    get imagesOptionsFilterInput() {
        return lib.FORM_VIEW + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }


    type(contentData) {
        return this.selectImages(contentData.images);
    }


    clickOnDropdownHandle() {
        return this.clickOnElement(this.imageComboBoxDrppdownHandle).catch(err => {
            this.saveScreenshot('err_img_sel_dropdown_handle');
            throw  new Error('image combobox dropdown handle not found ' + err);
        });
    }

    async clickOnModeTogglerButton() {
        await this.clickOnElement(this.modeTogglerButton);
        return await this.pause(1000);
    }

    getTreeModeOptionDisplayNames() {
        let options = lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(options);
    }

    getFlatModeOptionImageNames() {
        let titles = [];
        let imgSelector = XPATH.flatOptionView;
        return this.waitForElementDisplayed(imgSelector, appConst.TIMEOUT_2).then(() => {
            return this.findElements(imgSelector);
        }).then(result => {
            result.forEach(el => {
                titles.push(this.getBrowser().getElementAttribute(el.elementId, 'title'));
            });
            return Promise.all(titles).then(p => {
                return p;
            });
        });
    }


    selectImages(imgNames) {
        let result = Promise.resolve();
        imgNames.forEach(name => {
            result = result.then(() => this.filterOptionsAndSelectImage(name));
        });
        return result;
    }

    clickOnElements(elements) {
        let result = Promise.resolve();
        elements.forEach(el => {
            result = result.then(() => {
                return el.click()
            }).then(() => {
                return this.pause(300);
            });
        });
        return result;
    }

    async clickOnDropDownHandleAndSelectImages(numberImages) {
        await this.clickOnDropdownHandle();
        await this.pause(700);
        let selector = XPATH.imageContentComboBox + lib.SLICK_ROW + "//div[contains(@class,'checkboxsel')]";
        let elems = await this.findElements(selector);
        await this.clickOnElements(elems.slice(0, numberImages));
        await this.clickOnApplyButton();
        await this.pause(1000);
    }

    async clickOnApplyButton() {
        let selector = XPATH.imageContentComboBox + "//span[text()='Apply']";
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        return await this.clickOnElement(selector);
    }

    filterOptionsAndSelectImage(displayName) {
        let loaderComboBox = new LoaderComboBox();
        return this.typeTextInInput(this.imagesOptionsFilterInput, displayName).then(() => {
            return loaderComboBox.selectOption(displayName);
        });
    }

    async doFilterOptions(displayName) {
        await this.typeTextInInput(this.imagesOptionsFilterInput, displayName);
        return this.pause(600);
    }

    waitForEmptyOptionsMessage(displayName) {
        return this.waitForElementDisplayed(`//div[contains(@class,'empty-options') and text()='No matching items']`,
            appConst.TIMEOUT_3).catch(
            err => {
                console.log("Error: " + err);
                this.saveScreenshot("err_empty_options");
                return false;
            });
    }

    async clickOnExpanderIconInOptions(name) {
        let expanderIcon = XPATH.imageContentComboBox + XPATH.expanderIconByName(name);
        await this.clickOnElement(expanderIcon);
        return await this.pause(700);
    }
};
module.exports = ImageSelectorForm;