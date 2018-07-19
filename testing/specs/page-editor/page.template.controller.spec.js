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
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const liveContextWindow = require('../../page_objects/wizardpanel/liveform/liveform.context.window');
const pageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');

describe('page.template.controller: select a controller in a template-wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let TEMPLATE;
    let SUPPORT = 'Site';
    let CONTROLLER_NAME = 'main region';

    it(`WHEN new site has been added THEN the site should be listed in the grid`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                studioUtils.saveScreenshot(displayName + '_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {

                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });
    // verifies the xp-apps#686 "Template Wizard - Inspection Panel should appear after page controller is selected"
    it(`GIVEN template wizard is opened WHEN controller has been selected THEN Live Context Window should be loaded automatically`,
        () => {
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
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            }).then(() => {
                return pageTemplateForm.filterOptionsAndSelectSupport(appConstant.TEMPLATE_SUPPORT.SITE);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                studioUtils.saveScreenshot("support_selected_in_template");
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
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            }).then(() => {
                return pageTemplateForm.clickOnRemoveSupportIcon();
            }).pause(1500).then(() => {
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
            }).pause(1000).then(() => {
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
});
