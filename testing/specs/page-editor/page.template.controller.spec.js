/**
 * Created on 6.04.2018.
 *
 * Verifies:
 *  xp-apps#686 "Template Wizard - Inspection Panel should appear after page controller is selected"
 */
const chai = require('chai');
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
    it(`GIVEN _templates folder is selected WHEN New button has been pressed THEN upload button should not be present in the modal dialog`,
        async () => {
            let newContentDialog = new NewContentDialog();
            await selectTemplatesFolderAndClickNew();
            let isDisplayed = await newContentDialog.waitForUploaderButtonDisplayed();
            assert.isFalse(isDisplayed, "Uploader button should not be displayed (_templates is selected)");
        });

    it(`GIVEN no selections in the grid WHEN New button has been pressed THEN upload button should be present in New Content dialog`,
        async () => {
            let newContentDialog = new NewContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            let isDisplayed = await newContentDialog.waitForUploaderButtonDisplayed();
            assert.isTrue(isDisplayed, "Uploader button should be present on the modal dialog");
        });

    // verifies: Page Template wizard - Save button remains enabled after selecting a controller in unnamed template (#3091).
    it(`GIVEN new template wizard is opened WHEN controller has been selected THEN Save button gets disabled in unnamed wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open wizard for new template
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            //2. Select a page descriptor
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            //3. Wait for the notification message:
            await contentWizard.waitForNotificationMessage();
            //4. Verify that 'Save' button gets disabled
            await contentWizard.waitForSaveButtonDisabled();
        });

    // verifies the xp-apps#686 "Template Wizard - Inspection Panel should appear after page controller is selected"
    it(`GIVEN template wizard is opened WHEN controller has been selected THEN Live Context Window should be loaded automatically`,
        async () => {
            let contentWizard = new ContentWizard();
            let liveContextWindow = new LiveContextWindow();
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            await contentWizard.typeDisplayName(TEMPLATE.displayName);
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            //Verifies xp-apps#686 - 'Context Window should be loaded automatically':
            await liveContextWindow.waitForOpened();
        });

    //xp-apps#737 Page Editor panel for a site is not correctly refreshed when a page template was added or removed
    it(`GIVEN site is opened AND page-template is opened WHEN the 'site' has been selected in supports (in template) THEN template should be applied in the site-wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageTemplateForm = new PageTemplateForm();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await studioUtils.doSwitchToContentBrowsePanel();
            //2. Open the template:
            await studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            //3. 'site' has been selected in 'support' and the template has been saved
            await pageTemplateForm.filterOptionsAndSelectSupport(appConstant.TEMPLATE_SUPPORT.SITE);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //4. Template should be applied in the site-wizard:
            let isNotVisible = await contentWizard.waitForControllerOptionFilterInputNotVisible();
            studioUtils.saveScreenshot("template_applied");
            assert.isTrue(isNotVisible, 'Options filter input must not be visible, because the template has been applied to site');
        });

    //xp-apps#737 Live Editor is not updated after a page template was added or removed
    it(`GIVEN site is opened AND page-template is opened WHEN 'support' has been removed (in template) THEN controller-selector must appear on the site-wizard`,
        async () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await studioUtils.doSwitchToContentBrowsePanel();
            //2. Open the template:
            await studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            //3. Remove 'support' in the template
            await pageTemplateForm.clickOnRemoveSupportIcon();
            //4. Save the template
            await contentWizard.waitAndClickOnSave();
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //Site wizard should be updated:
            let isDisplayed = await contentWizard.waitForControllerOptionFilterInputVisible();
            studioUtils.saveScreenshot("template_support_removed");
            assert.isTrue(isDisplayed, 'Options filter input must be visible, because the `support` option has been removed');
        });

    //xp-apps#737 Live Editor is not updated after a page template was added or removed
    it(`GIVEN site is opened WHEN page-template has been deleted THEN site-wizard should be reset and controller-combobox should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await studioUtils.doSwitchToContentBrowsePanel();
            //2. switch to browse panel and delete the template:
            await studioUtils.doDeleteContent(TEMPLATE.displayName);
            //3. Switch to site wizard again:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //4. Controller selector should appear in the wizard:
            let isVisible = await contentWizard.waitForControllerOptionFilterInputVisible();
            studioUtils.saveScreenshot(SITE.displayName + '_reset');
            assert.isTrue(isVisible, 'Options filter input should appear in the site, because the template was deleted');
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
