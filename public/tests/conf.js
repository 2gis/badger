exports.config = {

    specs: ['e2e/auth/*_spec.js'],
    directConnect: true,
    baseUrl: 'http://localhost:5000',
    capabilities: {
        'browserName': 'firefox',
        'count': 1,
    },

    suites: {
        auth: 'e2e/auth/*_spec.js',
        //execute: 'e2e/execute/execute_spec.js',
        //launch: 'e2e/launch/*_spec.js',
        //testplan: 'e2e/testplan/*_spec.js'
    },

    jasmineNodeOpts: {
        isVerbose: true,
        showColors: true,
        includeStackTrace: true,
        defaultTimeoutInterval: 30000
    }
}
