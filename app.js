
var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path');

var app = express();
var backendUrl = process.env.BACKEND_URL || 'localhost:8000/api';
var frontendUrl = process.env.FRONTEND_URL || 'localhost';
var jiraIntegration = false;
if (process.env.JIRA_INTEGRATION && process.env.JIRA_INTEGRATION.toLowerCase() === 'true') {
    jiraIntegration = true;
}
var jiraIssueStatus = process.env.JIRA_ISSUE_STATUS;
var lang = process.env.LANG || 'en';
var colors = process.env.COLORS || 'blue=#7cb5ec;red=#f7464a;yellow=#e4d354;grey=#f0f0f0;green=#90ed7d';

app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('env', process.env.ENV || 'production')
if ('development' === app.get('env')) {
    app.use(express.logger('dev'));
} else {
    app.use(express.logger());
}
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(app.router);

if ('development' === app.get('env')) {
    console.log('Application started in development mode');
    app.use(express.errorHandler());
}

app.get('/', function (req, res) {
    if (req.host !== frontendUrl) {
        res.redirect(301, req.protocol + '://' + frontendUrl);
    }
    var date = new Date();
    res.render('index', {
        backendUrl: backendUrl,
        year:date.getFullYear(),
        env: app.get('env'),
        jiraIntegration: jiraIntegration,
        jiraIssueStatus: jiraIssueStatus,
        lang: lang,
        colors: colors
    });
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
