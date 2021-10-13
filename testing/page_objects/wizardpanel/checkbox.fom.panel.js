/**
 * Created on 23.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container_Div: "//div[contains(@id,'InputView')]//div[contains(@id,'Checkbox') and contains(@class,'checkbox')]",
    titleInput: `//input[contains(@name,'title')]`,
};

class CheckBoxForm extends Page {

    get checkboxInput() {
        return XPATH.container_Div + lib.CHECKBOX_INPUT;
    }

    clickOnCheckbox() {

    }

}

module.exports = CheckBoxForm;


