import type {Page} from '../../../../app/page/Page';
import type {Region} from '../../../../app/page/region/Region';
import {ConfigBasedComponent} from '../../../../app/page/region/ConfigBasedComponent';
import {LayoutComponent} from '../../../../app/page/region/LayoutComponent';

/**
 * Counts how many page component configs reference a given property value.
 * Walks all regions recursively (including nested layout regions).
 */
function countPropertyValueInRegions(regions: Region[], propertyName: string, propertyValue: string): number {
    let count = 0;

    for (const region of regions) {
        for (const component of region.getComponents()) {
            if (component instanceof ConfigBasedComponent) {
                if (component.getConfig().getProperty(propertyName)?.getString() === propertyValue) {
                    count++;
                }
            }

            if (component instanceof LayoutComponent) {
                count += countPropertyValueInRegions(component.getRegions().getRegions(), propertyName, propertyValue);
            }
        }
    }

    return count;
}

/**
 * Checks whether an attachment is referenced by more than one page component.
 * Used to prevent deleting a server-side attachment that other components still reference.
 *
 * @param page - The current draft page (null if content is not a page)
 * @param inputName - The form input name (e.g. "myAttachment")
 * @param attachmentName - The attachment filename to check
 * @returns true if the attachment is referenced by more than one component config
 */
export function isAttachmentInUse(page: Page | null, inputName: string, attachmentName: string): boolean {
    if (!page || !page.hasNonEmptyRegions()) {
        return false;
    }

    return countPropertyValueInRegions(page.getRegions().getRegions(), inputName, attachmentName) > 1;
}
