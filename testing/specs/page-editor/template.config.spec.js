/**
 * Created on 12.09.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const HomePageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/home.page.inspection.panel');
const WizardContextWindowPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const TextComponent = require('../../page_objects/components/text.component');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const PageWidgetPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');

describe('template.config.spec: template config should be displayed in the Inspection Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEMPLATE;
    const SUPPORT = 'article';
    const CONTROLLER_NAME = 'Page';
    const TITLE_TEXT = 'My title';
    const TEST_TEXT = 'test text';
    const ARTICLE_NAME = contentBuilder.generateRandomName('article');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`Precondition: new template(supports article) should be added`,
        async () => {
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE);
            await studioUtils.saveScreenshot('article_template');
        });

    // Verify - Creating a template doesn't work from a non-site content #9183
    // https://github.com/enonic/app-contentstudio/issues/9183
    it(`GIVEN a controller in article-content has been set WHEN 'Save as template' menu item has been clicked in PCV THEN new page template for this content should be created`,
        async () => {
            let wizardContextWindowPanel = new WizardContextWindowPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            // 2. Inspection Panel should be loaded in the Context Window:
            await wizardContextWindowPanel.waitForOpened();
            // 3. Click on 'Customize' menu item:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToMainFrame();
            // 4. Click on 'Customize Page' button in the Page Inspection panel:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            // 5. Confirm the action in the Confirmation dialog:
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            await pageComponentsWizardStepForm.openMenu('Page');
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE]);
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot('article_support_template');
            let pageTemplateForm = new PageTemplateForm();
            // 6. Verify that 'support' dropdown has 'article' option selected:
            let support = await pageTemplateForm.getSupportSelectedOptions() ;
            assert.equal(support[0],'article', `'article' should be selected in support dropdown`);
        });

    // verifies https://github.com/enonic/xp/issues/7396 and https://github.com/enonic/app-contentstudio/issues/947
    it(`WHEN new wizard for article has been opened THEN input from template-config should be displayed in the Inspection Panel`,
        async () => {
            let homePageInspectionPanel = new HomePageInspectionPanel();
            let wizardContextWindowPanel = new WizardContextWindowPanel();
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            // 2. Inspection Panel should be loaded in the Context Window:
            await wizardContextWindowPanel.waitForOpened();
            // 3. Click on 'Customize' menu item:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToMainFrame();
            //4. Click on 'Customize Page' button in the Page Inspection panel:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            // 5. Confirm the action in the Confirmation dialog:
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('article_details_panel');
            // 4. Verify that the 'title' text input is displayed in the Page Inspection panel(config):
            await homePageInspectionPanel.waitForTitleInputDisplayed();
            // 5. insert a text in the input:
            await homePageInspectionPanel.typeTitle(TITLE_TEXT);
            // 6. Click on 'Apply' button on the Inspect Panel and save the changes:
            await homePageInspectionPanel.clickOnApplyButton();
            // 7. Verify that text is applied:
            let result = await homePageInspectionPanel.getTitle();
            assert.equal(result, TITLE_TEXT, 'expected and actual title should be equal');
        });

    it(`WHEN wizard for new article content is opened THEN 'Page Component wizard' step should not be displayed because 'Customize Page' button was not clicked yet`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            // 2. Verify that 'Page Component wizard' step is not displayed, 'Customize' menu item is not clicked yet:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            // 3. Expand the Live Editor:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Verify that 'Page Component' modal dialog is not displayed before the customization:
            await pageComponentView.waitForNotDisplayed();
        });

    it(`WHEN 'Customize Page' button has been clicked in Insert tab THEN 'Insert' tab should be visible in Components widget in Context Window`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageWidgetPanel = new PageWidgetPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            await contentWizard.typeDisplayName(ARTICLE_NAME);
            // 2. Click on 'Customize' menu item:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToMainFrame();
            // 3. Click on 'Customize Page' button in the Page Inspection panel:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.switchToParentFrame();
            // 4. Verify that Insert tab is displayed in the Context Window:
            await pageWidgetPanel.waitForTabBarItemDisplayed('Insert');
            await contentWizard.waitForSaveButtonEnabled();
        });

    it(`GIVEN 'Customize' menu item has been clicked in article wizard WHEN text component has been inserted in 'Page Component wizard' step THEN the text should appear in the LiveEdit frame`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let textComponent = new TextComponent();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            await contentWizard.typeDisplayName(ARTICLE_NAME);
            // 2. Click on 'Customize' menu item:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToMainFrame();
            // 3. Click on 'Customize Page' button in the Page Inspection panel:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 3. Verify that Page item is displayed in the WizardStepNavigator
            await contentWizard.waitForWizardStepDisplayed('Page');
            // 4. Insert text component in Page Component wizard step
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Text']);
            await textComponent.typeTextInCkeEditor(TEST_TEXT);
            await studioUtils.saveScreenshot('article_content_customized');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1500);
            // 5. Verify that the text is present in LiveEdit frame
            await contentWizard.switchToLiveEditFrame();
            let actualText = await liveFormPanel.getTextInTextComponent();
            assert.equal(actualText[0], TEST_TEXT, 'Expected text should be present in Live Edit panel');
        });

    it(`GIVEN existing customized article content has been opened WHEN text component has been removed in Page Component wizard step THEN the text should not be present in the LiveEdit frame`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open new wizard for Article content:
            await studioUtils.selectAndOpenContentInWizard(ARTICLE_NAME);
            await contentWizard.switchToLiveEditFrame();
            // 2. Verify that text component is present in LiveEdit
            await liveFormPanel.waitForTextComponentDisplayed(TEST_TEXT);
            await contentWizard.switchToMainFrame();
            // 3. Remove the text component and save it
            await pageComponentsWizardStepForm.openMenu(TEST_TEXT);
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE]);
            await studioUtils.saveScreenshot('component_step_form_txt_removed');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1500);
            // 4. Verify that the text component is not present in LiveEdit frame
            await contentWizard.switchToLiveEditFrame();
            await liveFormPanel.waitForTextComponentNotDisplayed(TEST_TEXT);
        });

    it(`GIVEN existing customized article content has been opened WHEN 'Reset' menu item has been clicked in Page Component wizard step THEN Page Component wizard step gets not visible`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open the existing customized Article-content:
            await studioUtils.selectAndOpenContentInWizard(ARTICLE_NAME);
            let contextWindow = await contentWizard.openContextWindow();
            // 2. Click on 'Reset' menu item in the wizard step form:
            await pageComponentsWizardStepForm.openMenu('Page');
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('component_step_form_reset');
            // 3. The content should be saved automatically:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 4. Verify that 'Page Component wizard' step gets not visible:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            // 5. Verify that 'Page' item is not displayed in the WizardStepNavigator
            await contentWizard.waitForWizardStepNotDisplayed('Page');
            // 6. Verify that 'Customize Page' button is displayed in the Inspection Panel:
            await contextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.waitForCustomizePageButtonDisplayed();
            // 7. Save button should be disabled:
            await contentWizard.waitForSaveButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
