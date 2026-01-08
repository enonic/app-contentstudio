const Page = require('../page');
const ShortcutForm = require('./shortcut.form.panel');
const SiteForm = require('./site.form.panel');
const ImageSelectorForm = require('./imageselector.form.panel');
const ArticleForm = require('./article.form.panel');
const PageTemplateForm = require('./page.template.form.panel');
const HtmlAreaForm = require('./htmlarea.form.panel');
const appConst = require('../../libs/app_const');

const formMap = {
    [appConst.contentTypes.SHORTCUT]: ShortcutForm,
    [appConst.contentTypes.SITE]: SiteForm,
    [appConst.contentTypes.IMG_SELECTOR_2_4]: ImageSelectorForm,
    [appConst.contentTypes.ARTICLE]: ArticleForm,
    [appConst.contentTypes.PAGE_TEMPLATE]: PageTemplateForm,
    [appConst.contentTypes.HTML_AREA_0_1]: HtmlAreaForm,
    [appConst.contentTypes.HTML_AREA_2_4]: HtmlAreaForm
};


class ContentWizardStepForm extends Page {

    type(data, contentType) {
        if (contentType.includes(appConst.contentTypes.SHORTCUT)) {
            let shortcutForm = new ShortcutForm();
            return shortcutForm.type(data);
        }
        if (contentType.includes(appConst.contentTypes.SITE)) {
            let siteForm = new SiteForm();
            return siteForm.type(data);
        }
        if (contentType.includes(appConst.contentTypes.IMG_SELECTOR_2_4)) {
            let imageSelectorForm = new ImageSelectorForm();
            return imageSelectorForm.type(data);
        }
        if (contentType.includes(appConst.contentTypes.ARTICLE)) {
            let articleForm = new ArticleForm();
            return articleForm.type(data);
        }
        if (contentType.includes(appConst.contentTypes.PAGE_TEMPLATE)) {
            let pageTemplateForm = new PageTemplateForm();
            return pageTemplateForm.type(data);
        }
        if (contentType.includes(appConst.contentTypes.HTML_AREA_0_1)) {
            let htmlAreaForm = new HtmlAreaForm();
            return htmlAreaForm.type(data);
        }
        if (contentType.includes(appConst.contentTypes.HTML_AREA_2_4)) {
            let htmlAreaForm = new HtmlAreaForm();
            return htmlAreaForm.type(data);
        }
    }
}
module.exports = ContentWizardStepForm;


