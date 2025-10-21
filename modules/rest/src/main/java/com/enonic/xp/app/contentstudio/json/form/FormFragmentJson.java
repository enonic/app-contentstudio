package com.enonic.xp.app.contentstudio.json.form;

import com.fasterxml.jackson.annotation.JsonIgnore;

import com.enonic.xp.form.FormFragment;
import com.enonic.xp.form.FormItem;

@SuppressWarnings("UnusedDeclaration")
public class FormFragmentJson
    extends FormItemJson
{
    private final FormFragment formFragment;

    public FormFragmentJson( final FormFragment formFragment )
    {
        this.formFragment = formFragment;
    }

    @JsonIgnore
    @Override
    public FormItem getFormItem()
    {
        return formFragment;
    }

    @Override
    public String getName()
    {
        return formFragment.getName();
    }

    public String getReference()
    {
        return formFragment.getFormFragmentName().toString();
    }
}
