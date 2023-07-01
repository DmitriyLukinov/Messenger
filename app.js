const express = require("express");
const path = require("path");
const mysql = require('mysql2');
const jsonParser = express.json();
const app = express();
const fs = require("fs");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '*********',
    database: 'usersdb'
});

connection.connect((err) => {
    if (err) {
      console.error('Connection error:', err);
      return;
    }
    console.log('Successful database connection');
});

app.use(express.static(path.join(__dirname, "public")));

// Getting date in Unix format
function toUnixTime(date){
  var dateObj = new Date(date);
  var unixTimestamp = dateObj.getTime();
  var unixTimeSeconds = Math.floor(unixTimestamp / 1000);

  return unixTimeSeconds;
}

function writeToJSONandDatabase(user_message_time, user, message, time, res) {
  let data = fs.readFileSync("current_u_m.json", "utf8");
  let allData = JSON.parse(data);
  if (allData.length > 3) { //saves only last 4 messages in current_u_m.json
    allData.shift();
  }
  allData.push(user_message_time);
  data = JSON.stringify(allData);
  fs.writeFileSync("current_u_m.json", data);

  const sql = "INSERT INTO users_messages (user, message, time) VALUES (?, ?, ?)"; //saves all messages in database
  const values = [user, message, time];

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("SQL query execution error:", err);
      res.status(500).json({ error: "Server error" });
      return;
    }

    console.log("The message was successfully saved to the database");
    res.status(200).json({ message: "Post successfully published" });
  });
}

app.post("/publish", jsonParser, (req, res) => {
    const user = req.body.user;
    const message = req.body.message;
    const time = req.body.time;
    let user_message_time = {user: user, message: message, time: time};

    var timeFromTweet = toUnixTime(time);
    var timeFromDatabase;

    //find the most recent user record in the database
    const sql_searchUser = "SELECT * FROM users_messages WHERE user = ? ORDER BY id DESC";
    const sql_values = [user];

    connection.query(sql_searchUser, sql_values, (err, result) => {
      if (err) {
        console.error("SQL query execution error:", err);
        res.status(500).json({ error: "Server error" });
        return;
      }
      if (result.length > 0) {                          // If the user is present in the database
        timeFromDatabase = toUnixTime(result[0].time);  // Getting Unix-time from database
        if (timeFromTweet - timeFromDatabase > 600){    // If the difference is more than 10 minutes, then send status 200 (message will be published)
          writeToJSONandDatabase(user_message_time, user, message, time, res);
        }
      } 
      else{ // If the user is absent in the database
        writeToJSONandDatabase(user_message_time, user, message, time, res);
      }
    });
});

//Get all messages from current_u_m.json
app.get("/showtweets", function(req, res){
  const content = fs.readFileSync("current_u_m.json","utf8");
  const lastTweets = JSON.parse(content);
  res.send(lastTweets);
});

//Delete messages from current_u_m.json. Messages are not deleted from the database.
app.delete("/deletetweet", jsonParser, (req, res) => {
  const user = req.body.user;
  const time = req.body.timestamp;

  let data = fs.readFileSync("current_u_m.json", "utf8");
  let allData = JSON.parse(data);
  for(var i = 0; i<allData.length; i++){
    if(allData[i].user===user && allData[i].time===time){
      allData.splice(i,1);
      break;
    }
  }
  data = JSON.stringify(allData);
  fs.writeFileSync("current_u_m.json", data);

  res.status(200).json({ message: "Message deleted successfully" });
});

app.listen(3000);
