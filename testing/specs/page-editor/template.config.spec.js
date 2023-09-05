/**
 * Created on 12.09.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const DefaultPageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/default.page.inspection.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const TextComponent = require('../../page_objects/components/text.component');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const ContextWindow = require('../../page_objects/wizardpanel/liveform/liveform.context.window');

describe('template.config.spec: template config should be displayed in the Inspection Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEMPLATE;
    const SUPPORT = 'article';
    const CONTROLLER_NAME = 'Page';
    const TITLE_TEXT = "My title";
    const TEST_TEXT = "test text";
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

    // verifies https://github.com/enonic/xp/issues/7396 and https://github.com/enonic/app-contentstudio/issues/947
    it(`WHEN new wizard for article has been opened THEN input from template-config should be displayed in the Inspection Panel`,
        async () => {
            let defaultPageInspectionPanel = new DefaultPageInspectionPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            // 2. Click on Customize menu item:
            await contentWizard.doUnlockLiveEditor();
            await contentWizard.switchToMainFrame();
            // 3. Inspection Panel should be loaded:
            await wizardDetailsPanel.waitForDetailsPanelLoaded();
            await studioUtils.saveScreenshot('article_details_panel');
            // 4. Verify that Text input is displayed in the Inspection panel, insert a text:
            await defaultPageInspectionPanel.waitForTitleInputDisplayed();
            await defaultPageInspectionPanel.typeTitle(TITLE_TEXT);
            // 5. Click on 'Apply' button in Inspect Panel and save the changes:
            await defaultPageInspectionPanel.clickOnApplyButton();
            // 6. Verify that text is applied:
            let result = await defaultPageInspectionPanel.getTitle();
            assert.equal(result, TITLE_TEXT, 'expected and actual title should be equal');
        });

    it(`WHEN wizard for new article content is opened THEN 'Page Component wizard' step should not be displayed because 'Customize' menu item is not clicked yet`,
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

    it(`WHEN 'Customize' menu item has been clicked in article wizard THEN 'Insert' tab should be visible in Components widget in Context Window`,
        async () => {
            let contentWizard = new ContentWizard();
            let contextWindow = new ContextWindow();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            await contentWizard.typeDisplayName(ARTICLE_NAME);
            // 2. Click on 'Customize' menu item:
            await contentWizard.doUnlockLiveEditor();
            await contextWindow.switchToParentFrame();
            // 3. Verify that Insert tab is displayed in the Context Window:
            await contextWindow.waitForTabBarItemDisplayed('Insert');
            await contentWizard.waitForSaveButtonEnabled();
        });

    it(`GIVEN 'Customize' menu item has been clicked in article wizard WHEN text component has been inserted in 'Page Component wizard' step THEN the text should appear in the LiveEdit frame`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let textComponent = new TextComponent();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open new wizard for Article content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            await contentWizard.typeDisplayName(ARTICLE_NAME);
            // 2. Click on 'Customize' menu item:
            await contentWizard.doUnlockLiveEditor();
            await contentWizard.switchToMainFrame();
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
            await pageComponentsWizardStepForm.selectMenuItem(['Remove']);
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
            let contextWindow = new ContextWindow();
            // 1. Open the existing customized Article-content:
            await studioUtils.selectAndOpenContentInWizard(ARTICLE_NAME);
            // 2. Click on 'Reset' menu item in the wizard step form:
            await pageComponentsWizardStepForm.openMenu('Page');
            await pageComponentsWizardStepForm.selectMenuItem(['Reset']);
            await studioUtils.saveScreenshot('component_step_form_reset');
            // 3. The content should be saved automatically:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 4. Verify that 'Page Component wizard' step gets not visible:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            // 5. Verify that 'Page' item is not displayed in the WizardStepNavigator
            await contentWizard.waitForWizardStepNotDisplayed('Page');
            // 6. Verify that 'Insert' tab is present in the 'Components widget' in Context window
            await contextWindow.waitForTabBarItemDisplayed('Insert');
            // 7. Save button should be disabled:
            await contentWizard.waitForSaveButtonDisabled();
            // 6. Verify that 'Insert' tab is present in the Components widget in Context window
            await contextWindow.waitForTabBarItemDisplayed('Insert');
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
