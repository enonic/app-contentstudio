import {
    PageEditor,
    ComponentView,
    CreateItemViewConfig,
    RegionView,
    ComponentItemType,
    FragmentItemType,
    type ItemView,
    ComponentPath as ComponentPathEditor,
    Element,
    NewElementBuilder,
    EditorEvents
} from '@enonic/page-editor';
import {DescriptorBasedComponent} from '@enonic/lib-contentstudio/app/page/region/DescriptorBasedComponent';
import {ComponentPath} from '@enonic/lib-contentstudio/app/page/region/ComponentPath';
import {PageState} from '@enonic/lib-contentstudio/app/wizard/page/PageState';
import {PageHelper} from '@enonic/lib-contentstudio/app/util/PageHelper';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {HTMLAreaHelper} from '@enonic/lib-contentstudio/app/inputtype/ui/text/HTMLAreaHelper';
import {ItemType} from '@enonic/lib-contentstudio/page-editor/ItemType';
import {UriHelper} from '@enonic/lib-contentstudio/app/rendering/UriHelper';
import {RenderingMode} from '@enonic/lib-contentstudio/app/rendering/RenderingMode';
import DOMPurify from 'dompurify';

export class EditorEventHandler {

    public loadComponentView(view: ItemView, isExisting: boolean): void {

        const path = view.getPath();
        if (view instanceof ComponentView) {

            const content = PageEditor.getContent();

            const componentUrl: string = UriHelper.getComponentUri(content.getContentId().toString(),
                this.convertContentPath(path),
                RenderingMode.EDIT);

            this.loadComponent(view, componentUrl, isExisting).then(() => {

                PageEditor.notify(EditorEvents.ComponentLoaded, {path});
            }).catch((reason) => {
                console.warn(`LiveEditPage: loadComponent at [${path}] failed:`, reason);

                PageEditor.notify(EditorEvents.ComponentLoadFailed, {path, reason});
            });
        }
    }

    // Converts ComponentPathEditor to ComponentPathLib for interoperability of same classes between page-editor and lib-contentstudio
    private convertContentPath(path: ComponentPathEditor): ComponentPath {
        return ComponentPath.fromString(path.toString());
    }

    private loadComponent(componentView: ComponentView, componentUrl: string, isExisting: boolean): Promise<void> {
        assertNotNull(componentView, 'componentView cannot be null');
        assertNotNull(componentUrl, 'componentUrl cannot be null');

        componentView.showLoadingSpinner();

        return fetch(componentUrl)
            .then(response => {
                if (!isExisting) {
                    const hasContributions = response.headers.has('X-Has-Contributions');

                    // reloading entire live page if the component has contributions and there are no equal components on the page
                    if (hasContributions && !this.hasSameComponentOnPage(this.convertContentPath(componentView.getPath()))) {

                        PageEditor.notify(EditorEvents.PageReloadRequest);

                        return;
                    }
                }

                return response.text()
                    .then(htmlAsString => this.handleComponentHtml(componentView, htmlAsString))
            });
    }

    private hasSameComponentOnPage(path: ComponentPath): boolean {
        const component = PageState.getComponentByPath(path);

        if (component instanceof DescriptorBasedComponent) {
            const key = component.getDescriptorKey();
            const allPageComponents = PageHelper.flattenPageComponents(PageState.getState());

            return allPageComponents.some(
                (c) => !c.getPath().equals(path) && c instanceof DescriptorBasedComponent && c.getDescriptorKey()?.equals(key));
        }

        return false;
    }

    private handleComponentHtml(componentView: ComponentView, htmlAsString: string): void {

        const newElement: Element = this.wrapLoadedComponentHtml(htmlAsString, componentView.getType());
        const parentView = componentView.getParentItemView();

        const createViewConfig: CreateItemViewConfig<RegionView> = new CreateItemViewConfig<RegionView>()
            .setLiveEditParams(parentView.getLiveEditParams())
            .setParentView(parentView)
            .setPositionIndex(componentView.getPath().getPath() as number)
            .setElement(newElement);

        const newComponentView = componentView.createView(componentView.getType(), createViewConfig) as ComponentView;

        componentView.replaceWith(newComponentView);
    }

    private wrapLoadedComponentHtml(htmlAsString: string, componentType: ComponentItemType): Element {
        if (FragmentItemType.get().equals(componentType)) {
            return this.wrapLoadedFragmentHtml(htmlAsString);
        }

        return Element.fromString(htmlAsString);
    }

    private wrapLoadedFragmentHtml(htmlAsString: string): Element {
        const sanitized: string = DOMPurify.sanitize(htmlAsString, {ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp()});
        const sanitizedElement: Element = Element.fromHtml(sanitized);

        const fragmentWrapperEl: Element = new Element(new NewElementBuilder().setTagName('div'));
        fragmentWrapperEl.getEl().setAttribute(`data-${ItemType.ATTRIBUTE_TYPE}`, 'fragment');
        fragmentWrapperEl.appendChild(sanitizedElement);

        return fragmentWrapperEl;
    }
}
