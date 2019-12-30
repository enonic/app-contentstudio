/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');

const xpath = {
    option1Radio: "//span[contains(@id,'RadioButton') and child::label[text()='Option 1']]",
    option2Radio: "//span[contains(@id,'RadioButton') and child::label[text()='Option 2']]",
    titleInput: `//input[contains(@name,'title')]`,
};

class OptionSetFormView extends Page {

    get option1Radio() {
        return lib.FORM_VIEW + xpath.option1Radio;
    }

    get option2Radio() {
        return lib.FORM_VIEW + xpath.option2Radio;
    }

    clickOnOption1Radio() {
        return this.clickOnElement(this.option1Radio);
    }
};
module.exports = OptionSetFormView;
