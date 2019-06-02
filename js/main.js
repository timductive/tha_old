"use strict";
/**
 * https://github.com/luisbraganca/fake-terminal-website
 * Inital author credit due to @luisbraganca for fake-terminal-website code
 * Improvements to terminal: CD command, flyout, jekyll theme by @timductive
 * THA content by @timductive
 */

/**
 * Configs
 */
var configs = (function () {
    var instance;
    var Singleton = function (options) {
        var options = options || Singleton.defaultOptions;
        for (var key in Singleton.defaultOptions) {
            this[key] = options[key] || Singleton.defaultOptions[key];
        }
    };
    Singleton.defaultOptions = {
        general_help: `Below there's a list of commands approved for travelers.\nYou can use autofill by pressing the TAB key.`,
        ls_help: "List information about the files and folders (the current directory by default).",
        cat_help: "Read FILE(s) content and print it to the standard output (screen).",
        whoami_help: "Print the user name associated with the current effective user ID and more info.",
        date_help: "Print the system date and time.",
        help_help: "Print this menu.",
        clear_help: "Clear the terminal screen.",
        reboot_help: "Reboot the system.",
        cd_help: "Change the current working directory.",
        mv_help: "Move (rename) files.",
        rm_help: "Remove files or directories.",
        rmdir_help: "Remove directory, this command will only work if the folders are empty.",
        touch_help: "Change file timestamps. If the file doesn't exist, it's created an empty one.",
        sudo_help: "Execute a command as the superuser.",
        welcome: `Welcome traveler, the SYSTEM would like to impart the ALGORITHM.\n\nClearing previous credentials...\n.........\n...\n\nDate: [time distortion detected]\n...\n.\n\nType "help" for interface documentation.`,
        internet_explorer_warning: "NOTE: I see you're using antiquated technology, the ALGORITHM cannot be imparted.",
        welcome_file_name: "restricted.bp",
        invalid_command_message: "<value>: command not found.",
        reboot_message: "Preparing to reboot...\n\n3...\n\n2...\n\n1...\n\nRebooting...\n\n",
        permission_denied_message: "Unable to '<value>', permission denied.",
        sudo_message: "Unable to sudo, sudo reserved for rank Oz or above.",
        usage: "Usage",
        file: "file",
        directory: "directory",
        file_not_found: "File '<value>' not found.",
        not_a_directory: "cd: <value>: not a directory.",
        is_a_directory: "cat: <value>: is a directory.",
        username: "Username",
        hostname: "Host",
        platform: "Platform",
        accesible_cores: "Accessible cores",
        language: "Language",
        value_token: "<value>",
        host: "N.E.S.A.",
        user: "traveler",
        is_root: false,
        type_delay: 5
    };
    return {
        getInstance: function (options) {
            instance === void 0 && (instance = new Singleton(options));
            return instance;
        }
    };
})();

/**
 * Your files here
 */
var files = (function () {
    var instance;
    var Singleton = function (options) {
        var options = options || Singleton.defaultOptions;

        this.path = options['path'] || '/';
        this.directories = {};
        for (var key in Singleton.defaultOptions) {
            this.directories[key] = options[key] || Singleton.defaultOptions[key];
        }
    };
    var defaultDirectories = {
        "genesis": tags.genesis,
        "exodus-kids": { "corrupted.txt": "/404" },
        "elysium-trees": { "corrupted.txt": "/404" },
        "the-humanity-algorithm": tags["the-humanity-algorithm"],
        "metadata": {
            "antipatterns": tags.antipatterns
        }
    };
    delete tags.genesis;
    delete tags["the-humanity-algorithm"];
    delete tags.antipatterns;
    Singleton.defaultOptions = Object.assign({}, tags, defaultDirectories);

    return {
        getInstance: function (options) {
            instance === void 0 && (instance = new Singleton(options));
            return instance;
        }
    };
})();

