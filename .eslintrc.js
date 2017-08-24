module.exports = {
    "extends": ["eslint:recommended"],
    "plugins": [],
    "parserOptions": {},
    "env": {
        "browser": false,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "globals": {},
    "rules":{
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-console":0
    }
}
