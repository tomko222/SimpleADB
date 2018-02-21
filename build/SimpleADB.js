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
        key: 'getDeviceArgs',


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
        value: function getDeviceArgs(args) {
            return ['-s', this.adbDevice].concat(_toConsumableArray(args));
        }
    }]);

    return SimpleADB;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNpbXBsZUFEQi5lczYiXSwibmFtZXMiOlsicG90ZW50aWFsQ29tbWFuZHMiLCJ0aW1lb3V0TXMiLCJkZWZhdWx0QWRiUG9ydCIsIlNpbXBsZUFEQiIsIm9wdHMiLCJsb2dnZXIiLCJjcmVhdGVMb2dnZXIiLCJuYW1lIiwic3RyZWFtIiwicHJvY2VzcyIsInN0ZG91dCIsImxldmVsIiwibG9nTGV2ZWwiLCJhZGJEZXZpY2UiLCJwYXRoIiwicHVzaCIsInJlc29sdmUiLCJyZWplY3QiLCJ2IiwiY2IiLCJlcnIiLCJyZXN1bHQiLCJpcEFkZHJlc3MiLCJleGVjQWRiQ29tbWFuZCIsInBhY2thZ2VOYW1lIiwibGF1bmNoTmFtZSIsImFwcE5hbWUiLCJpbmZvIiwiZXhlY0FkYlNoZWxsQ29tbWFuZCIsInNlbGYiLCJmb3JjZVN0b3BBcHAiLCJ0aGVuIiwic3RhcnRBcHAiLCJzZXRUaW1lb3V0IiwiZXhlY1NoZWxsQWRiQ29tbWFuZCIsImZpbGVQYXRoIiwidG8iLCJkaXIiLCJleGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCIsImhvbWVkaXIiLCJmaWxlTmFtZSIsInNwbGl0IiwicG9wIiwicHVsbCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwicm0iLCJmb2xkZXJQYXRoIiwiZnJvbSIsInVzZXIiLCJncm91cCIsInJlY3Vyc2l2ZSIsImJ1c3lib3giLCJhcmdzIiwiYXBwVXNlckluZGV4IiwiZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvIiwiY29tcGFjdCIsImFwcEdyb3VwSW5kZXgiLCJmZXRjaEluc3RhbGxlZFBhY2thZ2VOYW1lcyIsImluc3RhbGxlZEFwcHMiLCJtYXAiLCJpbmRleE9mIiwicmV0cmllcyIsIm1heFJldHJpZXMiLCJwaWQiLCJ3YWl0IiwiaXNJbnN0YWxsZWRDaGVjayIsImNsZWFyVGltZW91dCIsImlzSW5zdGFsbGVkIiwiRXJyb3IiLCJsb2NhbEZpbGUiLCJkZXZpY2VQYXRoIiwiY2xlYW5VcCIsInVuaW5zdGFsbCIsImluc3RhbGwiLCJiaW5kIiwiZGVmYXVsdHMiLCJmbGFncyIsImFzc2lnbiIsImZvckVhY2giLCJrIiwiaXNBcnJheSIsImNvbmNhdCIsImV4ZWNBZGJDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCIsImZldGNoQWRiQ29tbWFuZCIsImRldmljZUFyZ3MiLCJnZXREZXZpY2VBcmdzIiwicHJvYyIsInNwYXduIiwiY21kIiwib24iLCJkYXRhIiwidG9TdHJpbmciLCJ0cmltIiwicGFyc2VJbnQiLCJjb2RlIiwiZXJyb3IiLCJqb2luIiwidGltZW91dCIsImNhdGNoIiwiVGltZW91dEVycm9yIiwiZSIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OztBQUVBLElBQUlBLG9CQUFvQixDQUNwQixLQURvQixFQUVwQix5REFGb0IsRUFHcEIsa0NBSG9CLEVBSXBCLHVDQUpvQixFQUtwQixVQUxvQixDQUF4Qjs7QUFRQSxJQUFNQyxZQUFZLElBQWxCO0FBQ0EsSUFBTUMsaUJBQWlCLElBQXZCOztBQUVBOzs7O0lBR2FDLFMsV0FBQUEsUzs7QUFFVDs7Ozs7Ozs7O0FBU0EsdUJBQWFDLElBQWIsRUFBbUI7QUFBQTs7QUFDZkEsZUFBT0EsUUFBUSxFQUFmOztBQUVBLGFBQUtDLE1BQUwsR0FBY0QsS0FBS0MsTUFBTCxJQUFlLGlCQUFPQyxZQUFQLENBQW9CO0FBQzdDQyxrQkFBTSxXQUR1QztBQUU3Q0Msb0JBQVFDLFFBQVFDLE1BRjZCO0FBRzdDQyxtQkFBT1AsS0FBS1EsUUFBTCxJQUFpQjtBQUhxQixTQUFwQixDQUE3Qjs7QUFNQSxhQUFLQyxTQUFMLEdBQWlCLEVBQWpCOztBQUVBLFlBQUlULEtBQUtVLElBQVQsRUFBZTtBQUNYZCw4QkFBa0JlLElBQWxCLENBQXVCWCxLQUFLVSxJQUE1QjtBQUNIO0FBRUo7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7OzswQ0FXbUI7QUFD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Q0Esd0JBQUlrQyxPQUFPLHdCQUFhQyxLQUFiLENBQW1CQyxHQUFuQixFQUF3QkosVUFBeEIsQ0FBWDs7QUFFQUUseUJBQUtHLEVBQUwsQ0FBUSxPQUFSLEVBQWlCLFVBQUNLLElBQUQsRUFBVTs7QUFFdkIsNEJBQUlELFNBQVNDLElBQVQsTUFBbUIsQ0FBdkIsRUFBMEI7QUFDdEJsRSxpQ0FBS3hCLE1BQUwsQ0FBWTJGLEtBQVosQ0FBa0Isc0JBQXNCWCxXQUFXWSxJQUFYLENBQWdCLEdBQWhCLENBQXRCLEdBQTZDLHFCQUE3QyxHQUFxRUYsSUFBdkY7QUFDSDs7QUFFRCwrQkFBT0QsU0FBU0MsSUFBVCxNQUFtQixDQUFuQixHQUF1Qi9FLFNBQXZCLEdBQW1DQyxRQUExQztBQUNILHFCQVBEO0FBU0gsaUJBZEwsRUFlS2lGLE9BZkwsQ0FlYWpHLFNBZmIsRUFnQktrRyxLQWhCTCxDQWdCVyxtQkFBUUMsWUFoQm5CLEVBZ0JpQyxVQUFTQyxDQUFULEVBQVk7QUFDckNDLDRCQUFRQyxHQUFSLENBQVksOEJBQThCdEcsU0FBMUM7QUFDSCxpQkFsQkw7QUFvQkgsYUF0Qk0sQ0FBUDtBQXdCSDs7Ozs7QUFFRDs7Ozs7Ozs7OztzQ0FVZW9ELEksRUFBTTtBQUNqQixvQkFBUSxJQUFSLEVBQWMsS0FBS3hDLFNBQW5CLDRCQUFpQ3dDLElBQWpDO0FBQ0giLCJmaWxlIjoiU2ltcGxlQURCLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgYnVueWFuIGZyb20gJ2J1bnlhbic7XG5pbXBvcnQgQ2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgY29tbWFuZEV4aXN0cyBmcm9tICdjb21tYW5kLWV4aXN0cyc7XG5pbXBvcnQgZGV0ZWN0IGZyb20gJ2FzeW5jL2RldGVjdCc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5cbmxldCBwb3RlbnRpYWxDb21tYW5kcyA9IFtcbiAgICAnYWRiJyxcbiAgICAnL3Vzci9sb2NhbC9hbmRyb2lkL2FuZHJvaWQtc2RrLWxpbnV4L3BsYXRmb3JtLXRvb2xzL2FkYicsXG4gICAgJy91c3IvbG9jYWwvYW5kcm9pZC1zZGsvdG9vbHMvYWRiJyxcbiAgICAnL3Vzci9sb2NhbC9hbmRyb2lkL3BsYXRmb3JtLXRvb2xzL2FkYicsXG4gICAgJy9iaW4vYWRiJ1xuXTtcblxuY29uc3QgdGltZW91dE1zID0gNTAwMDtcbmNvbnN0IGRlZmF1bHRBZGJQb3J0ID0gNTU1NTtcblxuLyoqXG4gKiBAY2xhc3MgU2ltcGxlQURCXG4gKi9cbmV4cG9ydCBjbGFzcyBTaW1wbGVBREIge1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YnVueWFufSBbb3B0cy5sb2dnZXJdXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvZ0xldmVsXVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChvcHRzKSB7XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMubG9nZ2VyID0gb3B0cy5sb2dnZXIgfHwgYnVueWFuLmNyZWF0ZUxvZ2dlcih7XG4gICAgICAgICAgICBuYW1lOiAnU2ltcGxlQURCJyxcbiAgICAgICAgICAgIHN0cmVhbTogcHJvY2Vzcy5zdGRvdXQsXG4gICAgICAgICAgICBsZXZlbDogb3B0cy5sb2dMZXZlbCB8fCAnaW5mbydcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGJEZXZpY2UgPSAnJztcblxuICAgICAgICBpZiAob3B0cy5wYXRoKSB7XG4gICAgICAgICAgICBwb3RlbnRpYWxDb21tYW5kcy5wdXNoKG9wdHMucGF0aCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBnZXQgd2hhdCB0aGUgY29tbWFuZCBpcyBmb3IgYWRiIGFzIGl0IGNhbiB2YXJ5IVxuICAgICAqXG4gICAgICogQG1ldGhvZCBmZXRjaEFkYkNvbW1hbmRcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQGFzeW5jXG4gICAgICovXG4gICAgZmV0Y2hBZGJDb21tYW5kICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkZXRlY3QocG90ZW50aWFsQ29tbWFuZHMsICh2LCBjYikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbW1hbmRFeGlzdHModiwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgfSwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgY29ubmVjdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlwQWRkcmVzc1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBjb25uZWN0IChpcEFkZHJlc3MpIHtcbiAgICAgICAgdGhpcy5hZGJEZXZpY2UgPSBgJHsgaXBBZGRyZXNzIH06JHsgZGVmYXVsdEFkYlBvcnQgfWA7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYkNvbW1hbmQoWydjb25uZWN0JywgaXBBZGRyZXNzXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBkaXNjb25uZWN0XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGRpc2Nvbm5lY3QgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiQ29tbWFuZChbJ2Rpc2Nvbm5lY3QnXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHN0YXJ0QXBwXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGF1bmNoTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBzdGFydEFwcCAocGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpIHtcbiAgICAgICAgbGV0IGFwcE5hbWUgPSBwYWNrYWdlTmFtZSArICcvJyArIGxhdW5jaE5hbWU7XG5cbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnU3RhcnRpbmcgQXBwOiAnICsgYXBwTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbJ2FtJywgJ3N0YXJ0JywgYXBwTmFtZV0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBzdGFydCBhbiBhcHAgd2hlbiB5b3UgZG8gbm90IGtub3cgdGhlIGxhdW5jaCBuYW1lXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHN0YXJ0QXBwQnlQYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHN0YXJ0QXBwQnlQYWNrYWdlTmFtZSAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnU3RhcnRpbmcgQXBwIGJ5IHBhY2thZ2VuYW1lOiAnICsgcGFja2FnZU5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoW1xuICAgICAgICAgICAgJ21vbmtleScsXG4gICAgICAgICAgICAnLXAnLFxuICAgICAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICAgICAgICAnLWMnLFxuICAgICAgICAgICAgJ2FuZHJvaWQuaW50ZW50LmNhdGVnb3J5LkxBVU5DSEVSJyxcbiAgICAgICAgICAgICcxOydcbiAgICAgICAgXSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGZvcmNlU3RvcEFwcFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGZvcmNlU3RvcEFwcCAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnRm9yY2Ugc3RvcHBpbmc6ICcgKyBwYWNrYWdlTmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoWydhbScsICdmb3JjZS1zdG9wJywgcGFja2FnZU5hbWVdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gcmVzdGFydCBhbiBhcHBcbiAgICAgKlxuICAgICAqIEBtZXRob2QgcmVzdGFydEFwcFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxhdW5jaE5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcmVzdGFydEFwcCAocGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1Jlc3RhcnRpbmcgQXBwOiAnICsgcGFja2FnZU5hbWUgKyAnLycgKyBsYXVuY2hOYW1lKTtcblxuICAgICAgICByZXR1cm4gc2VsZi5mb3JjZVN0b3BBcHAocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuc3RhcnRBcHAocGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCByZWJvb3RcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcmVib290ICgpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdSZWJvb3RpbmcnKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoIGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5leGVjQWRiQ29tbWFuZChbJ3JlYm9vdCddKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDAgKiAzMCk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBzaHV0ZG93blxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBzaHV0ZG93biAoKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY1NoZWxsQWRiQ29tbWFuZChbJ2lucHV0JywgJ2tleWV2ZW50JywgJ0tFWUNPREVfUE9XRVInXSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBjb3B5IGZpbGUgZnJvbSBhbmRyb2lkIGRldmljZSB0byBsb2NhbCBtYWNoaWVuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHB1bGxcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlUGF0aFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0b1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBwdWxsIChmaWxlUGF0aCwgdG8pIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQ29weWluZyBmaWxlIGZyb20gXCInICsgZmlsZVBhdGggKyAnXCIgb24gZGV2aWNlIHRvIFwiJyArIHRvICsgJ1wiJyApO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiQ29tbWFuZChbJ3B1bGwnLCBmaWxlUGF0aCwgdG9dKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjb3B5IGZpbGUgZnJvbSBsb2NhbCBtYWNoaW5lIHRvIGFuZHJvaWQgZGV2aWNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHB1c2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlUGF0aFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0b1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBwdXNoIChmaWxlUGF0aCwgdG8pIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQ29weWluZyBmaWxlIGZyb20gXCInICsgZmlsZVBhdGggKyAnXCIgdG8gXCInICsgdG8gKyAnXCIgb24gZGV2aWNlJyApO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiQ29tbWFuZChbJ3B1c2gnLCBmaWxlUGF0aCwgdG9dKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGxzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogVE9ETzpcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBscyAoZGlyKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ2xzIGZvciBkaXI6ICcgKyBkaXIpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dChbJ2xzJywgZGlyXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBjYXB0dXJlU2NyZWVuc2hvdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRvXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGNhcHR1cmVTY3JlZW5zaG90ICh0bykge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRvID0gdG8gfHwgb3MuaG9tZWRpcigpICsgJ3NjcmVlbnNob3QucG5nJztcblxuICAgICAgICBsZXQgZmlsZU5hbWUgPSB0by5zcGxpdCgnLycpLnBvcCgpO1xuXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ3Rha2luZyBhIHNjcmVlbnNob3QnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbJ3NjcmVlbmNhcCcsICctcCcsICcvc2RjYXJkLycgKyBmaWxlTmFtZV0pXG4gICAgICAgICAgICAudGhlbiggKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnB1bGwoJy9zZGNhcmQvJyArIGZpbGVOYW1lLCB0by5zdWJzdHJpbmcoMCwgdG8ubGFzdEluZGV4T2YoXCIvXCIpKSArICcvJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5ybSgnL3NkY2FyZC8nICsgZmlsZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGRlbGV0ZSBhIGZvbGRlciBhbmQgaXQncyBjb250ZW50cyBmcm9tIHRoZSBjb25uZWN0ZWQgZGV2aWNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHJtRGlyXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9sZGVyUGF0aCBTdHJpbmdcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcm1EaXIgKGZvbGRlclBhdGgpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnZGVsZXRpbmcgZm9sZGVyIG9uIGRldmljZTogJyArIGZvbGRlclBhdGgpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFsncm0nLCAnLVJmJywgZm9sZGVyUGF0aF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBkZWxldGUgYSBmaWxlIGZyb20gdGhlIGNvbm5lY3RlZCBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBtZXRob2Qgcm1cbiAgICAgKlxuICAgICAqIEBwYXJhbSBmaWxlUGF0aCBTdHJpbmdcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcm0gKGZpbGVQYXRoKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ2RlbGV0aW5nIGZpbGUgb24gZGV2aWNlOiAnICsgZmlsZVBhdGgpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFsncm0nLCAnLWYnLCBmaWxlUGF0aF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBtb3ZlIGEgZmlsZSBvciBmb2xkZXJcbiAgICAgKlxuICAgICAqIEBtZXRob2QgbXZcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcm9tIC0gcGF0aCBmcm9tXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRvIC0gcGF0aCB0b1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBtdiAoZnJvbSwgdG8pIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnbW92aW5nOiAnICsgZnJvbSArICd0bzogJyArIHRvKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbJ212JywgZnJvbSwgdG9dKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gY2hhbmdlIG93bmVyIG9mIGEgZmlsZSBvciBmb2xkZXJcbiAgICAgKlxuICAgICAqIEBtZXRob2QgY2hvd25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gcGF0aCBvZiBmaWxlIG9yIGZvbGRlclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1c2VyIC0gdXNlciB0aGF0IHdpbGwgb3duIHRoZSBmaWxlIG9yIGZvbGRlclxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0cy5yZWN1cnNpdmUgLSBzZXQgdG8gdHJ1ZSBpZiBvcGVyYXRpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCByZWN1cnNpdmVseVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBjaG93biAocGF0aCwgdXNlciwgZ3JvdXAsIG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgICAgICAgICAgYnVzeWJveDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBhcmdzID0gW107XG5cbiAgICAgICAgaWYgKG9wdHMuYnVzeWJveCkge1xuICAgICAgICAgICAgYXJncy5wdXNoKCdidXN5Ym94Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBhcmdzLnB1c2goJ2Nob3duJyk7XG5cblxuICAgICAgICBpZiAob3B0cy5yZWN1cnNpdmUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaCgnLVInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MucHVzaCh1c2VyKyc6Jytncm91cCk7XG4gICAgICAgIGFyZ3MucHVzaChwYXRoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKGFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBkb2VzIGFuIGxzIC1sYSBvbiB0aGUgZGF0YSBmb2xkZXIgZm9yIHRoZSBnaXZlbiBhcHBsaWNhdGlvblxuICAgICAqXG4gICAgICogQG1ldGhvZCBmZXRjaEFwcGxpY2F0aW9uRGF0YUZvbGRlckluZm9cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBmZXRjaEFwcGxpY2F0aW9uRGF0YUZvbGRlckluZm8gKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmRBbmRDYXB0dXJlT3V0cHV0KFsnYnVzeWJveCcsICdscycsICctbCcsICctbicsICcvZGF0YS9kYXRhLycsICd8JywgJ2dyZXAnLCAnXCInICsgcGFja2FnZU5hbWUgKyAnXCInXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGZpbmQgdGhlIHVzZXIgdGhhdCByZXByZXNlbnRzIGFuIGFwcGxpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZldGNoQXBwbGljYXRpb25Vc2VyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZmV0Y2hBcHBsaWNhdGlvblVzZXIgKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIGxldCBhcHBVc2VySW5kZXggPSAyO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmZldGNoQXBwbGljYXRpb25EYXRhRm9sZGVySW5mbyhwYWNrYWdlTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5jb21wYWN0KHJlc3VsdFswXS5zcGxpdCgnICcpKVthcHBVc2VySW5kZXhdO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGZpbmQgdGhlIGdyb3VwIHRoYXQgcmVwcmVzZW50cyBhbiBhcHBsaWNhdGlvblxuICAgICAqXG4gICAgICogQG1ldGhvZCBmZXRjaEFwcGxpY2F0aW9uR3JvdXBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBmZXRjaEFwcGxpY2F0aW9uR3JvdXAgKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIGxldCBhcHBHcm91cEluZGV4ID0gMztcblxuICAgICAgICByZXR1cm4gdGhpcy5mZXRjaEFwcGxpY2F0aW9uRGF0YUZvbGRlckluZm8ocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uY29tcGFjdChyZXN1bHRbMF0uc3BsaXQoJyAnKSlbYXBwR3JvdXBJbmRleF07XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gY2hlY2sgaWYgYSBwYWNrYWdlIGlzIGluc3RhbGxlZFxuICAgICAqXG4gICAgICogQG1ldGhvZCBpc0luc3RhbGxlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGlzSW5zdGFsbGVkIChwYWNrYWdlTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5mZXRjaEluc3RhbGxlZFBhY2thZ2VOYW1lcygpXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKGluc3RhbGxlZEFwcHMpIHtcbiAgICAgICAgICAgICAgICBpbnN0YWxsZWRBcHBzID0gaW5zdGFsbGVkQXBwcyB8fCBbXTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBfLm1hcChpbnN0YWxsZWRBcHBzLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdi5zcGxpdCgnOicpLnBvcCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoaW5zdGFsbGVkQXBwcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YWxsZWRBcHBzLmluZGV4T2YocGFja2FnZU5hbWUpID49IDA7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdGhhdCByZXNvbHZlIHdoZW4gaXNJbnN0YWxsZWQgYmVjb21lcyB0cnVlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHJlc29sdmVXaGVuSW5zdGFsbGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgcmVzb2x2ZVdoZW5JbnN0YWxsZWQgKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIHJldHJpZXMgPSAwLFxuICAgICAgICAgICAgbWF4UmV0cmllcyA9IDYwLFxuICAgICAgICAgICAgcGlkID0gbnVsbCxcbiAgICAgICAgICAgIHdhaXQgPSA1ICogMTAwMDtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBsZXQgaXNJbnN0YWxsZWRDaGVjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocGlkICE9PSBudWxsICkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQocGlkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzZWxmLmlzSW5zdGFsbGVkKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihpc0luc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW5zdGFsbGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldHJpZXMgPj0gbWF4UmV0cmllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdIaXQgbWF4IHJldGllcyBvbiB3YWl0IGZvciBwYWNrYWdlIG5hbWUgdG8gYXBwZWFyJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBwaWQgPSBzZXRUaW1lb3V0KGlzSW5zdGFsbGVkQ2hlY2ssIHdhaXQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpc0luc3RhbGxlZENoZWNrKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBpbnN0YWxsIGFuIGFwcCBmcm9tIGEgbG9jYWxseSBzdG9yZSBhcGsgZmlsZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBpbnN0YWxsXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbG9jYWxGaWxlIC0gZnVsbCBwYXRoIHRvIGxvY2FsIGZpbGUgdG8gY29weSBhbmQgaW5zdGFsbFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkZXZpY2VQYXRoIC0gcGF0aCBvZiB3aGVyZSB0byBjb3B5IHRoZSBmaWxlIHRvIGJlZm9yZSBpbnN0YWxsaW5nXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lIC0gcGFja2FnZU5hbWUgb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGxhdW5jaE5hbWUgLSBsYXVuY2hOYW1lIGZvciB0aGUgYXBwbGljYXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAYXN5bmNcbiAgICAgKi9cbiAgICBpbnN0YWxsKGxvY2FsRmlsZSwgZGV2aWNlUGF0aCwgcGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzZWxmLnB1c2gobG9jYWxGaWxlLCBkZXZpY2VQYXRoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5mb3JjZVN0b3BBcHAocGFja2FnZU5hbWUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZXhlY0FkYlNoZWxsQ29tbWFuZChbXG4gICAgICAgICAgICAgICAgICAgICdwbScsXG4gICAgICAgICAgICAgICAgICAgICdpbnN0YWxsJyxcbiAgICAgICAgICAgICAgICAgICAgJy1yJyxcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlUGF0aCArIGxvY2FsRmlsZS5zcGxpdCgnLycpLnBvcCgpXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAobGF1bmNoTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5zdGFydEFwcChwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byB1bmluc3RhbGwgYW4gYXBwXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHVuaW5zdGFsbFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lIC0gcGFja2FnZU5hbWUgb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBjbGVhblVwIC0gcmVtb3ZlIGNhY2hlZCBkYXRhIHRvb1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBhc3luY1xuICAgICAqL1xuICAgIHVuaW5zdGFsbCAocGFja2FnZU5hbWUsIGNsZWFuVXApIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgYXJncyA9IFsncG0nLCAndW5pbnN0YWxsJ107XG5cbiAgICAgICAgY2xlYW5VcCA9IGNsZWFuVXAgfHwgZmFsc2U7XG5cbiAgICAgICAgaWYgKGNsZWFuVXAgIT09IHRydWUpIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaCgnLWsnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MucHVzaChwYWNrYWdlTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYuZm9yY2VTdG9wQXBwKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmV4ZWNBZGJTaGVsbENvbW1hbmQoYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gdXBncmFkZSBhbiBhcHBcbiAgICAgKlxuICAgICAqIEBtZXRob2QgdXBncmFkZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGxvY2FsRmlsZSAtIGZ1bGwgcGF0aCB0byBsb2NhbCBmaWxlIHRvIGNvcHkgYW5kIGluc3RhbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGV2aWNlUGF0aCAtIHBhdGggb2Ygd2hlcmUgdG8gY29weSB0aGUgZmlsZSB0byBiZWZvcmUgaW5zdGFsbGluZ1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZSAtIHBhY2thZ2VOYW1lIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBsYXVuY2hOYW1lIC0gbGF1bmNoTmFtZSBmb3IgdGhlIGFwcGxpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQGFzeW5jXG4gICAgICovXG4gICAgdXBncmFkZSAobG9jYWxGaWxlLCBkZXZpY2VQYXRoLCBwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYudW5pbnN0YWxsKHBhY2thZ2VOYW1lLCBmYWxzZSlcbiAgICAgICAgICAgIC50aGVuKHNlbGYuaW5zdGFsbC5iaW5kKHNlbGYsIGxvY2FsRmlsZSwgZGV2aWNlUGF0aCwgcGFja2FnZU5hbWUsIGxhdW5jaE5hbWUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIE1ldGhvZCB0byBmZXRjaCBhIGxpc3Qgb2YgYWxsIGluc3RhbGxlZCBwYWNrYWdlcyBuYW1lcyBvbiB0aGUgZGV2aWNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZldGNoSW5zdGFsbGVkUGFja2FnZU5hbWVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICAgICAqXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQGFzeW5jXG4gICAgICovXG4gICAgZmV0Y2hJbnN0YWxsZWRQYWNrYWdlTmFtZXMgKG9wdHMpIHtcbiAgICAgICAgbGV0IGFyZ3MgPSBbJ3BtJywnbGlzdCcsJ3BhY2thZ2VzJ10sXG4gICAgICAgICAgICBkZWZhdWx0cyA9IHtcbiAgICAgICAgICAgICAgICAnc3lzdGVtT25seSc6IGZhbHNlLFxuICAgICAgICAgICAgICAgICd0aGlyZFBhcnR5T25seSc6IHRydWUsXG4gICAgICAgICAgICAgICAgJ3BhdGhzJzogZmFsc2UsXG4gICAgICAgICAgICAgICAgJ2FsbERpc2FibGVkJzogZmFsc2UsXG4gICAgICAgICAgICAgICAgJ2FsbEVuYWJsZWQnOiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZsYWdzID0ge1xuICAgICAgICAgICAgICAgICdzeXN0ZW1Pbmx5JzogJy1zJyxcbiAgICAgICAgICAgICAgICAndGhpcmRQYXJ0eU9ubHknOiAnLTMnLFxuICAgICAgICAgICAgICAgICdwYXRocyc6ICctZicsXG4gICAgICAgICAgICAgICAgJ2FsbERpc2FibGVkJzogJy1kJyxcbiAgICAgICAgICAgICAgICAnYWxsRW5hYmxlZCc6ICctZSdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgb3B0cyA9IF8uYXNzaWduKGRlZmF1bHRzLCBvcHRzIHx8IHt9KTtcblxuICAgICAgICBfLmZvckVhY2gob3B0cywgKHYsIGspID0+e1xuICAgICAgICAgICAgaWYgKHYgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goZmxhZ3Nba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dChhcmdzKVxuICAgICAgICAgICAgLnRoZW4oXy5jb21wYWN0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZ2V0IHRoZSByZXNvbHV0aW9uIG9mIHRoZSBhbmRyb2lkIGRldmljZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBmZXRjaFJlc29sdXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAYXN5bmNcbiAgICAgKi9cbiAgICBmZXRjaFJlc29sdXRpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dChbJ2NhdCcsICcvc3lzL2NsYXNzL2Rpc3BsYXkvZGlzcGxheTAuSERNSS9tb2RlJ10pXG4gICAgICAgICAgICAudGhlbiggKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXy5pc0FycmF5KHJlc3VsdCkpID8gcmVzdWx0LnBvcCgpIDogcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBleGVjQWRiU2hlbGxDb21tYW5kXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXJncyBBcnJheVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBleGVjQWRiU2hlbGxDb21tYW5kKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYkNvbW1hbmQoWydzaGVsbCddLmNvbmNhdChhcmdzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBleGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dFxuICAgICAqXG4gICAgICogQHBhcmFtIGFyZ3MgQXJyYXlcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZXhlY0FkYlNoZWxsQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQoYXJncykge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQoWydzaGVsbCddLmNvbmNhdChhcmdzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGV4ZWNBZGJDb21tYW5kXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbYXJnc11cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZXhlY0FkYkNvbW1hbmRBbmRDYXB0dXJlT3V0cHV0IChhcmdzKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBzZWxmLmZldGNoQWRiQ29tbWFuZCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oIGNtZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZXZpY2VBcmdzID0gdGhpcy5nZXREZXZpY2VBcmdzKGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ICA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvYyAgICA9IENoaWxkUHJvY2Vzcy5zcGF3bihjbWQsIGRldmljZUFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb2Muc3Rkb3V0Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gZGF0YS50b1N0cmluZygpLnNwbGl0KCdcXG4nKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9yZW1vdmUgYmxhbmsgbGluZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IF8ucmVqZWN0KHJlc3VsdC5jb25jYXQoZGF0YSksIHYgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2ID09PSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3JlbW92ZSBcXG4gYXQgdGhlIGVuZCBvZiBsaW5lc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gXy5tYXAgKHJlc3VsdCwgdiA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYudHJpbSgnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvYy5vbignY2xvc2UnLCBjb2RlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUludChjb2RlKSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubG9nZ2VyLmVycm9yKCdBREIgY29tbWFuZCBgYWRiICcgKyBkZXZpY2VBcmdzLmpvaW4oJyAnKSArICdgIGV4aXRlZCB3aXRoIGNvZGU6JyArIGNvZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoY29kZSkgPT09IDAgPyByZXNvbHZlKHJlc3VsdCkgOiByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aW1lb3V0KHRpbWVvdXRNcylcbiAgICAgICAgICAgICAgICAuY2F0Y2goUHJvbWlzZS5UaW1lb3V0RXJyb3IsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvdWxkIG5vdCBleGVjdXRlIHdpdGhpbiAnICsgdGltZW91dE1zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGV4ZWNBZGJDb21tYW5kXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbYXJnc11cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZXhlY0FkYkNvbW1hbmQgKGFyZ3MpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIHNlbGYuZmV0Y2hBZGJDb21tYW5kKClcbiAgICAgICAgICAgICAgICAudGhlbiggY21kID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRldmljZUFyZ3MgPSB0aGlzLmdldERldmljZUFyZ3MoYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9jID0gQ2hpbGRQcm9jZXNzLnNwYXduKGNtZCwgZGV2aWNlQXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvYy5vbignY2xvc2UnLCAoY29kZSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VJbnQoY29kZSkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ2dlci5lcnJvcignQURCIGNvbW1hbmQgYGFkYiAnICsgZGV2aWNlQXJncy5qb2luKCcgJykgKyAnYCBleGl0ZWQgd2l0aCBjb2RlOicgKyBjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGNvZGUpID09PSAwID8gcmVzb2x2ZSgpIDogcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGltZW91dCh0aW1lb3V0TXMpXG4gICAgICAgICAgICAgICAgLmNhdGNoKFByb21pc2UuVGltZW91dEVycm9yLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb3VsZCBub3QgZXhlY3V0ZSB3aXRoaW4gJyArIHRpbWVvdXRNcyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGdldERldmljZUFyZ3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICAgICAqXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZ2V0RGV2aWNlQXJncyAoYXJncykge1xuICAgICAgICByZXR1cm4gWyctcycsIHRoaXMuYWRiRGV2aWNlLCAuLi5hcmdzXTtcbiAgICB9O1xufVxuIl19
