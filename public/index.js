// Function to format date and time to string
function formatTimestamp() {
    var date = new Date();
    var options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Function to create a new message
function createTweet(text, time, userName) {
  var tweet = document.createElement('div');
  tweet.className = 'tweet';
  
  var timestamp;
  if (time) { timestamp = time; } 
  else { timestamp = formatTimestamp(); }

  var user;
  if (userName){user = userName;}
  else {user = document.getElementById('user').value;}

  //Creating an html tweet form
  var userSpan = document.createElement('span');
  userSpan.className = 'tweet-userstamp';
  userSpan.innerHTML = '<span class="user-first">' + user.substr(0, 3) +
                      '</span><span class="user-rest">' + user.substr(3) + '</span>';
    
  tweet.innerHTML = '<span class="tweet-text">' + text + '</span>' +
                    userSpan.outerHTML +
                    '<span class="tweet-timestamp">' + timestamp + '</span>' +
                    '<button class="tweet-delete">Delete</button>';

  // Add an event listener for the "delete" button
  var deleteButton = tweet.querySelector('.tweet-delete');
  deleteButton.addEventListener('click', async function() {
    var tweetContainer = this.closest('.tweet');
    var tweetUser = tweetContainer.querySelector('.tweet-userstamp').textContent;
    var currentUser = document.getElementById('user').value;
    var timestamp_toserver = tweetContainer.querySelector('.tweet-timestamp').textContent;

    if (currentUser === tweetUser) {
      var requestBody = JSON.stringify({
        user: tweetUser,
        timestamp: timestamp_toserver
      });

      var response = await fetch('/deletetweet',{
        method: 'DELETE',
        headers: {'Accept': 'application/json',
                  'Content-Type': 'application/json'},
        body: requestBody
      });
      var data = await response.json();
      console.log(data.message);

      tweetContainer.remove();
    }
  });

  //Add an event listener to hide the "delete" button
  deleteButton.addEventListener('mouseenter', () => {
    var tweetContainer = deleteButton.closest('.tweet');
    var tweetUser = tweetContainer.querySelector('.tweet-userstamp').textContent;
    var currentUser = document.getElementById('user').value;
  
    if (currentUser !== tweetUser) {
      deleteButton.style.backgroundColor = 'white';
    }
  });
  
  deleteButton.addEventListener('mouseleave', () => {
    deleteButton.style.backgroundColor = ''; 
  });
 
  return tweet;
}

//Publication of all messages from current_u_m.json
async function GetTweets(){
  const response = await fetch("/showtweets",{
    method: "GET",
    headers: { "Accept": "application/json" }
  });
  if (response.ok) {
    const tweets = await response.json();
    const tweetsWidget = document.getElementById('tweets-widget');

    tweetsWidget.innerHTML = '';

    tweets.forEach(function(tweetText) {
      var tweet = createTweet(tweetText.message, tweetText.time, tweetText.user);
      tweetsWidget.prepend(tweet); 
    });
  } 
}

// Event listener for the "Post message" button
var tweetButton = document.getElementById('tweet-button');
tweetButton.addEventListener('click', async function() {
  var tweetInput = document.getElementById('tweet-input');
  var tweetText = tweetInput.value;

  if (tweetText.trim() !== '') {
    var user = document.getElementById('user').value;  
    if (user.length < 4) {
      alert('User must be at least 4 characters long');
      return; 
    }
    var timestamp = formatTimestamp();
    var tweet = { user: user, message: tweetText, time: timestamp };  

    var response = await fetch('/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweet)
    });
    var data = await response.json();
    console.log(data.message);

    var newTweet = createTweet(tweetText, timestamp);

    var tweetsWidget = document.getElementById('tweets-widget');
    tweetsWidget.insertBefore(newTweet, tweetsWidget.firstChild);

    tweetInput.value = '';

    tweetsWidget.scrollTop = 0;
  }
});

GetTweets();
