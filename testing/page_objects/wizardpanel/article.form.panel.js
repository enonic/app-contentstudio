/**
 * Created on 23.12.2017. updated on 08.04.2026
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');

const XPATH = {
    bodyTextArea: `//textarea[contains(@name,'body')]`,
    titleInput: `//input[contains(@name,'title')]`,
};

class ArticleForm extends Page {

    get bodyTextArea() {
        return COMMON.INPUTS.inputFieldByLabel('Body') + '//textarea';
    }

    get prefaceInput() {
        return COMMON.INPUTS.inputFieldByLabel('Preface') + '//input';
    }

    get titleInput() {
        return COMMON.INPUTS.inputFieldByLabel('Title') + '//input';
    }

    async type(articleData) {
        await this.typeArticleTitle( articleData.title);
        await this.typeInTextArea( articleData.body);
    }

    async typeArticleTitle(title) {
        await this.waitForElementDisplayed(this.titleInput);
        let input = await this.findElement(this.titleInput);
        await input.clearValue();
        for (const ch of title) {
            await input.addValue(ch);
        }
        return await this.pause(200);
    }

    async typeInTextArea(text) {
        await this.waitForElementDisplayed(this.bodyTextArea);
        await this.enterTextUsingArray(this.bodyTextArea,text);
        return await this.pause(500);
    }
}

module.exports = ArticleForm;


