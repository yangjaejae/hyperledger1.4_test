const { res_format, get_format, res_error } = require("../utils/format/format.response");
const DBObject = require("../sqliteDB/sqlite.execute").SqlQueryObj;
const { BUY, ACC, TOKEN, MODEL, SUCCESS, FUNC } = require("../constants/contants");
const { EosManager } = require("../utils/eosnetwork/eosnetwork.manager");

const eosManager = new EosManager();
let db = new DBObject();

let get_account = (req, logger) => {
    return new Promise((resolve, reject) => {
        logger.log("info", ">> GET ACCOUNT REQUEST");
        let nid = req.query.nid;
        let account = req.query.account;

        logger.log("info", `RECEIVE PARAMETER`);
        logger.log("info", `${nid ? nid : account}`);

        if (account) {
            get_account_eos(account).then(res => {
                logger.log("info", `SUCCESS GET USER BY EOS ACCOUNT - FINAL`);
                resolve(res);
            }).catch(error => {
                logger.error(`ERROR GET ACCOUNT - BY EOS ACCOUNT`);
                reject(res_error(error.json, 2));
            });
        } else if (nid) {
            db.get_user(nid).then(res => {
                logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
                let acc = res[0].account_name;

                get_account_eos(acc).then(res => {
                    logger.log("info", `SUCCESS GET USER BY NID - FINAL`);
                    resolve(res);
                }).catch(error => {
                    logger.error(`ERROR GET ACCOUNT - GET USER FROM EOS`);
                    reject(res_error(error.json, 2));
                });
            }).catch(error => {
                logger.error(`ERROR GET ACCOUNT - GET USER FROM DATABASE`);
                reject(res_error(error.json, 2));
            });
        }

    });
}

let get_total_currency = (req, logger) => {
    return new Promise((resolve, reject) => {
        logger.log("info", ">> GET TOTAL CURRENCY REQUEST");

        let rpc = eosManager.rpc;
        rpc.get_currency_stats(
            ACC.TOKEN.NAME,
            TOKEN.SYMBOL
        ).then(res => {
            logger.log("info", "GET TOTAL CURRENCY - FINAL");
            resolve(get_format(res, SUCCESS.FUNC.GET_TOTAL_CURRENCY));
        }).catch(error => {
            logger.error("ERROR GET TOTAL CURRENCY");
            reject(res_error(error.json, 2));
        });
    });
}

let get_accounts_cnt = (req, logger) => {
    return new Promise((resolve, reject) => {
        logger.log("info", ">> GET TOTAL TRAVELRE ACCOUNT COUNT");
        let data = {}
        let cnt = 0;
        let rpc = eosManager.rpc;
        rpc.history_get_actions(ACC.USER_ACTION.NAME, -1, -10000000).then(res => {
            for (let i = 0; i < res["actions"].length; i++) {
                let action = res["actions"][i];
                if (action["action_trace"]["act"]["name"] == FUNC.MGR_ACC.PROFILE) {
                    cnt += 1;
                }
            }
            logger.log("info", `GET TOTAL TRAVELRE ACCOUNT COUNT: ${cnt} - FINAL`);
            data.func = "all accounts";
            data.cnt = cnt;
            resolve(get_format(data, SUCCESS.FUNC.GET_ACCOUNTS_CNT));
        }).catch( error => {
            reject(res_error(error.json, 2))
        });
    });
}

let get_transaction_cnt = (req, logger) => {
    return new Promise((resolve, reject) => {
        logger.log("info", ">> GET TOTAL TRAVELRE TRANSACTION COUNT");
        let data = {}
        let cnt = 0;
        let rpc = eosManager.rpc;
        rpc.history_get_actions(ACC.MGR_ACC.NAME, -1, -10000000).then(res => {
            cnt += res["actions"].length;
            
            rpc.history_get_actions(ACC.TOKEN.NAME, -1, -10000000).then(res => {
                cnt += res["actions"].length;
                
                rpc.history_get_actions(ACC.USER_ACTION.NAME, -1, -10000000).then(res => {
                    cnt += res["actions"].length;
                    
                    logger.log("info", `GET TOTAL TRAVELRE TRANSACTION COUNT: ${cnt} - FINAL`);
                    data.func = "all transaction";
                    data.cnt = cnt;
                    resolve(get_format(data, SUCCESS.FUNC.GET_ACCOUNTS_CNT));
                }).catch( error => {
                    reject(res_error(error.json, 2))
                });
            }).catch( error => {
                reject(res_error(error.json, 2))
            });
        }).catch( error => {
            reject(res_error(error.json, 2))
        });
    });
}

let get_account_eos = (account) => {
    return new Promise((resolve, reject) => {

        let rpc = eosManager.rpc;
        rpc.get_account(account).then(res => {
            let format = {};
            format = get_format(res, SUCCESS.FUNC.GET_ACCOUNT);
            get_account_balance(account).then(res => {
                format["balance"] = res;
                resolve(format);
            })
        }).catch(error => {
            reject(res_error(error.json, 2));
        });
    });
}

let get_account_balance = (account) => {
    return new Promise((resolve, reject) => {

        let rpc = eosManager.rpc;
        rpc.get_currency_balance(
            ACC.TOKEN.NAME, // code(contract)
            account, // account
            TOKEN.SYMBOL            // symbol
        ).then(res => {
            resolve(res);
        }).catch(error => {
            reject(error);
        })
    });
}

module.exports = {
    get_account,
    get_total_currency,
    get_accounts_cnt,
    get_transaction_cnt
}