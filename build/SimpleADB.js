'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SimpleADB = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _commandExists = require('command-exists');

var _commandExists2 = _interopRequireDefault(_commandExists);

var _detect = require('async/detect');

var _detect2 = _interopRequireDefault(_detect);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var potentialCommands = ['adb', '/usr/local/android/android-sdk-linux/platform-tools/adb', '/usr/local/android-sdk/tools/adb', '/usr/local/android/platform-tools/adb', '/bin/adb'];

var timeoutMs = 5000;
var defaultAdbPort = 5555;

/**
 * @class SimpleADB
 */

var SimpleADB = exports.SimpleADB = function () {

    /**
     *
     * @constructor
     *
     * @param {bunyan} [opts.logger]
     * @param {string} [opts.logLevel]
     *
     * @public
     */
    function SimpleADB(opts) {
        _classCallCheck(this, SimpleADB);

        opts = opts || {};

        this.logger = opts.logger || _bunyan2.default.createLogger({
            name: 'SimpleADB',
            stream: process.stdout,
            level: opts.logLevel || 'info'
        });

        this.adbDevice = '';

        if (opts.path) {
            potentialCommands.push(opts.path);
        }
    }

    /**
     * Method to get what the command is for adb as it can vary!
     *
     * @method fetchAdbCommand
     *
     * @return {Promise}
     *
     * @private
     *
     * @async
     */


    _createClass(SimpleADB, [{
        key: 'fetchAdbCommand',
        value: function fetchAdbCommand() {
            return new _bluebird2.default(function (resolve, reject) {
                (0, _detect2.default)(potentialCommands, function (v, cb) {
                    (0, _commandExists2.default)(v, function (err, result) {
                        if (err) {
                            return cb(err);
                        }

                        return cb(null, result);
                    });
                }, function (err, result) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(result);
                });
            });
        }

        /**
         * @method connect
         *
         * @param {string} ipAddress
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'connect',
        value: function connect(ipAddress) {
            this.adbDevice = ipAddress + ':' + defaultAdbPort;

            return this.execAdbCommand(['connect', ipAddress]);
        }

        /**
         * @method disconnect
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'disconnect',
        value: function disconnect() {
            return this.execAdbCommand(['disconnect']);
        }

        /**
         *
         * @method startApp
         *
         * @param {string} packageName
         * @param {string} launchName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'startApp',
        value: function startApp(packageName, launchName) {
            var appName = packageName + '/' + launchName;

            this.logger.info('Starting App: ' + appName);

            return this.execAdbShellCommand(['am', 'start', appName]);
        }

        /**
         * Method to start an app when you do not know the launch name
         *
         * @method startAppByPackageName
         *
         * @param {String} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'startAppByPackageName',
        value: function startAppByPackageName(packageName) {
            this.logger.info('Starting App by packagename: ' + packageName);

            return this.execAdbShellCommand(['monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1;']);
        }

        /**
         * @method forceStopApp
         *
         * @param {string} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'forceStopApp',
        value: function forceStopApp(packageName) {
            this.logger.info('Force stopping: ' + packageName);
            return this.execAdbShellCommand(['am', 'force-stop', packageName]);
        }

        /**
         * Method to restart an app
         *
         * @method restartApp
         *
         * @param {string} packageName
         * @param {string} launchName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'restartApp',
        value: function restartApp(packageName, launchName) {
            var self = this;

            this.logger.info('Restarting App: ' + packageName + '/' + launchName);

            return self.forceStopApp(packageName).then(function () {
                return self.startApp(packageName, launchName);
            });
        }

        /**
         * @method reboot
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'reboot',
        value: function reboot() {
            var self = this;
            this.logger.info('Rebooting');

            return new _bluebird2.default(function (resolve) {
                self.execAdbCommand(['reboot']);

                return setTimeout(resolve, 1000 * 30);
            });
        }

        /**
         * @method shutdown
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'shutdown',
        value: function shutdown() {
            this.logger.info('Shutting down');
            return this.execShellAdbCommand(['input', 'keyevent', 'KEYCODE_POWER']);
        }

        /**
         * copy file from android device to local machien
         *
         * @method pull
         *
         * @param {String} filePath
         * @param {String} to
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'pull',
        value: function pull(filePath, to) {
            this.logger.info('Copying file from "' + filePath + '" on device to "' + to + '"');
            return this.execAdbCommand(['pull', filePath, to]);
        }

        /**
         * copy file from local machine to android device
         *
         * @method push
         *
         * @param {String} filePath
         * @param {String} to
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'push',
        value: function push(filePath, to) {
            this.logger.info('Copying file from "' + filePath + '" to "' + to + '" on device');
            return this.execAdbCommand(['push', filePath, to]);
        }

        /**
         * @method ls
         *
         * @return {Promise}
         *
         * TODO:
         *
         * @public
         */

    }, {
        key: 'ls',
        value: function ls(dir) {
            this.logger.info('ls for dir: ' + dir);
            return this.execAdbShellCommandAndCaptureOutput(['ls', dir]);
        }

        /**
         * @method captureScreenshot
         *
         * @param {String} to
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'captureScreenshot',
        value: function captureScreenshot(to) {
            var self = this;
            to = to || _os2.default.homedir() + 'screenshot.png';

            var fileName = to.split('/').pop();

            this.logger.info('taking a screenshot');
            return this.execAdbShellCommand(['screencap', '-p', '/sdcard/' + fileName]).then(function () {
                return self.pull('/sdcard/' + fileName, to.substring(0, to.lastIndexOf("/")) + '/');
            }).then(function () {
                return self.rm('/sdcard/' + fileName);
            });
        }

        /**
         * Method to delete a folder and it's contents from the connected device
         *
         * @method rmDir
         *
         * @param folderPath String
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'rmDir',
        value: function rmDir(folderPath) {
            this.logger.info('deleting folder on device: ' + folderPath);
            return this.execAdbShellCommand(['rm', '-Rf', folderPath]);
        }

        /**
         * Method to delete a file from the connected device
         *
         * @method rm
         *
         * @param filePath String
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'rm',
        value: function rm(filePath) {
            this.logger.info('deleting file on device: ' + filePath);
            return this.execAdbShellCommand(['rm', '-f', filePath]);
        }

        /**
         * Method to move a file or folder
         *
         * @method mv
         *
         * @param {String} from - path from
         * @param {String} to - path to
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'mv',
        value: function mv(from, to) {
            this.logger.info('moving: ' + from + 'to: ' + to);
            return this.execAdbShellCommand(['mv', from, to]);
        }

        /**
         * Method to change owner of a file or folder
         *
         * @method chown
         *
         * @param {String} path - path of file or folder
         * @param {String} user - user that will own the file or folder
         * @param {Boolean} opts.recursive - set to true if operation should be performed recursively
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'chown',
        value: function chown(path, user, group, opts) {
            opts = opts || {
                recursive: true,
                busybox: true
            };

            var args = [];

            if (opts.busybox) {
                args.push('busybox');
            }

            args.push('chown');

            if (opts.recursive === true) {
                args.push('-R');
            }

            args.push(user + ':' + group);
            args.push(path);

            return this.execAdbShellCommand(args);
        }

        /**
         * Method to does an ls -la on the data folder for the given application
         *
         * @method fetchApplicationDataFolderInfo
         *
         * @param {String} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'fetchApplicationDataFolderInfo',
        value: function fetchApplicationDataFolderInfo(packageName) {
            return this.execAdbShellCommandAndCaptureOutput(['busybox', 'ls', '-l', '-n', '/data/data/', '|', 'grep', '"' + packageName + '"']);
        }

        /**
         * Method to find the user that represents an application
         *
         * @method fetchApplicationUser
         *
         * @param {String} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'fetchApplicationUser',
        value: function fetchApplicationUser(packageName) {
            var appUserIndex = 2;

            return this.fetchApplicationDataFolderInfo(packageName).then(function (result) {
                return _lodash2.default.compact(result[0].split(' '))[appUserIndex];
            });
        }

        /**
         * Method to find the group that represents an application
         *
         * @method fetchApplicationGroup
         *
         * @param {String} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'fetchApplicationGroup',
        value: function fetchApplicationGroup(packageName) {
            var appGroupIndex = 3;

            return this.fetchApplicationDataFolderInfo(packageName).then(function (result) {
                return _lodash2.default.compact(result[0].split(' '))[appGroupIndex];
            });
        }

        /**
         * Method to check if a package is installed
         *
         * @method isInstalled
         *
         * @param {String} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'isInstalled',
        value: function isInstalled(packageName) {
            return this.fetchInstalledPackageNames().then(function (installedApps) {
                installedApps = installedApps || [];

                return _lodash2.default.map(installedApps, function (v) {
                    return v.split(':').pop();
                });
            }).then(function (installedApps) {
                return installedApps.indexOf(packageName) >= 0;
            });
        }

        /**
         * Method that resolve when isInstalled becomes true
         *
         * @method resolveWhenInstalled
         *
         * @param {String} packageName
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'resolveWhenInstalled',
        value: function resolveWhenInstalled(packageName) {
            var self = this,
                retries = 0,
                maxRetries = 60,
                pid = null,
                wait = 5 * 1000;

            return new _bluebird2.default(function (resolve, reject) {

                var isInstalledCheck = function isInstalledCheck() {
                    if (pid !== null) {
                        clearTimeout(pid);
                    }

                    self.isInstalled(packageName).then(function (isInstalled) {
                        if (isInstalled === true) {
                            return resolve();
                        }

                        if (retries >= maxRetries) {
                            return reject(new Error('Hit max reties on wait for package name to appear'));
                        }

                        pid = setTimeout(isInstalledCheck, wait);
                    });
                };

                isInstalledCheck();
            });
        }

        /**
         * Method to install an app from a locally store apk file
         *
         * @method install
         *
         * @param {String} localFile - full path to local file to copy and install
         * @param {String} devicePath - path of where to copy the file to before installing
         * @param {String} packageName - packageName of the application
         * @param {String} launchName - launchName for the application
         *
         * @return {Promise}
         *
         * @public
         *
         * @async
         */

    }, {
        key: 'install',
        value: function install(localFile, devicePath, packageName, launchName) {
            var self = this;

            return self.push(localFile, devicePath).then(function () {
                return self.forceStopApp(packageName);
            }).then(function () {
                return self.execAdbShellCommand(['pm', 'install', '-r', devicePath + localFile.split('/').pop()]);
            }).then(function () {
                if (launchName) {
                    return self.startApp(packageName, launchName);
                } else {
                    return _bluebird2.default.resolve();
                }
            });
        }

        /**
         * Method to uninstall an app
         *
         * @method uninstall
         *
         * @param {String} packageName - packageName of the application
         * @param {Boolean} cleanUp - remove cached data too
         *
         * @return {Promise}
         *
         * @public
         *
         * @async
         */

    }, {
        key: 'uninstall',
        value: function uninstall(packageName, cleanUp) {
            var self = this,
                args = ['pm', 'uninstall'];

            cleanUp = cleanUp || false;

            if (cleanUp !== true) {
                args.push('-k');
            }

            args.push(packageName);

            return self.forceStopApp(packageName).then(function () {
                return self.execAdbShellCommand(args);
            });
        }

        /**
         * Method to upgrade an app
         *
         * @method upgrade
         *
         * @param {String} localFile - full path to local file to copy and install
         * @param {String} devicePath - path of where to copy the file to before installing
         * @param {String} packageName - packageName of the application
         * @param {String} launchName - launchName for the application
         *
         * @return {Promise}
         *
         * @public
         *
         * @async
         */

    }, {
        key: 'upgrade',
        value: function upgrade(localFile, devicePath, packageName, launchName) {
            var self = this;

            return self.uninstall(packageName, false).then(self.install.bind(self, localFile, devicePath, packageName, launchName));
        }

        /**
         *
         * Method to fetch a list of all installed packages names on the device
         *
         * @method fetchInstalledPackageNames
         *
         * @param {Object} opts
         *
         *
         * @return {Promise}
         *
         * @public
         *
         * @async
         */

    }, {
        key: 'fetchInstalledPackageNames',
        value: function fetchInstalledPackageNames(opts) {
            var args = ['pm', 'list', 'packages'],
                defaults = {
                'systemOnly': false,
                'thirdPartyOnly': true,
                'paths': false,
                'allDisabled': false,
                'allEnabled': false
            },
                flags = {
                'systemOnly': '-s',
                'thirdPartyOnly': '-3',
                'paths': '-f',
                'allDisabled': '-d',
                'allEnabled': '-e'
            };

            opts = _lodash2.default.assign(defaults, opts || {});

            _lodash2.default.forEach(opts, function (v, k) {
                if (v === true) {
                    args.push(flags[k]);
                }
            });

            return this.execAdbShellCommandAndCaptureOutput(args).then(_lodash2.default.compact);
        }

        /**
         * Method to get the resolution of the android device
         *
         * @method fetchResolution
         *
         * @return {Promise}
         *
         * @public
         *
         * @async
         */

    }, {
        key: 'fetchResolution',
        value: function fetchResolution() {
            return this.execAdbShellCommandAndCaptureOutput(['cat', '/sys/class/display/display0.HDMI/mode']).then(function (result) {
                return _lodash2.default.isArray(result) ? result.pop() : result;
            });
        }

        /**
         * @method execAdbShellCommand
         *
         * @param args Array
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'execAdbShellCommand',
        value: function execAdbShellCommand(args) {
            return this.execAdbCommand(['shell'].concat(args));
        }

        /**
         * @method execAdbShellCommandAndCaptureOutput
         *
         * @param args Array
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'execAdbShellCommandAndCaptureOutput',
        value: function execAdbShellCommandAndCaptureOutput(args) {
            return this.execAdbCommandAndCaptureOutput(['shell'].concat(args));
        }

        /**
         *
         * @method execAdbCommand
         *
         * @param {Array} [args]
         *
         * @return {Promise}
         *
         * @public
         */

    }, {
        key: 'execAdbCommandAndCaptureOutput',
        value: function execAdbCommandAndCaptureOutput(args) {
            var self = this;

            return new _bluebird2.default(function (resolve, reject) {
                var _this = this;

                self.fetchAdbCommand().then(function (cmd) {
                    var deviceArgs = _this.getDeviceArgs(args);
                    var result = [];
                    var proc = _child_process2.default.spawn(cmd, deviceArgs);

                    proc.stdout.on('data', function (data) {
                        data = data.toString().split('\n');

                        //remove blank lines
                        result = _lodash2.default.reject(result.concat(data), function (v) {
                            return v === '';
                        });

                        //remove \n at the end of lines
                        result = _lodash2.default.map(result, function (v) {
                            return v.trim('\n');
                        });
                    });

                    proc.on('close', function (code) {
                        if (parseInt(code) !== 0) {
                            self.logger.error('ADB command `adb ' + deviceArgs.join(' ') + '` exited with code:' + code);
                        }

                        return parseInt(code) === 0 ? resolve(result) : reject();
                    });
                }).timeout(timeoutMs).catch(_bluebird2.default.TimeoutError, function (e) {
                    console.log('could not execute within ' + timeoutMs);
                });
            });
        }
    }, {
        key: 'execAdbCommand',


        /**
         *
         * @method execAdbCommand
         *
         * @param {Array} [args]
         *
         * @return {Promise}
         *
         * @public
         */
        value: function execAdbCommand(args) {
            var self = this;

            return new _bluebird2.default(function (resolve, reject) {
                var _this2 = this;

                self.fetchAdbCommand().then(function (cmd) {
                    var deviceArgs = _this2.getDeviceArgs(args);
                    var proc = _child_process2.default.spawn(cmd, deviceArgs);

                    proc.on('close', function (code) {

                        if (parseInt(code) !== 0) {
                            self.logger.error('ADB command `adb ' + deviceArgs.join(' ') + '` exited with code:' + code);
                        }

                        return parseInt(code) === 0 ? resolve() : reject();
                    });
                }).timeout(timeoutMs).catch(_bluebird2.default.TimeoutError, function (e) {
                    console.log('could not execute within ' + timeoutMs);
                });
            });
        }
    }, {
        key: 'execAdbCommand',


        /**
         *
         * @method getDeviceArgs
         *
         * @param {Array} [args]
         *
         * @return {Array}
         *
         * @public
         */
        value: function execAdbCommand(args) {
            return ['-s', this.adbDevice].concat(_toConsumableArray(args));
        }
    }]);

    return SimpleADB;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNpbXBsZUFEQi5lczYiXSwibmFtZXMiOlsicG90ZW50aWFsQ29tbWFuZHMiLCJ0aW1lb3V0TXMiLCJkZWZhdWx0QWRiUG9ydCIsIlNpbXBsZUFEQiIsIm9wdHMiLCJsb2dnZXIiLCJjcmVhdGVMb2dnZXIiLCJuYW1lIiwic3RyZWFtIiwicHJvY2VzcyIsInN0ZG91dCIsImxldmVsIiwibG9nTGV2ZWwiLCJhZGJEZXZpY2UiLCJwYXRoIiwicHVzaCIsInJlc29sdmUiLCJyZWplY3QiLCJ2IiwiY2IiLCJlcnIiLCJyZXN1bHQiLCJpcEFkZHJlc3MiLCJleGVjQWRiQ29tbWFuZCIsInBhY2thZ2VOYW1lIiwibGF1bmNoTmFtZSIsImFwcE5hbWUiLCJpbmZvIiwiZXhlY0FkYlNoZWxsQ29tbWFuZCIsInNlbGYiLCJmb3JjZVN0b3BBcHAiLCJ0aGVuIiwic3RhcnRBcHAiLCJzZXRUaW1lb3V0IiwiZXhlY1NoZWxsQWRiQ29tbWFuZCIsImZpbGVQYXRoIiwidG8iLCJkaXIiLCJleGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCIsImhvbWVkaXIiLCJmaWxlTmFtZSIsInNwbGl0IiwicG9wIiwicHVsbCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwicm0iLCJmb2xkZXJQYXRoIiwiZnJvbSIsInVzZXIiLCJncm91cCIsInJlY3Vyc2l2ZSIsImJ1c3lib3giLCJhcmdzIiwiYXBwVXNlckluZGV4IiwiZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvIiwiY29tcGFjdCIsImFwcEdyb3VwSW5kZXgiLCJmZXRjaEluc3RhbGxlZFBhY2thZ2VOYW1lcyIsImluc3RhbGxlZEFwcHMiLCJtYXAiLCJpbmRleE9mIiwicmV0cmllcyIsIm1heFJldHJpZXMiLCJwaWQiLCJ3YWl0IiwiaXNJbnN0YWxsZWRDaGVjayIsImNsZWFyVGltZW91dCIsImlzSW5zdGFsbGVkIiwiRXJyb3IiLCJsb2NhbEZpbGUiLCJkZXZpY2VQYXRoIiwiY2xlYW5VcCIsInVuaW5zdGFsbCIsImluc3RhbGwiLCJiaW5kIiwiZGVmYXVsdHMiLCJmbGFncyIsImFzc2lnbiIsImZvckVhY2giLCJrIiwiaXNBcnJheSIsImNvbmNhdCIsImV4ZWNBZGJDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCIsImZldGNoQWRiQ29tbWFuZCIsImRldmljZUFyZ3MiLCJnZXREZXZpY2VBcmdzIiwicHJvYyIsInNwYXduIiwiY21kIiwib24iLCJkYXRhIiwidG9TdHJpbmciLCJ0cmltIiwicGFyc2VJbnQiLCJjb2RlIiwiZXJyb3IiLCJqb2luIiwidGltZW91dCIsImNhdGNoIiwiVGltZW91dEVycm9yIiwiZSIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OztBQUVBLElBQUlBLG9CQUFvQixDQUNwQixLQURvQixFQUVwQix5REFGb0IsRUFHcEIsa0NBSG9CLEVBSXBCLHVDQUpvQixFQUtwQixVQUxvQixDQUF4Qjs7QUFRQSxJQUFNQyxZQUFZLElBQWxCO0FBQ0EsSUFBTUMsaUJBQWlCLElBQXZCOztBQUVBOzs7O0lBR2FDLFMsV0FBQUEsUzs7QUFFVDs7Ozs7Ozs7O0FBU0EsdUJBQWFDLElBQWIsRUFBbUI7QUFBQTs7QUFDZkEsZUFBT0EsUUFBUSxFQUFmOztBQUVBLGFBQUtDLE1BQUwsR0FBY0QsS0FBS0MsTUFBTCxJQUFlLGlCQUFPQyxZQUFQLENBQW9CO0FBQzdDQyxrQkFBTSxXQUR1QztBQUU3Q0Msb0JBQVFDLFFBQVFDLE1BRjZCO0FBRzdDQyxtQkFBT1AsS0FBS1EsUUFBTCxJQUFpQjtBQUhxQixTQUFwQixDQUE3Qjs7QUFNQSxhQUFLQyxTQUFMLEdBQWlCLEVBQWpCOztBQUVBLFlBQUlULEtBQUtVLElBQVQsRUFBZTtBQUNYZCw4QkFBa0JlLElBQWxCLENBQXVCWCxLQUFLVSxJQUE1QjtBQUNIO0FBRUo7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7OzswQ0FXbUI7QUFD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Q0Esd0JBQUlrQyxPQUFPLHdCQUFhQyxLQUFiLENBQW1CQyxHQUFuQixFQUF3QkosVUFBeEIsQ0FBWDs7QUFFQUUseUJBQUtHLEVBQUwsQ0FBUSxPQUFSLEVBQWlCLFVBQUNLLElBQUQsRUFBVTs7QUFFdkIsNEJBQUlELFNBQVNDLElBQVQsTUFBbUIsQ0FBdkIsRUFBMEI7QUFDdEJsRSxpQ0FBS3hCLE1BQUwsQ0FBWTJGLEtBQVosQ0FBa0Isc0JBQXNCWCxXQUFXWSxJQUFYLENBQWdCLEdBQWhCLENBQXRCLEdBQTZDLHFCQUE3QyxHQUFxRUYsSUFBdkY7QUFDSDs7QUFFRCwrQkFBT0QsU0FBU0MsSUFBVCxNQUFtQixDQUFuQixHQUF1Qi9FLFNBQXZCLEdBQW1DQyxRQUExQztBQUNILHFCQVBEO0FBU0gsaUJBZEwsRUFlS2lGLE9BZkwsQ0FlYWpHLFNBZmIsRUFnQktrRyxLQWhCTCxDQWdCVyxtQkFBUUMsWUFoQm5CLEVBZ0JpQyxVQUFTQyxDQUFULEVBQVk7QUFDckNDLDRCQUFRQyxHQUFSLENBQVksOEJBQThCdEcsU0FBMUM7QUFDSCxpQkFsQkw7QUFvQkgsYUF0Qk0sQ0FBUDtBQXdCSDs7Ozs7QUFFRDs7Ozs7Ozs7Ozt1Q0FVZ0JvRCxJLEVBQU07QUFDbEIsb0JBQVEsSUFBUixFQUFjLEtBQUt4QyxTQUFuQiw0QkFBaUN3QyxJQUFqQztBQUNIIiwiZmlsZSI6IlNpbXBsZUFEQi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGJ1bnlhbiBmcm9tICdidW55YW4nO1xuaW1wb3J0IENoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGNvbW1hbmRFeGlzdHMgZnJvbSAnY29tbWFuZC1leGlzdHMnO1xuaW1wb3J0IGRldGVjdCBmcm9tICdhc3luYy9kZXRlY3QnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5sZXQgcG90ZW50aWFsQ29tbWFuZHMgPSBbXG4gICAgJ2FkYicsXG4gICAgJy91c3IvbG9jYWwvYW5kcm9pZC9hbmRyb2lkLXNkay1saW51eC9wbGF0Zm9ybS10b29scy9hZGInLFxuICAgICcvdXNyL2xvY2FsL2FuZHJvaWQtc2RrL3Rvb2xzL2FkYicsXG4gICAgJy91c3IvbG9jYWwvYW5kcm9pZC9wbGF0Zm9ybS10b29scy9hZGInLFxuICAgICcvYmluL2FkYidcbl07XG5cbmNvbnN0IHRpbWVvdXRNcyA9IDUwMDA7XG5jb25zdCBkZWZhdWx0QWRiUG9ydCA9IDU1NTU7XG5cbi8qKlxuICogQGNsYXNzIFNpbXBsZUFEQlxuICovXG5leHBvcnQgY2xhc3MgU2ltcGxlQURCIHtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2J1bnlhbn0gW29wdHMubG9nZ2VyXVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5sb2dMZXZlbF1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAob3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB0aGlzLmxvZ2dlciA9IG9wdHMubG9nZ2VyIHx8IGJ1bnlhbi5jcmVhdGVMb2dnZXIoe1xuICAgICAgICAgICAgbmFtZTogJ1NpbXBsZUFEQicsXG4gICAgICAgICAgICBzdHJlYW06IHByb2Nlc3Muc3Rkb3V0LFxuICAgICAgICAgICAgbGV2ZWw6IG9wdHMubG9nTGV2ZWwgfHwgJ2luZm8nXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRiRGV2aWNlID0gJyc7XG5cbiAgICAgICAgaWYgKG9wdHMucGF0aCkge1xuICAgICAgICAgICAgcG90ZW50aWFsQ29tbWFuZHMucHVzaChvcHRzLnBhdGgpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZ2V0IHdoYXQgdGhlIGNvbW1hbmQgaXMgZm9yIGFkYiBhcyBpdCBjYW4gdmFyeSFcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmV0Y2hBZGJDb21tYW5kXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBhc3luY1xuICAgICAqL1xuICAgIGZldGNoQWRiQ29tbWFuZCAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZGV0ZWN0KHBvdGVudGlhbENvbW1hbmRzLCAodiwgY2IpID0+IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kRXhpc3RzKHYsIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIH0sIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGNvbm5lY3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpcEFkZHJlc3NcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY29ubmVjdCAoaXBBZGRyZXNzKSB7XG4gICAgICAgIHRoaXMuYWRiRGV2aWNlID0gYCR7IGlwQWRkcmVzcyB9OiR7IGRlZmF1bHRBZGJQb3J0IH1gO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJDb21tYW5kKFsnY29ubmVjdCcsIGlwQWRkcmVzc10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgZGlzY29ubmVjdFxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0ICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYkNvbW1hbmQoWydkaXNjb25uZWN0J10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQG1ldGhvZCBzdGFydEFwcFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxhdW5jaE5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgc3RhcnRBcHAgKHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKSB7XG4gICAgICAgIGxldCBhcHBOYW1lID0gcGFja2FnZU5hbWUgKyAnLycgKyBsYXVuY2hOYW1lO1xuXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1N0YXJ0aW5nIEFwcDogJyArIGFwcE5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoWydhbScsICdzdGFydCcsIGFwcE5hbWVdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gc3RhcnQgYW4gYXBwIHdoZW4geW91IGRvIG5vdCBrbm93IHRoZSBsYXVuY2ggbmFtZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBzdGFydEFwcEJ5UGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBzdGFydEFwcEJ5UGFja2FnZU5hbWUgKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1N0YXJ0aW5nIEFwcCBieSBwYWNrYWdlbmFtZTogJyArIHBhY2thZ2VOYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFtcbiAgICAgICAgICAgICdtb25rZXknLFxuICAgICAgICAgICAgJy1wJyxcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lLFxuICAgICAgICAgICAgJy1jJyxcbiAgICAgICAgICAgICdhbmRyb2lkLmludGVudC5jYXRlZ29yeS5MQVVOQ0hFUicsXG4gICAgICAgICAgICAnMTsnXG4gICAgICAgIF0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBmb3JjZVN0b3BBcHBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBmb3JjZVN0b3BBcHAgKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0ZvcmNlIHN0b3BwaW5nOiAnICsgcGFja2FnZU5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFsnYW0nLCAnZm9yY2Utc3RvcCcsIHBhY2thZ2VOYW1lXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIHJlc3RhcnQgYW4gYXBwXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHJlc3RhcnRBcHBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXVuY2hOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHJlc3RhcnRBcHAgKHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdSZXN0YXJ0aW5nIEFwcDogJyArIHBhY2thZ2VOYW1lICsgJy8nICsgbGF1bmNoTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYuZm9yY2VTdG9wQXBwKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnN0YXJ0QXBwKHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgcmVib290XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHJlYm9vdCAoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnUmVib290aW5nJyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCBmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZXhlY0FkYkNvbW1hbmQoWydyZWJvb3QnXSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwICogMzApO1xuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2Qgc2h1dGRvd25cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgc2h1dGRvd24gKCkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdTaHV0dGluZyBkb3duJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNTaGVsbEFkYkNvbW1hbmQoWydpbnB1dCcsICdrZXlldmVudCcsICdLRVlDT0RFX1BPV0VSJ10pO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogY29weSBmaWxlIGZyb20gYW5kcm9pZCBkZXZpY2UgdG8gbG9jYWwgbWFjaGllblxuICAgICAqXG4gICAgICogQG1ldGhvZCBwdWxsXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmlsZVBhdGhcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdG9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcHVsbCAoZmlsZVBhdGgsIHRvKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0NvcHlpbmcgZmlsZSBmcm9tIFwiJyArIGZpbGVQYXRoICsgJ1wiIG9uIGRldmljZSB0byBcIicgKyB0byArICdcIicgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYkNvbW1hbmQoWydwdWxsJywgZmlsZVBhdGgsIHRvXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY29weSBmaWxlIGZyb20gbG9jYWwgbWFjaGluZSB0byBhbmRyb2lkIGRldmljZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBwdXNoXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmlsZVBhdGhcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdG9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcHVzaCAoZmlsZVBhdGgsIHRvKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0NvcHlpbmcgZmlsZSBmcm9tIFwiJyArIGZpbGVQYXRoICsgJ1wiIHRvIFwiJyArIHRvICsgJ1wiIG9uIGRldmljZScgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYkNvbW1hbmQoWydwdXNoJywgZmlsZVBhdGgsIHRvXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBsc1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIFRPRE86XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgbHMgKGRpcikge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdscyBmb3IgZGlyOiAnICsgZGlyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQoWydscycsIGRpcl0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgY2FwdHVyZVNjcmVlbnNob3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0b1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBjYXB0dXJlU2NyZWVuc2hvdCAodG8pIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICB0byA9IHRvIHx8IG9zLmhvbWVkaXIoKSArICdzY3JlZW5zaG90LnBuZyc7XG5cbiAgICAgICAgbGV0IGZpbGVOYW1lID0gdG8uc3BsaXQoJy8nKS5wb3AoKTtcblxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCd0YWtpbmcgYSBzY3JlZW5zaG90Jyk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoWydzY3JlZW5jYXAnLCAnLXAnLCAnL3NkY2FyZC8nICsgZmlsZU5hbWVdKVxuICAgICAgICAgICAgLnRoZW4oICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wdWxsKCcvc2RjYXJkLycgKyBmaWxlTmFtZSwgdG8uc3Vic3RyaW5nKDAsIHRvLmxhc3RJbmRleE9mKFwiL1wiKSkgKyAnLycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucm0oJy9zZGNhcmQvJyArIGZpbGVOYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBkZWxldGUgYSBmb2xkZXIgYW5kIGl0J3MgY29udGVudHMgZnJvbSB0aGUgY29ubmVjdGVkIGRldmljZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBybURpclxuICAgICAqXG4gICAgICogQHBhcmFtIGZvbGRlclBhdGggU3RyaW5nXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHJtRGlyIChmb2xkZXJQYXRoKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ2RlbGV0aW5nIGZvbGRlciBvbiBkZXZpY2U6ICcgKyBmb2xkZXJQYXRoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbJ3JtJywgJy1SZicsIGZvbGRlclBhdGhdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZGVsZXRlIGEgZmlsZSBmcm9tIHRoZSBjb25uZWN0ZWQgZGV2aWNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHJtXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZmlsZVBhdGggU3RyaW5nXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHJtIChmaWxlUGF0aCkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdkZWxldGluZyBmaWxlIG9uIGRldmljZTogJyArIGZpbGVQYXRoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbJ3JtJywgJy1mJywgZmlsZVBhdGhdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gbW92ZSBhIGZpbGUgb3IgZm9sZGVyXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIG12XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJvbSAtIHBhdGggZnJvbVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0byAtIHBhdGggdG9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgbXYgKGZyb20sIHRvKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ21vdmluZzogJyArIGZyb20gKyAndG86ICcgKyB0byk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoWydtdicsIGZyb20sIHRvXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGNoYW5nZSBvd25lciBvZiBhIGZpbGUgb3IgZm9sZGVyXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGNob3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAtIHBhdGggb2YgZmlsZSBvciBmb2xkZXJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXNlciAtIHVzZXIgdGhhdCB3aWxsIG93biB0aGUgZmlsZSBvciBmb2xkZXJcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdHMucmVjdXJzaXZlIC0gc2V0IHRvIHRydWUgaWYgb3BlcmF0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgcmVjdXJzaXZlbHlcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY2hvd24gKHBhdGgsIHVzZXIsIGdyb3VwLCBvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgIGJ1c3lib3g6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgYXJncyA9IFtdO1xuXG4gICAgICAgIGlmIChvcHRzLmJ1c3lib3gpIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaCgnYnVzeWJveCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncy5wdXNoKCdjaG93bicpO1xuXG5cbiAgICAgICAgaWYgKG9wdHMucmVjdXJzaXZlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2goJy1SJyk7XG4gICAgICAgIH1cblxuICAgICAgICBhcmdzLnB1c2godXNlcisnOicrZ3JvdXApO1xuICAgICAgICBhcmdzLnB1c2gocGF0aCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChhcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZG9lcyBhbiBscyAtbGEgb24gdGhlIGRhdGEgZm9sZGVyIGZvciB0aGUgZ2l2ZW4gYXBwbGljYXRpb25cbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvIChwYWNrYWdlTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dChbJ2J1c3lib3gnLCAnbHMnLCAnLWwnLCAnLW4nLCAnL2RhdGEvZGF0YS8nLCAnfCcsICdncmVwJywgJ1wiJyArIHBhY2thZ2VOYW1lICsgJ1wiJ10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBmaW5kIHRoZSB1c2VyIHRoYXQgcmVwcmVzZW50cyBhbiBhcHBsaWNhdGlvblxuICAgICAqXG4gICAgICogQG1ldGhvZCBmZXRjaEFwcGxpY2F0aW9uVXNlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGZldGNoQXBwbGljYXRpb25Vc2VyIChwYWNrYWdlTmFtZSkge1xuICAgICAgICBsZXQgYXBwVXNlckluZGV4ID0gMjtcblxuICAgICAgICByZXR1cm4gdGhpcy5mZXRjaEFwcGxpY2F0aW9uRGF0YUZvbGRlckluZm8ocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uY29tcGFjdChyZXN1bHRbMF0uc3BsaXQoJyAnKSlbYXBwVXNlckluZGV4XTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBmaW5kIHRoZSBncm91cCB0aGF0IHJlcHJlc2VudHMgYW4gYXBwbGljYXRpb25cbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmV0Y2hBcHBsaWNhdGlvbkdyb3VwXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZmV0Y2hBcHBsaWNhdGlvbkdyb3VwIChwYWNrYWdlTmFtZSkge1xuICAgICAgICBsZXQgYXBwR3JvdXBJbmRleCA9IDM7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLmNvbXBhY3QocmVzdWx0WzBdLnNwbGl0KCcgJykpW2FwcEdyb3VwSW5kZXhdO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGNoZWNrIGlmIGEgcGFja2FnZSBpcyBpbnN0YWxsZWRcbiAgICAgKlxuICAgICAqIEBtZXRob2QgaXNJbnN0YWxsZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBpc0luc3RhbGxlZCAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hJbnN0YWxsZWRQYWNrYWdlTmFtZXMoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uIChpbnN0YWxsZWRBcHBzKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFsbGVkQXBwcyA9IGluc3RhbGxlZEFwcHMgfHwgW107XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gXy5tYXAoaW5zdGFsbGVkQXBwcywgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYuc3BsaXQoJzonKS5wb3AoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKGluc3RhbGxlZEFwcHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFsbGVkQXBwcy5pbmRleE9mKHBhY2thZ2VOYW1lKSA+PSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRoYXQgcmVzb2x2ZSB3aGVuIGlzSW5zdGFsbGVkIGJlY29tZXMgdHJ1ZVxuICAgICAqXG4gICAgICogQG1ldGhvZCByZXNvbHZlV2hlbkluc3RhbGxlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHJlc29sdmVXaGVuSW5zdGFsbGVkIChwYWNrYWdlTmFtZSkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICByZXRyaWVzID0gMCxcbiAgICAgICAgICAgIG1heFJldHJpZXMgPSA2MCxcbiAgICAgICAgICAgIHBpZCA9IG51bGwsXG4gICAgICAgICAgICB3YWl0ID0gNSAqIDEwMDA7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgbGV0IGlzSW5zdGFsbGVkQ2hlY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBpZCAhPT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHBpZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2VsZi5pc0luc3RhbGxlZChwYWNrYWdlTmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oaXNJbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0luc3RhbGxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXRyaWVzID49IG1heFJldHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignSGl0IG1heCByZXRpZXMgb24gd2FpdCBmb3IgcGFja2FnZSBuYW1lIHRvIGFwcGVhcicpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcGlkID0gc2V0VGltZW91dChpc0luc3RhbGxlZENoZWNrLCB3YWl0KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXNJbnN0YWxsZWRDaGVjaygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gaW5zdGFsbCBhbiBhcHAgZnJvbSBhIGxvY2FsbHkgc3RvcmUgYXBrIGZpbGVcbiAgICAgKlxuICAgICAqIEBtZXRob2QgaW5zdGFsbFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGxvY2FsRmlsZSAtIGZ1bGwgcGF0aCB0byBsb2NhbCBmaWxlIHRvIGNvcHkgYW5kIGluc3RhbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGV2aWNlUGF0aCAtIHBhdGggb2Ygd2hlcmUgdG8gY29weSB0aGUgZmlsZSB0byBiZWZvcmUgaW5zdGFsbGluZ1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZSAtIHBhY2thZ2VOYW1lIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBsYXVuY2hOYW1lIC0gbGF1bmNoTmFtZSBmb3IgdGhlIGFwcGxpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQGFzeW5jXG4gICAgICovXG4gICAgaW5zdGFsbChsb2NhbEZpbGUsIGRldmljZVBhdGgsIHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi5wdXNoKGxvY2FsRmlsZSwgZGV2aWNlUGF0aClcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZm9yY2VTdG9wQXBwKHBhY2thZ2VOYW1lKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmV4ZWNBZGJTaGVsbENvbW1hbmQoW1xuICAgICAgICAgICAgICAgICAgICAncG0nLFxuICAgICAgICAgICAgICAgICAgICAnaW5zdGFsbCcsXG4gICAgICAgICAgICAgICAgICAgICctcicsXG4gICAgICAgICAgICAgICAgICAgIGRldmljZVBhdGggKyBsb2NhbEZpbGUuc3BsaXQoJy8nKS5wb3AoKVxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhdW5jaE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuc3RhcnRBcHAocGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gdW5pbnN0YWxsIGFuIGFwcFxuICAgICAqXG4gICAgICogQG1ldGhvZCB1bmluc3RhbGxcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZSAtIHBhY2thZ2VOYW1lIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2xlYW5VcCAtIHJlbW92ZSBjYWNoZWQgZGF0YSB0b29cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAYXN5bmNcbiAgICAgKi9cbiAgICB1bmluc3RhbGwgKHBhY2thZ2VOYW1lLCBjbGVhblVwKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIGFyZ3MgPSBbJ3BtJywgJ3VuaW5zdGFsbCddO1xuXG4gICAgICAgIGNsZWFuVXAgPSBjbGVhblVwIHx8IGZhbHNlO1xuXG4gICAgICAgIGlmIChjbGVhblVwICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2goJy1rJyk7XG4gICAgICAgIH1cblxuICAgICAgICBhcmdzLnB1c2gocGFja2FnZU5hbWUpO1xuXG4gICAgICAgIHJldHVybiBzZWxmLmZvcmNlU3RvcEFwcChwYWNrYWdlTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5leGVjQWRiU2hlbGxDb21tYW5kKGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIHVwZ3JhZGUgYW4gYXBwXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHVwZ3JhZGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBsb2NhbEZpbGUgLSBmdWxsIHBhdGggdG8gbG9jYWwgZmlsZSB0byBjb3B5IGFuZCBpbnN0YWxsXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRldmljZVBhdGggLSBwYXRoIG9mIHdoZXJlIHRvIGNvcHkgdGhlIGZpbGUgdG8gYmVmb3JlIGluc3RhbGxpbmdcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWUgLSBwYWNrYWdlTmFtZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbGF1bmNoTmFtZSAtIGxhdW5jaE5hbWUgZm9yIHRoZSBhcHBsaWNhdGlvblxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBhc3luY1xuICAgICAqL1xuICAgIHVwZ3JhZGUgKGxvY2FsRmlsZSwgZGV2aWNlUGF0aCwgcGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnVuaW5zdGFsbChwYWNrYWdlTmFtZSwgZmFsc2UpXG4gICAgICAgICAgICAudGhlbihzZWxmLmluc3RhbGwuYmluZChzZWxmLCBsb2NhbEZpbGUsIGRldmljZVBhdGgsIHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBNZXRob2QgdG8gZmV0Y2ggYSBsaXN0IG9mIGFsbCBpbnN0YWxsZWQgcGFja2FnZXMgbmFtZXMgb24gdGhlIGRldmljZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBmZXRjaEluc3RhbGxlZFBhY2thZ2VOYW1lc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICAgKlxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBhc3luY1xuICAgICAqL1xuICAgIGZldGNoSW5zdGFsbGVkUGFja2FnZU5hbWVzIChvcHRzKSB7XG4gICAgICAgIGxldCBhcmdzID0gWydwbScsJ2xpc3QnLCdwYWNrYWdlcyddLFxuICAgICAgICAgICAgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAgICAgJ3N5c3RlbU9ubHknOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAndGhpcmRQYXJ0eU9ubHknOiB0cnVlLFxuICAgICAgICAgICAgICAgICdwYXRocyc6IGZhbHNlLFxuICAgICAgICAgICAgICAgICdhbGxEaXNhYmxlZCc6IGZhbHNlLFxuICAgICAgICAgICAgICAgICdhbGxFbmFibGVkJzogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmbGFncyA9IHtcbiAgICAgICAgICAgICAgICAnc3lzdGVtT25seSc6ICctcycsXG4gICAgICAgICAgICAgICAgJ3RoaXJkUGFydHlPbmx5JzogJy0zJyxcbiAgICAgICAgICAgICAgICAncGF0aHMnOiAnLWYnLFxuICAgICAgICAgICAgICAgICdhbGxEaXNhYmxlZCc6ICctZCcsXG4gICAgICAgICAgICAgICAgJ2FsbEVuYWJsZWQnOiAnLWUnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIG9wdHMgPSBfLmFzc2lnbihkZWZhdWx0cywgb3B0cyB8fCB7fSk7XG5cbiAgICAgICAgXy5mb3JFYWNoKG9wdHMsICh2LCBrKSA9PntcbiAgICAgICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGZsYWdzW2tdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQoYXJncylcbiAgICAgICAgICAgIC50aGVuKF8uY29tcGFjdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGdldCB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgYW5kcm9pZCBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmV0Y2hSZXNvbHV0aW9uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQGFzeW5jXG4gICAgICovXG4gICAgZmV0Y2hSZXNvbHV0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQoWydjYXQnLCAnL3N5cy9jbGFzcy9kaXNwbGF5L2Rpc3BsYXkwLkhETUkvbW9kZSddKVxuICAgICAgICAgICAgLnRoZW4oIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKF8uaXNBcnJheShyZXN1bHQpKSA/IHJlc3VsdC5wb3AoKSA6IHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgZXhlY0FkYlNoZWxsQ29tbWFuZFxuICAgICAqXG4gICAgICogQHBhcmFtIGFyZ3MgQXJyYXlcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZXhlY0FkYlNoZWxsQ29tbWFuZChhcmdzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJDb21tYW5kKFsnc2hlbGwnXS5jb25jYXQoYXJncykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgZXhlY0FkYlNoZWxsQ29tbWFuZEFuZENhcHR1cmVPdXRwdXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBhcmdzIEFycmF5XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGV4ZWNBZGJTaGVsbENvbW1hbmRBbmRDYXB0dXJlT3V0cHV0KGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYkNvbW1hbmRBbmRDYXB0dXJlT3V0cHV0KFsnc2hlbGwnXS5jb25jYXQoYXJncykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQG1ldGhvZCBleGVjQWRiQ29tbWFuZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGV4ZWNBZGJDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCAoYXJncykge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgc2VsZi5mZXRjaEFkYkNvbW1hbmQoKVxuICAgICAgICAgICAgICAgIC50aGVuKCBjbWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGV2aWNlQXJncyA9IHRoaXMuZ2V0RGV2aWNlQXJncyhhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCAgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb2MgICAgPSBDaGlsZFByb2Nlc3Muc3Bhd24oY21kLCBkZXZpY2VBcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICBwcm9jLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcoKS5zcGxpdCgnXFxuJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVtb3ZlIGJsYW5rIGxpbmVzXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBfLnJlamVjdChyZXN1bHQuY29uY2F0KGRhdGEpLCB2ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdiA9PT0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9yZW1vdmUgXFxuIGF0IHRoZSBlbmQgb2YgbGluZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IF8ubWFwIChyZXN1bHQsIHYgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2LnRyaW0oJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb2Mub24oJ2Nsb3NlJywgY29kZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VJbnQoY29kZSkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ2dlci5lcnJvcignQURCIGNvbW1hbmQgYGFkYiAnICsgZGV2aWNlQXJncy5qb2luKCcgJykgKyAnYCBleGl0ZWQgd2l0aCBjb2RlOicgKyBjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGNvZGUpID09PSAwID8gcmVzb2x2ZShyZXN1bHQpIDogcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGltZW91dCh0aW1lb3V0TXMpXG4gICAgICAgICAgICAgICAgLmNhdGNoKFByb21pc2UuVGltZW91dEVycm9yLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3VsZCBub3QgZXhlY3V0ZSB3aXRoaW4gJyArIHRpbWVvdXRNcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQG1ldGhvZCBleGVjQWRiQ29tbWFuZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGV4ZWNBZGJDb21tYW5kIChhcmdzKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBzZWxmLmZldGNoQWRiQ29tbWFuZCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oIGNtZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZXZpY2VBcmdzID0gdGhpcy5nZXREZXZpY2VBcmdzKGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvYyA9IENoaWxkUHJvY2Vzcy5zcGF3bihjbWQsIGRldmljZUFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb2Mub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KGNvZGUpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dnZXIuZXJyb3IoJ0FEQiBjb21tYW5kIGBhZGIgJyArIGRldmljZUFyZ3Muam9pbignICcpICsgJ2AgZXhpdGVkIHdpdGggY29kZTonICsgY29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChjb2RlKSA9PT0gMCA/IHJlc29sdmUoKSA6IHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRpbWVvdXQodGltZW91dE1zKVxuICAgICAgICAgICAgICAgIC5jYXRjaChQcm9taXNlLlRpbWVvdXRFcnJvciwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY291bGQgbm90IGV4ZWN1dGUgd2l0aGluICcgKyB0aW1lb3V0TXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQG1ldGhvZCBnZXREZXZpY2VBcmdzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbYXJnc11cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGV4ZWNBZGJDb21tYW5kIChhcmdzKSB7XG4gICAgICAgIHJldHVybiBbJy1zJywgdGhpcy5hZGJEZXZpY2UsIC4uLmFyZ3NdO1xuICAgIH07XG59XG4iXX0=
