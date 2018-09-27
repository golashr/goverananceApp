const utils = require('./web3util');

module.exports = class SimpleValidatorSet {

    constructor(web3provider) {
        this.web3 = web3provider;
        //Read ABI and Bytecode from dynamic source.
        var value = utils.readSolidityContractJSON("./build/contracts/SimpleValidatorSet.json");
        if(value.length > 0){
            this.simpleValidatorSetAbi = value[0];
            this.simpleValidatorSetByteCode = value[1];
        }
    }
    
    setOwnersParameters(ownerAccountAddress,privateKey,simpleValidatorSetAddress){
        try{
            this.ownerAccountAddress = ownerAccountAddress;
            this.privateKey = privateKey;
            this.simpleValidatorSetAddress = simpleValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi),this.simpleValidatorSetAddress);

            //this.subscribeForPastEvents();
            //this.listenForContractObjectEvents(this.contract);
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.setOwnersParameters(): " + error);
            return "";
        }  
    }    
    
    async deployNewSimpleSetValidatorContract(ethAccountToUse, adminValidatorAddress) {
        try {
            var constructorParameters = [];
            constructorParameters.push(adminValidatorAddress);
            var deployedAddress = await utils.deployContract(this.simpleValidatorSetAbi, this.simpleValidatorSetByteCode, ethAccountToUse, constructorParameters, this.web3);//, function(returnTypeString, result){
            this.simpleValidatorSetAddress = deployedAddress;    
            return this.simpleValidatorSetAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.deployNewSimpleSetValidatorContract(): " + error);
            return "";
        }
    }

    async getAllValidatorsAsync(ethAccountToUse) {
        var resultList = [];
        try {
            var encodedABI = this.contract.methods.getAllValidators().encodeABI();
            resultList = await utils.getData(ethAccountToUse,this.simpleValidatorSetAddress,encodedABI,this.web3);
            console.log(resultList);
            return utils.split(resultList);
            // try{
            //     resultList  = await this.contract.methods.getAllValidators.call({from:ethAccountToUse});
            //     //resultList = await utils.getData(ethAccountToUse,this.simpleValidatorSetAddress,myData,this.web3);
            //     return resultList;
            // }
            // catch (error){
            //     //resultList = await utils.getData(ethAccountToUse,this.simpleValidatorSetAddress,encodedABI,this.web3);
            //     return resultList;
            // }    
        } catch (error) {
            console.log("Error in SimpleValidatorSet.getAllValidatorsAsync(): " + error);
            return resultList;
        }
    }

    async getAdminValidatorsAsync(ethAccountToUse) {
        // var resultList = [];
        try {
            this.contract.methods.getValidatorsForAdmin().call({from: ethAccountToUse}).then(function(resultList){
                console.log("GetAdminValidatorsAsync resultList for ",adminAddress, resultList.length);
                if (resultList.length > 0) {
                    resultList.forEach(eachElement => {
                        console.log(eachElement, "\n");
                    });
                }
            });
        } catch (error) {
            console.log("Error in SimpleValidatorSet.getAdminValidatorsAsync(): " + error);
            return "";
        }
    }

    async addValidator(ethAccountToUse, newValidator) {
        try {
            var encodedABI = this.contract.methods.addValidator(newValidator).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,this.privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.addValidator(): " + error);
            return "";
        }    
    }

    async finaliseChange(ethAccountToUse, newValidator) {
        try {
            var encodedABI = this.contract.methods.finalize(newValidator).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address, encodedABI,this.privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.finaliseChange(): " + error);
            return "";
        }
    }

    async removeValidator(ethAccountToUse, validatorToRemove) {
        try {
            var encodedABI = this.contract.methods.removeValidator(validatorToRemove).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,this.privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;        
        } catch (error) {
            console.log("Error in SimpleValidatorSet.removeValidator(): " + error);
            return "";
        }
    }
   
    async isActiveValidator(validatorAddress) {
        try {
            var data = await this.contract.methods.isValidator(validatorAddress).call();
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.isActiveValidator(): " + error);
            return false;
        }
    }

    subscribeForPastEvents(){
        var options = {
            fromBlock: "latest",
            address: this.simpleValidatorSetAddress
        };
        this.contract.getPastEvents(
            'AllEvents',
            {
              fromBlock: 0,
              toBlock: 'latest'
            },
            (err, events) => {
                if(events.length > 0){
                    events.forEach(eachElement => {
                        if(eachElement.event == "addvalidator"){
                            console.log("addvalidator:Contract address",eachElement.address);
                            console.log("addvalidator:Transaction Hash",eachElement.transactionHash);
                            console.log("addvalidator:Block Hash",eachElement.blockHash);
                            console.log("addvalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                        else if(eachElement.event == "removevalidator"){
                            console.log("removevalidator:Contract address",eachElement.address);
                            console.log("removevalidator:Transaction Hash",eachElement.transactionHash);
                            console.log("removevalidator:Block Hash",eachElement.blockHash);
                            console.log("removevalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                        else if(eachElement.event == "finalizeEvent"){
                            console.log("finalizeEvent:Contract address",eachElement.returnValues[0]);
                            console.log("finalizeEvent:Transaction Hash",eachElement.transactionHash);
                            console.log("finalizeEvent:Block Hash",eachElement.blockHash);
                            console.log("addvalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                    })
                }
                
            });
     }     
        
     listenForContractObjectEvents(contractObject){
        utils.listen(contractObject,(events)=>{
            console.log('SimpleValidatorSet Event Received');
            switch(events.event){
                case "addvalidator":
                    console.log("addvalidator:Contract address",event.address);
                    console.log("addvalidator:admin ",event.returnValues._admin);
                    console.log("addvalidator:validator",event.returnValues.validator);
                    break;
                case "removevalidator":
                    console.log("removevalidator");
                    break;
                case "finalizeEvent":
                    console.log("finalizeEvent");
                    break;
                default:
                    break;
            }
        });

        // utils.subscribe("SimpleValidatorSet", this.web3, (events)=>{
        //     console.log('SimpleValidatorSet subscribe Event Received');
        //     switch(events.event){
        //         case "InitiateChange":
        //             console.log("InitiateChange");
        //             break;
        //         case "AddValidatorEvent":
        //             console.log("AddValidatorEvent");
        //             break;
        //         case "RemoveValidatorEvent":
        //             console.log("RemoveValidatorEvent");
        //             break;
        //         case "FinalizeCalledEvent":
        //             console.log("FinalizeCalledEvent");
        //             break;
        //         default:			
        //             break;
        //     }
        // });
    }

    get getThis() {
        return this;
    }
}
