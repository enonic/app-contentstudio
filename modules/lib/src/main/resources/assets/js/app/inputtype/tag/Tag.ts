import * as Q from 'q';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyPath, PropertyPathElement} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {ContentTagSuggester, ContentTagSuggesterBuilder} from './ContentTagSuggester';
import {Tags, TagsBuilder} from '../ui/tag/Tags';
import {TagRemovedEvent} from '../ui/tag/TagRemovedEvent';
import {TagAddedEvent} from '../ui/tag/TagAddedEvent';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';

export class Tag
    extends BaseInputTypeManagingAdd {

    private tags: Tags;

    private allowedContentPaths: string[];

    private tagSuggester: ContentTagSuggester;

    constructor(context: ContentInputTypeViewContext) {
        super(context, 'tag');

        this.tagSuggester = new ContentTagSuggesterBuilder()
            .setDataPath(Tag.resolveDataPath(context))
            .setContent(context.content)
            .setAllowedContentPaths(this.allowedContentPaths)
            .build();
    }

    protected readInputConfig(): void {
        const allowContentPathConfig: Record<string, string>[] = this.context.inputConfig['allowPath'] || [];

        this.allowedContentPaths =
            allowContentPathConfig.length > 0
            ? allowContentPathConfig.map((cfg) => cfg['value']).filter((val) => !!val)
            : [ContentTagSuggester.SITE_PATH];
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        return super.layout(input, propertyArray).then(() => {
            const tagsBuilder =
                new TagsBuilder().setTagSuggester(this.tagSuggester).setMaxTags(this.context.input.getOccurrences().getMaximum());

            propertyArray.forEach((property) => {
                let value = property.getString();
                if (value) {
                    tagsBuilder.addTag(value);
                }
            });

            this.tags = tagsBuilder.build();
            this.tags.setAriaLabelledBy(this.getContext().labelEl);
            this.appendChild(this.tags);

            this.tags.onTagAdded((event: TagAddedEvent) => {
                this.ignorePropertyChange(true);
                let value = new Value(event.getValue(), ValueTypes.STRING);
                if (this.tags.countTags() === 1) {
                    this.getPropertyArray().set(0, value);
                } else {
                    this.getPropertyArray().add(value);
                }
                this.handleValueChanged(false);
                this.ignorePropertyChange(false);
            });

            this.tags.onTagRemoved((event: TagRemovedEvent) => {
                this.ignorePropertyChange(true);
                this.getPropertyArray().remove(event.getIndex());
                this.handleValueChanged(false);
                this.ignorePropertyChange(false);
            });

            this.setLayoutInProgress(false);

            return Q<void>(null);
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.tags.isDirty()) {
            return superPromise.then(() => {
                this.tags.setValue(this.getValueFromPropertyArray(propertyArray));
            });
        } else if (this.tags.isDirty()) {
            this.resetPropertyValues();
        }
        return superPromise;
    }

    reset() {
        this.tags.resetBaseValues();
    }

    setEnabled(enable: boolean): void {
        this.tags.setEnabled(enable);
    }

    resetPropertyValues() {
        this.getPropertyArray().removeAll(true);
        this.tags.resetPropertyValues();
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    private static resolveDataPath(context: ContentInputTypeViewContext): PropertyPath {
        if (context.parentDataPath) {
            return PropertyPath.fromParent(context.parentDataPath, PropertyPathElement.fromString(context.input.getName()));
        } else {
            return new PropertyPath([PropertyPathElement.fromString(context.input.getName())], false);
        }
    }

    giveFocus(): boolean {
        return this.tags.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.tags.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.tags.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.tags.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.tags.unBlur(listener);
    }
}

InputTypeManager.register(new Class('Tag', Tag));