var main = (function () {

    /**
     * Aux functions
     */
    const isUsingIE = window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);

    const ignoreEvent = function (event) {
        event.preventDefault();
        event.stopPropagation();
    };
    
    const scrollToBottom = function () {
        window.scrollTo(0, document.body.scrollHeight);
    };
    
    const isURL = function (str) {
        return (str.startsWith("http") || str.startsWith("www")) && str.indexOf(" ") === -1 && str.indexOf("\n") === -1;
    };

    const getNestedObject = (nestedObj, pathArr) => {
        return pathArr.reduce((obj, key) =>
            (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
    };

    const cleanPath = function (path) {
        // Takes a path as string ex "/path1/path2/etc" and
        // returns a clean array of subdirectories/files
        var clean_path = [];
        var dirty_path = path.split("/");
        for (var idx in dirty_path) {
            if (!dirty_path[idx]) {
                continue;
            }
            clean_path.push(dirty_path[idx]);
        }
        return clean_path;
    };

    const getCurrentPath = function () {
        return cleanPath(files.getInstance().path);
    };

    const getCurrentDirectory = function (custom_path) {
        var current_path = custom_path ||  getCurrentPath();
        var directories = files.getInstance().directories;
        if (current_path.length > 0) {
            directories = getNestedObject(directories, current_path);
        } 
        return directories
    };
    
    /**
     * Model
     */
    var InvalidArgumentException = function (message) {
        this.message = message;
        // Use V8's native method if available, otherwise fallback
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, InvalidArgumentException);
        } else {
            this.stack = (new Error()).stack;
        }
    };
    // Extends Error
    InvalidArgumentException.prototype = Object.create(Error.prototype);
    InvalidArgumentException.prototype.name = "InvalidArgumentException";
    InvalidArgumentException.prototype.constructor = InvalidArgumentException;

    var cmds = {
        LS: { value: "ls", help: configs.getInstance().ls_help },
        CAT: { value: "cat", help: configs.getInstance().cat_help },
        WHOAMI: { value: "whoami", help: configs.getInstance().whoami_help },
        DATE: { value: "date", help: configs.getInstance().date_help },
        HELP: { value: "help", help: configs.getInstance().help_help },
        CLEAR: { value: "clear", help: configs.getInstance().clear_help },
        REBOOT: { value: "reboot", help: configs.getInstance().reboot_help },
        CD: { value: "cd", help: configs.getInstance().cd_help },
        MV: { value: "mv", help: configs.getInstance().mv_help },
        RM: { value: "rm", help: configs.getInstance().rm_help },
        RMDIR: { value: "rmdir", help: configs.getInstance().rmdir_help },
        TOUCH: { value: "touch", help: configs.getInstance().touch_help },
        SUDO: { value: "sudo", help: configs.getInstance().sudo_help }
    };

    var Terminal = function (prompt, cmdLine, output, sidenav, profilePic, user, host, root, outputTimer, flyout) {
        if (!(prompt instanceof Node) || prompt.nodeName.toUpperCase() !== "DIV") {
            throw new InvalidArgumentException("Invalid value " + prompt + " for argument 'prompt'.");
        }
        if (!(cmdLine instanceof Node) || cmdLine.nodeName.toUpperCase() !== "INPUT") {
            throw new InvalidArgumentException("Invalid value " + cmdLine + " for argument 'cmdLine'.");
        }
        if (!(output instanceof Node) || output.nodeName.toUpperCase() !== "DIV") {
            throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");
        }
        if (!(sidenav instanceof Node) || sidenav.nodeName.toUpperCase() !== "DIV") {
            throw new InvalidArgumentException("Invalid value " + sidenav + " for argument 'sidenav'.");
        }
        if (!(flyout instanceof Node) || sidenav.nodeName.toUpperCase() !== "DIV") {
            throw new InvalidArgumentException("Invalid value " + sidenav + " for argument 'flyout'.");
        }
        if (!(profilePic instanceof Node) || profilePic.nodeName.toUpperCase() !== "IMG") {
            throw new InvalidArgumentException("Invalid value " + profilePic + " for argument 'profilePic'.");
        }
        (typeof user === "string" && typeof host === "string") && (this.completePrompt = user + "@" + host + ":~" + (root ? "#" : "$"));
        this.profilePic = profilePic;
        this.prompt = prompt;
        this.cmdLine = cmdLine;
        this.output = output;
        this.sidenav = sidenav;
        this.sidenavOpen = false;
        this.sidenavElements = [];
        this.typeSimulator = new TypeSimulator(outputTimer, output);
        this.flyout = flyout;
        this.flyoutOpen = false;
    };

    Terminal.prototype.type = function (text, callback) {
        this.typeSimulator.type(text, callback);
    };

    Terminal.prototype.updatePrompt = function () {
        var prompt = this.completePrompt.split("~");
        this.completePrompt = prompt[0] + "~" + files.getInstance().path + '$';
    };

    Terminal.prototype.exec = function () {
        var command = this.cmdLine.value;
        this.updatePrompt();
    
        this.cmdLine.value = "";
        this.prompt.textContent = "";
        this.output.innerHTML += "<span class=\"prompt-color\">" + this.completePrompt + "</span> " + command + "<br/>";
    };

    Terminal.prototype.init = function () {
        this.sidenav.addEventListener("click", ignoreEvent);
        this.cmdLine.disabled = true;
        this.sidenavElements.forEach(function (elem) {
            elem.disabled = true;
        });
        this.prepareSideNav();
        this.lock(); // Need to lock here since the sidenav elements were just added
        document.body.addEventListener("click", function (event) {
            if (this.sidenavOpen) {
                this.handleSidenav(event);
            }
            this.focus();
        }.bind(this));

        // Setup flyout
        document.body.addEventListener("keydown", function(event) {
            if (event.which === 13 || event.keyCode === 13) {
                if (this.flyoutOpen) {
                    this.handleFlyout(event, '', '');
                }
            }
        }.bind(this));
        document.getElementById("flyout-escape").addEventListener("click", function(event) {
            if (this.flyoutOpen) {
                this.handleFlyout(event, '', '');
            }
        }.bind(this));
    
        this.cmdLine.addEventListener("keydown", function (event) {
            if (event.which === 13 || event.keyCode === 13) {
                if (this.flyoutOpen) {
                    this.handleFlyout(event, '', '');
                } else {
                    this.handleCmd();
                }
                ignoreEvent(event);
            } else if (event.which === 9 || event.keyCode === 9) {
                this.handleFill();
                ignoreEvent(event);
            }
        }.bind(this));
        this.reset();
    };

    Terminal.makeElementDisappear = function (element) {
        element.style.opacity = 0;
        element.style.transform = "translateX(-300px)";
    };

    Terminal.makeElementAppear = function (element) {
        element.style.opacity = 1;
        element.style.transform = "translateX(0)";
    };

    Terminal.prototype.prepareSideNav = function () {
        var capFirst = (function () {
            return function (string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
        })();
        var sidenavContent = document.getElementById("sidenav-content");
        sidenavContent.innerHTML = "";
        debugger;
        for (var file in getCurrentDirectory()) {
            var element = document.createElement("button");
            Terminal.makeElementDisappear(element);
            element.onclick = function (file, event) {
                if (file.includes(".bp") || file.includes(".txt")) {
                    this.handleSidenav(event);
                    this.cmdLine.value = "cat " + file + " ";
                } else {
                    this.cmdLine.value = "cd " + file + " ";
                }
                this.handleCmd();
            }.bind(this, file);
            element.appendChild(document.createTextNode(capFirst(file.replace(/\.[^/.]+$/, "").replace(/_/g, " "))));
            sidenavContent.appendChild(element);
            this.sidenavElements.push(element);
        }
        // Shouldn't use document.getElementById but Terminal is already using loads of params
        document.getElementById("sidenavBtn").addEventListener("click", this.handleSidenav.bind(this));
    };

    Terminal.prototype.handleSidenav = function (event) {
        if (this.sidenavOpen) {
            this.profilePic.style.opacity = 0;
            this.sidenavElements.forEach(Terminal.makeElementDisappear);
            this.sidenav.style.width = "50px";
            document.getElementById("sidenavBtn").innerHTML = "&#9776;";
            this.sidenavOpen = false;

            // Also close flyout if closing sidenav
            if (this.flyoutOpen) {
                this.handleFlyout(event, '', '');
            }
        } else {
            this.sidenav.style.width = "300px";
            this.sidenavElements.forEach(Terminal.makeElementAppear);
            document.getElementById("sidenavBtn").innerHTML = "&times;";
            this.profilePic.style.opacity = .1;
            this.sidenavOpen = true;
        }
        document.getElementById("sidenavBtn").blur();
        ignoreEvent(event);
    };

    Terminal.prototype.handleFlyout = function (event, text, title) {
        if (this.flyoutOpen) {
            // reset flyout content and url hash
            document.getElementById("flyout-content").innerHTML = '';
            parent.location.hash = '';

            // animate css
            this.flyout.style.width = '0px';
            this.flyout.style.padding = '0px';
            this.flyoutOpen = false;   

        } else {
            // Update flyout content and url hash
            document.getElementById("flyout-content").innerHTML = text;
            parent.location.hash = title;

            // animate css
            this.flyout.style.padding = '60px 20px';
            this.flyout.style.width = "100%";
            this.flyoutOpen = true;
        }
        if (event) {
            ignoreEvent(event);
        }
        // Re-focus and unlock terminal
        this.unlock();
    };

    Terminal.prototype.lock = function () {
        this.exec();
        this.cmdLine.blur();
        this.cmdLine.disabled = true;
        this.sidenavElements.forEach(function (elem) {
            elem.disabled = true;
        });
    };

    Terminal.prototype.unlock = function () {
        this.cmdLine.disabled = false;
        this.updatePrompt();
        this.prompt.textContent = this.completePrompt;
        this.sidenavElements.forEach(function (elem) {
            elem.disabled = false;
        });
        scrollToBottom();
        this.focus();
    };

    Terminal.prototype.handleFill = function () {
        var cmdComponents = this.cmdLine.value.trim().split(" ");
        if ((cmdComponents.length <= 1) || 
        ((cmdComponents.length === 2 && cmdComponents[0] === cmds.CAT.value)) || 
        (cmdComponents.length === 2 && cmdComponents[0] === cmds.CD.value)) {
            this.lock();
            var possibilities = [];
            if (cmdComponents[0].toLowerCase() === cmds.CAT.value || cmdComponents[0].toLowerCase() === cmds.CD.value) {
                if (cmdComponents.length === 1) {
                    cmdComponents[1] = "";
                }
                if (configs.getInstance().welcome_file_name.startsWith(cmdComponents[1].toLowerCase())) {
                    possibilities.push(cmdComponents[0].toLowerCase() + " " + configs.getInstance().welcome_file_name);
                }
                for (var file in getCurrentDirectory()) {
                    if (file.startsWith(cmdComponents[1].toLowerCase())) {
                        possibilities.push(cmdComponents[0].toLowerCase() + " " + file);
                    }
                }
            } else {
                for (var command in cmds) {
                    if (cmds[command].value.startsWith(cmdComponents[0].toLowerCase())) {
                        possibilities.push(cmds[command].value);
                    }
                }
            }
            if (possibilities.length === 1) {
                this.cmdLine.value = possibilities[0] + " ";
                this.unlock();
            } else if (possibilities.length > 1) {
                this.type(possibilities.join("\n"), function () {
                    this.cmdLine.value = cmdComponents.join(" ");
                    this.unlock();
                }.bind(this));
            } else {
                this.cmdLine.value = cmdComponents.join(" ");
                this.unlock();
            }
        }
    };

    Terminal.prototype.handleCmd = function () {
        var cmdComponents = this.cmdLine.value.trim().split(" ");
        this.lock();
        switch (cmdComponents[0]) {
            case cmds.CAT.value:
                this.cat(cmdComponents);
                break;
            case cmds.LS.value:
                this.ls();
                break;
            case cmds.WHOAMI.value:
                this.whoami();
                break;
            case cmds.DATE.value:
                this.date();
                break;
            case cmds.HELP.value:
                this.help();
                break;
            case cmds.CLEAR.value:
                this.clear();
                break;
            case cmds.REBOOT.value:
                this.reboot();
                break;
            case cmds.CD.value:
                this.cd(cmdComponents);
                break;
            case cmds.MV.value:
            case cmds.RMDIR.value:
            case cmds.RM.value:
            case cmds.TOUCH.value:
                this.permissionDenied(cmdComponents);
                break;
            case cmds.SUDO.value:
                this.sudo();
                break;
            default:
                this.invalidCommand(cmdComponents);
                break;
        };
    };

    Terminal.prototype.cat = function (cmdComponents) {
        var result;
        var path = '';
        var file = '';
        if (cmdComponents.length > 1 && cmdComponents[1]) {
            file = cmdComponents[1];

            if (cmdComponents[1].includes("/")) {
                path = cleanPath(cmdComponents[1]);
                file = path.pop();
            }
        }

        if (cmdComponents.length <= 1) {
            result = configs.getInstance().usage + ": " + cmds.CAT.value + " <" + configs.getInstance().file + ">";
            this.type(result, this.unlock.bind(this));
        } else if (!cmdComponents[1] || (!cmdComponents[1] === configs.getInstance().welcome_file_name || !getCurrentDirectory(path).hasOwnProperty(file))) {
            result = configs.getInstance().file_not_found.replace(configs.getInstance().value_token, cmdComponents[1]);
            this.type(result, this.unlock.bind(this));
        } else if (!cmdComponents[1].includes(".bp") && !cmdComponents[1].includes(".txt")) {
            result = configs.getInstance().is_a_directory.replace(configs.getInstance().value_token, cmdComponents[1]);
            this.type(result, this.unlock.bind(this));
        } else {
            result = cmdComponents[1] === configs.getInstance().welcome_file_name ? configs.getInstance().welcome : getCurrentDirectory(path)[file];
            // If filetype is .bp use flyout, otherwise type in terminal
            if (cmdComponents[1] && cmdComponents[1].includes(".bp")) {
                var xhttp = new XMLHttpRequest();
                var parent = this;
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        parent.handleFlyout('', this.responseText, files.getInstance().path + cmdComponents[1]);
                    } else if (this.readyState == 4 && this.status == 404) {
                        parent.type("ERROR: File Not Found.", parent.unlock.bind(parent));
                    }
                };
                xhttp.open("GET", result, true);
                xhttp.send();
                
                
            } else {
                var xhttp = new XMLHttpRequest();
                var parent = this;
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        parent.type(this.responseText, parent.unlock.bind(parent));
                    } else if (this.readyState == 4 && this.status == 404) {
                        parent.type("ERROR: File Not Found.", parent.unlock.bind(parent));
                    }
                };
                xhttp.open("GET", result, true);
                xhttp.send();
            }
        }
    };

    Terminal.prototype.cd = function (cmdComponents) {
        var result = "";
        var current_path = getCurrentPath();
        var computed_path = "/";
        var new_directory;
        var input_path;

        // check for valid input
        if (!cmdComponents || cmdComponents.length <= 1 || !cmdComponents[1]) {
            result = configs.getInstance().usage + ": " + cmds.CD.value + " <" + configs.getInstance().directory +">";
            this.type(result.trim(), this.unlock.bind(this));
            return;
        }

        // create new path mapping
        input_path = cmdComponents[1].split("/");
        for (var new_idx in input_path) {
            if (!input_path[new_idx]) {
                continue;
            } 
            else if (input_path[new_idx] == "..") {
                try {
                    current_path.pop();
                } catch (error) {
                    console.log(error);
                    break;
                }
            } 
            else if (input_path[new_idx] == ".") {
                continue;
            } 
            else {
                current_path.push(input_path[new_idx]);
            }
        }

        if (current_path) {
            var temp_path = [];
            for (var idx in current_path) {
                if (!current_path[idx]) {
                    continue;
                }
                temp_path.push(current_path[idx]);
                computed_path += current_path[idx] + "/";
            }
            current_path = temp_path;
        }

        // check for valid new directory, if current path, otherwise assume root directory
        if (current_path.length > 0) {
            new_directory = getNestedObject(files.getInstance().directories, current_path);
            if (new_directory === undefined || (cmdComponents[1].includes(".rb") || cmdComponents[1].includes(".txt"))) {
                result = configs.getInstance().not_a_directory.replace(configs.getInstance().value_token, cmdComponents[1]);
                this.type(result.trim(), this.unlock.bind(this));
                return;
            }
        }
        // set new working directory
        files.getInstance().path = computed_path;

        this.unlock();
    };

    Terminal.prototype.ls = function () {
        var result = ".\n..\n";
        var current_directory = getCurrentDirectory();

        for (var file in current_directory) {
            result += file + "\n";
        }
        this.type(result.trim(), this.unlock.bind(this));
    };

    Terminal.prototype.sudo = function () {
        this.type(configs.getInstance().sudo_message, this.unlock.bind(this));
    }

    Terminal.prototype.whoami = function (cmdComponents) {
        var result = configs.getInstance().username + ": " + configs.getInstance().user + "\n" + configs.getInstance().hostname + ": " + configs.getInstance().host + "\n" + configs.getInstance().platform + ": N.E.S.A. Super Computer" + "\n" + configs.getInstance().accesible_cores + ": " + navigator.hardwareConcurrency + "/12B" + "\n" + configs.getInstance().language + ": " + navigator.language + " derivative";
        this.type(result, this.unlock.bind(this));
    };

    Terminal.prototype.date = function (cmdComponents) {
        this.type('Time Distortion Detected!\nRecalibrating...\n\n' + new Date().toString(), this.unlock.bind(this));
    };

    Terminal.prototype.help = function () {
        var result = configs.getInstance().general_help + "\n\n";
        for (var cmd in cmds) {
            result += cmds[cmd].value + " - " + cmds[cmd].help + "\n";
        }
        this.type(result.trim(), this.unlock.bind(this));
    };

    Terminal.prototype.clear = function () {
        this.output.textContent = "";
        this.prompt.textContent = "";
        this.prompt.textContent = this.completePrompt;
        this.unlock();
    };

    Terminal.prototype.reboot = function () {
        this.type(configs.getInstance().reboot_message, this.reset.bind(this));
    };

    Terminal.prototype.reset = function () {
        this.output.textContent = "";
        this.prompt.textContent = "";
        files.getInstance().path = "/";
        if (this.typeSimulator) {
            this.type(configs.getInstance().welcome + (isUsingIE ? "\n" + configs.getInstance().internet_explorer_warning : ""), function () {
                this.unlock();

                // Check for existing url and open it
                var hash = parent.location.hash.slice(1);
                if (hash) {
                    this.cmdLine.value = "cat " + hash + " ";
                    this.handleCmd();
                }
            }.bind(this));
        }
    };

    Terminal.prototype.permissionDenied = function (cmdComponents) {
        this.type(configs.getInstance().permission_denied_message.replace(configs.getInstance().value_token, cmdComponents[0]), this.unlock.bind(this));
    };

    Terminal.prototype.invalidCommand = function (cmdComponents) {
        this.type(configs.getInstance().invalid_command_message.replace(configs.getInstance().value_token, cmdComponents[0]), this.unlock.bind(this));
    };

    Terminal.prototype.focus = function () {
        this.cmdLine.focus();
    };

    var TypeSimulator = function (timer, output) {
        var timer = parseInt(timer);
        if (timer === Number.NaN || timer < 0) {
            throw new InvalidArgumentException("Invalid value " + timer + " for argument 'timer'.");
        }
        if (!(output instanceof Node)) {
            throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");
        }
        this.timer = timer;
        this.output = output;
    };

    TypeSimulator.prototype.type = function (text, callback) {
        if (isURL(text)) {
            window.open(text);
        }
        var i = 0;
        var output = this.output;
        var timer = this.timer;
        var skipped = false;
        var skip = function () {
            skipped = true;
        }.bind(this);
        document.addEventListener("dblclick", skip);
        (function typer() {
            if (i < text.length) {
                var char = text.charAt(i);
                var isNewLine = char === "\n";
                output.innerHTML += isNewLine ? "<br/>" : char;
                i++;
                if (!skipped) {
                    setTimeout(typer, isNewLine ? timer * 2 : timer);
                } else {
                    output.innerHTML += (text.substring(i).replace(new RegExp("\n", 'g'), "<br/>")) + "<br/>";
                    document.removeEventListener("dblclick", skip);
                    callback();
                }
            } else if (callback) {
                output.innerHTML += "<br/>";
                document.removeEventListener("dblclick", skip);
                callback();
            }
            scrollToBottom();
        })();
    };

    return {
        listener: function () {
            new Terminal(
                document.getElementById("prompt"),
                document.getElementById("cmdline"),
                document.getElementById("output"),
                document.getElementById("sidenav"),
                document.getElementById("profilePic"),
                configs.getInstance().user,
                configs.getInstance().host,
                configs.getInstance().is_root,
                configs.getInstance().type_delay,
                document.getElementById("flyout")
            ).init();
        }
    };
})();

window.onload = main.listener;
