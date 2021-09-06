/**
 * Created on 03.09.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ContextWindow = require('../../page_objects/wizardpanel/liveform/liveform.context.window');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');

describe('page.inspection.panel.spec: tests for page-inspection panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let COUNTRY_LIST_CONTROLLER = "Country List";

    it("GIVEN new site with controller is added WHEN 'Inspect' link has been clicked THEN Inspection tab should be opened",
        async () => {
            let contentWizard = new ContentWizard();
            let contextWindow = new ContextWindow();
            let pageInspectionPanel = new PageInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'My first Site', [appConst.MY_FIRST_APP], COUNTRY_LIST_CONTROLLER);
            //1. Open site-wizard and save new site with a controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            //Verify that the site should be automatically saved after selecting an application:
            await contentWizard.waitForNotificationMessage();
            //Verify that the site should be saved automatically after selecting a controller
            await contentWizard.selectPageDescriptor(COUNTRY_LIST_CONTROLLER);
            await contentWizard.waitForSaveButtonDisabled();

            await contextWindow.clickOnTabBarItem('Page');
            await pageInspectionPanel.waitForSaveAsTemplateButtonDisplayed();
            //5. Click on dropdown handle and expand options:
            let actualController = await pageInspectionPanel.getSelectedPageController();
            assert.equal(actualController, COUNTRY_LIST_CONTROLLER, "Expected page controller should be selected");
        });

    it("GIVEN 'Page Inspection' tab is opened WHEN 'Automatic' option has been selected THEN 'Confirmation Dialog' with the question should appear",
        async () => {
            let contextWindow = new ContextWindow();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            //2. Click on 'Page' tab in Inspection panel:
            await contextWindow.clickOnTabBarItem('Page');
            //3. Select new controller(Automatic)
            await pageInspectionPanel.selectPageTemplateOrController("Automatic");
            //3. Confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            let question = await confirmationDialog.getQuestion();
            assert.equal(question, "Switching to a page template will discard all of the custom changes made to the page. Are you sure?",
                "Expected message should be displayed");
        });

    //verifies :XP-3993 Inspection Panel should be closed, when 'Page Controller' was removed (Automatic)
    it("GIVEN 'Page Inspection' tab is opened WHEN 'Automatic' option has been selected THEN 'Context window' should be closed AND Details panel should be loaded",
        async () => {
            let contextWindow = new ContextWindow();
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            //2. Click on 'Page' tab in Inspection panel:
            await contextWindow.clickOnTabBarItem('Page');
            //3. Select new controller(Automatic)
            await pageInspectionPanel.selectPageTemplateOrController("Automatic");
            //4. Click on 'Yes' button
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await studioUtils.saveScreenshot("controller_automatic");
            //5. Verify that the content is automatically saved:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            //6. Details Panel should be loaded
            await pageInspectionPanel.waitForNotDipplayed();
            await wizardDetailsPanel.waitForDetailsPanelLoaded();
            //7. Controller selector should be loaded in Live Edit:
            await contentWizard.waitForControllerOptionFilterInputVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
