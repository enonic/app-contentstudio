/**
 * Created on 25.01.2019.
 */

const page = require('../../../page');
const elements = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const loaderComboBox = require('../../../components/loader.combobox');
const xpath = {
    container: `//div[contains(@id,'ImageInspectionPanel')]`,
    imageContentComboBox: `//div[contains(@id,'ImageContentComboBox')]`,
    applyButton: ``,
};
//Context Window, Inspect tab for Image Component
const imageInspectionPanel = Object.create(page, {

    captionTextArea: {
        get: function () {
            return `${xpath.container}` + "//div[contains(@id,'InputView') and descendant::div[text()='Caption']]" + elements.TEXT_AREA;
        }
    },
    imageContentComboBox: {
        get: function () {
            return `${xpath.container}` + `${xpath.imageContentComboBox}`;
        }
    },

    typeNameAndSelectImage: {
        value: function (displayName) {
            return loaderComboBox.typeTextAndSelectOption(displayName, xpath.container).pause(500);
        }
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_load_inspect_panel');
                throw new Error('Live Edit, Inspection not loaded' + err);
            });
        }
    },
    typeCaption: {
        value: function (caption) {
            return this.typeTextInInput(this.captionTextArea, caption).catch(err => {
                this.saveScreenshot('err_type_text_in_caption');
                throw new Error('error- Image Inspect Panel, type text in Caption text area: ' + err)
            })
        }
    },
    getCaptionText: {
        value: function () {
            return this.getTextFromInput(this.captionTextArea).catch(err => {
                this.saveScreenshot('err_type_text_in_caption');
                throw new Error('error- Image Inspect Panel, type text in Caption text area: ' + err)
            });
        }
    },
    clickOnRemoveIcon: {
        value: function () {
            let selector = xpath.container + elements.CONTENT_SELECTED_OPTION_VIEW + elements.REMOVE_ICON;
            return this.waitForVisible(selector).then(()=>{
                return this.doClick(selector);
            }).catch(err => {
                this.saveScreenshot('err_clicking_remove_inspection_panel');
                throw new Error('Image Inspect Panel, error when remove-icon has been clicked: ' + err)
            })
        }
    },
    clickOnApplyButton: {
        value: function () {
            let selector = "//div[contains(@id,'ContextWindow')]" + elements.ACTION_BUTTON + "/span[text()='Apply']";
            return this.doClick(selector).catch(err => {
                this.saveScreenshot('err_click_on_apply_inspect_panel');
                throw new Error('error- Image Inspect Panel, click on Apply button: ' + err)
            }).pause(1500);
        }
    },

});
module.exports = imageInspectionPanel;
