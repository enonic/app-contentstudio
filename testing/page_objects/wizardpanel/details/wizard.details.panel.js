/**
 * Created on 30/07/2018.
 */
const BaseDetailsPanel = require('../../details_panel/base.details.panel');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DockedContextPanel') or contains(@id,'FloatingContextPanel')]`,
    widgetItem: `//div[contains(@id,'ContentWidgetItemView')]`
};

class WizardDetailsPanel extends BaseDetailsPanel {

    get widgetSelectorDropdown() {
        return xpath.container + lib.DROPDOWN_SELECTOR.WIDGET_FILTER_DROPDOWN;
    }

    get widgetSelectorDropdownHandle() {
        return xpath.container + lib.DROPDOWN_SELECTOR.WIDGET_FILTER_DROPDOWN + lib.DROP_DOWN_HANDLE;
    }

    async isContentInvalid() {
        let selector = xpath.container + xpath.widgetItem + lib.CONTENT_SUMMARY_AND_STATUS_VIEWER;
        let attr = await this.getAttribute(selector, 'class');
        return await attr.includes('invalid');
    }

    async waitForDetailsPanelLoaded() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let el = await this.findElement(xpath.container);
                let widthValue = await this.getBrowser().getElementCSSValue(el.elementId, 'width');
                return await this.getPanelWidth(widthValue) > 150;
            }, {timeout: appConst.mediumTimeout, timeoutMsg: "Details Panel was not loaded in " + appConst.mediumTimeout});
        } catch (err) {
            await this.handleError('Wizard: Details Panel', 'err_details_panel_loaded', err);
        }
    }

    isDetailsPanelLoaded() {
        return this.getBrowser().waitUntil(() => {
            return this.findElement(xpath.container).then(el => {
                return this.getBrowser().getElementCSSValue(el.elementId, 'width');
            }).then(width => {
                console.log("width: " + width);
                return this.getPanelWidth(width) > 0;
            });
        }, {timeout: appConst.shortTimeout}).catch(err => {
            console.log("Wizard details panel is not loaded" + err);
            return false;
        });
    }

    async openVersionHistory() {
        try {
            return await super.openVersionHistory();
        } catch (err) {
            //Workaround for issue with the empty selector:
            await this.saveScreenshotUniqueName('err_versions');
            await this.refresh();
            await this.pause(4000);
            await super.openVersionHistory();
        }
    }

    async openDependencies() {
        try {
            await super.openDependencies();
            await this.pause(1000);
        } catch (err) {
            //Workaround for issue with the empty selector:
            await this.saveScreenshotUniqueName('err_dependencies');
            await this.refresh();
            await this.pause(4000);
            await super.openDependencies();
        }
    }
}

module.exports = WizardDetailsPanel;


