/**
 * Created on 11.08.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');

describe("insert.component.workflow.spec - insert a component and click on 'Mark as ready button'", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = 'main region';
    const TEXT_WITH_SPACES = "test text2   ";

    it("Precondition - new site should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN a text component has been inserted in the site WHEN 'Mark as ready' button has been pressed THEN site's status gets 'Ready for publishing'",
        async () => {
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open an existing site (work in progress)
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("main");
            //2. Insert Text Component with test text and save it:
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.typeTextInCkeEditor("test text");
            //3. Click on 'Mark as Ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            let expectedMessage = appConst.itemMarkedAsReadyMessage(SITE.displayName);
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, "Item is marked as ready - this message should appear");
            await studioUtils.saveScreenshot("text_component_mark_as_ready_pressed");
            //4. Verify the workflow state get 'Ready for publishing'
            actualWorkflow = await contentWizard.getToolbarWorkflowState();
            assert.equal(actualWorkflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "Ready for publishing status should be displayed in the wizard");
            //5. Verify that Publish button gets displayed in the wizard-toolbar
            await contentWizard.waitForPublishButtonDisplayed();
            //6. Verify the workflow status in Browse Panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            actualWorkflow = await contentBrowsePanel.getWorkflowState(SITE.displayName);
            assert.equal(actualWorkflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "'Ready for publishing' should be displayed in browse panel");
        });

    it("GIVEN text with spaces has been inserted in a text component WHEN 'Save' button has been pressed THEN 'Saved' button should appear in the wizard toolbar",
        async () => {
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentWizard = new ContentWizard();
            //1. Open an existing site and insert new text component:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            //2. insert a text with spaces:
            await textComponentCke.insertTextInCkeEditor(TEXT_WITH_SPACES);
            await textComponentCke.insertTextInCkeEditor(TEXT_WITH_SPACES);
            //3. Click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(2000);
            await studioUtils.saveScreenshot("text_component_saved_button");
            //4. Verify that Saved button gets visible in the toolbar:
            await contentWizard.waitForSavedButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
