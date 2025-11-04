package com.enonic.xp.app.contentstudio.json.form;


import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment.CmsFormFragmentResolver;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.FormItem;

@SuppressWarnings("UnusedDeclaration")
public class FormJson
{
    private final Form form;

    private final List<FormItemJson> items;

    public FormJson( final Form form, final LocaleMessageResolver localeMessageResolver, final CmsFormFragmentResolver inlineMixinResolver )
    {
        this.form = inlineMixinResolver.inlineForm( form );

        items = new ArrayList<>( this.form.size() );
        for ( FormItem formItem : this.form )
        {
            items.add( FormItemJsonFactory.create( formItem, localeMessageResolver ) );
        }
        FormDefaultValuesJsonProcessor.setDefaultValues( this.form, this );
    }

    public List<FormItemJson> getFormItems()
    {
        return items;
    }

    @JsonIgnore
    public Form getForm()
    {
        return this.form;
    }

}
