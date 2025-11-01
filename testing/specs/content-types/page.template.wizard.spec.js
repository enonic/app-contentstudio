/**
 * Created on 16.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require("../../page_objects/browsepanel/content.browse.panel");
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('page.template.wizard.spec tests for page template wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const TEMPLATE_NAME = contentBuilder.generateRandomName('template');

    it("GIVEN 'page template' wizard is opened WHEN a display name has been typed AND 'Save' button pressed THEN red icon should be displayed in the wizard",
        async () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
            // 1. Open wizard for new page template
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            // 2. Fill in the name input
            await contentWizard.typeDisplayName(TEMPLATE_NAME);
            await contentWizard.pause(500);
            // 3. Verify that red icon is displayed in the wizard(the content is not valid)
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'Red icon should be displayed because Support is not selected');
            // 4. Save the invalid page template
            await contentWizard.waitAndClickOnSave();
            // 5. Verify that red icon remains in the wizard after the saving
            isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'Red icon should be displayed after saving the template, because Support is not selected');
            // 6. Select 'site' in support selector
            await pageTemplateForm.filterOptionsAndSelectSupport(appConst.TEMPLATE_SUPPORT.SITE);
            // 7. Verify that the content gets valid now:
            isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'Red icon should not be displayed, the template gets valid');
            // 8. Verify that "Page Template" wizard's step is present:
            let isPresent = await contentWizard.isWizardStepPresent('Page Template');
            assert.ok(isPresent, 'Page Template step should be displayed');
            // Save the valid template
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing page-template,'support' is selected EXPECT the template should be valid in the grid",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEMPLATE_NAME);
            // Verify that the template is valid in Grid
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(TEMPLATE_NAME);
            await studioUtils.saveScreenshot('template_support_selected');
            assert.ok(isDisplayed === false, 'red icon should not be displayed near the content!');
            // Verify that Mark as Ready is default action for the template:
            await contentBrowsePanel.waitForMarkAsReadyButtonVisible();
        });

    it("GIVEN the page-template is opened WHEN support selected option has been removed THEN the content gets invalid",
        async () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            // 1. Open the existing valid template:
            await studioUtils.selectAndOpenContentInWizard(TEMPLATE_NAME);
            // 2. Click on 'Remove' icon and remove the support selected option:
            await pageTemplateForm.clickOnRemoveSupportIcon("Site");
            // 3. Verify that the template is not valid now:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'Red icon gets displayed in Wizard after removing the support option');
            // 4. Click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            // 5. Verify that validation recording gets visible:
            let validationRecording = await pageTemplateForm.getFormValidationRecording();
            assert.equal(validationRecording, appConst.requiredValidationMessage(1), 'Min 1 valid occurrence(s) required');
            let contentBrowsePanel = new ContentBrowsePanel();
            // 6. Go to Browse Panel
            await studioUtils.doSwitchToContentBrowsePanel();
            // 7. Verify that the template is invalid in the grid:
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(TEMPLATE_NAME);
            await studioUtils.saveScreenshot('template_support_selected');
            assert.ok(isDisplayed, 'red icon should be present near the content!');
        });

    it("GIVEN the page-template is opened WHEN the previous version has been reverted THEN expected support option should be selected",
        async () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open the not valid template:
            await studioUtils.selectAndOpenContentInWizard(TEMPLATE_NAME);
            // 2. Open 'Versions widget' and revert the valid version(support is selected)
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRestoreButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('template_reverted_support');
            // 3. Verify that expected support option gets visible:
            let support = await pageTemplateForm.getSupportSelectedOptions();
            assert.equal(support.length, 1, 'Single item should be in support form');
            assert.equal(support[0], 'Site', 'Site option should be selected in the selector');
            // 4. Verify that the template gets valid after revering the version
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'Red icon should not be displayed after reverting the valid version');
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
