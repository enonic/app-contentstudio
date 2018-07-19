/**
 * Created on 18.12.2017.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');
var form = {
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
        return elements.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;

    },
}
var imageSelectorForm = Object.create(page, {

    imageComboBoxDrppdownHandle: {
        get: function () {
            return `${form.imageContentComboBox}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    modeTogglerButton: {
        get: function () {
            return `${form.imageContentComboBox}` + `${form.modeTogglerButton}`;
        }
    },
    imagesOptionsFilterInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },

    type: {
        value: function (contentData) {
            return this.selectImages(contentData.images);
        }
    },

    clickOnDropdownHandle: {
        value: function (contentData) {
            return this.doClick(this.imageComboBoxDrppdownHandle).pause(700).catch(err => {
                this.saveScreenshot('err_img_sel_dropdown_handle');
                throw  new Error('image combobox dropdown handle not found ' + err);
            });
        }
    },
    clickOnModeTogglerButton: {
        value: function () {
            return this.doClick(this.modeTogglerButton).catch(err => {
                this.saveScreenshot('err_img_sel_toggler');
                throw  new Error('mode toggler not found ' + err);
            }).pause(1000);
        }
    },
    getTreeModeOptionDisplayNames: {
        value: function () {
            let options = `${elements.SLICK_VIEW_PORT}` + `${elements.H6_DISPLAY_NAME}`;
            return this.getTextFromElements(options);
        }
    },
    getFlatModeOptionImageNames: {
        value: function () {
            let titles = [];
            let imgSelector = `${form.flatOptionView}`;
            return this.waitForVisible(imgSelector, appConst.TIMEOUT_2).then(() => {
                return this.getBrowser().elements(imgSelector);
            }).then(result => {
                result.value.forEach(val => {
                    titles.push(this.getBrowser().elementIdAttribute(val.ELEMENT, 'title'));
                });
                return Promise.all(titles).then(p => {
                    return p;
                });
            }).then(responses => {
                let imageNames = [];
                responses.forEach(atrribute => {
                    return imageNames.push(atrribute.value);
                });
                return imageNames;
            });
        }
    },

    selectImages: {
        value: function (imgNames) {
            let result = Promise.resolve();
            imgNames.forEach(name => {
                result = result.then(() => this.filterOptionsAndSelectImage(name));
            });
            return result;
        }
    },
    filterOptionsAndSelectImage: {
        value: function (displayName) {
            return this.typeTextInInput(this.imagesOptionsFilterInput, displayName).then(() => {
                return loaderComboBox.selectOption(displayName);
            });
        }
    },
    doFilterOptions: {
        value: function (displayName) {
            return this.typeTextInInput(this.imagesOptionsFilterInput, displayName).pause(500);
        }
    },
    waitForEmptyOptionsMessage: {
        value: function (displayName) {
            return this.waitForVisible(`//div[contains(@class,'empty-options') and text()='No matching items']`, appConst.TIMEOUT_2).catch(
                err => {
                    return false;
                });
        }
    },

    clickOnExpanderIconInOptions: {
        value: function (name) {
            var expanderIcon = form.imageContentComboBox + form.expanderIconByName(name);
            return this.doClick(expanderIcon).pause(700).catch(err => {
                this.saveScreenshot('err_click_on_expander ' + name);
                throw new Error('error when click on expander-icon ' + err);
            })
        }
    },

});
module.exports = imageSelectorForm;