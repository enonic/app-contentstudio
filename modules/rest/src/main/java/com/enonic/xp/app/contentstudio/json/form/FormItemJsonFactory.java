package com.enonic.xp.app.contentstudio.json.form;

import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.form.FieldSet;
import com.enonic.xp.form.FormFragment;
import com.enonic.xp.form.FormItem;
import com.enonic.xp.form.FormItemSet;
import com.enonic.xp.form.FormOptionSet;
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
        else if ( formItem instanceof FormFragment )
        {
            return new FormFragmentJson( (FormFragment) formItem );
        }
        else if ( formItem instanceof FormOptionSet )
        {
            return new FormOptionSetJson( (FormOptionSet) formItem, localeMessageResolver );
        }
        throw new IllegalArgumentException( "Unsupported FormItem: " + formItem.getClass().getSimpleName() );
    }

}
