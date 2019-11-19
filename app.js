const express = require('express');
const cors = require('cors');

/**
 * api url설정*/
const router = require('./route/router');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*
* logger 설정(margan)
*/
// app.use(logger({
    //     format: 'default',
    //     stream: fs.createWriteStream(path.join(__dirname, 'eos-api.log'), {'flags': 'a'})
    // }));
    
    /*
    * api url설정
    */
   app.use('/fabric', router);
   
   // catch 404 and forward to error handler
   app.use(function(req, res, next) {
       next(createError(404));
    });
    
    // error handler
    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        
        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
    
    /*
    * logger 설정(winston)
    */
   let port = "3000";
   app.listen(port, () => {
       console.log(`listening port ${port}`)
   });
   
   module.exports = app;
   