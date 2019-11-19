const { BUY, ACC, SUCCESS, ERROR, MESSAGE, TOKEN, FUNC, SERVICE, CIPHER } = require("../constants/contants");
const { tx_enroll_user, tx_rams, tx_stake, tx_enroll_user_log, tx_user_action, tx_user_action_add, tx_create_token, tx_reward_token, tx_send_token, tx_allow_transfer, tx_freeze_token } = require("../utils/format/format.transaction");
const { EosManager } = require("../utils/eosnetwork/eosnetwork.manager");
const { res_format, res_error } = require("../utils/format/format.response");
const { hide_string } = require("../utils/format/format.string");
const DBObject = require("../sqliteDB/sqlite.execute").SqlQueryObj;
const decrypt_pass = require("../utils/certtificate/cipher").decrypt_pass;

const db = new DBObject();
const eosManager = new EosManager();
require('date-utils');

let enroll_user = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> ENROLL USER REQUEST");
    let nid = req.body.nid;
    let email = hide_string(req.decoded._emailId, "email");

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${nid}`);

    db.check_completion(nid).then(res => {
      logger.log("info", `ENROLLMENT CHECK`);
      if (res.length == 0) {
        db.get_user(ACC.MGR_ACC.ETYPE).then(acc => {
          logger.log("info", `SUCCESS GET USER FROM KEY STORE`);

          let admin = acc[0].active_pri;
          let account = eosManager.gen_account();

          let rpc = eosManager.rpc;
          rpc.get_account(account).then((res) => {
            db.update_completion(nid, 1).then(res => {
              logger.error("info", `NEW MADE ACCOUNT ALREADY IN BLOCKCHAIN NETWORK`);
              resolve({
                result_code: 601,
                result: "fail",
                err_message: "this account is already in block chain, try again"
              });////////////////////////////
            });
          }).catch(err => {
            logger.log("info", `SUCCESS GENERATE NEW ACCOUNT FOR EOS NETWORK`);
            eosManager.gen_keys().then(keys => {
              let owner_pub = keys.pub_key;
              let owner_pri = keys.pri_key;
              eosManager.gen_keys().then(keys => {
                logger.log("info", `SUCCESS GENERATE NEW KEYS FOR EOS NETWORK`);
                let active_pub = keys.pub_key;
                let active_pri = keys.pri_key;

                let now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');

                let users_key = [];
                let decrypt_key = decrypt_pass(4, admin);
                users_key.push(decrypt_key);
                users_key.push(active_pri);

                eosManager.set_cached_key(users_key);
                let eos = eosManager.eos;
                db.enroll_user(nid, account, owner_pri, owner_pub, active_pri, active_pub, now).then(res => {

                  eos.transact({
                    actions: [
                      tx_enroll_user(account, owner_pub, active_pub),
                      tx_rams(BUY.BUY, ACC.MGR_ACC.NAME, account),
                      tx_stake(BUY.BUY, ACC.MGR_ACC.NAME, account),
                    ]
                  },
                    {
                      blocksBehind: 3,
                      expireSeconds: 30,
                    }).then(tx_enroll_res => {
                      logger.log("info", `SUCCESS TRANSACTION ENROLL NEW USER`);
                      db.update_completion(nid, 1).then(res => {
                        logger.log("info", `SUCCESS ENROLL NEW USER`);

                        eos.transact({
                          actions: [
                            tx_enroll_user_log(SERVICE.NAME, account, now, email, owner_pub, active_pub)
                          ]
                        },
                          {
                            blocksBehind: 3,
                            expireSeconds: 30,
                          }).then(tx_res => {
                            logger.log("info", `SUCCESS ALERT TO NEW USER - FINAL`);
                            resolve(res_format(tx_enroll_res, SUCCESS.FUNC.NEW_ACCOUNT));
                          }).catch(error => {
                            logger.error(`ERROR BLOCKCHAIN TRANSACTION - LOG USER`);
                            resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
                          });
                      })
                    }).catch(error => {
                      logger.error(`ERROR BLOCKCHAIN TRANSACTION`);
                      resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
                    });
                }).catch(error => {
                  logger.error(`ERROR DATABASE TRANSACTION - SAVE USER`);
                  resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
                });
              }).catch(error => {
                logger.error(`ERROR DATABASE TRANSACTION - GENERATE KEY`);
                resolve(res_error(error, ERROR.TYPE.ETC.CODE));
              });;
            }).catch(error => {
              logger.error(`ERROR DATABASE TRANSACTION - GENERATE KEY`);
              resolve(res_error(error, ERROR.TYPE.ETC.CODE));
            });
          });
        }).catch(error => {
          logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
          resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
        });
      } else if (res[0].completion == 0) {
        let chk_name = res[0].account_name ? res[0].account_name : null;
        let rpc = eosManager.rpc;

        rpc.get_account(chk_name).then((res) => {
          logger.log("info", `NEW MADE ACCOUNT ALREADY IN BLOCKCHAIN NETWORK`);
          db.update_completion(nid, 1).then(res => {
            logger.log("info", `THIS ACCOUNT IS ALREADY IN BLOCKCHAIN - FINAL`);
            resolve({
              result_code: 200,
              result: "success",
              action_data: {
                auth: {
                  name: chk_name
                }
              },
              err_message: "this account is already in block chain, just updated nid and completion"
            });////////////////////////////
          })
        }).catch(err => {
          logger.log("info", `SUCCESS CHECK IS ACCOUNT ALREADY IN BLOCKCHAIN NETWORK`);
          db.get_user(ACC.MGR_ACC.ETYPE).then(acc => {
            logger.log("info", `SUCCESS GET USER FROM KEY STORE`);

            let admin = acc[0].active_pri;

            let account = eosManager.gen_account();
            rpc.get_account(account).then((res) => {
              logger.error("info", `NEW MADE ACCOUNT ALREADY IN BLOCKCHAIN NETWORK`);
              resolve({
                result_code: 601,
                result: "fail",
                err_message: "this account is already in block chain, try again"
              });////////////////////////////
            }).catch(err => {
              logger.log("info", `SUCCESS GENERATE NEW ACCOUNT FOR EOS NETWORK`);
              eosManager.gen_keys().then(keys => {
                let owner_pub = keys.pub_key;
                let owner_pri = keys.pri_key;
                eosManager.gen_keys().then(keys => {
                  logger.log("info", `SUCCESS GENERATE NEW KEYS FOR EOS NETWORK`);
                  let active_pub = keys.pub_key;
                  let active_pri = keys.pri_key;

                  let now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');

                  let users_key = [];
                  let decrypt_key = decrypt_pass(4, admin);
                  users_key.push(decrypt_key);
                  users_key.push(active_pri);

                  eosManager.set_cached_key(users_key);
                  let eos = eosManager.eos;

                  db.change_user(nid, account, owner_pri, owner_pub, active_pri, active_pub, now).then(res => {

                    eos.transact({
                      actions: [
                        tx_enroll_user(account, owner_pub, active_pub),
                        tx_rams(BUY.BUY, ACC.MGR_ACC.NAME, account),
                        tx_stake(BUY.BUY, ACC.MGR_ACC.NAME, account),
                      ]
                    },
                      {
                        blocksBehind: 3,
                        expireSeconds: 30,
                      }).then(tx_enroll_res => {
                        logger.log("info", `SUCCESS TRANSACTION ENROLL NEW USER`);
                        db.update_completion(nid, 1).then(res => {
                          logger.log("info", `SUCCESS ENROLL NEW USER`);

                          eos.transact({
                            actions: [
                              tx_enroll_user_log(SERVICE.NAME, account, now, email, owner_pub, active_pub)
                            ]
                          },
                            {
                              blocksBehind: 3,
                              expireSeconds: 30,
                            }).then(tx_res => {
                              logger.log("info", `SUCCESS ALERT TO NEW USER - FINAL`);
                              resolve(res_format(tx_enroll_res, SUCCESS.FUNC.NEW_ACCOUNT));
                            }).catch(error => {
                              logger.error(`ERROR BLOCKCHAIN TRANSACTION - LOG USER`);
                              resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
                            });
                        })
                      }).catch(error => {
                        logger.error(`ERROR BLOCKCHAIN TRANSACTION`);
                        resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
                      });
                  }).catch(error => {
                    logger.error(`ERROR DATABASE TRANSACTION - SAVE USER`);
                    resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
                  });
                }).catch(error => {
                  logger.error(`ERROR DATABASE TRANSACTION - GENERATE KEY`);
                  resolve(res_error(error, ERROR.TYPE.ETC.CODE));
                });;
              }).catch(error => {
                logger.error(`ERROR DATABASE TRANSACTION - GENERATE KEY`);
                resolve(res_error(error, ERROR.TYPE.ETC.CODE));
              });
            });
          }).catch(error => {
            logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
            resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
          });
        });
      } else {
        logger.log("info", `THIS ACCOUNT IS ALREADY ENROLLED - FINAL`);
        resolve({
          result_code: 200,
          result: "success",
          err_message: "this account is already enrolled"
        });////////////////////////////
      }
    }).catch(error => {
      logger.log("info", `THIS ACCOUNT IS ALREADY ENROLLED - FINAL`);
      resolve({
        result_code: 200,
        result: "success",
        err_message: "this account is already enrolled"
      });////////////////////////////
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
};

let buy_rams = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> BUY RAMS REQUEST");
    let buyer_nid = ACC.MGR_ACC.ETYPE;
    let user_nid = req.body.nid;
    let is_buy = req.body.is_buy;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${user_nid},${is_buy == 0 ? "BUY" : "SELL"}`);

    db.get_from_to_users(buyer_nid, user_nid).then(res => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let from_key = res.from_key;
      let from_acc = res.from_acc;
      let to_acc = res.to_acc;

      let users_key = [];
      let decrypt_key = decrypt_pass(4, from_key);
      users_key.push(decrypt_key);

      eosManager.set_cached_key(users_key);
      let eos = eosManager.eos;
      let buyer = from_acc
      let owner = to_acc;

      eos.transact({
        actions: [
          tx_rams(is_buy, buyer, owner)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          logger.log("info", `SUCCESS TRANSACTION BUY RAMS - FINAL`);
          resolve(res_format(res, SUCCESS.FUNC.BUY_RAM));
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION`);
          reject(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      reject(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    reject(res_error(error, ERROR.TYPE.ETC.CODE));
  });
};

let stake_resource = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> STAKE RESOURCE REQUEST");
    let buyer_nid = ACC.MGR_ACC.ETYPE;
    let user_nid = req.body.nid;
    let is_buy = req.body.is_buy;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${user_nid},${is_buy == 0 ? "BUY" : "SELL"}`);

    db.get_from_to_users(buyer_nid, user_nid).then(res => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let from_key = res.from_key;
      let from_acc = res.from_acc;
      let to_acc = res.to_acc;

      let users_key = [];
      let decrypt_key = decrypt_pass(4, from_key);
      users_key.push(decrypt_key);

      eosManager.set_cached_key(users_key);
      let eos = eosManager.eos;
      let buyer = from_acc
      let receiver = to_acc;

      eos.transact({
        actions: [
          tx_stake(is_buy, buyer, receiver)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          logger.log("info", `SUCCESS TRANSACTION STAKE RESOURCES - FINAL`);
          resolve(res_format(res, SUCCESS.FUNC.STAKING));
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
}

let user_action = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> USER ACTION REQUEST");
    let nid = req.body.nid;
    let act_type = parseInt(req.body.act_type) - 1;
    let serial = req.body.serial;
    let seq = req.body.seq;
    let act_time = req.body.act_time;
    let rwd_amt = req.body.reward_amount;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${nid},${act_type},${serial},${act_time},${rwd_amt}`);

    db.get_user(nid).then(acc => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let users_key = [];
      let decrypt_key = decrypt_pass(1, acc[0].active_pri);
      users_key.push(decrypt_key);
      eosManager.set_cached_key(users_key);

      let eos = eosManager.eos;
      let user = acc[0].account_name;
      let user_actions = {};
      if (act_type <= 6) {
        logger.log("info", `USER ACTION - FIXED`);
        user_actions = tx_user_action(user, act_type, serial, seq, act_time, rwd_amt);
      } else if (act_type > 6) {
        logger.log("info", `USER ACTION - ALTERNATIVE`);
        let data = {
          serial_num: serial,
          seq: seq,
          act_type: FUNC.REWARD[act_type],
          reward_amount: rwd_amt
        }
        data = JSON.stringify(data).toString();
        user_actions = tx_user_action_add(user, act_time, data);
      }
      eos.transact({
        actions: [user_actions]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(tx_res => {
          logger.log("info", `SUCCESS BLOCKCHAIN TRANSACTION`);
          let now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');

          db.update_user_date(nid, now).then(res => {
            logger.log("info", `SUCCESS TRANSACTION AND UPDATE USER'S STATE - FINAL`);
            resolve(res_format(tx_res, SUCCESS.FUNC.USER_ACTION));
          }).catch(error => {
            logger.error(`ERROR DATABASE TRANSACTION - UPDATE USER STATE`);
            resolve(res_error(error, ERROR.TYPE.DATABASE.CODE, serial));
          });
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE, serial));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE, serial));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.DATABASE.CODE, serial));
  });
};

