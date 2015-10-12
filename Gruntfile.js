'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            src: ['public/tests/coverage/']
        },

        copy: {
            instrument: {
                files: [{
                    src: ['public/app/**/*.js'],
                    dest: 'public/tests/coverage/e2e/instrumented/'
                }]
            }
        },

        connect: {
            options: {
                port: 5000,
                hostname: 'localhost'
            }
        },

        instrument: {
            files: ['public/app/**/*.js'],
            options: {
                lazy: false,
                basePath: 'public/tests/coverage/e2e/instrumented/'
            }
        },

        protractor_coverage: {
            options: {
                keepAlive: true,
                noColor: false,
                coverageDir: 'public/tests/coverage',
                args: {
                    baseUrl: 'http://localhost:5000'
                }
            },
            local: {
                options: {
                    configFile: 'public/tests/conf.js'
                }
            },
            run: {}
        },

        makeReport: {
            src: 'public/tests/coverage/*.json',
            options: {
                type: 'lcov',
                dir: 'public/tests/coverage',
                print: 'detail'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-protractor-coverage');

    grunt.registerTask('default', ['clean', 'copy', 'connect', 'instrument', 'protractor_coverage:local', 'makeReport']);
};
