/**
 * Created on 21/09/2020.
 */
const BaseLayersWidget = require('../../details_panel/base.layers.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'LayersWidgetItemView')]",
    widgetItemView: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'LayersWidgetItemView')]",
};

class WizardLayersWidget extends BaseLayersWidget {

    get layersWidget() {
        return xpath.widget;
    }

    get widgetItemView() {
        return xpath.widgetItemView;
    }
}

module.exports = WizardLayersWidget;

