/**
 * Created on 08.02.2022 updated on 03.08.2026
 */
const BaseAttachmentsWidgetItemView = require('../../details_panel/base.attachments.items.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//section[@data-component='DetailsWidgetAttachmentsSection']",
};

class BrowseAttachmentsItemView extends BaseAttachmentsWidgetItemView {

    get attachmentsWidget() {
        return xpath.widget;
    }
}

module.exports = BrowseAttachmentsItemView;


