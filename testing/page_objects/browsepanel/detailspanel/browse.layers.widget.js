/**
 * Created on 05/08/2020.
 */
const appConst = require('../../../libs/app_const');
const BaseLayersWidget = require('../../details_panel/base.layers.widget')

const xpath = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'LayersWidgetItemView')]",
    widgetItemView: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'LayersWidgetItemView')]",
};

class BrowseLayersWidget extends BaseLayersWidget {

    get layersWidget() {
        return xpath.widget;
    }

    get widgetItemView() {
        return xpath.widgetItemView;
    }
}

module.exports = BrowseLayersWidget;


