(function () {
    'use strict';
    angular.module('itsyouonlineApp')
        .directive('contract', ContractDirective);

    function ContractDirective() {
        return {
            restrict: 'E',
            templateUrl: 'components/contract/views/contract.html',
            controller: ['$window', '$filter', 'ContractService', 'ContractConstants', ContractController],
            controllerAs: 'vm',
            scope: {
                contract: '='
            },
            bindToController: true
        };
    }

    function ContractController($window, $filter, ContractService, ContractConstants) {
        var vm = this;
        vm.openImageInTab = openImageInTab;
        vm.getPartyLabel = getPartyLabel;
        vm.getDateString = getDateString;

        function getPartyLabel(val) {
            return ContractConstants.partyTypes.filter(function (p) {
                return p.type === val;
            })[0].label;
        }

        function openImageInTab() {
            $window.open('data:' + vm.contract.content.mimeType + ';base64,' + vm.contract.content.content, '_blank');
        }

        function getDateString(date, format) {
            return $filter('date')(date, format || 'longDate');
        }
    }
})();