//==============================================================================
//
//  TOBESOFT Co., Ltd.
//  Copyright 2014 TOBESOFT Co., Ltd.
//  All Rights Reserved.
//
//  NOTICE: TOBESOFT permits you to use, modify, and distribute this file 
//          in accordance with the terms of the license agreement accompanying it.
//
//  Readme URL: http://www.tobesoft.com/legal/nexacro-public-license-readme-1.0.html	
//
//==============================================================================

if (!nexacro.Logger)
{

    //----------------------------------------------------------------
    // getLogger
    nexacro._loggers = {};
    nexacro.getLogger = function (name)
    {
        if (!name || typeof name != "string")
        {
            name = "[default]";
        }

        var logger = nexacro._loggers[name]
        if (logger)
            return logger;

        logger = nexacro._loggers[name] = new nexacro.Logger(name);
        return logger;
    };

    //----------------------------------------------------------------
    // Logger
    nexacro.Logger = function (name)
    {
        this.name = (name || "");
        this.level = nexacro.Logger.ALL;

        this.logItems = [];

        this.itemCounts = [];
        this.itemCounts.length = nexacro.Logger.OFF;
        this.itemCounts.fill(0);

        this.appenders = [];
        this.location = {};
        //this.contexts = [];
    };

    var _pLogger = nexacro._createPrototype(Object, nexacro.Logger);
    nexacro.Logger.prototype = _pLogger;

    nexacro.Logger.ALL = 1;
    nexacro.Logger.TRACE = 1;
    nexacro.Logger.INFO = 2;
    nexacro.Logger.WARN = 3;
    nexacro.Logger.ERROR = 4;
    nexacro.Logger.OFF = 5;

    nexacro.Logger.getLevelText = function (level)
    {
        switch (level)
        {
            case nexacro.Logger.TRACE:  return "TRACE";
            case nexacro.Logger.INFO: return "INFO";
            case nexacro.Logger.WARN: return "WARN";
            case nexacro.Logger.ERROR:  return "ERROR"
        }
        return "";
    };
    nexacro.Logger.getLevelFromText = function (levelText)
    {
        switch (levelText.toUpperCase())
        {
            case "ALL": return nexacro.Logger.ALL;
            case "TRACE": return nexacro.Logger.TRACE;
            case "INFO": return nexacro.Logger.INFO;
            case "WARN": return nexacro.Logger.WARN;
            case "ERROR": return nexacro.Logger.ERROR;
            case "OFF": return nexacro.Logger.OFF;
            case "TRACE": return nexacro.Logger.TRACE;
        }
        return nexacro.Logger.ALL;
    };

    nexacro.Logger.DEFAULT_DATE_FORMAT = "yyyy-MM-ddThh:mm:ss.SSSZ"; // ISO8601

    nexacro.Logger._layout_types = {};
    nexacro.Logger.addLayoutType = function (name, constructor)
    {
        nexacro.Logger._layout_types[name] = constructor;
    };
    nexacro.Logger.getLayoutType = function (name)
    {
        if (!name) name = "default";
        return nexacro.Logger._layout_types[name];
    };

    nexacro.Logger._appender_types = {};
    nexacro.Logger.addAppenderType = function (name, constructor)
    {
        nexacro.Logger._appender_types[name] = constructor;
    };
    nexacro.Logger.getAppenderType = function (name)
    {
        if (!name) name = "default";
        return nexacro.Logger._appender_types[name];
    };

    _pLogger.addAppender = function (appender)
    {
        if (appender)
        {
            return this.appenders.push(appender);
        }
        return -1;
    };
    _pLogger.open = function ()
    {
        var appender, cnt = this.appenders.length;
        for (var i = 0; i < cnt; i++)
        {
            appender = this.appenders[i];
            appender.open(this.name);
        }
    };
    _pLogger.close = function ()
    {
        var appender, cnt = this.appenders.length;
        for (var i = 0; i < cnt; i++)
        {
            appender = this.appenders[i];
            appender.close();
        }
    };
    _pLogger.isopened = function ()
    {
        var opened = false;
        var appender, cnt = this.appenders.length;
        for (var i = 0; i < cnt; i++)
        {
            appender = this.appenders[i];
            opened |= appender.isopened();
        }
        return opened;
    };
    _pLogger.setLevel = function (level)
    {
        if (!level || typeof level == "string")
            level = nexacro.Logger.getLevelFromText(level);

        this.level = level;
    };
    _pLogger.getLogCount = function (level)
    {
        if (!level)
        {
            var total = 0;
            this.itemCounts.forEach(function (item) { total += item; });
            return total;
        }
        return this.itemCounts[level];
    };
    _pLogger._log = function (level, msg, exception, reldoc)
    {
        var logItem = new nexacro.Logger.Item(this.name, level, msg, this.location, exception, reldoc);
        //this.logItems.push(logItem);

        var appender, cnt = this.appenders.length;
        for (var i=0;i<cnt;i++)
        {
            appender = this.appenders[i];
            appender.append(logItem);
        }

        this.itemCounts[level] += 1;
    };
    _pLogger.trace = function (msg, exception, reldoc)
    {
        if (this.level <= nexacro.Logger.TRACE)
            this._log(nexacro.Logger.TRACE, msg, exception, reldoc);
    };
    _pLogger.info = function (msg, exception, reldoc)
    {
        if (this.level <= nexacro.Logger.INFO)
            this._log(nexacro.Logger.INFO, msg, exception, reldoc);
    };
    _pLogger.warn = function (msg, exception, reldoc)
    {
        if (this.level <= nexacro.Logger.WARN)
            this._log(nexacro.Logger.WARN, msg, exception, reldoc);
    };
    _pLogger.error = function (msg, exception, reldoc)
    {
        if (this.level <= nexacro.Logger.ERROR)
            this._log(nexacro.Logger.ERROR, msg, exception, reldoc);
    };
    _pLogger.clear = function ()
    {
        this.logItems = [];
        this.location = {};
        this.itemCounts.fill(0);

        var appender, cnt = this.appenders.length;
        for (var i = 0; i < cnt; i++)
        {
            appender = this.appenders[i];
            appender.clear();
        }
    };

    _pLogger.addLocation = function (typeText)
    {
        if (!this.location[typeText])
        {
            this.location[typeText] = new nexacro.Logger.Location();
        }
    };
    _pLogger.removeLocation = function (typeText)
    {
        if (this.location[typeText])
        {
            delete this.location[typeText];
        }
    };
    _pLogger.enterContext = function (loctype, type, name)
    {
        var location = this.location[loctype];
        if (location)
        {
            location.contexts.unshift({ type: type, name: name, line: "" });
        }
    };
    _pLogger.leaveContext = function (loctype)
    {
        var location = this.location[loctype];
        if (location)
        {
            location.contexts.shift();
        }
    };
    _pLogger.setLineMark = function (loctype, line)
    {
        var location = this.location[loctype];
        if (location)
        {
            var context = location.contexts[0];
            if (context)
            {
                context.line = line;
            }
        }
    };
    _pLogger.getLineMark = function (loctype)
    {
        var location = this.location[loctype];
        if (location)
        {
            var context = location.contexts[0];
            if (context)
            {
                return context.line;
            }
        }
    };


    //----------------------------------------------------------------
    // LoggerLocation
    nexacro.Logger.Location = function ()
    {
        this.contexts = [];
    };

    var _pLoggerLocation = nexacro._createPrototype(Object, nexacro.Logger.Location);
    nexacro.Logger.Location.prototype = _pLoggerLocation;

    //----------------------------------------------------------------
    // LoggerReference
    nexacro.Logger.Reference = function (title, url, line)
    {
        this.title = title;
        this.url = url;
        this.line = line;
    };

    var _pLoggerReference = nexacro._createPrototype(Object, nexacro.Logger.Reference);
    nexacro.Logger.Reference.prototype = _pLoggerReference;

    //----------------------------------------------------------------
    // LoggerItem
    nexacro.Logger.Item = function (category, level, message, location, exception, reference)
    {
        this.time = (new Date());

        this.category = (category || "");
        this.level = level;
        this.message = message;
        this.exception = exception;
        this.location = location;
        this.reference = reference;
    };

    var _pLoggerItem = nexacro._createPrototype(Object, nexacro.Logger.Item);
    nexacro.Logger.Item.prototype = _pLoggerItem;

    _pLoggerItem.time = 0;
    _pLoggerItem.category = "";
    _pLoggerItem.level = 0;
    _pLoggerItem.message = "";
    _pLoggerItem.exception = null;
    _pLoggerItem.location = null;
    _pLoggerItem.reference = null;  // { title:"", url:file, type:"", line: number }

    _pLoggerItem.getTimeStamp = function (format)
    {
        var time = this.time;

        var year = nexacro._padLeft(time.getFullYear() + "", 4, '0');
        var month = nexacro._padLeft((time.getMonth() + 1) + "", 2, '0');
        var day = nexacro._padLeft(time.getDate() + "", 2, '0');

        var hour = nexacro._padLeft(time.getHours() + "", 2, '0');
        var minute = nexacro._padLeft(time.getMinutes() + "", 2, '0');
        var second = nexacro._padLeft(time.getSeconds() + "", 2, '0');

        var second = nexacro._padLeft(time.getSeconds() + "", 2, '0');

        var msecond = nexacro._padRight(time.getMilliseconds() + "", 3, 0);

        var offset = time.getTimezoneOffset();
        var dh = nexacro._padLeft(Math.floor(Math.abs(offset) / 60) + "", 2, '0');
        var dm = nexacro._padLeft((Math.abs(offset) % 60) + "", 2, 0);

        var zone = (offset < 0 ? '+' : '-') + dh + dm;

        var timestamp = format;
        timestamp = timestamp.replace(/y{1,4}/g, year).replace(/MM/g, month).replace(/dd/g, day);
        timestamp = timestamp.replace(/hh/g, hour).replace(/mm/g, minute).replace(/ss/g, second);
        timestamp = timestamp.replace(/SSS/g, msecond);
        timestamp = timestamp.replace(/Z/g, zone);

        return timestamp;
    };
    _pLoggerItem.getLevelText = function ()
    {
        return nexacro.Logger.getLevelText(this.level);
    };
    _pLoggerItem.getCategory = function ()
    {
        return this.category;
    };
    _pLoggerItem.getMessage = function ()
    {
        return this.message;
    };
    _pLoggerItem.getReference = function ()
    {
        return this.reference;
    };


    //----------------------------------------------------------------
    // LoggerLayout
    nexacro.Logger.Layout = function ()
    {
        this.starttime = (new Date());
    };
    var _pLoggerLayout = nexacro._createPrototype(Object, nexacro.Logger.Layout);
    nexacro.Logger.Layout.prototype = _pLoggerLayout;

    nexacro.Logger.addLayoutType("default", nexacro.Logger.Layout);

    _pLoggerLayout.pattern = "%d %c %p> %l %m\n";
    _pLoggerLayout.starttime = 0;

    _pLoggerLayout.toFormatMessage = function (logItem)
    {
        var result, formattedMessage = "";
        var pattern = this.pattern;
        var regexp = /%(-?[0-9]+)?(\.?[0-9]+)?([cdflmnpr%])(\{([^\}]+)\})?|([^%]+)/;

        while ((result = regexp.exec(pattern)))
        {
            var matched = result[0];

            var padding = result[1];
            var leftjustify, minwidth, maxwidth;
            if (padding && padding.charAt(0) == "-")
            {
                leftjustify = true;
                minwidth = parseInt(padding.substr(1), 10);
            }
            else
            {
                leftjustify = false;
                minwidth = parseInt(padding, 10);
            }

            var trunc = result[2];
            if (trunc)
            {
                maxwidth = parseInt(trunc.substr(1), 10);
            }

            var ch = result[3], specifier = result[5], plaintext = result[6];
            if (plaintext)
            {
                formattedMessage += "" + plaintext;
            }
            else
            {
                var part = "";
                switch (ch)
                {
                    case "c": // category
                        part = logItem.category;
                        break;

                    case "d": // date
                        if (specifier)
                        {
                            part = logItem.getTimeStamp(specifier);
                        }
                        else
                        {
                            part = logItem.getTimeStamp(nexacro.Logger.DEFAULT_DATE_FORMAT);
                        }
                        break;

                    case "l": // location
                        var location = logItem.location;
                        if (location)
                        {
                            for (var type in location)
                            {
                                var objLocation = location[type];

                                var context, cnt = (objLocation ? objLocation.contexts.length : 0);
                                if (cnt > 0)
                                {
                                    var active_context = objLocation.contexts[0];

                                    var last_line = active_context ? parseInt(objLocation[0].line) : -1;
                                    if (last_line != NaN && last_line > -1)
                                    {
                                        var segments = [];
                                        for (var i = cnt - 1; i >= 0; i--)
                                        {
                                            context = objLocation.contexts[i];
                                            segments.push(context.name || context.type);
                                        }
                                        segments.push(last_line);

                                        part = type + ":" + segments.join(':');
                                    }
                                }
                            }
                        }
                        break;

                    case "m": // message
                        part = logItem.message;
                        break;

                    case "n":
                        part = "\n";
                        break;

                    case "p": // priority
                        part = logItem.getLevelText();
                        break;

                    case "r":   // elapsed time(milliseconds)
                        part = ((logItem.time.getTime() - this.starttime.getTime()) + "");
                        break;

                    case "%": // percent sign
                        part = "%";
                        break;

                    default:
                        part = matched;
                        break;
                }

                // maxwidth
                var len;

                if (maxwidth && maxwidth < part.length)
                {
                    part = part.substring(0, maxwidth);
                }

                // minwidth
                if (minwidth && minwidth > part.length)
                {
                    var padtext = ' ';
                    padtext.repeat(minwidth - part.length);

                    if (leftjustify)
                        part += padtext;
                    else
                        part = padtext + part;
                }
                formattedMessage += part;
            }
            pattern = pattern.substr(result.index + result[0].length);
        }
        return formattedMessage;
    };
    _pLoggerLayout.getHeader = function (category)
    {
        return "";
    };
    _pLoggerLayout.getFooter = function ()
    {
        return "";
    };
    _pLoggerLayout.getSeparator = function ()
    {
        return "";
    };

    //----------------------------------------------------------------
    // LoggerLayout - XML
    nexacro.Logger.XmlLayout = function ()
    {
        nexacro.Logger.Layout.call(this);
    };
    var _pLoggerXmlLayout = nexacro._createPrototype(nexacro.Logger.Layout, nexacro.Logger.XmlLayout);
    nexacro.Logger.XmlLayout.prototype = _pLoggerXmlLayout;

    nexacro.Logger.addLayoutType("xml", nexacro.Logger.XmlLayout);

    _pLoggerXmlLayout.contenttype = "";
    _pLoggerXmlLayout.srcurl = "";
    _pLoggerXmlLayout.desturl = "";

    _pLoggerXmlLayout.toFormatMessage = function (logItem)
    {
        //var xmlMsg = "<item timestamp=\"" +
        //            logItem.getTimeStamp(nexacro.Logger.DEFAULT_DATE_FORMAT) + "\" level=\"" +
        //            logItem.getLevelText() + "\" category=\"" +
        //            logItem.category + "\">\n";
        var xmlMsg = "<item level=\"" + logItem.getLevelText() + "\">\n";
        
        xmlMsg += "\t<message><![CDATA[" + logItem.message + "]]></message>\n";

        var ref = logItem.getReference();
        if (ref)
        {                                    
            if (ref.line)
                xmlMsg += "\t<reference title=\"" + ref.title + "\" url=\"" + ref.url + "\" line=\"" + ref.line + "\"/>\n";
            else
                xmlMsg += "\t<reference title=\"" + ref.title + "\" url=\"" + ref.url + "\"/>\n";
        }

        var location = logItem.location;
        if (location)
        {
            for (var type in location)
            {
                var objLocation = location[type];

                var context, cnt = ( objLocation ? objLocation.contexts.length : 0);
                if (cnt > 0)
                {
                    var active_context = objLocation.contexts[0];
                    var last_line = active_context ? parseInt(active_context.line) : -1;

                    if (last_line != NaN && last_line > -1)
                    {
                        xmlMsg += "\t<location type=\"" + type + "\">\n";

                        var indent = "\t", context_xml = "", child_xml = "";
                        for (var i = 0; i < cnt; i++)
                        {
                            context = objLocation.contexts[i];

                            if (child_xml)
                            {
                                context_xml = (indent.repeat(cnt - i) + "\t<context type=\"" + context.type + "\" name=\"" + context.name + "\" line=\"" + context.line + "\">\n");
                                context_xml += child_xml;
                                context_xml += (indent.repeat(cnt - i) + "\t</context>\n");
                            }
                            else
                            {
                                context_xml = (indent.repeat(cnt - i) + "\t<context type=\"" + context.type + "\" name=\"" + context.name + "\" line=\"" + context.line + "\"/>\n");
                            }
                            child_xml = context_xml;
                        }
                        xmlMsg += context_xml;
                        xmlMsg += "\t</location>\n";
                    }
                }
            }
        }

        var ex = logItem.exception;
        if (ex)
        {
            xmlMsg += "\t<exception>\n";

            var msg = ex.toString();
            if (msg)
            {
                xmlMsg += "\t\t<message><![CDATA[" + msg + "]]></message>\n";
            }

            if (ex.stack && ex.stack.length > 0)
            {
                xmlMsg += "\t\t<stacktrace>\n";

                for (var i = 0; i < ex.stack.length; i++)
                {
                    var frame = ex.stack[0];
                    var url = frame.getEvalOrigin() || frame.getFileName();
                    var func = frame.getMethodName() || frame.getFunctionName();

                    xmlMsg += "\t\t\t<stack function=\"" + func + "\" file=\"" + url + "\" line=\"" + frame.getLineNumber() + "\" />\n";
                }

                xmlMsg += "\t\t</stacktrace>\n";
            }
            xmlMsg += "\t</exception>\n";
        }
        xmlMsg += "</item>\n";
        
        var temp = xmlMsg;        
        xmlMsg = temp.split("&").join("&amp;");

        return xmlMsg;
    };
    _pLoggerXmlLayout.getHeader = function (category)
    {
        var temp = category;
        category = temp.split("&").join("&amp;");

        return "<migration version=\"1.0\" category=\"" + category + "\">\n";
    };
    _pLoggerXmlLayout.getFooter = function ()
    {
        return "</migration>\n";
    };
    _pLoggerXmlLayout.getSeparator = function ()
    {
        return "";
    };

    //----------------------------------------------------------------
    // LoggerAppender
    nexacro.Logger.Appender = function ()
    {

    };
    var _pLoggerAppender = nexacro._createPrototype(Object, nexacro.Logger.Appender);
    nexacro.Logger.Appender.prototype = _pLoggerAppender;

    nexacro.Logger.addAppenderType("default", nexacro.Logger.Appender);

    _pLoggerAppender.layout = null;
    _pLoggerAppender._is_opened = false;

    _pLoggerAppender.open = function (category)
    {
        this._is_opened = true;
    };
    _pLoggerAppender.close = function ()
    {
        this._is_opened = false;
    };
    _pLoggerAppender.isopened = function ()
    {
        return this._is_opened;
    };

    _pLoggerAppender.append = function (logItem)
    {

    };
    _pLoggerAppender.clear = function ()
    {

    };
    _pLoggerAppender.setLayout = function (layout) // "default" | "xml" | instanceof nexacro.Logger.Layout
    {
        if (!layout || typeof layout == "string")
        {
            var layoutConstructor = nexacro.Logger.getLayoutType(layout);
            layout = new layoutConstructor();
        }

        if (layout instanceof nexacro.Logger.Layout)
            this.layout = layout;
        else
            this.layout = null;
    };

    //----------------------------------------------------------------
    // LoggerFileAppender
    nexacro.Logger.FileAppender = function (filepath)
    {
        this.filepath = filepath;
        this.layout = new nexacro.Logger.Layout();
    };
    var _pLoggerFileAppender = nexacro._createPrototype(nexacro.Logger.Appender, nexacro.Logger.FileAppender);
    nexacro.Logger.FileAppender.prototype = _pLoggerFileAppender;

    nexacro.Logger.addAppenderType("file", nexacro.Logger.FileAppender);

    _pLoggerFileAppender.filepath = "";

    _pLoggerFileAppender.open = function (category)
    {
        this._is_opened = true;

        var headerText = "";
        if (this.layout)
        {
            headerText = this.layout.getHeader(category);
        }
        if (this.filepath != "")
        {
            nexacro._writeFile(this.filepath, headerText);
        }
    };
    _pLoggerFileAppender.close = function ()
    {
        var footerText = "";
        if (this.layout)
        {
            footerText = this.layout.getFooter();
        }

        if (this.filepath != "" && footerText)
        {
            nexacro._writeFile(this.filepath, footerText, true);
        }

        this._is_opened = false;
    };

    _pLoggerFileAppender.append = function (logItem)
    {
        if (!this.isopened()) return;

        if (this.layout && this.filepath != "")
        {
            var message = this.layout.toFormatMessage(logItem);
            nexacro._writeFile(this.filepath, message, true);
        }
    };
    _pLoggerFileAppender.clear = function ()
    {
        nexacro._writeFile(this.filepath, "");
    };
}
//# sourceURL=lib\obj.logger.js
	
	