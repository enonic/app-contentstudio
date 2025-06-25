/**
 * Created on 12.09.2019.
 */
const PageInspectionPanel = require('./page.inspection.panel');
const lib = require('../../../../libs/elements-old');
const appConst = require('../../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'PageInspectionPanel')]`,
};

//Context Window, Inspect tab for 'Home Page' controller that contains 'Title' input field
class HomePageInspectionPanel extends PageInspectionPanel {

    get titleTextInput() {
        return xpath.container + "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Title']]" + lib.TEXT_INPUT;
    }

    async typeTitle(text) {
        try {
            await this.waitUntilDisplayed(this.titleTextInput, appConst.mediumTimeout);
            return await this.typeTextInInput(this.titleTextInput, text);
        } catch (err) {
            await this.handleError('Home Page controller, Inspect Panel, Title input', 'err_insert_text_in_config', err);
        }
    }

    async getTitle() {
        try {
            return await this.getTextInInput(this.titleTextInput)
        } catch (err) {
            await this.handleError('Home Page controller, Inspect Panel, Title input', 'err_page_inspection_title', err);
        }
    }

    async waitForTitleInputDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.titleTextInput, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Home Page controller, Inspect Panel, Title input', 'err_page_inspection_config_title_input', err);
        }
    }

    async clickOnApplyButton() {
        let selector = "//div[contains(@id,'ContextWindow')]" + lib.actionButton('Apply');
        await this.clickOnElement(selector);
        return await this.pause(2000);
    }
}

module.exports = HomePageInspectionPanel;

