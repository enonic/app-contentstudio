/**
 * Created on 24.12.2024
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements-old');
const appConst = require('../../../../libs/app_const');
const utils = require('../../../../libs/studio.utils');

const XPATH = {
    container: "//div[contains(@id,'TextInspectionPanel')]",
};

// Context Window, Text Component Inspect tab
class TextComponentInspectionPanel extends BaseComponentInspectionPanel {

    waitForOpened() {
        return this.waitForElementDisplayed(XPATH.container);
    }

    async typeTextInEditor(text) {
        try {
            let id = await this.getIdOfTextEditor();
            await utils.insertTextInCKE(id, text);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Inspect Panel with text area: ', 'err_text_component_inspect_panel', err);
        }
    }

    async getIdOfTextEditor() {
        let locator = XPATH.container + lib.TEXT_AREA;
        let elems = await this.findElements(locator);
        return await elems[0].getAttribute('id');
    }

    async getTextFromEditor() {
        let id = await this.getIdOfTextEditor();
        return await utils.getTextInCKE(id);
    }
}

module.exports = TextComponentInspectionPanel;
