package com.enonic.app.contentstudio.json.form;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.form.FormItem;
import com.enonic.xp.form.FormItemSet;
import com.enonic.xp.form.FieldSet;
import com.enonic.xp.form.FormOptionSet;
import com.enonic.xp.form.InlineMixin;
import com.enonic.xp.form.Input;

public class FormItemJsonFactory
{
    public static FormItemJson create( final FormItem formItem, final LocaleMessageResolver localeMessageResolver )
    {
        if ( formItem instanceof FormItemSet )
        {
            return new FormItemSetJson( (FormItemSet) formItem, localeMessageResolver );
        }
        else if ( formItem instanceof FieldSet )
        {
            return LayoutJsonFactory.create( (FieldSet) formItem, localeMessageResolver );
        }
        else if ( formItem instanceof Input )
        {
            return new InputJson( (Input) formItem, localeMessageResolver );
        }
        else if ( formItem instanceof InlineMixin )
        {
            return new InlineMixinJson( (InlineMixin) formItem );
        }
        else if ( formItem instanceof FormOptionSet )
        {
            return new FormOptionSetJson( (FormOptionSet) formItem, localeMessageResolver );
        }
        throw new IllegalArgumentException( "Unsupported FormItem: " + formItem.getClass().getSimpleName() );
    }

}
