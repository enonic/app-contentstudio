/**
 * Created on 07.09.2021 updated 24.04.2026
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');

const XPATH = {
    radioDataComponent:"//div[@data-component='RadioButtonInput']",
};

class RadioButtonForm extends Page {

    async clickOnRadio(label) {
        try {
            let locator = XPATH.radioDataComponent+ BUTTONS.radioButtonByLabel(label);
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            await this.pause(200);
        }catch(err){
            await this.handleError(`Radio button with label "${label}" is not found.`,'err_click_on_radio', err);
        }
    }

    async isRadioSelected(label) {
        let locator = XPATH.radioDataComponent + BUTTONS.radioButtonByLabel(label);
        await this.waitForElementDisplayed(locator);
        let ariaChecked = await this.getAttribute(locator, 'aria-checked');
        return ariaChecked === 'true';
    }
}

module.exports = RadioButtonForm;
