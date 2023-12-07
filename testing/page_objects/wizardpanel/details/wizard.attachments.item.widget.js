/**
 * Created on 07.13.2023
 */
const BaseAttachmentsWidgetItemView = require('../../details_panel/base.attachments.items.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'AttachmentsWidgetItemView')]",
};

class WizardAttachmentsItemWidget extends BaseAttachmentsWidgetItemView {

    get attachmentsWidget() {
        return xpath.widget;
    }
}

module.exports = WizardAttachmentsItemWidget;
