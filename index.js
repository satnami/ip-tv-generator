const express = require('express')
const request = require('request')
const async = require('async')
const app = express()
const port = process.env.PORT || '3000'

const countries = ['ae', 'kw', 'ps', 'bh', 'eg', 'iq', 'jo', 'lb', 'qa', 'sa', 'sy', 'tr']
function callback(error, response, body, cb) {
  if(error || response.statusCode != 200)
    return cb(true);

  cb(null, body);
}

let tasks = {};
countries.forEach(function(country){
  tasks[country] = function (cb) {
    request({url: "https://raw.githubusercontent.com/iptv-org/iptv/master/channels/"+country+".m3u"}, function (error, response, body) {

      callback(error, response, body.split('\n'), cb);
    });
  }
})


app.get('/', (req, res) => {
  // res.json({1:2})
  async.parallel(tasks, function (err, resp) {
    if(err) {
      return;
    }
  
    let data = []
    Object.values(resp).forEach(function (value) {
      data = data.concat(value);
    });

    res.setHeader('Content-Type', 'text/plain');
    res.send(data.join("\n"));
  });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})