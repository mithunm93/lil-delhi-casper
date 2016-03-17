var request = require('request');
var express = require('express');
var private = require("./private");

// Have to visit the login page first for the cookies
request = request.defaults({jar: true});
request("https://www.seamless.com/corporate/login", function(error, response, body) {
  if(!error && response.statusCode == 200) {
    var options = {
      uri: "https://www.seamless.com/food-delivery/login.m",
      headers: {
      //  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      //  "Accept-Encoding": "gzip, deflate",
      //  "Accept-Language": "en-US,en;q=0.8",
      //  "Cache-Control": "max-age=0",
      //  "Connection": "keep-alive",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36",
      //  "Referer": "https://www.seamless.com/corporate/login/",
      //  "Upgrade-Insecure-Requests": 1,
      },
      form: { "ReturnUrl" : "/", "username": private.username, "password": private.password }
    }
    request.post(options, function(error, response, body) {
      if (!error) {
        request("https://www.seamless.com/SubmitLogin.m", function(error, response, body) {
          console.log(response);
        })
      }
    });
  }
});
