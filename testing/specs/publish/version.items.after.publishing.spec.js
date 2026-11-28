/**
 * Created on 11.10.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const CompareWithPublishedVersionDialog = require('../../page_objects/compare.with.published.version.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const contentBuilder = require('../../libs/content.builder');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');

describe('version.items.after.publishing.spec: tests for version items after publishing a folder and updating its permissions', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const FOLDER_NAME = appConst.generateRandomName('folder');
    const PUBLISH_MSG = 'publish message';

    it(`Preconditions: 'Ready for publishing' folder should be added`, async () => {
        let folder = contentBuilder.buildFolder(FOLDER_NAME);
        await studioUtils.doAddReadyFolder(folder);
    });

    it(`GIVEN publish message has been typed in Publish Wizard AND the folder has been published WHEN 'Show all activities' has been checked AND 'Published' item has been expanded THEN the publish message should be displayed in the 'Published' version item`, async () => {
        let wizardVersionsWidget = new WizardVersionsWidget();
        let wizardContextPanel = new WizardContextPanel();
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizard = new ContentWizard();
        // 1. Open an existing folder
        await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
        await contentWizard.openDetailsWidget();
        // 2. Open Version widget:
        await wizardContextPanel.openVersionHistory();
        // 3. Open Publish wizard and insert a publish-message:
        await contentWizard.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnAddCommentButton();
        await contentPublishDialog.typeTextInCommentTextArea(PUBLISH_MSG);
        // 4. Publish the folder:
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForNotificationMessage();
        // 5. Click on 'Show all activities' checkbox, 'Published' item gets visible in the widget:
        await wizardVersionsWidget.clickOnShowAllActivitiesCheckbox();
        // 6. Expand the 'Published' item and verify the publish message (it is displayed only in the expanded item):
        let actualResult = await wizardVersionsWidget.getPublishMessagesFromPublishedItems();
        await studioUtils.saveScreenshot('version_item_publish_message');
        assert.equal(
            actualResult[0],
            PUBLISH_MSG,
            'Expected publish message should be displayed in Published version item',
        );
    });

    it(`GIVEN existing published folder is opened WHEN 'Audit Log' role has been added in 'Edit Permissions' dialog AND the changes have been applied THEN the folder remains 'Online' in the wizard toolbar`, async () => {
        let contentWizard = new ContentWizard();
        let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
        let userAccessWidget = new DetailsWidgetPermissionsSection();
        // 1. Open the published folder:
        await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
        await contentWizard.openDetailsWidget();
        // 2. Open 'Edit Permissions' dialog:
        await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
        // 3. Add 'Audit Log' principal:
        await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.AUDIT_LOG);
        // 4. Click on 'Next' button and go to Apply Changes step:
        await editPermissionsGeneralStep.clickOnNextButton();
        let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
        await editPermissionsSummaryStep.waitForLoaded();
        await editPermissionsSummaryStep.clickOnApplyChangesButton();
        await editPermissionsSummaryStep.waitForDialogClosed();
        // 5. Verify that the status remains 'Online' in the wizard toolbar:
        await contentWizard.waitForContentStatusInToolbar(appConst.CONTENT_STATUS.ONLINE);
    });

    it(`WHEN published folder with updated permissions has been filtered in the grid THEN 'Online' status should be displayed for the folder`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Type the folder name in the filter panel:
        await studioUtils.typeNameInFilterPanel(FOLDER_NAME);
        let state = await contentBrowsePanel.getContentStatus(FOLDER_NAME);
        // 2. Verify that the folder with updated permissions remains 'Online':
        assert.equal(state, appConst.CONTENT_STATUS.ONLINE, `The content should be 'Online'`);
    });

    it("GIVEN published folder with updated permissions is opened AND 'Show all activities' has been checked WHEN 'Edited' and 'Renamed' versions have been compared THEN one 'Permissions' item should be present in Versions Widget AND 'inheritPermissions' should not be present in 'Compare versions' dialog AND the folder remains 'Online'", async () => {
        let contentWizard = new ContentWizard();
        let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
        // 1. Open the published folder(permissions updated):
        await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
        // 2. Open Versions widget:
        await contentWizard.clickOnVersionHistoryButton();
        let wizardVersionsWidget = new WizardVersionsWidget();
        await wizardVersionsWidget.waitForLoaded();
        // 3. Click on 'Show all activities' checkbox and verify that one 'Permissions' item is displayed in the widget:
        await wizardVersionsWidget.clickOnShowAllActivitiesCheckbox();
        let permissionsItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
        assert.equal(permissionsItems, 1, `One 'Permissions' item should be present in the widget`);
        // 4. Select 'Edited' and 'Renamed' versions for comparing:
        await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader('Edited', 0);
        await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader('Renamed', 0);
        // 5. Click on 'Show changes' button:
        await wizardVersionsWidget.clickOnShowChangesButton();
        await compareWithPublishedVersionDialog.waitForDialogOpened();
        await studioUtils.saveScreenshot('compare_dlg_inherit_perm');
        // 6. Verify that only the name and path are modified:
        await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed('_name');
        await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed('_path');
        // 7. Verify that updating of permissions is not shown in the dialog:
        await compareWithPublishedVersionDialog.waitForModifiedPropertyNotDisplayed(
            appConst.COMPARE_VERSIONS_DLG_PROP.INHERIT_PERM,
        );
        await compareWithPublishedVersionDialog.waitForAddedPropertyNotDisplayed(
            appConst.COMPARE_VERSIONS_DLG_PROP.INHERIT_PERM,
        );
        // 8. Verify that the newer version ('Renamed') remains 'Online':
        let operation = await compareWithPublishedVersionDialog.getNewerVersionOperation();
        assert.equal(operation, 'Renamed', `'Renamed' should be displayed in the Newer version card`);
        let status = await compareWithPublishedVersionDialog.getNewerVersionStatus();
        assert.equal(
            status,
            appConst.CONTENT_STATUS.ONLINE,
            `'Online' status should be displayed in the Newer version card`,
        );
        // 9. Close the dialog and verify that the content remains 'Online' in the wizard toolbar:
        await compareWithPublishedVersionDialog.clickOnCancelButtonTop();
        await contentWizard.waitForContentStatusInToolbar(appConst.CONTENT_STATUS.ONLINE);
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
