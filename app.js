const express = require('express')
const app = express()
const port = 3000
let cron = require('node-cron');
let nodemailer = require('nodemailer');
var mysql = require('mysql');
const bodyparser = require('body-parser') 

// Body-parser middleware 
app.use(bodyparser.urlencoded({extended:false})) 
app.use(bodyparser.json())

// create mysql connection
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Test_1234",
  database: "test_db"
});

// e-mail transport configuration
let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: '<EMAIL>',
        pass: '<PASSWORD>'
      }
  });

/**
 * API to schedule Mail
 */
app.post('/scheduleMail', (req, res) => {
    con.query(`INSERT INTO test_temp(subject, message, send_to, schedule_date) VALUES ('${req.body.subject}', '${req.body.message}', '${req.body.to}', '${req.body.scheduleDate}')`, function (err, result, fields) {
      if (err) throw err;
        res.send('mail schedule successfully.');   
    });
})

/**
 * API to update scheduled Mail
 */
app.put('/updateScheduleMail', (req, res) => {
  con.query(`UPDATE test_temp SET subject = '${req.body.subject}', message = '${req.body.message}', send_to = '${req.body.to}', schedule_date = '${req.body.scheduleDate}' WHERE id = ${req.body.scheduleId}`, function (err, result, fields) {
    if (err) throw err;
      res.send('Updated schedule successfully.');   
  });
})

/**
 * API to get all scheduled Mail
 */
app.get('/getScheduleMail', (req, res) => {
  con.query(`SELECT * FROM test_temp`, function (err, result, fields) {
    if (err) throw err;
      res.send(result);   
  });
})

/**
 * API to delete scheduled Mail by id
 */
app.delete('/deleteScheduleMail', (req, res) => {
  con.query(`DELETE FROM test_temp WHERE id = ${req.query.scheduleId}`, function (err, result, fields) {
    if (err) throw err;
      res.send('deleted scheduled mail successfully.');   
  });
})

/**
 * cron runs every minute to check scheduled Mails date and send mail
 */
cron.schedule('* * * * *', () => {
  console.log('running a task every minute', new Date());
    con.query("SELECT * FROM test_temp", function (err, result, fields) {
      if (err) throw err;
      for(let i = 0; i < result.length; i++) {
          let d1 = new Date();
          d1.setHours(d1.getHours(), d1.getMinutes(), 0, 0);
          let d2 = new Date(result[i].schedule_date);
          d2.setHours(d2.getHours(), d2.getMinutes(), 0, 0);
          if(d1.getTime() === d2.getTime())
          {
            // e-mail message options
            let mailOptions = {
              from: 'patilharsh8997@gmail.com',
              to: result[i].send_to,
              subject: result[i].subject,
              text: result[i].message
            };
            
            // send mail
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });

          }
          console.log(result);
      }      
    });
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})