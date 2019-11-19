
let update_user_status = (req, res) => {
    return new Promise((resolve, reject) => {
        let nid = req.body.nid;
        let status = req.body.status;

        db.update_user_status(nid, status, new Date().toFormat('YYYY-MM-DD HH24:MI:SS')).then( res => {
            console.log(res);

        }).catch( error => {
            console.log(error);
        });
    });
}

module.exports = {
    update_user_status: update_user_status
}