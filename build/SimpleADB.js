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

                self.fetchAdbCommand().then(function (cmd) {
                    var deviceArgs = self.getDeviceArgs(args);
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

                self.fetchAdbCommand().then(function (cmd) {
                    var deviceArgs = self.getDeviceArgs(args);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNpbXBsZUFEQi5lczYiXSwibmFtZXMiOlsicG90ZW50aWFsQ29tbWFuZHMiLCJ0aW1lb3V0TXMiLCJkZWZhdWx0QWRiUG9ydCIsIlNpbXBsZUFEQiIsIm9wdHMiLCJsb2dnZXIiLCJjcmVhdGVMb2dnZXIiLCJuYW1lIiwic3RyZWFtIiwicHJvY2VzcyIsInN0ZG91dCIsImxldmVsIiwibG9nTGV2ZWwiLCJhZGJEZXZpY2UiLCJwYXRoIiwicHVzaCIsInJlc29sdmUiLCJyZWplY3QiLCJ2IiwiY2IiLCJlcnIiLCJyZXN1bHQiLCJpcEFkZHJlc3MiLCJleGVjQWRiQ29tbWFuZCIsInBhY2thZ2VOYW1lIiwibGF1bmNoTmFtZSIsImFwcE5hbWUiLCJpbmZvIiwiZXhlY0FkYlNoZWxsQ29tbWFuZCIsInNlbGYiLCJmb3JjZVN0b3BBcHAiLCJ0aGVuIiwic3RhcnRBcHAiLCJzZXRUaW1lb3V0IiwiZXhlY1NoZWxsQWRiQ29tbWFuZCIsImZpbGVQYXRoIiwidG8iLCJkaXIiLCJleGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCIsImhvbWVkaXIiLCJmaWxlTmFtZSIsInNwbGl0IiwicG9wIiwicHVsbCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwicm0iLCJmb2xkZXJQYXRoIiwiZnJvbSIsInVzZXIiLCJncm91cCIsInJlY3Vyc2l2ZSIsImJ1c3lib3giLCJhcmdzIiwiYXBwVXNlckluZGV4IiwiZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvIiwiY29tcGFjdCIsImFwcEdyb3VwSW5kZXgiLCJmZXRjaEluc3RhbGxlZFBhY2thZ2VOYW1lcyIsImluc3RhbGxlZEFwcHMiLCJtYXAiLCJpbmRleE9mIiwicmV0cmllcyIsIm1heFJldHJpZXMiLCJwaWQiLCJ3YWl0IiwiaXNJbnN0YWxsZWRDaGVjayIsImNsZWFyVGltZW91dCIsImlzSW5zdGFsbGVkIiwiRXJyb3IiLCJsb2NhbEZpbGUiLCJkZXZpY2VQYXRoIiwiY2xlYW5VcCIsInVuaW5zdGFsbCIsImluc3RhbGwiLCJiaW5kIiwiZGVmYXVsdHMiLCJmbGFncyIsImFzc2lnbiIsImZvckVhY2giLCJrIiwiaXNBcnJheSIsImNvbmNhdCIsImV4ZWNBZGJDb21tYW5kQW5kQ2FwdHVyZU91dHB1dCIsImZldGNoQWRiQ29tbWFuZCIsImRldmljZUFyZ3MiLCJnZXREZXZpY2VBcmdzIiwicHJvYyIsInNwYXduIiwiY21kIiwib24iLCJkYXRhIiwidG9TdHJpbmciLCJ0cmltIiwicGFyc2VJbnQiLCJjb2RlIiwiZXJyb3IiLCJqb2luIiwidGltZW91dCIsImNhdGNoIiwiVGltZW91dEVycm9yIiwiZSIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OztBQUVBLElBQUlBLG9CQUFvQixDQUNwQixLQURvQixFQUVwQix5REFGb0IsRUFHcEIsa0NBSG9CLEVBSXBCLHVDQUpvQixFQUtwQixVQUxvQixDQUF4Qjs7QUFRQSxJQUFNQyxZQUFZLElBQWxCO0FBQ0EsSUFBTUMsaUJBQWlCLElBQXZCOztBQUVBOzs7O0lBR2FDLFMsV0FBQUEsUzs7QUFFVDs7Ozs7Ozs7O0FBU0EsdUJBQWFDLElBQWIsRUFBbUI7QUFBQTs7QUFDZkEsZUFBT0EsUUFBUSxFQUFmOztBQUVBLGFBQUtDLE1BQUwsR0FBY0QsS0FBS0MsTUFBTCxJQUFlLGlCQUFPQyxZQUFQLENBQW9CO0FBQzdDQyxrQkFBTSxXQUR1QztBQUU3Q0Msb0JBQVFDLFFBQVFDLE1BRjZCO0FBRzdDQyxtQkFBT1AsS0FBS1EsUUFBTCxJQUFpQjtBQUhxQixTQUFwQixDQUE3Qjs7QUFNQSxhQUFLQyxTQUFMLEdBQWlCLEVBQWpCOztBQUVBLFlBQUlULEtBQUtVLElBQVQsRUFBZTtBQUNYZCw4QkFBa0JlLElBQWxCLENBQXVCWCxLQUFLVSxJQUE1QjtBQUNIO0FBRUo7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7OzswQ0FXbUI7QUFD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QkFBSWtDLE9BQU8sd0JBQWFDLEtBQWIsQ0FBbUJDLEdBQW5CLEVBQXdCSixVQUF4QixDQUFYOztBQUVBRSx5QkFBS0csRUFBTCxDQUFRLE9BQVIsRUFBaUIsVUFBQ0ssSUFBRCxFQUFVOztBQUV2Qiw0QkFBSUQsU0FBU0MsSUFBVCxNQUFtQixDQUF2QixFQUEwQjtBQUN0QmxFLGlDQUFLeEIsTUFBTCxDQUFZMkYsS0FBWixDQUFrQixzQkFBc0JYLFdBQVdZLElBQVgsQ0FBZ0IsR0FBaEIsQ0FBdEIsR0FBNkMscUJBQTdDLEdBQXFFRixJQUF2RjtBQUNIOztBQUVELCtCQUFPRCxTQUFTQyxJQUFULE1BQW1CLENBQW5CLEdBQXVCL0UsU0FBdkIsR0FBbUNDLFFBQTFDO0FBQ0gscUJBUEQ7QUFTSCxpQkFkTCxFQWVLaUYsT0FmTCxDQWVhakcsU0FmYixFQWdCS2tHLEtBaEJMLENBZ0JXLG1CQUFRQyxZQWhCbkIsRUFnQmlDLFVBQVNDLENBQVQsRUFBWTtBQUNyQ0MsNEJBQVFDLEdBQVIsQ0FBWSw4QkFBOEJ0RyxTQUExQztBQUNILGlCQWxCTDtBQW9CSCxhQXRCTSxDQUFQO0FBd0JIOzs7OztBQUVEOzs7Ozs7Ozs7O3NDQVVlb0QsSSxFQUFNO0FBQ2pCLG9CQUFRLElBQVIsRUFBYyxLQUFLeEMsU0FBbkIsNEJBQWlDd0MsSUFBakM7QUFDSCIsImZpbGUiOiJTaW1wbGVBREIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBidW55YW4gZnJvbSAnYnVueWFuJztcbmltcG9ydCBDaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBjb21tYW5kRXhpc3RzIGZyb20gJ2NvbW1hbmQtZXhpc3RzJztcbmltcG9ydCBkZXRlY3QgZnJvbSAnYXN5bmMvZGV0ZWN0JztcbmltcG9ydCBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcblxubGV0IHBvdGVudGlhbENvbW1hbmRzID0gW1xuICAgICdhZGInLFxuICAgICcvdXNyL2xvY2FsL2FuZHJvaWQvYW5kcm9pZC1zZGstbGludXgvcGxhdGZvcm0tdG9vbHMvYWRiJyxcbiAgICAnL3Vzci9sb2NhbC9hbmRyb2lkLXNkay90b29scy9hZGInLFxuICAgICcvdXNyL2xvY2FsL2FuZHJvaWQvcGxhdGZvcm0tdG9vbHMvYWRiJyxcbiAgICAnL2Jpbi9hZGInXG5dO1xuXG5jb25zdCB0aW1lb3V0TXMgPSA1MDAwO1xuY29uc3QgZGVmYXVsdEFkYlBvcnQgPSA1NTU1O1xuXG4vKipcbiAqIEBjbGFzcyBTaW1wbGVBREJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpbXBsZUFEQiB7XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtidW55YW59IFtvcHRzLmxvZ2dlcl1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9nTGV2ZWxdXG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKG9wdHMpIHtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdGhpcy5sb2dnZXIgPSBvcHRzLmxvZ2dlciB8fCBidW55YW4uY3JlYXRlTG9nZ2VyKHtcbiAgICAgICAgICAgIG5hbWU6ICdTaW1wbGVBREInLFxuICAgICAgICAgICAgc3RyZWFtOiBwcm9jZXNzLnN0ZG91dCxcbiAgICAgICAgICAgIGxldmVsOiBvcHRzLmxvZ0xldmVsIHx8ICdpbmZvJ1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkYkRldmljZSA9ICcnO1xuXG4gICAgICAgIGlmIChvcHRzLnBhdGgpIHtcbiAgICAgICAgICAgIHBvdGVudGlhbENvbW1hbmRzLnB1c2gob3B0cy5wYXRoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGdldCB3aGF0IHRoZSBjb21tYW5kIGlzIGZvciBhZGIgYXMgaXQgY2FuIHZhcnkhXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZldGNoQWRiQ29tbWFuZFxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAYXN5bmNcbiAgICAgKi9cbiAgICBmZXRjaEFkYkNvbW1hbmQgKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGRldGVjdChwb3RlbnRpYWxDb21tYW5kcywgKHYsIGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZEV4aXN0cyh2LCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICB9LCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBjb25uZWN0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaXBBZGRyZXNzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGNvbm5lY3QgKGlwQWRkcmVzcykge1xuICAgICAgICB0aGlzLmFkYkRldmljZSA9IGAkeyBpcEFkZHJlc3MgfTokeyBkZWZhdWx0QWRiUG9ydCB9YDtcblxuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiQ29tbWFuZChbJ2Nvbm5lY3QnLCBpcEFkZHJlc3NdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGRpc2Nvbm5lY3RcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZGlzY29ubmVjdCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJDb21tYW5kKFsnZGlzY29ubmVjdCddKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBtZXRob2Qgc3RhcnRBcHBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXVuY2hOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHN0YXJ0QXBwIChwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSkge1xuICAgICAgICBsZXQgYXBwTmFtZSA9IHBhY2thZ2VOYW1lICsgJy8nICsgbGF1bmNoTmFtZTtcblxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdTdGFydGluZyBBcHA6ICcgKyBhcHBOYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFsnYW0nLCAnc3RhcnQnLCBhcHBOYW1lXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIHN0YXJ0IGFuIGFwcCB3aGVuIHlvdSBkbyBub3Qga25vdyB0aGUgbGF1bmNoIG5hbWVcbiAgICAgKlxuICAgICAqIEBtZXRob2Qgc3RhcnRBcHBCeVBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgc3RhcnRBcHBCeVBhY2thZ2VOYW1lIChwYWNrYWdlTmFtZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdTdGFydGluZyBBcHAgYnkgcGFja2FnZW5hbWU6ICcgKyBwYWNrYWdlTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbXG4gICAgICAgICAgICAnbW9ua2V5JyxcbiAgICAgICAgICAgICctcCcsXG4gICAgICAgICAgICBwYWNrYWdlTmFtZSxcbiAgICAgICAgICAgICctYycsXG4gICAgICAgICAgICAnYW5kcm9pZC5pbnRlbnQuY2F0ZWdvcnkuTEFVTkNIRVInLFxuICAgICAgICAgICAgJzE7J1xuICAgICAgICBdKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgZm9yY2VTdG9wQXBwXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgZm9yY2VTdG9wQXBwIChwYWNrYWdlTmFtZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdGb3JjZSBzdG9wcGluZzogJyArIHBhY2thZ2VOYW1lKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZChbJ2FtJywgJ2ZvcmNlLXN0b3AnLCBwYWNrYWdlTmFtZV0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byByZXN0YXJ0IGFuIGFwcFxuICAgICAqXG4gICAgICogQG1ldGhvZCByZXN0YXJ0QXBwXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGF1bmNoTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICByZXN0YXJ0QXBwIChwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnUmVzdGFydGluZyBBcHA6ICcgKyBwYWNrYWdlTmFtZSArICcvJyArIGxhdW5jaE5hbWUpO1xuXG4gICAgICAgIHJldHVybiBzZWxmLmZvcmNlU3RvcEFwcChwYWNrYWdlTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5zdGFydEFwcChwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIHJlYm9vdFxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICByZWJvb3QgKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1JlYm9vdGluZycpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSggZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4ZWNBZGJDb21tYW5kKFsncmVib290J10pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCAqIDMwKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIHNodXRkb3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHNodXRkb3duICgpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93bicpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjU2hlbGxBZGJDb21tYW5kKFsnaW5wdXQnLCAna2V5ZXZlbnQnLCAnS0VZQ09ERV9QT1dFUiddKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIGNvcHkgZmlsZSBmcm9tIGFuZHJvaWQgZGV2aWNlIHRvIGxvY2FsIG1hY2hpZW5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgcHVsbFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZpbGVQYXRoXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRvXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHB1bGwgKGZpbGVQYXRoLCB0bykge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdDb3B5aW5nIGZpbGUgZnJvbSBcIicgKyBmaWxlUGF0aCArICdcIiBvbiBkZXZpY2UgdG8gXCInICsgdG8gKyAnXCInICk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJDb21tYW5kKFsncHVsbCcsIGZpbGVQYXRoLCB0b10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNvcHkgZmlsZSBmcm9tIGxvY2FsIG1hY2hpbmUgdG8gYW5kcm9pZCBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBtZXRob2QgcHVzaFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZpbGVQYXRoXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRvXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHB1c2ggKGZpbGVQYXRoLCB0bykge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdDb3B5aW5nIGZpbGUgZnJvbSBcIicgKyBmaWxlUGF0aCArICdcIiB0byBcIicgKyB0byArICdcIiBvbiBkZXZpY2UnICk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJDb21tYW5kKFsncHVzaCcsIGZpbGVQYXRoLCB0b10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgbHNcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBUT0RPOlxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGxzIChkaXIpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnbHMgZm9yIGRpcjogJyArIGRpcik7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmRBbmRDYXB0dXJlT3V0cHV0KFsnbHMnLCBkaXJdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGNhcHR1cmVTY3JlZW5zaG90XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdG9cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY2FwdHVyZVNjcmVlbnNob3QgKHRvKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgdG8gPSB0byB8fCBvcy5ob21lZGlyKCkgKyAnc2NyZWVuc2hvdC5wbmcnO1xuXG4gICAgICAgIGxldCBmaWxlTmFtZSA9IHRvLnNwbGl0KCcvJykucG9wKCk7XG5cbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygndGFraW5nIGEgc2NyZWVuc2hvdCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFsnc2NyZWVuY2FwJywgJy1wJywgJy9zZGNhcmQvJyArIGZpbGVOYW1lXSlcbiAgICAgICAgICAgIC50aGVuKCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHVsbCgnL3NkY2FyZC8nICsgZmlsZU5hbWUsIHRvLnN1YnN0cmluZygwLCB0by5sYXN0SW5kZXhPZihcIi9cIikpICsgJy8nKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbiggKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnJtKCcvc2RjYXJkLycgKyBmaWxlTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZGVsZXRlIGEgZm9sZGVyIGFuZCBpdCdzIGNvbnRlbnRzIGZyb20gdGhlIGNvbm5lY3RlZCBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBtZXRob2Qgcm1EaXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb2xkZXJQYXRoIFN0cmluZ1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBybURpciAoZm9sZGVyUGF0aCkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdkZWxldGluZyBmb2xkZXIgb24gZGV2aWNlOiAnICsgZm9sZGVyUGF0aCk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoWydybScsICctUmYnLCBmb2xkZXJQYXRoXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGRlbGV0ZSBhIGZpbGUgZnJvbSB0aGUgY29ubmVjdGVkIGRldmljZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBybVxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbGVQYXRoIFN0cmluZ1xuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBybSAoZmlsZVBhdGgpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnZGVsZXRpbmcgZmlsZSBvbiBkZXZpY2U6ICcgKyBmaWxlUGF0aCk7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoWydybScsICctZicsIGZpbGVQYXRoXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIG1vdmUgYSBmaWxlIG9yIGZvbGRlclxuICAgICAqXG4gICAgICogQG1ldGhvZCBtdlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZyb20gLSBwYXRoIGZyb21cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdG8gLSBwYXRoIHRvXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIG12IChmcm9tLCB0bykge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdtb3Zpbmc6ICcgKyBmcm9tICsgJ3RvOiAnICsgdG8pO1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiU2hlbGxDb21tYW5kKFsnbXYnLCBmcm9tLCB0b10pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBjaGFuZ2Ugb3duZXIgb2YgYSBmaWxlIG9yIGZvbGRlclxuICAgICAqXG4gICAgICogQG1ldGhvZCBjaG93blxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBwYXRoIG9mIGZpbGUgb3IgZm9sZGVyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVzZXIgLSB1c2VyIHRoYXQgd2lsbCBvd24gdGhlIGZpbGUgb3IgZm9sZGVyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBvcHRzLnJlY3Vyc2l2ZSAtIHNldCB0byB0cnVlIGlmIG9wZXJhdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIHJlY3Vyc2l2ZWx5XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGNob3duIChwYXRoLCB1c2VyLCBncm91cCwgb3B0cykge1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7XG4gICAgICAgICAgICByZWN1cnNpdmU6IHRydWUsXG4gICAgICAgICAgICBidXN5Ym94OiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGFyZ3MgPSBbXTtcblxuICAgICAgICBpZiAob3B0cy5idXN5Ym94KSB7XG4gICAgICAgICAgICBhcmdzLnB1c2goJ2J1c3lib3gnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MucHVzaCgnY2hvd24nKTtcblxuXG4gICAgICAgIGlmIChvcHRzLnJlY3Vyc2l2ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgYXJncy5wdXNoKCctUicpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncy5wdXNoKHVzZXIrJzonK2dyb3VwKTtcbiAgICAgICAgYXJncy5wdXNoKHBhdGgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmQoYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGRvZXMgYW4gbHMgLWxhIG9uIHRoZSBkYXRhIGZvbGRlciBmb3IgdGhlIGdpdmVuIGFwcGxpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZldGNoQXBwbGljYXRpb25EYXRhRm9sZGVySW5mb1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGZldGNoQXBwbGljYXRpb25EYXRhRm9sZGVySW5mbyAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY0FkYlNoZWxsQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQoWydidXN5Ym94JywgJ2xzJywgJy1sJywgJy1uJywgJy9kYXRhL2RhdGEvJywgJ3wnLCAnZ3JlcCcsICdcIicgKyBwYWNrYWdlTmFtZSArICdcIiddKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZmluZCB0aGUgdXNlciB0aGF0IHJlcHJlc2VudHMgYW4gYXBwbGljYXRpb25cbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmV0Y2hBcHBsaWNhdGlvblVzZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBmZXRjaEFwcGxpY2F0aW9uVXNlciAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgbGV0IGFwcFVzZXJJbmRleCA9IDI7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hBcHBsaWNhdGlvbkRhdGFGb2xkZXJJbmZvKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLmNvbXBhY3QocmVzdWx0WzBdLnNwbGl0KCcgJykpW2FwcFVzZXJJbmRleF07XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gZmluZCB0aGUgZ3JvdXAgdGhhdCByZXByZXNlbnRzIGFuIGFwcGxpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZldGNoQXBwbGljYXRpb25Hcm91cFxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGZldGNoQXBwbGljYXRpb25Hcm91cCAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgbGV0IGFwcEdyb3VwSW5kZXggPSAzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmZldGNoQXBwbGljYXRpb25EYXRhRm9sZGVySW5mbyhwYWNrYWdlTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5jb21wYWN0KHJlc3VsdFswXS5zcGxpdCgnICcpKVthcHBHcm91cEluZGV4XTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBjaGVjayBpZiBhIHBhY2thZ2UgaXMgaW5zdGFsbGVkXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGlzSW5zdGFsbGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgaXNJbnN0YWxsZWQgKHBhY2thZ2VOYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZldGNoSW5zdGFsbGVkUGFja2FnZU5hbWVzKClcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoaW5zdGFsbGVkQXBwcykge1xuICAgICAgICAgICAgICAgIGluc3RhbGxlZEFwcHMgPSBpbnN0YWxsZWRBcHBzIHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGluc3RhbGxlZEFwcHMsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2LnNwbGl0KCc6JykucG9wKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uIChpbnN0YWxsZWRBcHBzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbGxlZEFwcHMuaW5kZXhPZihwYWNrYWdlTmFtZSkgPj0gMDtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0aGF0IHJlc29sdmUgd2hlbiBpc0luc3RhbGxlZCBiZWNvbWVzIHRydWVcbiAgICAgKlxuICAgICAqIEBtZXRob2QgcmVzb2x2ZVdoZW5JbnN0YWxsZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrYWdlTmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICByZXNvbHZlV2hlbkluc3RhbGxlZCAocGFja2FnZU5hbWUpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgcmV0cmllcyA9IDAsXG4gICAgICAgICAgICBtYXhSZXRyaWVzID0gNjAsXG4gICAgICAgICAgICBwaWQgPSBudWxsLFxuICAgICAgICAgICAgd2FpdCA9IDUgKiAxMDAwO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGxldCBpc0luc3RhbGxlZENoZWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChwaWQgIT09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChwaWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYuaXNJbnN0YWxsZWQocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGlzSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNJbnN0YWxsZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0cmllcyA+PSBtYXhSZXRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ0hpdCBtYXggcmV0aWVzIG9uIHdhaXQgZm9yIHBhY2thZ2UgbmFtZSB0byBhcHBlYXInKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBpZCA9IHNldFRpbWVvdXQoaXNJbnN0YWxsZWRDaGVjaywgd2FpdCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlzSW5zdGFsbGVkQ2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGluc3RhbGwgYW4gYXBwIGZyb20gYSBsb2NhbGx5IHN0b3JlIGFwayBmaWxlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGluc3RhbGxcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBsb2NhbEZpbGUgLSBmdWxsIHBhdGggdG8gbG9jYWwgZmlsZSB0byBjb3B5IGFuZCBpbnN0YWxsXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRldmljZVBhdGggLSBwYXRoIG9mIHdoZXJlIHRvIGNvcHkgdGhlIGZpbGUgdG8gYmVmb3JlIGluc3RhbGxpbmdcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWUgLSBwYWNrYWdlTmFtZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbGF1bmNoTmFtZSAtIGxhdW5jaE5hbWUgZm9yIHRoZSBhcHBsaWNhdGlvblxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBhc3luY1xuICAgICAqL1xuICAgIGluc3RhbGwobG9jYWxGaWxlLCBkZXZpY2VQYXRoLCBwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHNlbGYucHVzaChsb2NhbEZpbGUsIGRldmljZVBhdGgpXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmZvcmNlU3RvcEFwcChwYWNrYWdlTmFtZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5leGVjQWRiU2hlbGxDb21tYW5kKFtcbiAgICAgICAgICAgICAgICAgICAgJ3BtJyxcbiAgICAgICAgICAgICAgICAgICAgJ2luc3RhbGwnLFxuICAgICAgICAgICAgICAgICAgICAnLXInLFxuICAgICAgICAgICAgICAgICAgICBkZXZpY2VQYXRoICsgbG9jYWxGaWxlLnNwbGl0KCcvJykucG9wKClcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChsYXVuY2hOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnN0YXJ0QXBwKHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIHVuaW5zdGFsbCBhbiBhcHBcbiAgICAgKlxuICAgICAqIEBtZXRob2QgdW5pbnN0YWxsXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFja2FnZU5hbWUgLSBwYWNrYWdlTmFtZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGNsZWFuVXAgLSByZW1vdmUgY2FjaGVkIGRhdGEgdG9vXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqXG4gICAgICogQGFzeW5jXG4gICAgICovXG4gICAgdW5pbnN0YWxsIChwYWNrYWdlTmFtZSwgY2xlYW5VcCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICBhcmdzID0gWydwbScsICd1bmluc3RhbGwnXTtcblxuICAgICAgICBjbGVhblVwID0gY2xlYW5VcCB8fCBmYWxzZTtcblxuICAgICAgICBpZiAoY2xlYW5VcCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgYXJncy5wdXNoKCctaycpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncy5wdXNoKHBhY2thZ2VOYW1lKTtcblxuICAgICAgICByZXR1cm4gc2VsZi5mb3JjZVN0b3BBcHAocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZXhlY0FkYlNoZWxsQ29tbWFuZChhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byB1cGdyYWRlIGFuIGFwcFxuICAgICAqXG4gICAgICogQG1ldGhvZCB1cGdyYWRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbG9jYWxGaWxlIC0gZnVsbCBwYXRoIHRvIGxvY2FsIGZpbGUgdG8gY29weSBhbmQgaW5zdGFsbFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkZXZpY2VQYXRoIC0gcGF0aCBvZiB3aGVyZSB0byBjb3B5IHRoZSBmaWxlIHRvIGJlZm9yZSBpbnN0YWxsaW5nXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhY2thZ2VOYW1lIC0gcGFja2FnZU5hbWUgb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGxhdW5jaE5hbWUgLSBsYXVuY2hOYW1lIGZvciB0aGUgYXBwbGljYXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAYXN5bmNcbiAgICAgKi9cbiAgICB1cGdyYWRlIChsb2NhbEZpbGUsIGRldmljZVBhdGgsIHBhY2thZ2VOYW1lLCBsYXVuY2hOYW1lKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gc2VsZi51bmluc3RhbGwocGFja2FnZU5hbWUsIGZhbHNlKVxuICAgICAgICAgICAgLnRoZW4oc2VsZi5pbnN0YWxsLmJpbmQoc2VsZiwgbG9jYWxGaWxlLCBkZXZpY2VQYXRoLCBwYWNrYWdlTmFtZSwgbGF1bmNoTmFtZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogTWV0aG9kIHRvIGZldGNoIGEgbGlzdCBvZiBhbGwgaW5zdGFsbGVkIHBhY2thZ2VzIG5hbWVzIG9uIHRoZSBkZXZpY2VcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZmV0Y2hJbnN0YWxsZWRQYWNrYWdlTmFtZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gICAgICpcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICpcbiAgICAgKiBAYXN5bmNcbiAgICAgKi9cbiAgICBmZXRjaEluc3RhbGxlZFBhY2thZ2VOYW1lcyAob3B0cykge1xuICAgICAgICBsZXQgYXJncyA9IFsncG0nLCdsaXN0JywncGFja2FnZXMnXSxcbiAgICAgICAgICAgIGRlZmF1bHRzID0ge1xuICAgICAgICAgICAgICAgICdzeXN0ZW1Pbmx5JzogZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3RoaXJkUGFydHlPbmx5JzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAncGF0aHMnOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAnYWxsRGlzYWJsZWQnOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAnYWxsRW5hYmxlZCc6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhZ3MgPSB7XG4gICAgICAgICAgICAgICAgJ3N5c3RlbU9ubHknOiAnLXMnLFxuICAgICAgICAgICAgICAgICd0aGlyZFBhcnR5T25seSc6ICctMycsXG4gICAgICAgICAgICAgICAgJ3BhdGhzJzogJy1mJyxcbiAgICAgICAgICAgICAgICAnYWxsRGlzYWJsZWQnOiAnLWQnLFxuICAgICAgICAgICAgICAgICdhbGxFbmFibGVkJzogJy1lJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBvcHRzID0gXy5hc3NpZ24oZGVmYXVsdHMsIG9wdHMgfHwge30pO1xuXG4gICAgICAgIF8uZm9yRWFjaChvcHRzLCAodiwgaykgPT57XG4gICAgICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChmbGFnc1trXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmRBbmRDYXB0dXJlT3V0cHV0KGFyZ3MpXG4gICAgICAgICAgICAudGhlbihfLmNvbXBhY3QpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBnZXQgdGhlIHJlc29sdXRpb24gb2YgdGhlIGFuZHJvaWQgZGV2aWNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGZldGNoUmVzb2x1dGlvblxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBhc3luY1xuICAgICAqL1xuICAgIGZldGNoUmVzb2x1dGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJTaGVsbENvbW1hbmRBbmRDYXB0dXJlT3V0cHV0KFsnY2F0JywgJy9zeXMvY2xhc3MvZGlzcGxheS9kaXNwbGF5MC5IRE1JL21vZGUnXSlcbiAgICAgICAgICAgIC50aGVuKCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChfLmlzQXJyYXkocmVzdWx0KSkgPyByZXN1bHQucG9wKCkgOiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGV4ZWNBZGJTaGVsbENvbW1hbmRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBhcmdzIEFycmF5XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGV4ZWNBZGJTaGVsbENvbW1hbmQoYXJncykge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjQWRiQ29tbWFuZChbJ3NoZWxsJ10uY29uY2F0KGFyZ3MpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIGV4ZWNBZGJTaGVsbENvbW1hbmRBbmRDYXB0dXJlT3V0cHV0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXJncyBBcnJheVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBleGVjQWRiU2hlbGxDb21tYW5kQW5kQ2FwdHVyZU91dHB1dChhcmdzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWNBZGJDb21tYW5kQW5kQ2FwdHVyZU91dHB1dChbJ3NoZWxsJ10uY29uY2F0KGFyZ3MpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZXhlY0FkYkNvbW1hbmRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBleGVjQWRiQ29tbWFuZEFuZENhcHR1cmVPdXRwdXQgKGFyZ3MpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIHNlbGYuZmV0Y2hBZGJDb21tYW5kKClcbiAgICAgICAgICAgICAgICAudGhlbiggY21kID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRldmljZUFyZ3MgPSBzZWxmLmdldERldmljZUFyZ3MoYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgID0gW107XG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9jICAgID0gQ2hpbGRQcm9jZXNzLnNwYXduKGNtZCwgZGV2aWNlQXJncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgcHJvYy5zdGRvdXQub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhLnRvU3RyaW5nKCkuc3BsaXQoJ1xcbicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3JlbW92ZSBibGFuayBsaW5lc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gXy5yZWplY3QocmVzdWx0LmNvbmNhdChkYXRhKSwgdiA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYgPT09ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVtb3ZlIFxcbiBhdCB0aGUgZW5kIG9mIGxpbmVzXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBfLm1hcCAocmVzdWx0LCB2ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdi50cmltKCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBwcm9jLm9uKCdjbG9zZScsIGNvZGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KGNvZGUpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dnZXIuZXJyb3IoJ0FEQiBjb21tYW5kIGBhZGIgJyArIGRldmljZUFyZ3Muam9pbignICcpICsgJ2AgZXhpdGVkIHdpdGggY29kZTonICsgY29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChjb2RlKSA9PT0gMCA/IHJlc29sdmUocmVzdWx0KSA6IHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRpbWVvdXQodGltZW91dE1zKVxuICAgICAgICAgICAgICAgIC5jYXRjaChQcm9taXNlLlRpbWVvdXRFcnJvciwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY291bGQgbm90IGV4ZWN1dGUgd2l0aGluICcgKyB0aW1lb3V0TXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZXhlY0FkYkNvbW1hbmRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICAgICAqXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBleGVjQWRiQ29tbWFuZCAoYXJncykge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgc2VsZi5mZXRjaEFkYkNvbW1hbmQoKVxuICAgICAgICAgICAgICAgIC50aGVuKCBjbWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGV2aWNlQXJncyA9IHNlbGYuZ2V0RGV2aWNlQXJncyhhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb2MgPSBDaGlsZFByb2Nlc3Muc3Bhd24oY21kLCBkZXZpY2VBcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICBwcm9jLm9uKCdjbG9zZScsIChjb2RlKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUludChjb2RlKSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubG9nZ2VyLmVycm9yKCdBREIgY29tbWFuZCBgYWRiICcgKyBkZXZpY2VBcmdzLmpvaW4oJyAnKSArICdgIGV4aXRlZCB3aXRoIGNvZGU6JyArIGNvZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoY29kZSkgPT09IDAgPyByZXNvbHZlKCkgOiByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aW1lb3V0KHRpbWVvdXRNcylcbiAgICAgICAgICAgICAgICAuY2F0Y2goUHJvbWlzZS5UaW1lb3V0RXJyb3IsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvdWxkIG5vdCBleGVjdXRlIHdpdGhpbiAnICsgdGltZW91dE1zKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBtZXRob2QgZ2V0RGV2aWNlQXJnc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBnZXREZXZpY2VBcmdzIChhcmdzKSB7XG4gICAgICAgIHJldHVybiBbJy1zJywgdGhpcy5hZGJEZXZpY2UsIC4uLmFyZ3NdO1xuICAgIH07XG59XG4iXX0=
