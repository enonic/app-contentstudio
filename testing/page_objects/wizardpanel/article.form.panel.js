/**
 * Created on 23.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

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

    async type(articleData) {
        await this.typeTextInInput(this.titleInput, articleData.title);
        await this.typeTextInInput(this.bodyTextArea, articleData.body);
    }

    async typeArticleTitle(title) {
        await this.waitForElementDisplayed(this.titleInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.titleInput, title);
        return await this.pause(500);
    }

    async typeInTextArea(text) {
        await this.waitForElementDisplayed(this.bodyTextArea, appConst.mediumTimeout);
        await this.typeTextInInput(this.bodyTextArea, text);
        return await this.pause(500);
    }
}

module.exports = ArticleForm;


