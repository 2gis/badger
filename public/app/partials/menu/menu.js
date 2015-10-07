'use strict';

app.controller('Menu', ['$rootScope', '$routeParams','$scope', '$location', 'Project', 'TestPlan', 'Auth', 'isSafari',
    function ($rootScope, $routeParams, $scope, $location, Project, TestPlan, Auth, isSafari) {
        $scope.isSafari = isSafari;
        $scope.jira = JIRA_INTEGRATION;

        //hide menu if hideMenu=true
        var scope = $routeParams;
        $scope.$watch(function (){return scope.hideMenu;}, function (value) {
            if(value) {
                $("body").css("padding-top", "0px");
            } else {
                $("body").css("padding-top", "50px");
            }
            $scope.hideMenu = !!value;
        });

        $scope.activeProject = null;
        $scope.activeProjectId = null;
        $scope.logout = function () {
            Auth.api.logout(function () {
                $rootScope.profile = null;
            }, function (result) {
                console.info(result);
            });
        };

        Auth.api.get_current(function (result) {
            $rootScope.profile = result;
        }, function () {
            $rootScope.profile = null;
        });

        $rootScope.reloadProjects = function () {
            Project.query(function (result) {

                $rootScope.projects = result.results;
                TestPlan.custom_list({ projectsIds: _.map($rootScope.projects, function (item) { return item.id})}, function (result) {
                    _.each($rootScope.projects, function (project) {
                        project.testplans = _.sortBy(
                            _.filter(result.results, function (testplan) { return testplan.project === project.id }),
                            'name');
                    });
                });
            }, function() {
                $rootScope.api_path = API_PATH;

            });
        };

        $rootScope.reloadProjects();

        $scope.$watch('projects', function () {
            $scope.activeProject = $scope.findProjectById($scope.activeProjectId);
        });

        $scope.$watch('activeProjectId', function () {
            $scope.activeProject = $scope.findProjectById($scope.activeProjectId);
        });

        $scope.findProjectById = function (id) {
            var data = _.filter($rootScope.projects, function (project) { return project.id === parseInt(id)});
            return data[0];
        };

        $rootScope.selectProject = function (id) {
            id = (typeof id === 'undefined') ? null : id;
            if (id !== $scope.activeProjectId) {
                $scope.activeProjectId = id;
            }
        };

        $rootScope.getActiveProject = function() {
            return $scope.activeProjectId;
        };

        $scope.login = function () {
            $rootScope.originLoginPath = $location.path();
            $location.path('/auth/login/');
        };

    }
]);
