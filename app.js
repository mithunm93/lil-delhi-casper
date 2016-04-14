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
var alfredGetOrdersUrl = 'http://lil-delhi-alfred.herokuapp.com/get_orders';
var alfredPostCompletionUrl = 'http://lil-delhi-alfred.herokuapp.com/order_completed';
var timeoutFunction = function() {};
var timeout = 600000; // 10 minutes for total order time
var orders;

// TODO: Figure out a way to send headers in .start
casper.start('http://google.com');

// 0. Ask Alfred for today's orders
casper.thenOpen(alfredGetOrdersUrl, { headers: { token: private.slackSecret } }).then(function() {
  orders = JSON.parse(this.getPageContent());
  if (orders.items.length === 0) {
    console.log("No orders!");
    this.exit();
  }
  casper.thenOpen(url);
});

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
  this.fill('form#pageForm', {'time': '5:15 PM'}, true);
}, timeoutFunction, timeout);

// 3. Select Little Delhi
casper.waitForSelector('table#resultstable', function() {
  console.log("Step2: Results table loaded");
  this.clickLabel('Little Delhi', 'a');
}, timeoutFunction, timeout);

// 4. Add items
casper.waitForSelector('div#PopularList', function() {
  console.log("Step3: Little Delhi loaded");
  clickOrders(orders.items, 0);
}, timeoutFunction, timeout);

// 5. Confirm items
casper.on('items.added', function() {
  console.log('Proceeding to checkout');
  this.clickLabel('Proceed to Checkout', 'a');
});

// 6. Add people to order
casper.waitForSelector('div#submit_order_div', function() {
  if (orders.users !== [])
    addPeople(orders.users, 0);
  else
    this.emit('people.added');
}, timeoutFunction, timeout);

// 7. Go paperless and submit order
casper.on('people.added', function() {
  console.log('Going Paperless');
  this.clickLabel('Do not include plastic utensils, napkins, etc.', 'label');

  console.log('Putting in phone number');
  this.sendKeys('input#phoneNumber', orders.number, {reset: true});

  this.wait(1000, function() {
    console.log('Submitting order!');
    this.clickLabel('Submit Order', 'a');
  });
});

// 8. Confirm that order was placed
casper.waitForSelector('div.ThanksForOrder', function() {
  console.log('Order successfully submitted');
  this.open(alfredPostCompletionUrl, { method: 'POST', data: { token: private.slackSecret , success: true } }).then(function() {this.exit});
}, timeoutFunction, timeout);

// 9. If something happened and it didn't succeed, show failure
//
// TODO: fix this, it seems to trigger every time, even after the order
//   is successfully submitted. The .exit is not doing what I think it
//   should be doing or Casper is appending the exit to the back of this
//   wait.
//casper.wait(timeout, function() {
//  console.log('Order was unsuccessful');
//  this.open(alfredPostCompletionUrl, { method: 'POST', data: { token: private.slackSecret , success: false } }).then(function() {this.exit});
//});

casper.run();

// Add one person every 5 seconds
function addPeople(people, i) {
  var first = people[i][0];
  var last = people[i][1];

  casper.clickLabel('Add Another User');
  casper.sendKeys('input#FirstName', first);
  casper.sendKeys('input#LastName', last);
  casper.clickLabel('Verify', 'a');

  casper.wait(5000, function() {
    console.log(first + ' ' + last + ' added!');
    if (++i < people.length)
      addPeople(people, i);
    else
      casper.emit('people.added');
  });
}

// Add an item every 4 seconds
function clickOrders(items, i) {
  var item = Object.keys(items[i])[0];
  casper.clickLabel(item, 'a');

  casper.waitForSelector('form#orderAttributes', function() {
    console.log("Step4: " + item + " loaded");

    if (items[i][item].spice !== undefined)
      this.clickLabel(items[i][item].spice, 'label');
    this.wait(3000, function() {
      this.clickLabel('Add Item to Your Order', 'a');
    });

    // wait for modal to close
    this.wait(5000, function() {
      console.log(item + " added");
      if (++i < items.length)
        clickOrders(items, i);
      else
        this.emit('items.added');
    });

  }, timeoutFunction, timeout);
}
