/**
 * Created on 11.07.2025
 */
const BaseContentWidgetItemView = require('../../details_panel/base.content.widget.item.view');
const lib = require('../../../libs/elements');

const xpath = {
    parentPanel: `//div[contains(@class,'content-browse-panel')]`,
};

class BrowseContentWidgetItemView extends BaseContentWidgetItemView {

    get parentPanel(){
        return xpath.parentPanel;
    }
}
module.exports = BrowseContentWidgetItemView;
