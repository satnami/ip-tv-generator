const express = require('express')
const request = require('request')
const async = require('async')
const app = express()

const cache_ttl = process.env.CACHE_TTL || 3600
const port = process.env.PORT || '3000'
const redis_url = process.env.REDIS_URL || 'redis://localhost:6379'
const countries = ['ae', 'kw', 'ps', 'bh', 'eg', 'lb', 'qa', 'sa', 'sy']

const cache = require('express-redis-cache')({
  client: require('redis').createClient(redis_url)
})

function callback(error, response, body, cb) {
  if (error || response.statusCode != 200)
    return cb(true);

  cb(null, body);
}

let tasks = {};
countries.forEach(function (country) {
  tasks[country] = function (cb) {
    request({
      url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/' + country + '.m3u'
    }, function (error, response, body) {

      callback(error, response, body.split('\n'), cb);
    });
  }
})


app.get('/', cache.route({ expire: cache_ttl }), (req, res) => {
  async.parallel(tasks, function (err, resp) {
    if (err) {
      res.send("");
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
  console.log('Starting App')
})
