/**
 * Created on 6.04.2018.
 *
 * Verifies:
 *  xp-apps#686 "Template Wizard - Inspection Panel should appear after page controller is selected"
 *  xp-apps#737 Page Editor panel for a site is not correctly refreshed when a page template was added or removed
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const LiveContextWindow = require('../../page_objects/wizardpanel/liveform/liveform.context.window');
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');

describe('page.template.controller: select a controller in a template-wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let TEMPLATE;
    let SUPPORT = 'Site';
    let CONTROLLER_NAME = 'main region';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/364
    //Upload button should not be visible in the New Content dialog for Templates folder
    it(`GIVEN existing site is expanded AND _templates folder selected WHEN New button has been pressed THEN upload button should not be present on the modal dialog`,
        () => {
        let newContentDialog = new NewContentDialog();
            return selectTemplatesFolderAndClickNew().then(() => {
                return newContentDialog.waitForUploaderButtonDisplayed();
            }).then(result => {
                assert.isFalse(result, "Uploader button should not be displayed");
            });
        });
    it(`GIVEN no selections in the grid WHEN New button has been pressed THEN upload button should be present on the modal dialog`,
        () => {
            let newContentDialog = new NewContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            return contentBrowsePanel.clickOnNewButton().then(() => {
                return newContentDialog.waitForOpened();
            }).then(() => {
                return newContentDialog.waitForUploaderButtonDisplayed();
            }).then(result => {
                assert.isTrue(result, "Uploader button should be displayed");
            });
        });

    // verifies the xp-apps#686 "Template Wizard - Inspection Panel should appear after page controller is selected"
    it(`GIVEN template wizard is opened WHEN controller has been selected THEN Live Context Window should be loaded automatically`,
        () => {
            let contentWizard = new ContentWizard();
            let liveContextWindow = new  LiveContextWindow();
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
            return studioUtils.doOpenPageTemplateWizard(SITE.displayName).then(() => {
                return contentWizard.typeDisplayName(TEMPLATE.displayName);
            }).then(() => {
                return contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            }).then(() => {
                return liveContextWindow.waitForOpened();
            }).then(isDisplayed => {
                studioUtils.saveScreenshot('template_context_window_should_be_loaded');
                assert.isTrue(isDisplayed, 'Context Window should be loaded automatically');
            });
        });
    //xp-apps#737 Page Editor panel for a site is not correctly refreshed when a page template was added or removed
    it(`GIVEN site is opened AND page-template is opened WHEN the 'site' has been selected in supports (in template) THEN template should be applied in the site-wizard`,
        () => {
            let contentWizard = new ContentWizard();
            let pageTemplateForm = new PageTemplateForm();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            }).then(() => {
                return pageTemplateForm.filterOptionsAndSelectSupport(appConstant.TEMPLATE_SUPPORT.SITE);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return studioUtils.switchToContentTabWindow(SITE.displayName);
            }).then(() => {
                return contentWizard.waitForControllerOptionFilterInputNotVisible();
            }).then(result => {
                studioUtils.saveScreenshot("template_applied");
                assert.isTrue(result, 'Options filter input must not be visible, because the template has been applied to site');
            });
        });
    //xp-apps#737 Page Editor panel for a site is not correctly refreshed when a page template was added or removed
    it(`GIVEN site is opened AND page-template is opened WHEN 'support' has been removed (in template) THEN controller-selector must appear on the site-wizard`,
        () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            }).then(() => {
                return pageTemplateForm.clickOnRemoveSupportIcon();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return studioUtils.switchToContentTabWindow(SITE.displayName);
            }).then(() => {
                return contentWizard.waitForControllerOptionFilterInputVisible();
            }).then(result => {
                studioUtils.saveScreenshot("template_support_removed");
                assert.isTrue(result, 'Options filter input must be visible, because the `support` option has been removed');
            });
        });
    //xp-apps#737 Page Editor panel for a site is not correctly refreshed when a page template was added or removed
    it(`GIVEN site is opened  WHEN template has been deleted THEN Options filter input must be visible in the site-wizard`,
        () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            return studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName).then(() => {
                return pageTemplateForm.filterOptionsAndSelectSupport(appConstant.TEMPLATE_SUPPORT.SITE);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.selectContentAndOpenWizard(SITE.displayName);
            }).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.doDeleteContent(TEMPLATE.displayName);
            }).then(()=>{
                return contentWizard.pause(2000);
            }).then(() => {
                return studioUtils.switchToContentTabWindow(SITE.displayName);
            }).then(() => {
                return contentWizard.waitForControllerOptionFilterInputVisible();
            }).then(result => {
                studioUtils.saveScreenshot("template_removed");
                assert.isTrue(result, 'Options filter input must be visible, because the template has been deleted');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });

    function selectTemplatesFolderAndClickNew() {
        let newContentDialog = new NewContentDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
            return contentBrowsePanel.clickOnExpanderIcon(SITE.displayName);
        }).then(() => {
            return contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName('Templates');
        }).then(() => {
            return contentBrowsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.waitForOpened();
        });
    }
});