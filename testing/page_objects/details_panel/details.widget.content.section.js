/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');

const xpath = {
    container: `//section[@data-component='DetailsWidgetContentSection']`,
    pathProperty: "//dt[contains(.,'Path')]/following-sibling::dd[1]",
    displayNameProperty: "//dt[contains(.,'Display Name')]/following-sibling::dd[1]",
    statusProperty: "//dt[contains(.,'Status')]/following-sibling::dd[1]",
    diffStatusBadge: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[@data-component='DiffStatusBadge']`,
    publishStatus: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[@data-component='DiffStatusBadge']/span[1]`,
    statusDiffStatus: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[@data-component='DiffStatusBadge']/span[2]`,
    statusValidity: `//dt[contains(.,'Status')]/following-sibling::dd[1]//span[child::*[@data-component='StatusIcon']]`,
};

/*
Example

Status   Offline New Invalid
Display Name
Path
 */
class DetailsWidgetContentSection extends Page {

    get pathProperty() {
        return xpath.container + xpath.pathProperty;
    }

    get displayNameProperty() {
        return xpath.container + xpath.displayNameProperty;
    }

    async waitForPathPropertyDisplayed() {
        try {
            await this.waitForElementDisplayed(this.pathProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetContentSection, path was not displayed', 'err_content_section_path', err);
        }
    }

    async waitForDisplayNamePropertyDisplayed() {
        try {
            await this.waitForElementDisplayed(this.displayNameProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetContentSection, display name was not displayed', 'err_content_section_display_name', err);
        }
    }

    async getTextInPathField() {
        try {
            await this.waitForPathPropertyDisplayed();
            return await this.getText(this.pathProperty);
        } catch (err) {
            await this.handleError('Cannot get text in path field of WidgetContentSection', 'err_get_text_path_field', err);
        }
    }

    async getTextInDisplayNameField() {
        await this.waitForDisplayNamePropertyDisplayed();
        return await this.getText(this.displayNameProperty);
    }

    get publishStatus() {
        return xpath.container + xpath.publishStatus;
    }

    get statusProperty() {
        return xpath.container + xpath.statusProperty;
    }

    get diffStatusBadge() {
        return xpath.container + xpath.diffStatusBadge;
    }

    get statusDiffStatus() {
        return xpath.container + xpath.statusDiffStatus;
    }

    // Workflow and validation status are displayed in the same element, so we need to check both of them to get the full status info
    get statusValidity() {
        return xpath.container + xpath.statusValidity;
    }

    async getTextInDisplayNameField() {
        await this.waitForDisplayNamePropertyDisplayed();
        return await this.getText(this.displayNameProperty);
    }

    async getTextInPathField() {
        await this.waitForPathPropertyDisplayed();
        return await this.getText(this.pathProperty);
    }

    async getStatusText() {
        await this.waitForElementDisplayed(this.publishStatus);
        const publishStatus = await this.getText(this.publishStatus);
        const diffStatusElements = await this.findElements(this.statusDiffStatus);
        const diffStatus = diffStatusElements.length > 0 ? await diffStatusElements[0].getText() : '';
        return [publishStatus, diffStatus].filter(t => t).join(' ');
    }

    async getWorkflowOrValidityStatus() {
        try {
            await this.waitForElementDisplayed(this.statusValidity);
            return await this.getText(this.statusValidity);
        } catch (err) {
            await this.handleError('Cannot get workflow or validity status text of WidgetContentSection', 'err_get_workflow_status', err);
        }
    }

    async setStatusWidth(widthPx) {
        const statusProperty = await this.findElement(this.statusProperty);
        await this.getBrowser().execute((element, width) => {
            element.style.width = width;
            element.style.maxWidth = width;
        }, statusProperty, `${widthPx}px`);
    }

    async clearStatusWidth() {
        const statusProperty = await this.findElement(this.statusProperty);
        await this.getBrowser().execute((element) => {
            element.style.width = '';
            element.style.maxWidth = '';
        }, statusProperty);
    }

    async isWorkflowStatusWrapped() {
        await this.waitForElementDisplayed(this.diffStatusBadge);
        await this.waitForElementDisplayed(this.statusValidity);
        const diffStatusBadge = await this.findElement(this.diffStatusBadge);
        const workflowStatus = await this.findElement(this.statusValidity);
        const diffStatusBadgeY = await diffStatusBadge.getLocation('y');
        const workflowStatusY = await workflowStatus.getLocation('y');
        return workflowStatusY > diffStatusBadgeY;
    }

    async waitForWorkflowStatusWrapped() {
        await this.getBrowser().waitUntil(async () => {
            return await this.isWorkflowStatusWrapped();
        }, {
            timeout: 4000,
            timeoutMsg: 'Workflow status should wrap to the next line in DetailsWidgetContentSection',
        });
    }
}

module.exports = DetailsWidgetContentSection;
