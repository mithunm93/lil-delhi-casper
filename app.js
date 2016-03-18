var request = require('request');
var express = require('express');
var $ = require('cheerio');
var private = require("./private");

//  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
//  "Accept-Encoding": "gzip, deflate",
//  "Accept-Language": "en-US,en;q=0.8",
//  "Cache-Control": "max-age=0",
//  "Connection": "keep-alive",
//  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36",
//  "Referer": "https://www.seamless.com/corporate/login/",
//  "Upgrade-Insecure-Requests": 1,

var userAgent = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36" };

// 1. Have to visit the login page first for the cookies
request = request.defaults({jar: true});
request("https://www.seamless.com/corporate/login", function(error, response, body) {
  if(!error && response.statusCode == 200) {
    var options = {
      uri: "https://www.seamless.com/food-delivery/login.m",
      headers: userAgent,
      form: { "ReturnUrl" : "/", "username": private.username, "password": private.password }
    }
    // 2. Log into seamless account
    request.post(options, function(error, response, body) {
      if (!error) {
        request({ uri: "https://www.seamless.com/SubmitLogin.m", headers: userAgent },  function (error, response, body) {
          console.log("Logged in as: " + private.username);
          if (!error) {
            var options = {
              uri: "https://www.seamless.com/UpdateMeals.m",
              headers: { "User-Agent": userAgent },
              form: {
                "subVendeorId": 1,
                "allowPickupOrder": "Y",
                "allowPickupOrderLineOfCredit": "Y",
                "allowPickupOrderPersonal": "Y",
                "deliveryType": "D",
                "mealsLineOfCredit": "Y",
                "vendorTypeForPaymentOptions": 1,
                "whoPays": "firmPays",
                "deliveryDate": "3/17/2016",
                "time": "5:45 PM",
                //TimeDropDownData:ASAP
                "deliveryMethod": "Delivery",
                //InfoPopupfavorite_orderId:
              }
            }
            request.post(options, function(error, response, body) {
              if (!error) {
                request({ uri: "https://www.seamless.com/MealsVendorSelection.m", headers: userAgent, qs: {
                  AjaxSupport:"Yes",
                  cssClass:"OrderStep1",
                  styleSheet:"./css/v20.css",
                  vendorType:1
                } },  function (error, response, body) {
                  console.log("onto step 1!");
                  request({ uri: "https://www.seamless.com/UpdateMemberMealsStep2.m", headers: {
                    //Referer: "https://www.seamless.com/MealsVendorSelection.m?AjaxSupport=Yes&cssClass=OrderStep1&styleSheet=.%2fcss%2fv20.css&vendorType=1",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36"
                  }, qs: {
                    venderLocationId: 16960,
                 }}, function (error, response, body) {
                    console.log("chose Little Delhi");
                  });
                });
              }
            });
           // request({ uri: "https://www.seamless.com/UpdateMemberMealsStep2.m", headers: userAgent, form: {"vendorLocationId":16960} }, function (error, response, body) {
           //   console.log("chose lil delhi");
           // });
          }
        });
      }
    });
  }
});
