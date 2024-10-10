const BaseSiteConfiguratorDialog = require('./base.site.configurator.dialog');
const MultiSelectionOptionSet = require('../optionset/multi.selection.set.view');

class SiteConfiguratorWitOptionSetDialog extends BaseSiteConfiguratorDialog {

    async clickOnOption(option) {
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        await multiSelectionOptionSet.clickOnOption(option);
    }

    async isCheckboxSelected(option) {
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        return await multiSelectionOptionSet.isCheckboxSelected(option);
    }
}

module.exports = SiteConfiguratorWitOptionSetDialog;
