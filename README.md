# Badger [![Build Status](https://travis-ci.org/2gis/badger.svg?branch=master)](https://travis-ci.org/2gis/badger)

Badger - an open-source tool for monitoring product quality.

Features:
- simple tests execution
- collecting test results from different sources
- the aggregation of results
- beautiful graphics

Work with <a href="https://github.com/2gis/badger-api">badger-api</a>.

# Installation

### Development version | <a href="README_HEROKU.md">Deploy to Heroku</a>

Clone repository:
```bash
   git clone https://github.com/2gis/badger.git
   cd badger
```

Install [npm] (https://www.npmjs.com/) packages (also you need nodejs-legacy package):
*don't work with 5.x node currently, please use lts version of [node] (https://nodejs.org/)*
```bash
   npm install
```

Run application:
```bash
   npm run dev
```

Now your web interface is available at http://localhost:5000/

### Testing
*backend is not required*

Dependencies:
- Firefox browser
- Java runtime

Run tests:
```bash
   npm run dev & npm run test
```

### User guide
Your Badger and <a href="https://github.com/2gis/badger-api">Badger-api</a> deployed.
If you want to try them and run tests, follow this <a href="README_GUIDE.md">guide</a>.
