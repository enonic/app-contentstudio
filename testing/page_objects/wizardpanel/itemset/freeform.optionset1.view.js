/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    optionSet: "//div[contains(@id,'FormOptionSetOptionView')]",
    imageRadioButton: "//span[contains(@id,'RadioButton') and descendant::label[text()='image']]//label",
    textRadioButton: "//span[contains(@id,'RadioButton') and descendant::label[text()='text']]//label"
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

    async clickOnImageRadioButton() {
        try {
            await this.waitForElementDisplayed(this.imageRadioButton, appConst.shortTimeout);
            return await this.clickOnElement(this.imageRadioButton);
        } catch (err) {
            this.saveScreenshot("err_free_form_image_radio");
            throw new Error("Free Form Wizard - Error when clicking on Image radio button" + err);
        }
    }

    async clickOnTextRadioButton() {
        try {
            await this.waitForElementDisplayed(this.textRadioButton, appConst.shortTimeout);
            return await this.clickOnElement(this.textRadioButton);
        } catch (err) {
            this.saveScreenshot("err_free_form_text_radio");
            throw new Error("Free Form Wizard - Error when clicking on Text radio button");
        }
    }

    async expandFormByLabel(formName) {
        let locator = `//div[contains(@id,'FormOccurrenceDraggableLabel') and text()='${formName}']`;
        let elements = await this.findElements(locator);
        await elements[0].click();
        return await this.pause(300);
    }
}

module.exports = FreeFormOptionSet1;
