'use strict';

const {handle} = require('./utils');

const sendPhoto = (app, telegramServer, upload) => {
  app.post('/bot:token/sendPhoto', upload.any(), (req, res, unusedNext) => {
    const botToken = req.params.token;
    const body = { ...req.body, photo: req.files.map(f => ({ file_id: f.originalname })) };
    telegramServer.addBotMessage(body, botToken);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendPhoto;
