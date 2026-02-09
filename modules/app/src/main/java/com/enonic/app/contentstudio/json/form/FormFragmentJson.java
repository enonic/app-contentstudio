package com.enonic.app.contentstudio.json.form;

import com.fasterxml.jackson.annotation.JsonIgnore;

import com.enonic.xp.form.FormFragment;
import com.enonic.xp.form.FormItem;

@SuppressWarnings("UnusedDeclaration")
public class FormFragmentJson
    extends FormItemJson
{
    private final FormFragment inline;

    public FormFragmentJson( final FormFragment inline )
    {
        this.inline = inline;
    }

    @JsonIgnore
    @Override
    public FormItem getFormItem()
    {
        return inline;
    }

    @Override
    public String getName()
    {
        return inline.getName();
    }

    public String getReference()
    {
        return inline.getFormFragmentName().toString();
    }
}
