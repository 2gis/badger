'use strict';

var TASK_STATUS_PENDING = 'PENDING',
    TASK_STATUS_RECEIVED = 'RECEIVED',
    TASK_STATUS_STARTED = 'STARTED',
    TASK_STATUS_SUCCESS = 'SUCCESS',
    TASK_STATUS_FAILURE = 'FAILURE',
    TASK_STATUS_REVOKED = 'REVOKED',
    TASK_STATUS_RETRY = 'RETRY',
    TASK_STATUS_IGNORED = 'IGNORED',
    TASK_STATUS_REJECTED = 'REJECTED';


var filters = angular.module('testReportFilters', []);

filters.filter('states', function () {
    return function (input) {
        var launch_states = ['STARTED', 'IN_PROGRESS', 'FINISHED', 'STOPPED', 'SUCCESS'];
        return launch_states[input];
    };
}).filter('testStates', function () {
    return function (input) {
        var launch_states = ['PASSED', 'FAILED', 'SKIPPED', 'BLOCKED'];
        return launch_states[input];
    };
}).filter('testStatesClass', function () {
    return function (input) {
        switch (input) {
            case 0:
                return 'label label-success';
            case 1:
                return 'label label-danger';
            case 2:
                return 'label label-warning';
            case 3:
                return 'label label-danger';
            case 4:
                return 'label label-info';
            default:
                return 'reverse';
        }
    };
}).filter('statesClass', function () {
    return function (input) {
        switch (input) {
            case 0:
                return 'label label-info';
            case 1:
                return 'label label-warning';
            case 2:
                return 'label label-default';
            case 3:
                return 'label label-danger';
            case 4:
                return 'label label-success';
            default:
                return 'reverse';
        }
    };
}).filter('toFixed', ['appConfig', function (appConfig) {
    return function (input) {
        return input.toFixed(appConfig.FRACTION_DIGITS);
    };
}]).filter('bugStatusClass', function () {
    var issueStatus = parseEnvString(JIRA_ISSUE_STATUS);
    return function (status) {
        switch (status) {
            case issueStatus.BACKLOG:
            case issueStatus.OPEN:
                return 'danger';
            case issueStatus.IN_PROGRESS:
            case issueStatus.CODE_REVIEW:
                return 'warning';
            case issueStatus.CLOSED:
                return 'success';
            case issueStatus.RELEASED:
                return 'primary';
            case issueStatus.DONE:
                return 'info';
            default:
                return 'default';
        }
    };
}).filter('progressBarClass', function () {
    return function (value) {
        switch (value) {
            case TASK_STATUS_PENDING:
            case TASK_STATUS_STARTED:
                return 'progress-bar-striped';
            case TASK_STATUS_SUCCESS:
                return 'progress-bar-success';
            case TASK_STATUS_FAILURE:
            case TASK_STATUS_IGNORED:
            case TASK_STATUS_REJECTED:
            case TASK_STATUS_REVOKED:
                return 'progress-bar-danger';
            case TASK_STATUS_RETRY:
                return 'progress-bar-warning';
            default:
                return 'progress-bar-info';
        }
    }
}).filter('cut', function () {
    return function (value, wordwise, max, tail, end) {
        if (!value) {
            return '';
        }

        max = parseInt(max, 10);
        if (!max) {
            return value;
        }

        if (value.length <= max) {
            return value;
        }

        if (end) {
            var pos = value.length - max;
            value = value.substr(pos);
            if (wordwise) {
                var first_space = value.indexOf(' ');
                if (first_space != -1) {
                    value = value.substr(first_space);
                }
            }
            return (tail || '… ') + value;
        }

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
}).filter('jsonToString', function () {
    return function (jsonObject) {
        return JSON.stringify(jsonObject, null, " ");
    }
}).filter('secondsToTime', function() {

    function padTime(t) {
        return t < 10 ? "0"+t : t;
    }

    return function(_seconds) {
        if (typeof _seconds !== "number" || _seconds < 0)
            return "00:00:00";

        var hours = Math.floor(_seconds / 3600),
            minutes = Math.floor((_seconds % 3600) / 60),
            seconds = Math.floor(_seconds % 60);

        return padTime(hours) + ":" + padTime(minutes) + ":" + padTime(seconds);
    };
});
