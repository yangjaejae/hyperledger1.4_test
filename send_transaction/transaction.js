const { FileSystemWallet, Gateway, DefaultEventHandlerStrategies } = require('fabric-network');
const Fabric_Client = require('fabric-client');
const path = require('path');
const fs = require('fs');

// const ccpPath = path.resolve(__dirname, '..', 'config', 'config_chainrefund_local.json');
// const ccpPath = path.resolve(__dirname, '..', 'config', 'config_customs_local.json');
// const ccpPath = path.resolve(__dirname, '..', 'config', 'config_merchants_local.json');
const ccpPath = path.resolve(__dirname, '..', 'config', 'config_chainrefund_local.json');
const ccpFile = fs.readFileSync(ccpPath);
const ccp = JSON.parse(ccpFile.toString());

async function transaction_add(req) {
    try {
        let user = req.body.user;
        let num1 = req.body.num1;
        let num2 = req.body.num2;

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user);
        if (!userExists) {
            console.log(`An identity for the user "${user}" does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        const connectOptions = {
            eventHandlerOptions: {
                stratergy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
            }
        }
        // await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: false } }, connectOptions);
        await gateway.connect(ccp, {
            wallet,
            identity: user,
            discovery: {
                enabled: true,
                asLocalhost: true
            }
        }, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('ch-taxrefund');

        // Get the contract from the network.
        const contract = network.getContract('ab');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('invoke', "a", "b", "10");
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }

}

async function transaction_taxreceipt(req) {
    try {

        // let user = req.body.user;
        let user = "yang1";
        let receipt = req.body.receipt;
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user);
        if (!userExists) {
            console.log(`An identity for the user "${user}" does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        const connectOptions = {
            eventHandlerOptions: {
                stratergy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
            }
        }
        // await gateway.connect(ccpPath, { wallet, identity: user, discovery: { enabled: true, asLocalhost: false } }, connectOptions);
        await gateway.connect(ccp, {
            wallet,
            identity: user,
            discovery: {
                enabled: true,
                asLocalhost: true
            }
        }, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('ch-taxrefund');

        // Get the contract from the network.
        const contract = network.getContract('example8');
        let value = {
            currentId: "1234",
            customerId: "1111",
            merchantId: "3000001",
            salesDetail: [
                {
                    "product_name": "Oat Mild Moisture Sun Cream",
                    "product_serial_num": "A14",
                    "individual_qty": "2",
                    "individual_sales_amount": "10000",
                    "product_management_code": "B14",
                    "sales_price": "20000",
                    "value_added_tax": "1000",
                    "individual_consumption_tax": "0",
                    "education_tax": "0",
                    "special_tax_for_rural_development": "0"
                },
                {
                    "product_name": "Jeju Cherry Blossom Tone Up Cream",
                    "product_serial_num": "A18",
                    "individual_qty": "1",
                    "individual_sales_amount": "20000",
                    "product_management_code": "B18",
                    "sales_price": "20000",
                    "value_added_tax": "2000",
                    "individual_consumption_tax": "0",
                    "education_tax": "0",
                    "special_tax_for_rural_development": "0"
                }
            ]
        }
        // Submit the specified transaction.
        // let result = await contract.submitTransaction('invokePending','Client.merchant', JSON.stringify(data));
        let result = await contract.submitTransaction('invoke', '2nd', JSON.stringify(receipt));
        console.log('Transaction has been submitted');
        console.log(`result: ${result}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }

}

async function query_result(req) {
    try {
        let user = req.body.user;
        let txId = req.body.txId;

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user);
        if (!userExists) {
            console.log(`An identity for the user "${user}" does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('ch-taxrefund');

        // Get the contract from the network.
        const contract = network.getContract('example4');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('query', '1234');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

async function query_block(req) {
    try {

        let blockNum = parseInt(req.body.blockNum);

        let channelName = ccp['name'];
        let peerUrl = ccp['peers']['peer0.chainrefundOrg.chainrefund.com']['url'];
        let peerPem = ccp['peers']['peer0.chainrefundOrg.chainrefund.com']['tlsCACerts'];

        let fabric_client = new Fabric_Client();
        // fabric_client.addTlsClientCertAndKey(ccp);
        fabric_client.newChannel(channelName);
        fabric_client.getChannel(channelName);
        let target = fabric_client.newPeer(peerUrl, peerPem);

        let blockInfo = await channel.queryBlock(blockNum, target);

        console.log(blockInfo);

    } catch (error) {
        console.error(`Failed to query block info: ${error}`);
        process.exit(1);
    }
}

module.exports = {
    transaction_add,
    transaction_taxreceipt,
    query_result,
    query_block
}