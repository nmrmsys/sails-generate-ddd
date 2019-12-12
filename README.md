sails-generate-ddd
====
Sails.js generator to use data-domain-driver

## Installation
```
$ npm install sails-generate-ddd
```

## .sailsrc
```
{
  "hooks": {
    "orm": false,
    "pubsub": false
  },
  "generators": {
    "modules": {
      "new": "sails-generate-ddd"
    }
  }
}
```

## Usage
On the command line
```
$ sails new <project name>
```

## Licence

[MIT](http://opensource.org/licenses/mit-license.php)

## Author

[nmrmsys](https://github.com/nmrmsys)