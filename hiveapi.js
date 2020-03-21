function HiveApi() {
    var hive = require('steem');
    hive.api.setOptions({ url: 'https://api.openhive.network/', useAppbaseApi: true});
    return hive
}
module.exports = HiveApi;