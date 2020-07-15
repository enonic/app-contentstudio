/**
 * Created on 23.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');

const XPATH = {
    bodyTextArea: `//textarea[contains(@name,'body')]`,
    titleInput: `//input[contains(@name,'title')]`,
};

class ArticleForm extends Page {

    get bodyTextArea() {
        return lib.FORM_VIEW + XPATH.bodyTextArea;
    }

    get titleInput() {
        return lib.FORM_VIEW + XPATH.titleInput;
    }

    type(articleData) {
        return this.typeTextInInput(this.titleInput, articleData.title).then(() => {
            return this.typeTextInInput(this.bodyTextArea, articleData.body);
        });
    }
}
module.exports = ArticleForm;


