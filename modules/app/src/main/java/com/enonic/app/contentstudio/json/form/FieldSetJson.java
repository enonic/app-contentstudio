package com.enonic.app.contentstudio.json.form;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.common.base.Preconditions;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.form.FieldSet;
import com.enonic.xp.form.FormItem;

import static com.google.common.base.Strings.nullToEmpty;

@SuppressWarnings("UnusedDeclaration")
public class FieldSetJson
   extends FormItemJson<FieldSet>
{
    private final FieldSet fieldSet;

    private final List<FormItemJson> items;

    private final LocaleMessageResolver localeMessageResolver;

    public FieldSetJson( final FieldSet fieldSet, final LocaleMessageResolver localeMessageResolver )
    {
        Preconditions.checkNotNull( fieldSet );
        Preconditions.checkNotNull( localeMessageResolver );

        this.fieldSet = fieldSet;
        this.localeMessageResolver = localeMessageResolver;

        this.items = wrapFormItems( fieldSet, localeMessageResolver );
    }

    static Iterable<FormItem> unwrapFormItems( final List<FormItemJson> items )
    {
        final List<FormItem> formItems = new ArrayList<>( items.size() );
        for ( FormItemJson formItemJson : items )
        {
            formItems.add( formItemJson.getFormItem() );
        }
        return formItems;
    }

    static List<FormItemJson> wrapFormItems( final Iterable<FormItem> items, final LocaleMessageResolver localeMessageResolver )
    {
        final List<FormItemJson> formItemJsonList = new ArrayList<>();
        for ( FormItem formItem : items )
        {
            formItemJsonList.add( FormItemJsonFactory.create( formItem, localeMessageResolver ) );
        }
        return formItemJsonList;
    }

    @JsonIgnore
    public FieldSet getFieldSet()
    {
        return fieldSet;
    }

    public String getLabel()
    {
        if ( localeMessageResolver != null && !nullToEmpty( fieldSet.getLabelI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( fieldSet.getLabelI18nKey(), fieldSet.getLabel() );
        }
        else
        {
            return fieldSet.getLabel();
        }
    }

    public List<FormItemJson> getItems()
    {
        return items;
    }

    @JsonIgnore
    @Override
    public FieldSet getFormItem()
    {
        return fieldSet;
    }

    @Override
    public String getName()
    {
        return fieldSet.getName();
    }
}
