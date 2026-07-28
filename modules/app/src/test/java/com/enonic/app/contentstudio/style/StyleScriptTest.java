package com.enonic.app.contentstudio.style;

import org.mockito.Mockito;

import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.style.StyleDescriptorService;
import com.enonic.xp.style.StyleDescriptors;
import com.enonic.xp.testing.ScriptRunnerSupport;

import static org.mockito.ArgumentMatchers.any;

public class StyleScriptTest
    extends ScriptRunnerSupport
{
    @Override
    protected void initialize()
        throws Exception
    {
        super.initialize();

        final StyleDescriptorService styleDescriptorService = Mockito.mock( StyleDescriptorService.class );
        Mockito.when( styleDescriptorService.getByApplications( any() ) ).thenReturn( StyleDescriptors.empty() );
        addService( StyleDescriptorService.class, styleDescriptorService );

        addService( LocaleService.class, Mockito.mock( LocaleService.class ) );

        final Project project = Project.create().name( ProjectName.from( "default" ) ).build();
        Mockito.when( this.projectService.get( any() ) ).thenReturn( project );
    }

    @Override
    public String getScriptTestFile()
    {
        return "/apis/styles/styles-test.js";
    }
}
