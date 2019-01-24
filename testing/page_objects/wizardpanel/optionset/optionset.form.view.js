/**
 * Created on 23.01.2019.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');

const xpath = {
    option1Radio: "//span[contains(@id,'api.ui.RadioButton') and child::label[text()='Option 1']]",
    option2Radio: "//span[contains(@id,'api.ui.RadioButton') and child::label[text()='Option 2']]",

    titleInput: `//input[contains(@name,'title')]`,
};
const optionSetFormView = Object.create(page, {

    option1Radio: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${xpath.option1Radio}`;
        }
    },
    option2Radio: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${xpath.option2Radio}`;
        }
    },
    clickOnOption1Radio: {
        value: function () {
            return this.doClick(this.option1Radio);
        }
    },
});
module.exports = optionSetFormView;


