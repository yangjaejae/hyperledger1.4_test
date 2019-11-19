const express = require('express');
const router = express.Router();

const enroll = require("../enroll/enroll");
const transaction = require("../send_transaction/transaction");

router.post('/enroll_admin', (req, res) => {
    enroll.enroll_admin(req).then((result) => {
        res.send(result);
    })
    .catch( error => {
        res.send(error);
    });
});

router.post('/enroll_account', (req, res) => {
    enroll.enroll_account(req).then((result) => {
        res.send(result);
    })
    .catch( error => {
        res.send(error);
    });
});

router.post('/transaction_add', (req, res) => {
    transaction.transaction_add(req).then((result) => {
        res.send(result);
    })
    .catch( error => {
        res.send(error);
    });
});

router.post('/query_result', (req, res) => {
    transaction.query_result(req).then((result) => {
        res.send(result);
    })
    .catch( error => {
        res.send(error);
    });
});

module.exports = router;