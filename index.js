/**
 * sails-generate-ddd
 *
 * Usage:
 * `sails new foo`
 *
 * @type {Object}
 */

var _ = require('lodash')
    ,path = require('path')
    ,util = require('util')
    ,fs = require('fs-extra')
    ,async = require('async')
    ,packageJSON = require('./json/package.json.js');

module.exports = {

	moduleDir: path.resolve(__dirname, '.'),

	templatesDirectory: path.resolve(__dirname, './templates'),

    targets: {
        // './:directivesDirectory/:filename': { template: 'new-directive.gen' },
        // '.': ['backend-gulp','gulpfile', 'frontend-gulp'],
        './.gitignore': { copy: 'gitignore' },
        // './.editorconfig': { copy: 'editorconfig.template' },
        './README.md': { template: 'README.md' },
        './package.json': { jsonfile: packageJSON },
        './.sailsrc': { copy: 'sailsrc' },
        // './app.js': { copy: 'app.js' },
        // './.jshintrc': { copy: '.jshintrc' }
    },

    before: function (scope, cb) {
        var args0 = scope.args[0];

        // Use a reasonable default app name
        var defaultAppName = args0;
        if ( args0 === '.' || !args0 ) {
            defaultAppName = path.basename(process.cwd());
        }
    
        _.defaults(scope, {
            author: process.env.USER || 'anonymous node/sails user',
            year: (new Date()).getFullYear(),
            appName: defaultAppName
        });
        _.defaults(scope, {
            github: { username: scope.author }
        });
        _.defaults(scope, {
            website: util.format('http://github.com/%s', scope.github.username)
        });
    
        // Allow for alternate --no-front-end cli option
        if (scope['front-end'] === false) {
            scope['frontend'] = false;
        }
    
        if (scope['frontend'] === false) {
            scope.modules['frontend'] = scope.modules['gulpfile'] = scope.modules['views'] = false;
        }
    
        // Make changes to the rootPath where the sails project will be created
        scope.rootPath = path.resolve(process.cwd(), args0 || '');
    
        // Ensure we aren't going to inadvertently delete any files.
        try {
            var files = fs.readdirSync(scope.rootPath);
            if (files.length) {
                return cb.error('`sails new` can only be called on an empty directory.');
            }
        }
        catch (e) {

        }
    
        cb();
    
    },

    after: function (scope, cb) {
        // Keep track of non-fatal errors.
        var nonFatalErrors = [];

        // Read the new package.json file
        var packageJson = require(scope.rootPath + '/package.json');

        // Delete the sails dependency--we'll add it separately
        delete packageJson.dependencies.sails;

        async.auto(
            {
                // Create the node_modules folder
                node_modules: function (cb) {
                    fs.mkdir(scope.rootPath + '/node_modules', cb);
                },
                // Create links to all necessary dependencies
                dependencies: ['node_modules', function (cb) {
                    async.parallel(_.map(_.keys(packageJson.dependencies), copyDependency), cb);
                }],
                // Create a link to the sails we used to create the app
                sails: ['node_modules', function (cb) {
                    fs.symlink(scope.sailsRoot, scope.rootPath + '/node_modules/sails', 'junction', function (symLinkErr) {
                        // If a symbolic link fails, push it to the `nonFatalErrors` stack,
                        if (symLinkErr) {
                            nonFatalErrors.push(symLinkErr);
                        }
                        // but keep going either way.
                        // cb();
                    });
                }]
            },

            function doneGeneratingApp(err) {
                if (err) return cb(err);

                // SUCCESS!
                cb.log.info('Created a new Sails app `' + scope.appName + '`!');

                // Warn that user needs to run `npm install`:
                if (nonFatalErrors.length) {
                    cb.log.warn('Could not create symbolic links in the newly generated `node_modules` folder');
                    cb.log.warn('(usually this is due to a permission issue on your filesystem)');
                    cb.log.warn('Before you run your new app, `cd` into the directory and run:');
                    cb.log.warn('$ npm install');
                }
                return cb();
            }
        );

        // Make a symlink between the dependency in the sails node_modules folder,
        // and the new app's node_modules
        function copyDependency(moduleName) {
            return function _copyDependency(cb) {
                var srcModulePath = path.resolve(scope.sailsRoot, 'node_modules', moduleName);
                var destModulePath = path.resolve(scope.rootPath, 'node_modules', moduleName);

                // Use the "junction" option for Windows
                fs.symlink(srcModulePath, destModulePath, 'junction', function (symLinkErr) {
                    // If a symbolic link fails, push it to the `nonFatalErrors` stack,
                    if (symLinkErr) {
                        nonFatalErrors.push(symLinkErr);
                    }
                    // but keep going either way.
                    cb();
                });
            };
        }

    }

};
