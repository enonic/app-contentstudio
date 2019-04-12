/**
 * Created on 12.04.2019.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    optionSet: "//div[contains(@id,'api.form.FormOptionSetOptionView')]",
    imageRadioButton: "//span[contains(@id,'ui.RadioButton') and descendant::label[text()='image']]",
    textRadioButton: "//span[contains(@id,'ui.RadioButton') and descendant::label[text()='text']]"

};
const freeFormOptionSet1 = Object.create(page, {

    //element type 'input' - radio button
    imageRadioButton: {
        get: function () {
            return `${xpath.optionSet}` + `${xpath.imageRadioButton}`;
        }
    },
    //element type 'Button' - radio button
    textRadioButton: {
        get: function () {
            return `${xpath.optionSet}` + `${xpath.textRadioButton}`;
        }
    },
    clickOnImageRadioButton: {
        value: function () {
            return this.waitForVisible(this.imageRadioButton, appConst.TIMEOUT_2).then(() => {
                return this.doClick(this.imageRadioButton);
            }).catch(() => {
                this.saveScreenshot("err_free_form_image_radio");
                throw new Error("Free Form Wizard - Error when clicking on Image radio button");
            });
        }
    },
    clickOnTextRadioButton: {
        value: function () {
            return this.waitForVisible(this.imageRadioButton, appConst.TIMEOUT_2).then(() => {
                return this.doClick(this.textRadioButton);
            }).catch(() => {
                this.saveScreenshot("err_free_form_text_radio");
                throw new Error("Free Form Wizard - Error when clicking on Text radio button");
            });
        }
    },
});
module.exports = freeFormOptionSet1;


