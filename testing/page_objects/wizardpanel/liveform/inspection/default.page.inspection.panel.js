/**
 * Created on 12.09.2019.
 */
const PageInspectionPanel = require('./page.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'PageInspectionPanel')]`,
};

//Context Window, Inspect tab for Default page
class DefaultPageInspectionPanel extends PageInspectionPanel {

    get titleTextInput() {
        return xpath.container + "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Title']]" + lib.TEXT_INPUT;
    }

    async typeTitle(text) {
        try {
            await this.waitUntilDisplayed(this.titleTextInput, appConst.mediumTimeout);
            return await this.typeTextInInput(this.titleTextInput, text);
        } catch (err) {
            await this.saveScreenshot('err_type_text_in_title_input');
            throw new Error('error- Default page, Inspect Panel, type text in Title input: ' + err)
        }
    }

    async getTitle() {
        try {
            return await this.getTextInInput(this.titleTextInput)
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_get_title_inspection');
            await this.saveScreenshot(screenshot);
            throw new Error('error- Default page, Inspect Panel, get text in Title input, screenshot: ' + screenshot + " " + err);
        }
    }

    async waitForTitleInputDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.titleTextInput, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_default_page_inspect_panel');
            throw new Error("Inspection Panel, default page- required text input is not visible " + err);
        }
    }

    async clickOnApplyButton() {
        let selector = "//div[contains(@id,'ContextWindow')]" + lib.actionButton('Apply');
        await this.clickOnElement(selector);
        return await this.pause(2000);
    }
}

module.exports = DefaultPageInspectionPanel;

