(function () {
    'use strict';
    angular.module('itsyouonlineApp')
        .directive('contractDetail', ContractDetailDirective)
        .directive('onFileChange', onFileChange);

    function ContractDetailDirective() {
        return {
            restrict: 'E',
            templateUrl: 'components/contract/views/contractDetail.html',
            controller: ['$window', '$q', 'ContractService', 'ContractConstants', ContractDetailController],
            controllerAs: 'vm',
            scope: {
                contract: '=',
                contracts: '=',
                contractSource: '=',
                contractSourceType: '='
            },
            bindToController: true
        };
    }

    function ContractDetailController($window, $q, ContractService, ContractConstants) {
        var vm = this;
        vm.partyTypes = ContractConstants.partyTypes;
        vm.contentTypes = ContractConstants.contentTypes;

        vm.addParty = addParty;
        vm.removeParty = removeParty;
        vm.searchContract = searchContract;
        vm.getContractDisplayName = getContractDisplayName;
        vm.transformContractChip = transformContractChip;
        vm.clickFileUpload = clickFileUpload;
        vm.selectedFileChanged = selectedFileChanged;
        vm.openImageInTab = openImageInTab;
        vm.deleteContract = deleteContract;
        vm.submit = submit;

        init();

        function init() {
            if (!vm.contracts) {
                console.error('No contracts supplied to contract directive');
            }
            if (!vm.contractSourceType) {
                console.error('No "contractSourceType" supplied to contract directive');
            }
            if (!vm.contractSource) {
                console.error('No "contractSource" supplied to contract directive');
            }
            vm.isNew = !vm.contract;
            if (vm.isNew) {
                vm.contract = {
                    parties: [{
                        type: vm.contractSourceType,
                        name: vm.contractSource
                    }],
                    invalidates: [],
                    extends: [],
                    content: {
                        mimeType: ''
                    }
                };
                vm.contractContentType = vm.contentTypes[1].type;
                vm.contractTextContent = '';
                vm.contractImageContent = '';
                vm.imageMimeType = '';
            } else {
                vm.contractContentType = vm.contract.content.mimeType.split('/')[0];
                vm.imageMimeType = vm.contract.content.mimeType;
                if (vm.imageMimeType.startsWith('text')) {
                    vm.contractTextContent = vm.contract.content.content;
                } else {
                    vm.contractImageContent = vm.contract.content.content;
                }
            }
            vm.fileError = '';

        }

        function addParty() {
            vm.contract.parties.push({
                type: vm.partyTypes[0].type,
                name: ''
            });
        }

        function removeParty(party) {
            vm.contract.parties.splice(vm.contract.parties.indexOf(party), 1);
        }

        function contractSearch(query) {
            var lowercaseQuery = angular.lowercase(query);
            vm.contracts.map(function (contract) {
                contract._lowerType = contract.contractType.toLowerCase();
            });
            return function filterFn(contract) {
                return (contract._lowerType.indexOf(lowercaseQuery) !== -1) || contract.contractId.startsWith(lowercaseQuery);
            };
        }

        function searchContract(query) {
            return query ? vm.contracts.filter(contractSearch(query)) : [];
        }

        function getContractDisplayName(contractId) {
            var contract = vm.contracts.filter(function (c) {
                return c.contractId === contractId;
            })[0];
            return contract.contractType || contract.contractId;
        }

        function transformContractChip(chip) {
            return chip.contractId;
        }

        function clickFileUpload() {
            angular.element(document.querySelector('#contractContentImage'))[0].click();
        }

        function selectedFileChanged(files) {
            var file = files[0];
            vm.fileError = '';
            vm.imageMimeType = file.type;
            if (!file) {
                return;
            }
            if (file.size > 1024 * 1024 * 5) {
                vm.fileError = 'The chosen file is too large. Maximum allowed size is 5 MB';
                return;
            }

            if (!file.type.startsWith('image')) {
                vm.fileError = 'Invalid file supplied. Only images are allowed.';
            } else {
                readFile(file).then(function (base64pic) {
                    var toReplace = 'data:' + vm.imageMimeType + ';base64,';
                    vm.contractImageContent = base64pic.replace(toReplace, '');
                }, function (result) {
                    vm.fileError = 'Something went wrong while converting the image.';
                });
            }

            function readFile(file) {
                var deferred = $q.defer();
                var reader = new FileReader();
                reader.onload = function (e) {
                    deferred.resolve(e.target.result);
                };
                reader.onerror = function (e) {
                    deferred.reject(e);
                };
                reader.readAsDataURL(file);
                return deferred.promise;
            }
        }

        function openImageInTab() {
            $window.open('data:' + vm.imageMimeType + ';base64,' + vm.contractImageContent, '_blank');
        }

        function submit() {
            var mimeType = '',
                content = '';
            vm.validationError = '';
            if (vm.contract.parties.length < 2) {
                vm.validationError = 'You need to assign at least 2 parties.';
                return;
            }
            switch (vm.contractContentType) {
                case 'text':
                    mimeType = 'text/plain';
                    content = vm.contractTextContent;
                    break;
                case 'image':
                    mimeType = vm.imageMimeType;
                    content = vm.contractImageContent;
                    break;
            }
            vm.contract.content = {
                content: content,
                mimeType: mimeType
            };

            if (vm.contractContentType === 'image' && !vm.contract.content.content) {
                vm.fileError = 'Please select an image for the contract';
                return;
            }
            if (vm.contract.contractId) {
                updateContract();
            } else {
                createContract();
            }
        }

        function createContract() {
            ContractService.createContract(vm.contractSourceType, vm.contractSource, vm.contract);
        }

        function updateContract() {
            ContractService.updateContract(vm.contractSourceType, vm.contractSource, vm.contract);
        }

        function deleteContract() {
            ContractService.deleteContract(vm.contract.contractId);
        }
    }

    function onFileChange() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.onFileChange);
                element.bind('change', function () {
                    scope.$apply(function () {
                        var files = element[0].files;
                        if (files) {
                            onChangeHandler(files);
                        }
                    });
                });
            }
        };
    }
})();