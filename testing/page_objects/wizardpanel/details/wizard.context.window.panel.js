/**
 * Created on 30/07/2018.
 */
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const BaseContextWindowPanel = require('../../details_panel/base.context.window.panel');
const {WIZARD} = require('../../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DockedContextPanel') or contains(@id,'FloatingContextPanel')]`,
    widgetItem: `//div[contains(@id,'ContentWidgetItemView')]`
};

class WizardContextWindowPanel extends BaseContextWindowPanel {

    get container() {
        return xpath.container;
    }

    get widgetSelectorDropdown() {
        return xpath.container + WIZARD.CONTEXT_WINDOW_WIDGET_SELECTOR_ITEM
    }

    get widgetSelectorDropdownHandle() {
        return xpath.container + lib.DROPDOWN_SELECTOR.WIDGET_FILTER_DROPDOWN + lib.DROP_DOWN_HANDLE;
    }

    async isContentInvalid() {
        let selector = xpath.container + xpath.widgetItem + lib.CONTENT_SUMMARY_AND_STATUS_VIEWER;
        let attr = await this.getAttribute(selector, 'class');
        return await attr.includes('invalid');
    }

    async waitForOpened() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let el = await this.findElement(xpath.container);
                let widthValue = await this.getBrowser().getElementCSSValue(el.elementId, 'width');
                return await this.getPanelWidth(widthValue) > 150;
            }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Context Window was not loaded in ' + appConst.mediumTimeout});
        } catch (err) {
            await this.handleError('Wizard:', 'err_context_window_loaded', err);
        }
    }

    isOpened() {
        return this.getBrowser().waitUntil(() => {
            return this.findElement(xpath.container).then(el => {
                return this.getBrowser().getElementCSSValue(el.elementId, 'width');
            }).then(width => {
                console.log('width: ' + width);
                return this.getPanelWidth(width) > 0;
            });
        }, {timeout: appConst.shortTimeout}).catch(err => {
            console.log('Wizard Context Window is not loaded' + err);
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

    async openDependenciesWidget() {
        try {
            await super.openDependenciesWidget();
            await this.pause(700);
        } catch (err) {
            //Workaround for issue with the empty selector:
            await this.saveScreenshotUniqueName('err_dependencies');
            await this.refresh();
            await this.pause(3000);
            await super.openDependenciesWidget();
        }
    }
}

module.exports = WizardContextWindowPanel;


