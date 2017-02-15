var sendMessage = function (app) {


  app.post('/sendMessage', function (req, res, next) {
    console.log(req.body);
    res.sendResult("ok");
  });
};

module.exports = sendMessage;