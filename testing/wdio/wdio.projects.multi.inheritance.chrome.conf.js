const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: [
        'project-multi/parent.project.step.multi.inheritance.spec.js',
        'project-multi/layer.owner.multi.inheritance.spec.js',
        'project-multi/project.recreate.spec.js',
    ],
});
