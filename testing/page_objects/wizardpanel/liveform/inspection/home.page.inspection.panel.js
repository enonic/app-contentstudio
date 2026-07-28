/**
 * Created on 12.09.2019.  updated on 26.07.2026
 */
const PageInspectionPanel = require('./page.inspection.panel');
const appConst = require('../../../../libs/app_const');

const xpath = {
    container: "//div[@data-component='PageInspectionPanel']",
    titleInput: "//input[@aria-label='Title']",
};

//Context Window, Inspect tab for 'Home Page' controller that contains 'Title' input field
class HomePageInspectionPanel extends PageInspectionPanel {

    get titleTextInput() {
        return xpath.container + xpath.titleInput;
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

}

module.exports = HomePageInspectionPanel;

