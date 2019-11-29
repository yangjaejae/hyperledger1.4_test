const { FileSystemWallet, Gateway, DefaultEventHandlerStrategies } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, '..', 'network', 'network_dev.json');
const ccpFile = fs.readFileSync(ccpPath);
const ccp = JSON.parse(ccpFile.toString());

async function transaction_add(req){
    try {

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
        await gateway.connect(ccp, { wallet, 
                                    identity: user, 
                                    discovery: { 
                                        enabled: true, 
                                        asLocalhost: false 
                                        } 
                                    }, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('ch-taxrefund');

        // Get the contract from the network.
        const contract = network.getContract('ab');
        
        

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }

}