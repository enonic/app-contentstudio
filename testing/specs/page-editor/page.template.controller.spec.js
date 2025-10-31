/**
 * Created on 6.04.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageWidgetPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const appConst = require('../../libs/app_const');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const PageTemplateWidget = require('../../page_objects/browsepanel/detailspanel/page.template.widget');

describe('page.template.controller: select a controller in a template-wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEMPLATE;
    const SUPPORT_SITE = 'Site';
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const TEST_IMAGE_NAME = appConst.TEST_IMAGES.FOSS;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/364
    // Upload button should not be visible in the New Content dialog for Templates folder
    it(`GIVEN _templates folder is selected WHEN New button has been pressed THEN upload button should not be present in the modal dialog`,
        async () => {
            let newContentDialog = new NewContentDialog();
            // 1. Expand the site, click on Templates folder and click on 'New' button
            await selectTemplatesFolderAndClickOnNew();
            // 2. Verify that 'Uploader' button is not be displayed in the 'New Content' modal dialog:
            await newContentDialog.waitForUploaderButtonNotDisplayed();
        });

    // verifies the xp-apps#686 "Template Wizard - Inspection Panel should appear after page controller is selected"
    it(`GIVEN template wizard is opened WHEN controller has been selected THEN Live Context Window should be loaded automatically`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageWidgetPanel = new PageWidgetPanel();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertImageDialog = new InsertImageDialog();
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT_SITE, CONTROLLER_NAME);
            // 1. Open wizard for new template:
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            // 2. fill in the name input and select the controller:
            await contentWizard.typeDisplayName(TEMPLATE.displayName);
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(CONTROLLER_NAME);
            // 3. Verify the issue - Verifies xp-apps#686 - 'Context Window should be loaded automatically':
            await pageWidgetPanel.waitForOpened();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Click on the item and open Context Menu:
            await pageComponentView.openMenu('main');
            // 5. Insert Text Component and insert an image:
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await contentWizard.switchToLiveEditFrame();
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    // xp-apps#737: Page Editor panel for a site is not correctly refreshed when a page template was added or removed
    it(`GIVEN site and its page-template are opened WHEN the 'site' has been selected in supports (in template) THEN template should be applied in the site-wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageTemplateForm = new PageTemplateForm();
            let pageInspectionTab = new PageInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await studioUtils.doSwitchToContentBrowsePanel();
            // 2. Open the template:
            await studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            // 3. 'site' option has been selected in 'support' and the template has been saved:
            await pageTemplateForm.filterOptionsAndSelectSupport(appConst.TEMPLATE_SUPPORT.SITE);
            // 4. Save the template with 'Site' option is supports dropdown
            await contentWizard.waitAndClickOnSave();
            // 5. Switch to the site again:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            let pageTemplateWidget = new PageTemplateWidget();
            // 6. Verify that 'Automatic' controller type is displayed in pageTemplateWidget:
            let actualName = await pageTemplateWidget.getControllerLink();
            assert.equal(actualName, TEMPLATE.displayName, 'Expected template name should be displayed in the template widget');
            let type = await pageTemplateWidget.getControllerType();
            assert.equal(type, 'Automatic', `'Automatic' template should be present in the widget`);
            await studioUtils.saveScreenshot('support_site_applied');
            // 7. Template should be applied in the site-wizard Preview button gets enabled:
            await contentWizard.waitForPreviewButtonEnabled();
            let contextWindow = await contentWizard.openContextWindow();
            // 8. Select 'Page' in widget selector:
            await contextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 9. Verify that the template is applied in the site - 'Customize Page' button gets visible in the Inspect panel:
            await pageInspectionTab.waitForCustomizePageButtonDisplayed();
        });

    // Verify  https://github.com/enonic/app-contentstudio/issues/7077
    // Images failed to render inside a page template #7077
    it(`GIVEN an image is inserted in the page-template WHEN the site has been opened THEN image that was inserted in the template is displayed in the site as well`,
        async () => {
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Unlock the LiveEdit(Click on Customize menu item)
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await liveFormPanel.switchToParentFrame();
            // 3. Click on Customize Page button in Inspect panel:
            await pageInspectionPanel.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('page_template_image_rendered');
            // 3. Verify that the image that was inserted in the template is displayed in the site
            await contentWizard.switchToLiveEditFrame();
            let srcAttr = await liveFormPanel.verifyImageElementsInTextComponent(0);
            await contentWizard.switchToParentFrame();
            assert.ok(srcAttr.includes('/admin/rest'), "Image in the Text Component - Attribute 'src' is not correct");
        });

    //  Live Editor is not updated after a page template was added or removed
    //  https://github.com/enonic/xp-apps/issues/738
    it(`GIVEN site is opened AND its page-template is opened WHEN 'support' option has been removed (in template) THEN controller-selector must appear in the site-wizard`,
        async () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            let pageInspectionTab = new PageInspectionPanel();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await studioUtils.doSwitchToContentBrowsePanel();
            //2. Open the template:
            await studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            //3. Remove 'support site' in the template
            await pageTemplateForm.clickOnRemoveSupportIcon('Site');
            //4. Save the template
            await contentWizard.waitAndClickOnSave();
            // 5. Switch to the site again:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            await studioUtils.saveScreenshot('template_support_removed');
            // 5. Verify - site wizard should be updated: Preview button gets disabled, because the `support` option has been removed in the page template
            await pageInspectionTab.waitForCustomizePageButtonNotDisplayed();
            await contentWizard.waitForPreviewButtonDisabled();
        });

    it(`Precondition - select 'site' option in Support selector`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageTemplateForm = new PageTemplateForm();
            // 1. Open the template:
            await studioUtils.selectContentAndOpenWizard(TEMPLATE.displayName);
            // 2. 'site' option has been selected in 'support' selector and the template has been saved
            await pageTemplateForm.filterOptionsAndSelectSupport(appConst.TEMPLATE_SUPPORT.SITE);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    // A new text component is incorrectly rendered after page is customised #8325
    // https://github.com/enonic/app-contentstudio/issues/8325
    it(`GIVEN site is opened and 'Customise' menu item has been clicked WHEN new text component with a text has been inserted THEN the expected text should be displayed in the Live Edit`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let TEST_TEXT = 'test text';
            let TEST_TEXT_INSERTED = "<p>test text</p>";
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let textComponentCke = new TextComponentCke();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Switches to 'live-edit' iframe and unlock the LiveEdit(Click on Customize menu item)
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            // 3. Switch to the parent frame:
            await contentWizard.switchToParentFrame();
            // 4. Click on Customize Page button in Inspect panel:
            await pageInspectionPanel.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('site_customised');
            // 5. Open the Page Components modal dialog and insert a text component:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Text']);
            await studioUtils.saveScreenshot('site_customised_component_inserted');
            // 6. Switches to 'live-edit' iframe and insert a text:
            await textComponentCke.typeTextInCkeEditor(TEST_TEXT);
            // 7. Switches to 'live-edit' iframe and gets the just inserted text:
            await textComponentCke.switchToLiveEditFrame();
            await studioUtils.saveScreenshot('site_customised_text_inserted');
            let result = await textComponentCke.getTextFromEditor();
            // 8. Verify that the text expected text is displayed in the text component:
            assert.equal(result, TEST_TEXT_INSERTED, "Expected text should be displayed in the text component");
        });

    // xp-apps#738 Live Editor is not updated after a page template was added or removed
    // https://github.com/enonic/xp-apps/issues/738
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
            await studioUtils.saveScreenshot(SITE.displayName + '_template_deleted');
            //4. Controller selector should appear in the wizard(Options filter input should appear): TODO
            //await contentWizard.waitForControllerOptionFilterInputVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

    function selectTemplatesFolderAndClickOnNew() {
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
