(function() {
    'use strict';


    angular
        .module("itsyouonlineApp")
        .controller("OrganizationController", OrganizationController)
        .controller("OrganizationDetailController", OrganizationDetailController)
        .controller("InvitationDialogController", InvitationDialogController);


    OrganizationController.$inject = ['$rootScope', '$location','OrganizationService','$window'];
    OrganizationDetailController.$inject = [
        '$location', '$routeParams', '$window', 'OrganizationService', '$mdDialog', '$mdMedia'];

    function OrganizationController($rootScope, $location, OrganizationService, $window) {
        var vm = this;
        vm.create = create;

        vm.username = $rootScope.user;
        vm.validationerrors = {};

        activate();

        function activate() {

        }

        function create(){
            var dns = []

            if (vm.dns) {
                dns.push(vm.dns)
            }

            vm.validationerrors = {};

            OrganizationService
                .create(vm.name, dns, vm.username)
                .then(
                    function(data){
                        $location.path("/organizations/" + vm.name);
                    },
                    function(reason){
                        if (reason.status == 409) {
                             vm.validationerrors = {duplicate: true};
                        }
                        else{
                            $window.location.href = "error" + reason.status;
                        }
                    }
                );
        }
    }

    function OrganizationDetailController($location, $routeParams, $window, OrganizationService, $mdDialog, $mdMedia) {
        var vm = this,
            globalid = $routeParams.globalid;
        vm.invitations = [];
        vm.apisecretlabels = [];
        vm.organization = {};

        vm.showInvitationDialog = showInvitationDialog;
        vm.showAPICreationDialog = showAPICreationDialog;
        vm.showAPISecretDialog = showAPISecretDialog;

        activate();

        function activate() {
            fetch();
        }

        function fetch(){
            OrganizationService
                .get(globalid)
                .then(
                    function(data) {
                        vm.organization = data;
                    },
                    function(reason) {
                        $window.location.href = "error" + reason.status;
                    }
                );

            OrganizationService
                .getInvitations(globalid)
                .then(
                    function(data) {
                        vm.invitations = data;
                    },
                    function(reason) {
                        $window.location.href = "error" + reason.status;
                    }
                );
            fetchAPISecretLabels();
        }

        function fetchAPISecretLabels(){

            OrganizationService
                .getAPISecretLabels(globalid)
                .then(
                    function(data) {
                        vm.apisecretlabels = data;
                    },
                    function(reason) {
                        $window.location.href = "error" + reason.status;
                    }
                );
        }

        function showInvitationDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))
            $mdDialog.show({
                controller: InvitationDialogController,
                templateUrl: 'components/organization/views/invitationdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        OrganizationService: OrganizationService,
                        organization : vm.organization.globalid,
                        $window: $window
                    }
            })
            .then(
                function(invitation) {
                    vm.invitations.push(invitation);
                });
        }




        function showAPICreationDialog(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))
            $mdDialog.show({
                controller: APISecretDialogController,
                templateUrl: 'components/organization/views/apisecretdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        OrganizationService: OrganizationService,
                        organization : vm.organization.globalid,
                        $window: $window,
                        label: ""
                    }
            })
            .then(
                function(data) {
                    if (data.newLabel) {
                        vm.apisecretlabels.push(data.newLabel);
                    }
                });
        }


        function showAPISecretDialog(ev, label) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))
            $mdDialog.show({
                controller: APISecretDialogController,
                templateUrl: 'components/organization/views/apisecretdialog.html',
                targetEvent: ev,
                fullscreen: useFullScreen,
                locals:
                    {
                        OrganizationService: OrganizationService,
                        organization : vm.organization.globalid,
                        $window: $window,
                        label: label
                    }
            })
            .then(
                function(data) {
                    if (data.originalLabel != data.newLabel){
                        if (data.originalLabel) {
                            if (data.newLabel){
                                //replace
                                vm.apisecretlabels[vm.apisecretlabels.indexOf(data.originalLabel)] = data.newLabel;
                            }
                            else {
                                //remove
                                vm.apisecretlabels.splice(vm.apisecretlabels.indexOf(data.originalLabel),1);
                            }
                        }
                        else {
                            //add
                            vm.apisecretlabels.push(data.newLabel);
                        }
                    }
                });
        }

    }

    function InvitationDialogController($scope, $mdDialog, organization, OrganizationService, $window) {

        $scope.role = "member";

        $scope.cancel = cancel;
        $scope.invite = invite;
        $scope.validationerrors = {}


        function cancel(){
            $mdDialog.cancel();
        }

        function invite(username, role){
            $scope.validationerrors = {};
            OrganizationService.invite(organization, username, role).then(
                function(data){
                    $mdDialog.hide(data);
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else if (reason.status == 404){
                        $scope.validationerrors.nosuchuser = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );

        }
    }

    function APISecretDialogController($scope, $mdDialog, organization, OrganizationService, $window, label) {
        //If there is a secret, it is already saved, if not, this means that a new secret is being created.

        $scope.secret = "";

        if (label) {
            $scope.secret = "-- Loading --";
            OrganizationService.getAPISecret(organization, label).then(
                function(data){
                    $scope.secret = data.secret;
                },
                function(reason){
                    $window.location.href = "error" + reason.status;
                }
            );
        }

        $scope.originalLabel = label;
        $scope.savedLabel = label;
        $scope.label = label;
        $scope.organization = organization;

        $scope.cancel = cancel;
        $scope.validationerrors = {}
        $scope.create = create;
        $scope.update = update;
        $scope.deleteAPISecret = deleteAPISecret;

        $scope.modified = false;


        function cancel(){
            if ($scope.modified) {
                $mdDialog.hide({originalLabel: label, newLabel: $scope.label});
            }
            else {
                $mdDialog.cancel();
            }
        }

        function create(label){
            $scope.validationerrors = {};
            OrganizationService.createAPISecret(organization, label).then(
                function(data){
                    $scope.modified = true;
                    $scope.secret = data.secret;
                    $scope.savedLabel = data.label;
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );
        }

        function update(oldLabel, newLabel){
            $scope.validationerrors = {};
            OrganizationService.updateAPISecretLabel(organization, oldLabel, newLabel).then(
                function(data){
                    $mdDialog.hide({originalLabel: oldLabel, newLabel: newLabel});
                },
                function(reason){
                    if (reason.status == 409){
                        $scope.validationerrors.duplicate = true;
                    }
                    else
                    {
                        $window.location.href = "error" + reason.status;
                    }
                }
            );
        }


        function deleteAPISecret(label){
            $scope.validationerrors = {};
            OrganizationService.deleteAPISecret(organization, label).then(
                function(data){
                    $mdDialog.hide({originalLabel: label, newLabel: ""});
                },
                function(reason){
                    $window.location.href = "error" + reason.status;
                }
            );
        }

    }



})();