const page = require('../page');
const shortcutForm = require('./shortcut.form.panel');
const siteForm = require('./site.form.panel');
const imageSelectorForm = require('./imageselector.form.panel');
const articleForm = require('./article.form.panel');
const pageTemplateForm = require('./page.template.form.panel');
const appConst = require('../../libs/app_const');
var panel = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
}
var contentWizardStepForm = Object.create(page, {

    type: {
        value: function (data, contentType) {
            if (contentType.includes(appConst.contentTypes.SHORTCUT)) {
                return shortcutForm.type(data);
            }
            if (contentType.includes(appConst.contentTypes.SITE)) {
                return siteForm.type(data);
            }
            if (contentType.includes(appConst.contentTypes.IMG_SELECTOR_2_4)) {
                return imageSelectorForm.type(data);
            }
            if (contentType.includes(appConst.contentTypes.ARTICLE)) {
                return articleForm.type(data);
            }
            if (contentType.includes(appConst.contentTypes.PAGE_TEMPLATE)) {
                return pageTemplateForm.type(data);
            }
        }
    },
});
module.exports = contentWizardStepForm;


