var path = require('path');
var util = require('util');
const fs = require('fs');
var os = require('os');

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');

const ccpPath = path.resolve(__dirname, '..', 'network', 'network_dev.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function enroll_admin(req){
    try {

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('chainrefund');
        if (adminExists) {
            console.log('An identity for the admin user "chainrefund" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'chainrefund', enrollmentSecret: 'chain2018' });
        const identity = X509WalletMixin.createIdentity('ChainrefundOrgMSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('chainrefund', identity);
        console.log('Successfully enrolled admin user "chainrefund" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "chainrefund": ${error}`);
        process.exit(1);
    }
}

async function enroll_account(req){
    try {
        let name = req.body.name;
        
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(name);
        if (userExists) {
            console.log(`An identity for the user "${name}" already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('chainrefund');
        if (!adminExists) {
            console.log('An identity for the admin user "chainrefund" does not exist in the wallet');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'chainrefund', discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: name, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: name, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('ChainrefundOrgMSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(name, userIdentity);
        console.log(`Successfully registered and enrolled admin user "${name}" and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user "${name}": ${error}`);
        process.exit(1);
    }

}

// var Fabric_Client = require('fabric-client');
// var Fabric_CA_Client = require('fabric-ca-client');

// var fabric_client = new Fabric_Client();
// var fabric_ca_client = null;
// var admin_user = null;
// var member_user = null;
// var store_path = path.join(__dirname, '../hfc-key-store');
// console.log(' Store path:' + store_path);


// let enroll_admin = (req, res) => {
//     return new Promise((resolve, reject) => {
//         Fabric_Client.newDefaultKeyValueStore({
//             path: store_path
//         }).then((state_store) => {
//             // assign the store to the fabric client
//             fabric_client.setStateStore(state_store);
//             var crypto_suite = Fabric_Client.newCryptoSuite();
//             // use the same location for the state store (where the users' certificate are kept)
//             // and the crypto store (where the users' keys are kept)
//             var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
//             crypto_suite.setCryptoKeyStore(crypto_store);
//             fabric_client.setCryptoSuite(crypto_suite);
//             var tlsOptions = {
//                 trustedRoots: [],
//                 verify: false
//             };
//             // be sure to change the http to https when the CA is running TLS enabled
//             fabric_ca_client = new Fabric_CA_Client('http://127.0.0.1:7054', tlsOptions, 'ca.chainrefund.com', crypto_suite);

//             // first check to see if the admin is already enrolled
//             return fabric_client.getUserContext('CertAdmin', true);
//         }).then((user_from_store) => {

//             if (user_from_store && user_from_store.isEnrolled()) {
//                 console.log('Successfully loaded admin from persistence');
//                 admin_user = user_from_store;
//                 return null;
//             } else {
//                 // need to enroll it with CA server
//                 return fabric_ca_client.enroll({
//                     enrollmentID: 'CertAdmin',
//                     enrollmentSecret: 'chain2018'
//                 }).then((enrollment) => {
//                     console.log('Successfully enrolled admin');
//                     return fabric_client.createUser(
//                         {
//                             username: 'CertAdmin',
//                             mspid: 'ChainrefundOrgMSP',
//                             cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
//                         });
//                 }).then((user) => {
//                     admin_user = user;
//                     return fabric_client.setUserContext(admin_user);
//                 }).catch((err) => {
//                     console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
//                     throw new Error('Failed to enroll admin');
//                 });
//             }


//         }).then(() => {
//             resolve({ result: 'Assigned the admin user to the fabric client ::' + admin_user.toString() });
//         }).catch((err) => {
//             reject({ result: 'Failed to enroll admin: ' + err });
//         });

//     });
// }

// let enroll_account = () => {
//     return new Promise((resolve, reject) => {

//         var admin_user = null;
//         var member_user = null;


//         Fabric_Client.newDefaultKeyValueStore({
//             path: store_path
//         }).then((state_store) => {
//             // assign the store to the fabric client
//             fabric_client.setStateStore(state_store);
//             var crypto_suite = Fabric_Client.newCryptoSuite();
//             // use the same location for the state store (where the users' certificate are kept)
//             // and the crypto store (where the users' keys are kept)
//             var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
//             crypto_suite.setCryptoKeyStore(crypto_store);
//             fabric_client.setCryptoSuite(crypto_suite);
//             var tlsOptions = {
//                 trustedRoots: [],
//                 verify: false
//             };
//             // be sure to change the http to https when the CA is running TLS enabled
//             fabric_ca_client = new Fabric_CA_Client('http://127.0.0.1:7054', null, 'ca.chainrefund.com', crypto_suite);

//             // first check to see if the admin is already enrolled
//             return fabric_client.getUserContext('CertAdmin', true);
//         }).then((user_from_store) => {
//             if (user_from_store && user_from_store.isEnrolled()) {
//                 console.log('Successfully loaded admin from persistence');
//                 admin_user = user_from_store;
//             } else {
//                 throw new Error('Failed to get admin.... run enrollAdmin.js');
//             }

//             // at this point we should have the admin user
//             // first need to register the user with the CA server
//             return fabric_ca_client.register({
//                 enrollmentID: 'user0001',
//                 affiliation: 'store.org1',
//                 role: 'Client.customer',
//                 enrollmentSecret: "chain2018",
//                 attrs: JSON.parse(`[{"name":"hf.Registrar.Attributes","value":"*"},
//                                     {"name":"hf.AffiliationMgr","value":"1"},
//                                     {"name":"hf.Registrar.Roles","value":"peer,client,member"},
//                                     {"name":"hf.Registrar.DelegateRoles","value":"peer,client,member"},
//                                     {"name":"hf.Revoker","value":"1"},
//                                     {"name":"hf.IntermediateCA","value":"1"},
//                                     {"name":"hf.GenCRL","value":"1"}]`)
//             }, admin_user);
//         }).then((secret) => {
//             // next we need to enroll the user with CA server
//             console.log('Successfully registered user1 - secret:' + secret);

//             return fabric_ca_client.enroll({
//                 enrollmentID: 'user1',
//                 enrollmentSecret: secret
//             });
//         }).then((enrollment) => {
//             console.log('Successfully enrolled member user "customer1" ');
//             return fabric_client.createUser(
//                 {
//                     username: 'user1',
//                     mspid: 'ChainrefundOrgMSP',
//                     cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
//                 });
//         }).then((user) => {
//             member_user = user;

//             return fabric_client.setUserContext(member_user);
//         }).then(() => {
//             resolve('customer1 was successfully registered and enrolled and is ready to intreact with the fabric network');

//         }).catch((err) => {
//             console.error('Failed to register: ' + err);
//             if (err.toString().indexOf('Authorization') > -1) {
//                 console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
//                     'Try again after deleting the contents of the store directory ' + store_path);
//             }
//         });

//     });
// }

module.exports = {
    enroll_admin,
    enroll_account
}