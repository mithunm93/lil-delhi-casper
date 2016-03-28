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
var orders;

// Ask Alfred for today's orders
casper.start('http://localhost:3000/get_orders').then(function() {
  debugger;
  orders = JSON.parse(this.getPageContent());
  //casper.thenOpen(url);
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
  this.fill('form#pageForm', {'time': '5:45 PM'}, true);
}, timeoutFunction, timeout);

// 3. Select Little Delhi
casper.waitForSelector('table#resultstable', function() {
  console.log("Step2: Results table loaded");
  this.clickLabel('Little Delhi', 'a');
}, timeoutFunction, timeout);

//4. Add items
casper.waitForSelector('div#PopularList', function() {
  console.log("Step3: Little Delhi loaded");
  clickOrders(orders.items, 0);
}, timeoutFunction, timeout);

//5. Confirm items
casper.on('items.added', function() {
  console.log('Proceeding to checkout');
  casper.clickLabel('Proceed to Checkout', 'a');
});

casper.waitForSelector('div#EcoFriendly', function() {
  // TODO: what happens on order price too high? -> popup
  // TODO: need to add people
  // TODO: check if people names are verifiable
  // TODO: Ensure min price is hit

  console.log('Going Paperless');
  this.clickLabel('Do not include plastic utensils, napkins, etc.', 'label');

  this.wait(1000, function() {
    console.log('Submitting order!');
    this.clickLabel('Submit Order', 'a');
  });
});

casper.run();

function clickOrders(items, i) {
  var item = Object.keys(items[i])[0];
  casper.clickLabel(item, 'a');

  casper.waitForSelector('form#orderAttributes', function() {
    console.log("Step4: " + item + " loaded");

    if (items[i][item].spice !== undefined)
      this.clickLabel(items[i][item].spice, 'label');
    this.wait(1000, function() {
      this.clickLabel('Add Item to Your Order', 'a');
    });

    // wait for modal to close
    this.wait(3000, function() {
      if (++i < items.length)
        clickOrders(items, i);
      else
        this.emit('items.added');
    });

  }, timeoutFunction, timeout);
}
