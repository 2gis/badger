# Badger [![Build Status](https://travis-ci.org/2gis/badger.svg?branch=master)](https://travis-ci.org/2gis/badger)

Badger - an open-source tool for monitoring product quality.

Features:
- simple tests execution
- collecting test results from different sources
- the aggregation of results
- beautiful graphics


# Installation

### Development version

Clone repository:
```bash
   git clone https://github.com/2gis/badger.git
   cd badger
```

Install [npm] (https://www.npmjs.com/) packages (also you need nodejs-legacy package):
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
