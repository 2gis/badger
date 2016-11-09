'use strict';

var app = angular.module('testReport.regexp', [
    'ngRoute'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/regexp_editor', {
        templateUrl: '/static/app/partials/regexp/regexp.html',
        controller: 'RegexpCtrl'
    });
}]);

app.controller('RegexpCtrl', ['$rootScope', '$scope', '$routeParams', '$filter', '$location', '$anchorScroll', '$timeout', 'Bug',
    function ($rootScope, $scope, $routeParams, $filter, $location, $anchorScroll, $timeout, Bug) {
        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }
        $scope.activeProjectId = $rootScope.getActiveProject();

        $scope.bugId = parseInt($location.hash());

        $rootScope.getProjectSettings($routeParams.projectId, 'jira_projects').then(function(result) {
            $scope.issue_names = result;
            if (result === '') {
                $scope.issue_names = 0;
            }
            $scope.reloadIssues();
        });

        $scope.reloadIssues = function() {
            Bug.custom_list({ issue_names__in: $scope.issue_names }, function (response) {
                $scope.issues = _.sortBy(response.results, function(result) {
                    if ($scope.bugId && result.id === $scope.bugId) {
                        result.$edit = true;
                    }
                    return -result.id
                });
                if ($location.hash()) {
                    $timeout(function() {
                        $anchorScroll.yOffset = 200;
                        $anchorScroll($location.hash());
                    });
                }
            });
        };

        $scope.deleteIssue = function (issue) {
            var modal = $('#ConfirmationModal');
            $scope.modalTitle = 'Attention';
            $scope.modalBody = 'Are you sure you want to delete link with "' + issue.externalId + '"?';
            $scope.objectId = issue.id;
            $scope.modalCallBack = function () {
                Bug.delete({bugId: $scope.objectId}).$promise.then(
                    function () {
                        $scope.reloadIssues();
                    }
                )
            };
            modal.modal('show');
        };

        $scope.updateIssue = function (issue) {
            if (typeof issue.regexp === 'undefined') {
                return;
            }
            issue.$edit = false;
            Bug.update({bugId: issue.id}, issue,
                function (result) {
                    issue.formUpdate = 'Link updated successfully';
                    issue.formErrors = null;
                },
                function (result) {
                    issue.formUpdate = null;
                    if (result.data.detail) {
                        issue.formErrors = result.data.detail;
                    }
                    if (result.data.message) {
                        issue.formErrors = result.data.message;
                    }
                }
            );
        };
    }
]);
