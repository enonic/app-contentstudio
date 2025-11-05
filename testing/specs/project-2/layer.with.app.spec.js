/**
 * Created on 20.09.2022.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const MixinsImageSelector = require('../../page_objects/wizardpanel/wizard-step-form/mixins.image.selector.wizard.step.form');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentSelectorForm = require('../../page_objects/wizardpanel/content.selector.form');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');

describe('layer.with.app.spec - tests for layer with applications', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.GEEK;

    it("Precondition 1 - new layer in 'Default' project should be added by SU",
        async () => {
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 1. Select 'Default' project and open wizard for new layer:
            await projectUtils.selectParentAndOpenProjectWizardDialog(appConst.PROJECTS.DEFAULT_PROJECT_NAME);
            let layer = projectUtils.buildLayer(appConst.PROJECTS.DEFAULT_PROJECT_NAME, null, appConst.PROJECT_ACCESS_MODE.PUBLIC, null,
                appConst.APP_CONTENT_TYPES, LAYER_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
        });

    // Incorrect behaviour inside the Select Project dialog #8616
    // https://github.com/enonic/app-contentstudio/issues/8616
    it("GIVEN Project Selection dialog is opened Focus should be set on the current project WHEN Shift+Tab have been pressed THEN the next project should be selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let projectSelectionDialog = new ProjectSelectionDialog();
            // 1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            // 2. Open Project Selection dialog:
            await contentBrowsePanel.clickOnProjectViewerButton();
            await projectSelectionDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('project_selection_dialog_current_project');
            // 3. Verify - The Focus is set on the current project
            await projectSelectionDialog.waitForSelectedProjectItem(LAYER_DISPLAY_NAME);
            // 4. Press Shift+Tab
            await projectSelectionDialog.press_Shift_Tab();
            // 5. Press 'Enter' key(switch to the next project):
            await projectSelectionDialog.pressEnterKey();
            await studioUtils.saveScreenshot('project_selection_dialog_shift_tab_pressed');
            let currentProject = await contentBrowsePanel.getCurrentProjectDisplayName();
            // 6. Verify - The next project should be displayed in the Browse Panel:
            assert.ok(currentProject.includes(LAYER_DISPLAY_NAME) === false, 'The next project should be selected');
        });

    // Verify issue https://github.com/enonic/app-contentstudio/issues/5118
    // 500 error in Project Wizard for a content with relationship-type #5118
    it(`GIVEN new article has been saved in root WHEN wizard with Custom relationship selector is opened THEN the article should be available in the selector`,
        async () => {
            // 1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            let displayName = contentBuilder.generateRandomName('article');
            let articleContent = contentBuilder.buildArticleContent(displayName, 'title', 'body', appConst.contentTypes.ARTICLE);
            // 2. Add Article content in root directory:
            await doAddArticleContent(articleContent);
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            let customRelationshipForm = new ContentSelectorForm();
            // 3. Open new wizard with Custom relationship
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await studioUtils.clickOnItemInNewContentDialog(appConst.contentTypes.CUSTOM_RELATIONSHIP);
            // 4. Verify that just created article content is available in the selector
            await customRelationshipForm.clickOnOptionByDisplayNameAndApply(articleContent.displayName);
            await studioUtils.saveScreenshot('custom_rel_root_dir');
            let result = await customRelationshipForm.getSelectedOptions();
            assert.ok(result[0].includes(articleContent.displayName), 'Expected option should be selected');
        });

    // Verifies: New Content dialog doesn't show content types from project apps #5104
    // https://github.com/enonic/app-contentstudio/issues/5104
    it("GIVEN layer's context with an application is selected AND no selections in the grid WHEN New content dialog is opened THEN all content types from project's application should be available in the dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            // 2. Click on 'New' button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await newContentDialog.pause(500);
            await studioUtils.saveScreenshot('root_new_content_with_apps');
            // 3. Verify that all input types are available for adding new content in root directory:
            let contentTypeItems = await newContentDialog.getItems();
            assert.ok(contentTypeItems.includes('all-inputs'), "Expected input type is displayed in the modal dialog");
            assert.ok(contentTypeItems.includes('attachment0_0'), "Expected input type is displayed in the modal dialog");
            assert.ok(contentTypeItems.length > 50, "All types from the application are present in the modal dialog");
        });

    // Verifies: mixins is not returned for a content-type outside of site #5117
    it("WHEN wizard for new content in root with mixins THEN mixins should be present in the wizard page",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            let mixinsImageSelector = new MixinsImageSelector();
            // 1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            // 2. Click on 'New' button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 3. Select the item with mixins:
            let contentWizard = await studioUtils.clickOnItemInNewContentDialog(appConst.contentTypes.DOUBLE_1_1_MIXINS);
            // 4. Click on mixins toggler:
            await contentWizard.clickOnMixinsTogglerByName('mixins (image selector)');
            // 5. Select an image in mixins
            await mixinsImageSelector.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_image_selector_saved_2');
            // 6. Verify that the image appears in the form:
            await mixinsImageSelector.waitForImageSelected();
        });

    it('Post conditions: the layer should be deleted',
        async () => {
            await studioUtils.openSettingsPanel();
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

});

async function doAddArticleContent(article) {
    let contentWizardPanel = new ContentWizardPanel();
    let contentBrowsePanel = new ContentBrowsePanel();
    let newContentDialog = new NewContentDialog();
    await contentBrowsePanel.clickOnNewButton();
    await newContentDialog.waitForOpened();
    //2. Open article-wizard:
    await studioUtils.clickOnItemInNewContentDialog(article.contentType);
    //3.Type the data and save all
    await contentWizardPanel.typeData(article);
    await contentWizardPanel.waitAndClickOnSave();
    await studioUtils.doCloseCurrentBrowserTab();
    await studioUtils.doSwitchToContentBrowsePanel();
    return await contentBrowsePanel.pause(1000);
}

