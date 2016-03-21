var casper = require('casper').create({
  verbose: true,
  logLevel: 'debug',
  pageSettings: {
    loadImages:  false,         // The WebPage instance used by Casper will
    loadPlugins: false,         // use these settings
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
  }
});
var private = require('./private');

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

casper.on("page.error", function(msg, trace) {
    this.echo("Page Error: " + msg, "ERROR");
});

var url = 'https://www.seamless.com/corporate/login';
var timeoutFunction = function() {};
var timeout = 100000; //100 seconds

casper.start(url);

// 1. Login
casper.waitForSelector('form#widgetLoginForm', function() {
  console.log("main page loaded");
  this.fill('form#widgetLoginForm', {
    'username': private.username,
    'password':  private.password
  }, true);
}, timeoutFunction, timeout);

// 2. Select 5:45 delivery
casper.waitForSelector('form#pageForm', function() {
  console.log("Step 1: Time selection loaded");
  this.fill('form#pageForm', {'time': '8:00 PM'}, true);
}, timeoutFunction, timeout);

// 3. Select Little Delhi
casper.waitForSelector('table#resultstable', function() {
  console.log("Step2: Results table loaded");
  this.clickLabel('Little Delhi', 'a');
}, timeoutFunction, timeout);

//4. Order items
casper.waitForSelector('div#PopularList', function() {
  console.log("Step3: Little Delhi loaded");
  this.clickLabel('Butter Chicken (Chef Recommended)', 'a');
}, timeoutFunction, timeout);


casper.waitForSelector('form#orderAttributes', function() {
  console.log("Step4: Butter Chicken loaded");
  this.clickLabel('Spicy', 'label');
  this.clickLabel('Add Item to Your Order', 'a');
}, timeoutFunction, timeout);

casper.run();
