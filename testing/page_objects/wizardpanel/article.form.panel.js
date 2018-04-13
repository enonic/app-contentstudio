/**
 * Created on 23.12.2017.
 */
const page = require('../page');
const elements = require('../../libs/elements');

const form = {
    bodyTextArea: `//textarea[contains(@name,'body')]`,
    titleInput: `//input[contains(@name,'title')]`,
};
var articleForm = Object.create(page, {

    bodyTextArea: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.bodyTextArea}`;
        }
    },
    titleInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.titleInput}`;
        }
    },
    type: {
        value: function (articleData) {
            return this.typeTextInInput(this.titleInput, articleData.title).then(()=> {
                this.typeTextInInput(this.bodyTextArea, articleData.body);
            });
        }
    },
});
module.exports = articleForm;