let create_token = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> CREATE TOKEN REQUEST");
    let max_supply = req.body.quantity + " " + req.body.symbol;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${max_supply}`);

    db.get_user(ACC.TOKEN.ETYPE).then(acc => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let users_key = [];
      let decrypt_key = decrypt_pass(4, acc[0].active_pri);
      users_key.push(decrypt_key);
      eosManager.set_cached_key(users_key);

      let eos = eosManager.eos;

      eos.transact({
        actions: [
          tx_create_token(max_supply)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(tx_res => {
          logger.log("info", `SUCCESS TRANSACTION CREATE TOKEN - FINAL`);
          resolve(res_format(tx_res, SUCCESS.FUNC.CREATE_TOKEN));
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION - CREATE TOKEN`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
}

let reward_token = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> REWARD TOKEN REQUEST");
    let admin_uid = ACC.TOKEN.ETYPE;
    let user_nid = req.body.nid;
    let serial = req.body.serial;
    let seq = req.body.seq;
    let quantity = req.body.quantity + " " + TOKEN.SYMBOL;
    let memo = req.body.memo;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${user_nid},${serial},${quantity},${memo}`);

    db.get_from_to_users(admin_uid, user_nid).then(acc => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let from_key = acc.from_key;
      let to_acc = acc.to_acc;

      let users_key = [];
      let decrypt_key = decrypt_pass(4, from_key);
      users_key.push(decrypt_key);

      eosManager.set_cached_key(users_key);
      let eos = eosManager.eos;
      let user = to_acc;

      eos.transact({
        actions: [
          tx_reward_token(user, quantity, serial, seq, memo)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(tx_res => {
          logger.log("info", `SUCCESS BLOCKCHAIN TRANSACTION`);
          let now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');

          db.update_user_date(user_nid, now).then(res => {
            logger.log("info", `SUCCESS TRANSACTION AND UPDATE USER'S STATE - FINAL`);
            resolve(res_format(tx_res, SUCCESS.FUNC.REWARD_TOKEN));
          }).catch(error => {
            logger.error(`ERROR DATABASE TRANSACTION - UPDATE USER STATE`);
            resolve(res_error(error, ERROR.TYPE.DATABASE.CODE, serial));
          });
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION - REWARD TOKEN`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE, serial));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
}

let send_token = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> SEND TOKEN REQUEST");
    let nid_from = req.body.nid;
    let nid_to = req.body.nid_to;
    let quantity = req.body.quantity + " " + TOKEN.SYMBOL;
    let memo = req.body.memo;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${nid_from},${nid_to},${quantity},${memo}`);

    db.get_from_to_users(nid_from, nid_to).then(acc => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let from_key = acc.from_key;
      let from_acc = acc.from_acc;
      let to_acc = acc.to_acc;

      let users_key = [];
      let decrypt_key = decrypt_pass(1, from_key);
      users_key.push(decrypt_key);

      eosManager.set_cached_key(users_key);
      let eos = eosManager.eos;

      eos.transact({
        actions: [
          tx_send_token(from_acc, to_acc, quantity, memo)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(tx_res => {
          logger.log("info", `SUCCESS BLOCKCHAIN TRANSACTION`);
          let now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');

          db.update_user_date(nid_from, now).then(res => {
            db.update_user_date(nid_to, now).then(res => {
              logger.log("info", `SUCCESS TRANSACTION AND UPDATE USER'S STATE - FINAL`);
              resolve(res_format(tx_res, SUCCESS.FUNC.SEND_TOKEN));
            }).catch(error => {
              logger.error(`ERROR DATABASE TRANSACTION - UPDATE USER STATE`);
              resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
            });
          }).catch(error => {
            logger.error(`ERROR DATABASE TRANSACTION - UPDATE USER STATE`);
            resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
          });
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION - SEND TOKEN`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
}

let allow_transfer = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> ALLOW TRANSFER REQUEST");
    let nid = req.body.nid;
    let nid_user = req.body.nid;
    let token = `1.0000${req.body.symbol}`
    let is_allow = req.body.is_allow == 0 ? false : true;
    let memo = "";

    if (is_allow == 1) {
      memo = MESSAGE.ALLOW;
    } else if (is_allow == 0) {
      memo = MESSAGE.NOT_ALLOW
    }

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${nid_user},${req.body.symbol},${is_allow ? "ALLOW" : "BAN"},${memo}`);

    db.get_from_to_users(nid, nid_user).then(acc => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let from_key = acc.from_key;
      let user_acc = acc.to_acc;

      let users_key = [];
      let decrypt_key = decrypt_pass(4, from_key);
      users_key.push(decrypt_key);

      eosManager.set_cached_key(users_key);
      let eos = eosManager.eos;

      eos.transact({
        actions: [
          tx_allow_transfer(user_acc, token, is_allow, memo)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(tx_res => {
          logger.log("info", `SUCCESS BLOCKCHAIN TRANSACTION - FINAL`);
          resolve(res_format(tx_res, SUCCESS.FUNC.USER_ACTION));
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION - ALLOW TRANSFER`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
};

let freeze_token = (req, logger) => {
  return new Promise((resolve, reject) => {
    logger.log("info", ">> FREEZE TOKEN REQUEST");
    let token = `1.0000${req.body.symbol}`
    let is_freeze = req.body.is_freeze == 0 ? false : true;

    logger.log("info", `RECEIVE PARAMETER`);
    logger.log("info", `${req.body.symbol},${is_freeze ? "ALLOW" : "BAN"}`);

    db.get_user(ACC.TOKEN.ETYPE).then(acc => {
      logger.log("info", `SUCCESS GET USER FROM KEY STORE`);
      let users_key = [];
      let decrypt_key = decrypt_pass(4, acc[0].active_pri);
      users_key.push(decrypt_key);

      eosManager.set_cached_key(users_key);
      let eos = eosManager.eos;

      eos.transact({
        actions: [
          tx_freeze_token(token, is_freeze)
        ]
      },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(tx_res => {
          logger.log("info", `SUCCESS BLOCKCHAIN TRANSACTION - FINAL`);
          resolve(res_format(tx_res, SUCCESS.FUNC.USER_ACTION));
        }).catch(error => {
          logger.error(`ERROR BLOCKCHAIN TRANSACTION - FREEZE TOKEN`);
          resolve(res_error(error, ERROR.TYPE.BLOCKCHAIN.CODE));
        });
    }).catch(error => {
      logger.error(`ERROR DATABASE TRANSACTION - GET USER`);
      resolve(res_error(error, ERROR.TYPE.DATABASE.CODE));
    });
  }).catch(error => {
    logger.error(`ERROR OTHER ERROR`);
    resolve(res_error(error, ERROR.TYPE.ETC.CODE));
  });
};

module.exports = {
  enroll_user,
  buy_rams,
  stake_resource,
  user_action,
  create_token,
  reward_token,
  send_token,
  allow_transfer,
  freeze_token,
}