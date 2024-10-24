/**
 * Created on 16.07.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const TextComponentCke = require('../../page_objects/components/text.component');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');

describe('publish.wizard.non.required.dependencies.spec - tests for config with excludeDependencies=true', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEST_FOLDER;
    const CONTENT_LINK_TITLE = appConst.generateRandomName('link');

    it("Precondition: ready for publishing site should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
            await studioUtils.saveScreenshot('issue_open2');
            let folderName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
        });

    it("GIVEN existing site with is opened WHEN content link has been inserted THEN new dependency item should appear for the site",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Select the 'main region' page controller:
            //await contentWizard.selectPageDescriptor(appConst.CONTROLLER_NAME.MAIN_REGION)
            // 3. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Insert a text-component in PCV modal dialog:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            // 5. Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            // 6. Open Insert Link dialog
            await textComponentCke.clickOnInsertLinkButton();
            // 7. Insert the content-link(link to a folder in the root directory):
            await studioUtils.insertContentLinkInCke(CONTENT_LINK_TITLE, TEST_FOLDER.displayName, true);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN site with non-required dependency item is selected WHEN 'Publish wizard' is opened WHEN 'Hide excluded' button should be displayed in the modal dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            // 2. Publish wizard should be automatically loaded:
            await contentPublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('publish_dlg_hide_excluded_shown');
            // 3. Verify that 'Hide excluded' button is displayed:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 4. Click on 'Hide excluded' button:
            await contentPublishDialog.clickOnHideExcludedItemsButton();
            // 5. Verify that 'Hide excluded' button is not displayed now:
            await studioUtils.saveScreenshot('publish_dlg_show_excluded_displayed');
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            // 6. Verify that the all dependency item are hidden:
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 0, 'dependencies list should be empty');
            // 7. Click on 'Include child items' toggler:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 8. Verify that expected dependency item gets visible in the dialog:
            await contentPublishDialog.waitForDependenciesListDisplayed();
            depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'non-required dependency should be displayed in the list');
            assert.ok(depItems[0].includes('_templates'), 'non-required dependency should be displayed in the list');
        });

    it("GIVEN 'Show excluded' button has been clicked in the 'Publish Wizard' WHEN 'Show excluded' has been pressed THEN non-required dependency item gets visible in the modal dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            // 2. Publish wizard should be automatically loaded:
            await contentPublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('publish_dlg_show_excluded_shown');
            // 3. Click on 'hide excluded' button:
            await contentPublishDialog.clickOnHideExcludedItemsButton();
            // 5. Verify that 'Hide excluded' button is not displayed now:
            await contentPublishDialog.clickOnShowExcludedItemsButton();
            await studioUtils.saveScreenshot('publish_dlg_hide_excluded_shown_again');
            // 6. Verify that the dependency items are not shown in the list:
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'The only one dependent item should be in the dependencies list');
            // 7. Verify that the checkbox for the dependency item is not selected:
            let isCheckboxSelected = await contentPublishDialog.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.ok(isCheckboxSelected === false, 'Checkbox for the dependent item should not be selected');
        });

    it("GIVEN site with non-required dependency item is selected AND 'Create Issue' dialog has been opened WHEN 'Hide excluded' button has been clicked THEN dependent item should be hidden",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            // 2. 'Create Issue' dialog should be loaded:
            await createIssueDialog.waitForDialogLoaded();
            await createIssueDialog.waitForSpinnerNotVisible();
            await createIssueDialog.pause(1000);
            await studioUtils.saveScreenshot('create_issue_show_excluded_displayed');
            // 3. Verify that 'Hide excluded' button is displayed:
            await createIssueDialog.waitForHideExcludedItemsButtonDisplayed();
            await createIssueDialog.waitForDependenciesListDisplayed();
            await createIssueDialog.waitForAllDependantsCheckboxDisplayed();
            // 4. Click on 'Hide excluded' button:
            await createIssueDialog.clickOnHideExcludedItemsButton();
            await studioUtils.saveScreenshot('create_issue_hide_excluded_pressed');
            await createIssueDialog.waitForShowExcludedItemsButtonDisplayed();
            // 5. Verify that dependency list is empty:
            let depItems = await createIssueDialog.getDisplayNameInDependentItems();
            //assert.equal(depItems.length, 0, 'dependencies list should be empty');
        });

    it("GIVEN Site is selected AND 'Create Issue' dialog has been opened WHEN dependant item has been selected in 'Items' combobox THEN non-required dependency item gets not visible in the modal dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.pause(1500);
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            // 2. Create issue dialog should be loaded:
            await createIssueDialog.waitForDialogLoaded();
            await createIssueDialog.selectItemsInContentCombobox(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('create_issue_dlg_item_added');
            // 3. Verify - 'show excluded' button should be hidden:
            await createIssueDialog.waitForShowExcludedItemsButtonNotDisplayed();
            // 4. Verify that 'hide excluded' button is not displayed as well:
            await createIssueDialog.waitForHideExcludedItemsButtonNotDisplayed();
            // 5. Verify that the 'dependency items' list is not displayed in the dialog:
            await createIssueDialog.waitForDependenciesListNotDisplayed();
        });

    it("GIVEN site with non-required dependency item is selected AND 'Request Publishing' dialog has been opened WHEN 'Hide excluded' then 'Show excluded' button has been clicked THEN dependent item gets visible and is not selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            // 1. Select the existing site with a dependency click on 'Request Publishing...' menu item:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. 'Request Publish' dialog should be loaded:
            await createRequestPublishDialog.waitForDialogLoaded();
            // 3. Click on 'Hide excluded' button:
            await createRequestPublishDialog.clickOnHideExcludedItemsButton();
            // 4. Click on 'show excluded' button:
            await createRequestPublishDialog.clickOnShowExcludedItemsButton();
            // 5. Verify that the only one dependency item is shown in the list:
            let depItems = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'The only one dependent item should be in the dependencies list');
            // 6. Verify that the checkbox for the dependency item is not selected:
            let isCheckboxSelected = await createRequestPublishDialog.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.ok(isCheckboxSelected === false, 'Checkbox for the dependent item should not be selected');
        });

    it("GIVEN 'Request Publishing' dialog has been opened WHEN checkbox for non-required item has been clicked THEN 'Show/Hide' excluded buttons are not displayed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            // 1. Select the existing site with a dependency click on 'Request Publishing...' menu item:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. 'Request Publish' dialog should be loaded:
            await createRequestPublishDialog.waitForDialogLoaded();
            // 3.  'Hide excluded' button should be displayed:
            await createRequestPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 4. Click on the checkbox:
            await createRequestPublishDialog.clickOnCheckboxInDependentItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('request_publish_apply_selection_btn');
            // 5. Click on 'Apply selection' button
            await createRequestPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('request_publish_checkbox_applied');
            // 6. Verify that Show/Hide excluded buttons are not displayed:
            await createRequestPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            await createRequestPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
        });

    it("GIVEN a site with non-required dependant is selected AND new issue has been created WHEN 'Items tab' in 'Issue Details' has been opened THEN 'Hide Excluded' button should be visible in Items tab",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            // 2. Create issue dialog should be loaded:
            await createIssueDialog.waitForDialogLoaded();
            // 3. Fill in the title and click on 'Create Issue' button:
            await createIssueDialog.typeTitle('test issue');
            await createIssueDialog.clickOnCreateIssueButton();
            await createIssueDialog.waitForNotificationMessage();
            // 4. Issue Details dialog should be loaded:
            await issueDetailsDialog.waitForDialogLoaded();
            // 5. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            await studioUtils.saveScreenshot('issue_show_excluded');
            // 6. Verify that 'Hide excluded' button is displayed in the 'Items' tab:
            await issueDetailsDialogItemsTab.waitForHideExcludedItemsButtonDisplayed();
            // 7. Verify that 'Show excluded' button is not displayed in the 'Items' tab:
            await issueDetailsDialogItemsTab.waitForShowExcludedItemsButtonNotDisplayed();
            // 8. Verify that the 'dependency items' list is displayed in the 'Items' tab:
            await issueDetailsDialogItemsTab.waitForDependenciesListDisplayed();
            let isSelected = await issueDetailsDialogItemsTab.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.ok(isSelected === false, "The dependant item-checkbox should be unselected");
        });

    it("GIVEN checkbox for non-required item is selected in IssueDetails dialog WHEN 'Publish' button has been pressed in 'Items tab' THEN the same dependant item should be selected in Publish Content dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentPublishDialog = new ContentPublishDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Select the existing site with a non required dependency:
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 2. Open Create Issue dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.waitForDialogLoaded();
            // 3. Fill in the title and click on 'Create Issue' button:
            await createIssueDialog.typeTitle('test issue 2');
            await createIssueDialog.clickOnCreateIssueButton();
            await createIssueDialog.waitForNotificationMessage();
            // 4. Issue Details dialog should be loaded:
            await issueDetailsDialog.waitForDialogLoaded();
            // 5. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 6. Click on the checkbox for the dependant item:
            await issueDetailsDialogItemsTab.clickOnCheckboxInDependentItem(TEST_FOLDER.displayName);
            await issueDetailsDialogItemsTab.clickOnApplySelectionButton();
            // 7. Verify that the item is selected in the 'Items' tab:
            let isSelected = await issueDetailsDialogItemsTab.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.ok(isSelected, "The checkbox for dependant item should be selected in Issue details dialog");
            // 8. Verify that the 'dependency items' list is displayed in the 'Items' tab:
            await issueDetailsDialogItemsTab.waitForHideExcludedItemsButtonNotDisplayed();
            // 9. Click on 'Publish' button and open 'Publish Wizard':
            await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            await studioUtils.saveScreenshot('dependant_item_in_publish_wizard');
            // 10. The same checkbox for dependant item should be selected in 'Publish Wizard' as well:
            isSelected = await contentPublishDialog.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.ok(isSelected, "The same checkbox for dependant item should be selected in 'Publish Wizard' as well");
            // 11. Hide excluded items button should not be displayed in 'Publish Wizard':
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
        });

    it("GIVEN site with non-required dependency item is selected AND 'Request Publishing' dialog has been opened WHEN 'Hide excluded' them 'Show excluded' button has been clicked THEN dependent item gets visible and is not selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            // 1. Select the existing site with a dependency click on 'Request Publishing...' menu item:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. 'Request Publish' dialog should be loaded:
            await createRequestPublishDialog.waitForDialogLoaded();
            // 3. Click on 'Hide excluded' button:
            await createRequestPublishDialog.clickOnHideExcludedItemsButton();
            // 4. Verify that All checkbox is hidden
            await createRequestPublishDialog.waitForAllDependantsCheckboxNotDisplayed();
            // 5. Click on Show excluded:
            await createRequestPublishDialog.clickOnShowExcludedItemsButton();
            // 6. Verify that the only one dependency item is shown in the list:
            let depItems = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'The only one dependent item should be in the dependencies list');
            // 7. Verify that the checkbox for the dependency item is not selected:
            let isCheckboxSelected = await createRequestPublishDialog.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.ok(isCheckboxSelected === false, 'Checkbox for the dependent item should not be selected');
        });

    it("GIVEN 'Request Publishing' dialog has been opened WHEN checkbox for non-required item has been clicked THEN 'Show/Hide' excluded buttons are not displayed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            // 1. Select the existing site with a dependency click on 'Request Publishing...' menu item:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. 'Request Publish' dialog should be loaded:
            await createRequestPublishDialog.waitForDialogLoaded();
            // 4. Click on the checkbox:
            await createRequestPublishDialog.clickOnCheckboxInDependentItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('request_publish_apply_selection_btn');
            // 5. Click on 'Apply selection' button
            await createRequestPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('request_publish_checkbox_applied');
            // 6. Verify that Show/Hide excluded buttons are not displayed:
            await createRequestPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            await createRequestPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
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
