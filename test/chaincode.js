const FabricClient = require('fabric-client');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, '..', 'config', 'network_local.json');
const ccpFile = fs.readFileSync(ccpPath);
const ccp = JSON.parse(ccpFile.toString());

const adminCertPath = path.resolve(__dirname, '..', 'wallet', 'chainrefund', 'chainrefund')
const adminCert = fs.readFileSync(adminCertPath);
const adminPemPath = path.resolve(__dirname, '..', 'wallet', 'chainrefund', 'd1500c37a362a8c9d60b6ea582552ed6a14fe983117d798bfffd4db065fb4dc6-priv')
const adminPem = fs.readFileSync(adminCertPath);

// const fabricClient = new FabricClient();
client = FabricClient.loadFromConfig(ccp);
client.setTlsClientCertAndKey(
    adminCert,
    adminPem
)
client.setDevMode(true);
// fabricClient.setAdminSigningIdentity(
//     adminPem,
//     adminCert,
//     ccp['organizations']['ChainrefundOrg']['mspid']
// )
console.log(client)
let targets = ["peer0.chainrefundOrg.chainrefund.com"]
let chaincodeId = "mycc"
let chaincodePath = "../chaincode/taxrefund"
let chaincodeVersion = "1"
let chaincodeType = "golang"
let chaincodeNames = ["ch-taxrefund"]
console.log(typeof chaincodePath)
let request = {};
request.targets = targets
request.chaincodeId = chaincodeId
request.chaincodePath = chaincodePath
request.chaincodeVersion = chaincodeVersion
request.chaincodeType = chaincodeType
request.channelNames = chaincodeNames

client.installChaincode(request).then(console.log);