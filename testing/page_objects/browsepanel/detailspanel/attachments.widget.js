/**
 * Created on 08.02.2022
 */
const appConst = require('../../../libs/app_const');
const BaseAttachmentsWidgetItemView = require('../../details_panel/base.attachments.items.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'AttachmentsWidgetItemView')]",
};

class AttachmentsItemView extends BaseAttachmentsWidgetItemView {

    get attachmentsWidget() {
        return xpath.widget;
    }

}

module.exports = AttachmentsItemView;


