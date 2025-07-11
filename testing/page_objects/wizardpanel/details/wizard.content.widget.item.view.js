/**
 * Created on 10.07.2025
 */
const BaseContentWidgetItemView = require('../../details_panel/base.content.widget.item.view');
const lib = require('../../../libs/elements');

const xpath = {
    parentPanel: `//div[contains(@class,'content-wizard-panel')]`,
};

class WizardContentWidgetItemView extends BaseContentWidgetItemView {

    get parentPanel(){
        return xpath.parentPanel;
    }
}
module.exports = WizardContentWidgetItemView;
