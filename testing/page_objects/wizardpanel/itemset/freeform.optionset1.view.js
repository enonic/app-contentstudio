/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    optionSet: "//div[contains(@id,'api.form.FormOptionSetOptionView')]",
    imageRadioButton: "//span[contains(@id,'ui.RadioButton') and descendant::label[text()='image']]",
    textRadioButton: "//span[contains(@id,'ui.RadioButton') and descendant::label[text()='text']]"
};

class FreeFormOptionSet1 extends Page {

    //element type 'input' - radio button
    get imageRadioButton() {
        return xpath.optionSet + xpath.imageRadioButton;
    }

    //element type 'Button' - radio button
    get textRadioButton() {
        return xpath.optionSet + xpath.textRadioButton;
    }

    clickOnImageRadioButton() {
        return this.waitForElementDisplayed(this.imageRadioButton, appConst.TIMEOUT_2).then(() => {
            return this.clickOnElement(this.imageRadioButton);
        }).catch(() => {
            this.saveScreenshot("err_free_form_image_radio");
            throw new Error("Free Form Wizard - Error when clicking on Image radio button");
        });
    }

    clickOnTextRadioButton() {
        return this.waitForElementDisplayed(this.textRadioButton, appConst.TIMEOUT_2).then(() => {
            return this.clickOnElement(this.textRadioButton);
        }).catch(() => {
            this.saveScreenshot("err_free_form_text_radio");
            throw new Error("Free Form Wizard - Error when clicking on Text radio button");
        });
    }
};
module.exports = FreeFormOptionSet1;


