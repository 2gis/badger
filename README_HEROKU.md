# Badger [![Build Status](https://travis-ci.org/2gis/badger.svg?branch=master)](https://travis-ci.org/2gis/badger)

Badger - an open-source tool for monitoring product quality.

Features:
- simple tests execution
- collecting test results from different sources
- the aggregation of results
- beautiful graphics


# Installation

### <a href="README.md">Development version</a> | Deploy to Heroku

Clone repository:
```bash
   git clone https://github.com/2gis/badger.git
   cd badger
```

Create an app on Heroku:
```bash
heroku create appname
```

Configure you app:
```bash
heroku config:set FRONTEND_URL=appname.herokuapp.com
heroku config:set BACKEND_URL=your-api-instance.herokuapp.com/api/
```

Deploy app:
```bash
git push heroku master
```

Start processes:
```bash
heroku ps:scale web=1
```
