//==============================================================================
//
//  TOBESOFT Co., Ltd.
//  Copyright 2014 TOBESOFT Co., Ltd.
//  All Rights Reserved.
//
//  NOTICE: TOBESOFT permits you to use, modify, and distribute this file 
//          in accordance with the terms of the license agreement accompanying it.
//
//  Readme URL: http://www.nexacro.co.kr/legal/nexacro-public-license-readme-1.0.html	
//
//==============================================================================

if (!nexacro.Init_CSSParser)
{
    nexacro.Init_CSSParser = true;

    nexacro.CSSTYPES = {
        UNKNOWN: "unknown",
        EOF: "eof",

        WHITESPACE: "whitespace",
        NEWLINE: "newline",
        COMMENT: "comment",
        RULE: "rule",
        SELECTOR: "selector",
        COMBINATOR: "combinator",
        DELIM: "delim",                 // ,
        DECLARATION: "declaration",
        ATTRIBUTE: "attribute",
        PROPERTY: "property",
        ATTRDELIM: "attr delim",        // :
        VALUE: "value",
        DECLAREDELIM: "declare delim"   // ;
    };

    nexacro.SELECTORS = {
        UNKNOWN: "unknown",
        TYPE: "type",
        CLASS: "class",         // .
        ID: "hashid",           // #
        PSEUDOC: "pseudoc",     // :
        ATTRIBUTE: "attribute", // []
        UNIVERSAL: "universal"  // *
    };

    nexacro.SELECTORCOMBINATOR = {
        CHILD: "child",                 // >
        DESCENDANT: "descendant",       // whitespace
        ADJACENT: "adjacent sibling",   // +
        GSIBLING: "general sibling"     // ~
    };

    function inrange(ch, from, to) { return ch >= from && ch <= to; }
    function isreplacechar(ch) { return ch.charCodeAt(0) == 0xfffd; }
    function isnotachar(ch) { return ch.charCodeAt(0) == 0xfffe || ch.charCodeAt(0) == 0xffff; }
    function isdigit(ch) { return inrange(ch, '0', '9'); }
    function isletter(ch) { return inrange(ch, 'a', 'z') || inrange(ch, 'A', 'Z'); }
    function isnonascii(ch) { return ch.charCodeAt(0) >= 0x80; }
    function isnamestartchar(ch) { return (isletter(ch) || isnonascii(ch) || ch === '_'); }
    function isnamechar(ch) { return isnamestartchar(ch) || isdigit(ch) || ch === '-'; }
    function isnewlinechar(ch) { return (ch === '\f' || ch === '\r' || ch === '\n'); }
    function isvalidescape(ch1, ch2) { return ch1 === '\\' && !isnewlinechar(ch2); }
    function isstartidentifier(ch1, ch2, ch3)
    {
        if (ch1 === '-') return (isnamestartchar(ch2) || isvalidescape(ch2, ch3));
        else if (ch1 === '\\') return !isnewlinechar(ch2);
        else return isnamestartchar(ch1);
    }
    function iswhitespace(ch) { return ch === ' ' || ch === '\t'; }


    //==============================================================================
    // Parse Error Object
    function CssParseError(message, line, chars, url)
    {
        this.name = "CssParseError";
        this.line = line;
        this.chars = chars;

        if (url)
        {
            this.message = url + "(line:" + line + "): " + message;
        }
        else
        {
            this.message = message;
        }

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor);
        else
            this.stack = (new Error()).stack;
    }
    CssParseError.prototype = new Error();
    CssParseError.prototype.constructor = CssParseError;
    CssParseError.prototype.line = 0;
    CssParseError.prototype.chars = 0;

    nexacro.CssParseError = CssParseError;

    //==============================================================================
    // Transform Error Object
    function CssTransformError(message, code)
    {
        this.name = "CssTransformError";
        this.message = message;
        this.code = code;

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor);
        else
            this.stack = (new Error()).stack;
    }
    CssTransformError.prototype = new Error();
    CssTransformError.prototype.constructor = CssTransformError;
    CssTransformError.prototype.code = 0;

    nexacro.CssTransformError = CssTransformError;

    //==============================================================================
    // CSSStyleSheet
    nexacro.CSSStyleSheet = function ()
    {
        this.type = "stylesheet";
        this.url = "";
        this.items = []; // comment, whitespace, rule
    };
    var _pCSSStyleSheet = nexacro._createPrototype(Object, nexacro.CSSStyleSheet);
    nexacro.CSSStyleSheet.prototype = _pCSSStyleSheet;

    _pCSSStyleSheet._type_name = "CSSStyleSheet";

    _pCSSStyleSheet.createStyleRule = function ()
    {
        return new nexacro.CSSStyleRule(this);
    };
    _pCSSStyleSheet.getRuleList = function ()
    {
        var TYPES = nexacro.CSSTYPES;
        var rules = [], items = this.items;
        var len = items.length;

        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            if (item.type == TYPES.RULE)
            {
                rules.push(item.value);
            }
        }
        return rules;
    };
    _pCSSStyleSheet.append = function (type, value, line, chars)
    {
        return this.items.push({ type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleSheet.insert = function (index, type, value, line, chars)
    {
        if (index >= this.items.length)
            return this.append(type, value, line, chars);
        else
            return this.items.splice(index, 0, { type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleSheet.remove = function (index, count)
    {
        return this.items.splice(index, count || 1);
    };

    _pCSSStyleSheet.toJSON = function ()
    {
        var TYPES = nexacro.CSSTYPES;

        var jsonItems = [], items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.RULE:
                    jsonItems.push(item.value.toJSON());
                    break;

                    //case TYPES.COMMENT:
                    //case TYPES.WHITESPACE:
                    //case TYPES.NEWLINE:
                    //case TYPES.DELIM:
                default:
                    jsonItems.push(item);
                    break;
            }
        }
        return jsonItems;
    };
    _pCSSStyleSheet.toString = function (bValidAttrOnly)
    {
        var TYPES = nexacro.CSSTYPES;

        var cssText = "", items = this.items;
        var len = items.length;
        for (var i = 0; i < len;i++)
        {
            var item = items[i];
            switch(item.type)
            {
                case TYPES.RULE:
                    cssText += item.value.toString(bValidAttrOnly);
                    break;

                // case TYPES.COMMENT:
                //case TYPES.WHITESPACE:
                //case TYPES.NEWLINE:
                default:
                    cssText += item.value;
                    break;
            }
        }
        return cssText;
    };

    delete _pCSSStyleSheet;

    //==============================================================================
    // CSSStyleRule
    nexacro.CSSStyleRule = function (stylesheet)
    {
        this.type = "rule";
        this.parent = stylesheet;
        this.items = []; // whitespace, seletor

        //this.selectors = [];
        this.style = new nexacro.CSSStyleDeclaration(this);

        this._start_line = 0;
        this._start_chars = 0;
    };
    var _pCSSStyleRule = nexacro._createPrototype(Object, nexacro.CSSStyleRule);
    nexacro.CSSStyleRule.prototype = _pCSSStyleRule;

    _pCSSStyleRule._type_name = "CSSStyleRule";

    _pCSSStyleRule.createStyleSelector = function ()
    {
        return new nexacro.CSSStyleSelector(this);
    };

    _pCSSStyleRule.setParseInfo = function (line, chars)
    {
        this._start_line = line;
        this._start_chars = chars;
    };
    _pCSSStyleRule.getParent = function ()
    {
        return this.parent;
    };
    _pCSSStyleRule.getSelectorList = function ()
    {
        var TYPES = nexacro.CSSTYPES;
        var selectors = [], items = this.items;
        var len = items.length;

        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            if (item.type == TYPES.SELECTOR)
            {
                selectors.push(item.value);
            }
        }
        return selectors;
    };
    _pCSSStyleRule.removeSelector = function (index)
    {
        var TYPES = nexacro.CSSTYPES;
        var selector_idx = 0, items = this.items;
        var len = items.length;

        if (index < 0 || index >= len) 
            return false;

        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            if (item.type == TYPES.SELECTOR)
            {
                if (selector_idx == index)
                {
                    for (var j = i+1; j < len; j++)
                    {
                        item = items[j];
                        if (item.type == TYPES.SELECTOR)
                            break;
                    }

                    items.splice(i, j - i);
                    return true;
                }
                selector_idx++;
            }
        }

        return false;
    };
    _pCSSStyleRule.clone = function (rule, selectoronly)
    {
        if (rule)
        {
            var TYPES = nexacro.CSSTYPES;

            var items = this.items, srcitems = rule.items;
            var len = srcitems.length;

            for (var i = 0; i < len; i++)
            {
                var item = srcitems[i];
                if (item.type == TYPES.SELECTOR)
                {
                    var selector = this.createStyleSelector();
                    selector.clone(item.value);
                    items.push({ type: item.type, value: selector, line: 0, chars: 0 });
                }
                else
                {
                    items.push({ type: item.type, value: item.value, line: 0, chars: 0 });
                }
            }

            if (!selectoronly)
            {
                this.style.clone(rule.style);
            }
        }
        return this;
    };
    _pCSSStyleRule.append = function (type, value, line, chars)
    {
        return this.items.push({ type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleRule.insert = function (index, type, value, line, chars)
    {
        if (index >= this.items.length)
            return this.append(type, value, line, chars);
        else
            return this.items.splice(index, 0, { type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleRule.remove = function (index, count)
    {
        return this.items.splice(index, count || 1);
    };

    _pCSSStyleRule.parse = function (cssText, pos, line, chars)
    {
        var TYPES = nexacro.CSSTYPES;

        pos = (pos || 0);
        line = (line || 1);
        chars = (chars || 0);

        var scope = this;
        var ch, cn, spos, sline, schars;
        var len = cssText.length;

        // [RP:80228] 2018/05/31 inyoung0820 : [Migrator] 14에서 사용중인 xtheme 파일을 마이그레이션할 때 Load Fail 발생
        // css migrate시 빈파일 에러나는 현상 처리.
        var temp = cssText.trim();
        if (temp.length <= 1)
        {
            return 0;
        }
        //}}

        this.setParseInfo(line, chars);

        // parse identifier
        var _getIdentifierLength = function (thisRule)
        {
            var start = pos, tch;
            if (isstartidentifier(cssText.charAt(pos), cssText.charAt(pos + 1), cssText.charAt(pos+2)))
            {
                for (pos = pos + 1; pos < len; pos++)
                {
                    tch = cssText.charAt(pos);
                    if (!isnamechar(tch)) break;
                }
            }
            return pos - start;
        };

        var _gotoQuoteStringEnd = function (thisRule)
        {
            var tch = cssText.charAt(pos);
            if (tch === '"' || tch === "'")
            {
                var quoteCh = tch, qpos = pos, qline = line, qchars = chars;

                // skip single/double quote string
                for (pos=pos+1; pos < len; pos++)
                {
                    tch = cssText.charAt(pos);
                    chars++;

                    if (tch === '\\')
                    {
                        pos++;
                        chars++;
                    }
                    else if (tch === '\n')
                    {
                        line++;
                        chars = 0;
                    }
                    else if (tch === quoteCh)
                        break;
                }

                if (pos == len)
                {
                    throw new CssParseError("Unmatched " + quoteCh, qline, qchars, thisRule.parent.url);
                }
            }
            return pos;
        };
        var _gotoCommentEnd = function (thisRule)
        {
            var tch = cssText.charAt(pos);
            if (tch === '/' && cssText.charAt(pos + 1) === "*")
            {
                var cpos = pos, cline = line, cchars = chars;

                // skip comment string
                for (pos = pos + 2, chars += 2; pos < len; pos++)
                {
                    tch = cssText.charAt(pos);
                    chars++;

                    if (tch === '\\')
                    {
                        pos++;
                        chars++;
                    }
                    else if (tch === '\n')
                    {
                        line++;
                        chars = 0;
                    }
                    else if (tch === '*' && cssText.charAt(pos + 1) === '/')
                    {
                        pos++;
                        chars++;
                        break;
                    }   
                }

                if (pos == len)
                {
                    throw new CssParseError("Missing *" + "/", cline, cchars, thisRule.parent.url);
                }
            }
            return pos;
        };

        var _parseValue = function (thisRule)
        {
            if (scope.type != "attribute")
            {
                throw new CssParseError("Unknown token: " + cssText.substring(pos, pos + 10), line, chars, thisRule.parent.url);
            }

            // parse value
            var tch;
            spos = pos, sline = line, schars = chars;
            for (; pos < len; pos++)
            {
                tch = cssText.charAt(pos);
                if (tch === '\\')
                    pos++;
                else if (tch === '"' || tch === "'")
                    _gotoQuoteStringEnd(this);
                else if (tch === ';' || isnewlinechar(tch) || (tch === '/' && cssText.charAt(pos + 1) == '*'))
                {
                    pos = pos - 1;
                    break;
                }
            }
            
            if (pos == len)
            {
                throw new CssParseError("Missing ;", sline, schars, thisRule.parent.url);
            }
            scope.append(TYPES.VALUE, nexacro._wrapQuote(cssText.substring(spos, pos + 1)), sline, schars);
            chars += (pos - spos + 1);

            if(tch == ';')
            {
                scope.append(TYPES.DECLAREDELIM, ';', sline, chars);
                pos++;
                chars++;
            }

            thisRule.style.append(TYPES.ATTRIBUTE, scope, scope._start_line, scope._start_chars);
            scope = thisRule.style;
        };

        var iseof = false;
        while (pos < len)
        {
            ch = cssText.charAt(pos);
            spos = pos, sline = line, schars = chars;
           
            // consume whitespace for check decentant selector
            if (scope.type == "selector" && (iswhitespace(ch) || isnewlinechar(ch)))
            {
                var tch, tpos = pos+1, tline = line, tchars = chars, isdescendant = true;
                while (tpos < len)
                {
                    tch = cssText.charAt(tpos);
                    if (tch === '>' || tch === '+' || tch === '~')
                    {
                        isdescendant = false;
                        break;
                    }
                    else if (tch === ',' || tch === '{' || (tch === '/' && cssText.charAt(tpos + 1) === '*'))
                    {
                        isdescendant = false;
                        this.append(TYPES.SELECTOR, scope, scope._start_line, scope._start_chars);
                        scope = this;
                        break;
                    }
                    else if (isnewlinechar(tch))
                    {
                        if (tch == '\r')
                        {
                            tchars++; 
                        }
                        else
                        {
                            tline++;
                            tchars = 0;
                        }
                        tpos++;
                        continue;
                    }
                    else (!iswhitespace(tch))
                    {
                        break;
                    }

                    tpos++;
                    tchars++;
                }

                if (isdescendant)
                {
                    scope.append(TYPES.COMBINATOR, cssText.substring(spos, tpos), sline, schars);
                    pos = tpos;
                    line = tline;
                    chars = tchars;
                    continue;
                }
            }

            switch (ch)
            {
                // whitespace
                case ' ':   
                case '\t':
                    while (iswhitespace(cssText.charAt(pos + 1)))
                        pos++;

                    scope.append(TYPES.WHITESPACE, cssText.substring(spos, pos + 1), line, schars);
                    chars += pos - spos + 1;
                    break;

                // newline
                case '\r':
                    if (cssText.charAt(pos + 1) === '\n')
                        pos++;
                case '\f':
                case '\n':
                    scope.append(TYPES.NEWLINE, cssText.substring(spos, pos + 1), sline, schars);
                    line++;
                    chars = 0;
                    break;

                //style declaration block
                case '{':
                    if (scope.type == "selector")
                        this.append(TYPES.SELECTOR, scope, scope._start_line, scope._start_chars);

                    scope = this.style;
                    scope.setParseInfo(line, chars);
                    chars++;
                    break;
                case '}':
                    scope = this;
                    iseof = true;
                    chars++;
                    break;

                    // comment
                case '/':
                    cn = cssText.charAt(pos + 1);
                    if (cn === "*")
                    {
                        pos = _gotoCommentEnd(this);
                        scope.append(TYPES.COMMENT, cssText.substring(spos, pos + 1), sline, schars);
                        chars += pos - spos + 1;
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }
                    else
                    {
                        throw new CssParseError("Unknown token: " + ch, sline, schars, this.parent.url);
                    }
                    break;

                case '*':   // universal selector
                    if (scope == this || scope.type === "selector")
                    {
                        if (scope.type != "selector")
                        {
                            scope = this.createStyleSelector();
                            scope.setParseInfo(line, chars);
                        }

                        scope.append(nexacro.SELECTORS.UNIVERSAL, ch, line, chars);
                        chars++;
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }
                    break;

                case ':':   // pseudo class, property delim
                    if (scope.type == "attribute")
                    {
                        scope.append(TYPES.ATTRDELIM, ch, line, chars++);
                    }

                case '.':   // class selector
                case '#':   // id selector
                    if (scope == this || scope.type === "selector")
                    {
                        if (scope.type != "selector")
                        {
                            scope = this.createStyleSelector();
                            scope.setParseInfo(line, chars);
                        }

                        if (isnamestartchar(cssText.charAt(pos + 1)))
                            pos++;

                        // parse identifier
                        spos = pos, sline = line, schars = chars;
                        var identlen = _getIdentifierLength();
                        if (identlen > 0)
                        {
                            var selectorType;
                            if (ch === ".") selectorType = nexacro.SELECTORS.CLASS;
                            else if (ch === "#") selectorType = nexacro.SELECTORS.ID;
                            else if (ch === ":") selectorType = nexacro.SELECTORS.PSEUDOC;

                            scope.append(selectorType, cssText.substring(spos, spos + identlen), sline, schars);
                            pos = spos + identlen - 1;
                        }
                        chars += (pos - spos + 1);
                    }
                    else if (ch !== ':' && scope.type === "attribute")
                    {
                        _parseValue(this);
                    }
                    break;

                case '[':   // attribute selector
                    if (scope == this || scope.type === "selector")
                    {
						if (scope.type != "selector")
						{
							scope = this.createStyleSelector();
							scope.setParseInfo(sline, schars);
						}
						
                        spos = pos + 1, sline = line, schars = chars;
                        for (pos = spos; pos < len; pos++)
                        {
                            ch = cssText.charAt(pos);
                            chars++;

                            if (ch === '\n')
                            {
                                chars = 0;
                                line++;
                            }
                            else if (ch === '\\')
                            {
                                pos++;
                                chars++;
                            }
                            else if (ch === '"' || ch === "'")
                            {
                                pos = _gotoQuoteStringEnd(this);
                            }
                            else if (ch === ']')
                            {
                                break;
                            }
                        }

                        if (pos == len)
                        {
                            throw new CssParseError("Missing ]", sline, schars, this.parent.url);
                        }
						
                        scope.append(nexacro.SELECTORS.ATTRIBUTE, nexacro._wrapQuote(cssText.substring(spos, pos)), sline, schars);
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }

                    break;

                case '>':   // child combinator
                    if (scope.type == "selector")
                    {
                        scope.append(TYPES.COMBINATOR, ch, line, chars++);
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }
                    break;

                case '+':   // Adjacent sibling combinator
                    if (scope.type == "selector")
                    {
                        scope.append(TYPES.COMBINATOR, ch, line, chars++);
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }
                    break;

                case '~':   // General sibling combinator
                    if (scope.type == "selector")
                    {
                        scope.append(TYPES.COMBINATOR, ch, line, chars++);
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }
                    break;

                case ',':   // selector separator
                    if (scope == this || scope.type == "selector")
                    {
                        if (scope.type == "selector")
                        {
                            this.append(TYPES.SELECTOR, scope, scope._start_line, scope._start_chars);
                            scope = this;
                        }
                        scope.append(TYPES.DELIM, ch, line, chars++);
                    }
                    else if (scope.type === "attribute")
                    {
                        _parseValue(this);
                    }

                    break;

                case ';':
                    if (scope.type == "attribute")
                    {
                        this.style.append(TYPES.ATTRIBUTE, scope, scope._start_line, scope._start_chars);
                        scope.append(TYPES.DECLAREDELIM, ch, line, chars++);
                    }

                    scope = this.style;
                    break;

                default:
                    {
                        // selector
                        if (scope == this || scope.type == "selector")
                        {
                            // [RP:81046] 2018/07/23 Lauren : nexacro14 프로젝트 마이그레이트 시 테마에 주석만 있는 경우 오동작
                            // theme.css에 주석만있는경우 "Unknown selector name: " error 나는 현상 처리(빈파일 error와 동일).
                            temp = cssText.substring(pos, len);
                            temp = temp.trim();
                            if (temp.length <= 1) {
                                return 0;
                            }

                            if (!isnamestartchar(ch))
                            {                                 
                                throw new CssParseError("Unknown selector name:" + cssText.substring(pos, pos + 10), line, chars, this.parent.url);
                            }

                            if (scope.type != "selector")
                            {
                                scope = this.createStyleSelector();
                                scope.setParseInfo(line, chars);
                            }

                            // parse identifier
                            var identlen = _getIdentifierLength();
                            if (identlen > 0)
                            {
                                scope.append(nexacro.SELECTORS.TYPE, cssText.substring(spos, spos + identlen), sline, schars);
                                pos = spos + identlen - 1;
                            }
                            chars += (pos - spos + 1);
                        }
                        else if (scope == this.style || scope.type == "attribute")
                        {
                            if (scope.type != "attribute")
                            {
                                if (!isstartidentifier(ch, cssText.charAt(pos + 1), cssText.charAt(pos + 2)))
                                {
                                    throw new CssParseError("Unknown property name:" + cssText.substring(pos, pos + 10), line, chars, this.parent.url);
                                }

                                scope = this.style.createStyleAttribute();
                                scope.setParseInfo(line, chars);

                                // parse name
                                var identlen = _getIdentifierLength();
                                if (identlen > 0)
                                {
                                    scope.append(TYPES.PROPERTY, cssText.substring(spos, spos + identlen), sline, schars);
                                    pos = spos + identlen - 1;
                                }
                                chars += (pos - spos + 1);
                            }
                            else
                            {
                                // parse value
                                _parseValue(this);
                            }
                        }
                    }
                    break;
            }

            if (iseof)
                break;

            pos++;
        }

        return {pos: pos, line: line, chars: chars};
    };

    _pCSSStyleRule.toJSON = function ()
    {
        var TYPES = nexacro.CSSTYPES;

        var jsonItems = [], items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.SELECTOR:
                    jsonItems.push(item.value.toJSON());
                    break;

                    //case TYPES.COMMENT:
                    //case TYPES.WHITESPACE:
                    //case TYPES.NEWLINE:
                    //case TYPES.DELIM:
                default:
                    jsonItems.push(item);
                    break;
            }
        }
        jsonItems.push(this.style.toJSON());

        return { type: this.type, value: jsonItems, line: this._start_line, chars: this._start_chars };
    };
    _pCSSStyleRule.toString = function (bValidAttrOnly)
    {
        var TYPES = nexacro.CSSTYPES;

        var cssText = "", items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.SELECTOR:
                    cssText += item.value.toString(bValidAttrOnly);
                    break;

                //case TYPES.COMMENT:
                //case TYPES.WHITESPACE:
                //case TYPES.NEWLINE:
                //case TYPES.DELIM:
                default:
                    cssText += item.value;
                    break;
            }
        }
        var styleText = this.style.toString(bValidAttrOnly);
        if (cssText.length > 0)
            cssText += "{" + (styleText ? styleText : "\n") + "}";

        return cssText;
    };
    _pCSSStyleRule.toCommentString = function (prefixMsg)
    {
        var cssText = this.toString(), commentText = "";

        if (prefixMsg)
        {
            cssText = prefixMsg + "\n" + cssText;
        }

        var ch, cn, quote, comment, pos = 0, len = cssText.length;
        while (pos < len)
        {
            ch = cssText.charAt(pos);

            if (ch === '\\')
            {
                commentText += cssText.substring(pos, pos + 2);
                pos++;
            }
            else if (ch === '\n')
            {
                commentText += ch;
                commentText += " * ";
            }
            else if (quote)
            {
                commentText += ch;
                if (ch === quote)
                    quote = "";
            }
            else if (ch === "'" || ch === "'")
            {
                commentText += ch;
                quote = ch;
            }
            else if (comment)
            {
                commentText += ch;
                if (ch === '*' && cssText.charAt(pos + 1) === '/')
                {
                    commentText += "\\/";
                    pos++;
                    comment = false;
                }
            }
            else if ((ch === "/" && cssText.charAt(pos + 1) === "*"))
            {
                commentText += "\\/*";
                pos++;
                comment = true;
            }
            else
            {
                commentText += ch;
            }

            pos++;
        }

        commentText = "/* " + commentText + "\n */";
        return commentText;
    };

    delete _pCSSStyleRule;

    //==============================================================================
    // CSSStyleSelector
    nexacro.CSSStyleSelector = function (rule)
    {
        this.type = "selector";
        this.parentRule = rule;
        this.items = []; // 

        this._start_line = 0;
        this._start_chars = 0;
    };
    var _pCSSStyleSelector = nexacro._createPrototype(Object, nexacro.CSSStyleSelector);
    nexacro.CSSStyleSelector.prototype = _pCSSStyleSelector;

    _pCSSStyleSelector._type_name = "CSSStyleSelector";

    _pCSSStyleSelector.getParent = function ()
    {
        return this.parentRule;
    };

    _pCSSStyleSelector.setParseInfo = function (line, chars)
    {
        this._start_line = line;
        this._start_chars = chars;
    };

    _pCSSStyleSelector.clone = function (selector)
    {
        if (selector)
        {
            var items = this.items, srcitems = selector.items;
            var len = srcitems.length;

            for (var i = 0; i < len; i++)
            {
                var item = srcitems[i];
                items.push({ type: item.type, value: item.value, line: 0, chars: 0 });
            }
        }
        return this;
    };

    _pCSSStyleSelector.getSelectorText = function ()
    {
        var TYPES = nexacro.CSSTYPES;
        var SELECTORS = nexacro.SELECTORS;

        var cssText = "", items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case SELECTORS.CLASS:
                    cssText += "." + item.value;
                    break;

                case SELECTORS.ID:
                    cssText += "#" + item.value;
                    break;

                case SELECTORS.PSEUDOC:
                    cssText += ":" + item.value;
                    break;

                case SELECTORS.ATTRIBUTE:
                    cssText += "[" + nexacro._stripQuote(item.value) + "]";
                    break;

                case TYPES.COMMENT:
                case TYPES.WHITESPACE:
                    break;

                case TYPES.COMBINATOR:
                    cssText += item.value;
                    break;

                default:
                    cssText += item.value;
                    break;
            }
        }

        return cssText;
    };

    _pCSSStyleSelector.findItemIndexOf = function (itemtype, start)
    {
        if (start == null) start = 0;
        if (start < 0 || !itemtype)
            return -1;

        var TYPES = nexacro.CSSTYPES;
        var SELECTORS = nexacro.SELECTORS;

        var items = this.items;
        var len = items.length;

        var find = -1;
        for (var i = start; i < len; i++)
        {
            var item = items[i];
            if (item.type == itemtype)
            {
                return i;
            }
        }

        return find;
    };
    _pCSSStyleSelector.lastItemIndexOf = function (itemtype, start)
    {
        if (start == null) start = 0;
        if (start < 0 || !itemtype)
            return -1;

        var TYPES = nexacro.CSSTYPES;
        var SELECTORS = nexacro.SELECTORS;

        var items = this.items;
        var len = items.length;

        var find = -1;
        for (var i = len - start - 1; i >= 0; i--)
        {
            var item = items[i];
            if (item.type == itemtype)
            {
                return i;
            }
        }

        return find;
    };
    _pCSSStyleSelector.append = function (type, value, line, chars)
    {
        return this.items.push({ type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleSelector.insert = function (index, type, value, line, chars)
    {
        if (index >= this.items.length)
            return this.append(type, value, line, chars);
        else
            return this.items.splice(index, 0, { type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleSelector.remove = function (index, count)
    {
        return this.items.splice(index, count || 1);
    };

    _pCSSStyleSelector.toJSON = function ()
    {
        return { type: this.type, value: this.items, line: this._start_line, chars: this._start_chars };
    };
    _pCSSStyleSelector.toString = function (bValidAttrOnly)
    {
        var TYPES = nexacro.CSSTYPES;
        var SELECTORS = nexacro.SELECTORS;

        var cssText = "", items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
                {
                case SELECTORS.CLASS:
                    cssText += "." + item.value;
                    break;

                case SELECTORS.ID:
                    cssText += "#" + item.value;
                    break;

                case SELECTORS.PSEUDOC:
                    cssText += ":" + item.value;
                    break;

                case SELECTORS.ATTRIBUTE:
                    cssText += "[" + nexacro._stripQuote(item.value) + "]";
                    break;

                //case TYPES.COMMENT:
                //case TYPES.WHITESPACE:
                //case TYPES.NEWLINE:
                //case TYPES.DELIM:
                //case SELECTORS.TYPE:
                //case SELECTORS.UNIVERSAL:
                //case TYPES.COMBINATOR:
                default:
                    cssText += item.value;
                    break;
                }
        }

        return cssText;
    };

    delete _pCSSStyleSelector;

    //==============================================================================
    // CSSStyleDeclaration
    nexacro.CSSStyleDeclaration = function (rule)
    {
        this.type = "declaration";
        this.parentRule = rule;
        this.items = []; // comment, whitespace, property, value, delim

        this._start_line = 0;
        this._start_chars = 0;
    };
    var _pCSSStyleDeclaration = nexacro._createPrototype(Object, nexacro.CSSStyleDeclaration);
    nexacro.CSSStyleDeclaration.prototype = _pCSSStyleDeclaration;

    _pCSSStyleDeclaration._type_name = "CSSStyleDeclaration";

    _pCSSStyleDeclaration.createStyleAttribute = function ()
    {
        return new nexacro.CSSStyleAttribute(this);
    };

    _pCSSStyleDeclaration.getParent = function ()
    {
        return this.parentRule;
    };

    _pCSSStyleDeclaration.setParseInfo = function (line, chars)
    {
        this._start_line = line;
        this._start_chars = chars;
    };

    _pCSSStyleDeclaration.clone = function (style)
    {
        if (style)
        {
            var TYPES = nexacro.CSSTYPES;

            var items = this.items, srcitems = style.items;
            var len = srcitems.length;

            for (var i = 0; i < len; i++)
            {
                var item = srcitems[i];
                if (item.type == TYPES.ATTRIBUTE)
                {
                    var attr = this.createStyleAttribute();
                    attr.clone(item.value);
                    items.push({ type: item.type, value: item.value, line: 0, chars: 0 });
                }
                else
                {
                    items.push({ type: item.type, value: item.value, line: 0, chars: 0 });
                }
            }
        }
        return this;
    };

    _pCSSStyleDeclaration.append = function (type, value, line, chars)
    {
        return this.items.push({ type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleDeclaration.insert = function (index, type, value, line, chars)
    {
        if (index >= this.items.length)
            return this.append(type, value, line, chars);
        else
            return this.items.splice(index, 0, { type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleDeclaration.remove = function (index, count)
    {
        return this.items.splice(index, count || 1);
    };

    _pCSSStyleDeclaration.toJSON = function ()
    {
        var TYPES = nexacro.CSSTYPES;

        var jsonItems = [], items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.ATTRIBUTE:
                    jsonItems.push(item.value.toJSON());
                    break;

                    //case TYPES.COMMENT:
                    //case TYPES.WHITESPACE:
                    //case TYPES.NEWLINE:
                default:
                    jsonItems.push(item);
                    break;
            }
        }

        return { type: this.type, value: jsonItems, line: this._start_line, chars: this._start_chars };
    };
    _pCSSStyleDeclaration.toString = function (bValidAttrOnly)
    {
        var TYPES = nexacro.CSSTYPES;

        var cssText = "", attrText = "", skip = false, cssLines = [];
        var items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.ATTRIBUTE:
                    attrText = item.value.toString(bValidAttrOnly);
                    skip = (bValidAttrOnly && attrText == "");

                    if (!skip) cssText += attrText;
                    break;

                case TYPES.NEWLINE:
                    if (!skip)
                    {
                        cssText += item.value;
                        cssLines.push(cssText);
                    }
                    cssText = "";
                    skip = false;
                    break;

                //case TYPES.COMMENT:
                //case TYPES.WHITESPACE:
                //case TYPES.NEWLINE:
                default:
                    cssText += item.value;
                    break;
            }
        }

        if (!skip && cssText)
        {
            cssLines.push(cssText);
        }

        return cssLines.join('');
    };

    delete _pCSSStyleDeclaration;

    //==============================================================================
    // CSSStyleAttribute
    nexacro.CSSStyleAttribute = function (declaration)
    {
        this.type = "attribute";
        this.parentDeclaration = declaration;
        this.items = []; // 

        this._start_line = 0;
        this._start_chars = 0;
    };
    var _pCSSStyleAttribute = nexacro._createPrototype(Object, nexacro.CSSStyleAttribute);
    nexacro.CSSStyleAttribute.prototype = _pCSSStyleAttribute;

    _pCSSStyleAttribute._type_name = "CSSStyleAttribute";

    _pCSSStyleAttribute.getParent = function ()
    {
        return this.parentDeclaration;
    };

    _pCSSStyleAttribute.setParseInfo = function (line, chars)
    {
        this._start_line = line;
        this._start_chars = chars;
    };

    _pCSSStyleAttribute.clone = function (attr)
    {
        if (attr)
        {
            var TYPES = nexacro.CSSTYPES;

            var items = this.items, srcitems = attr.items;
            var len = srcitems.length;

            for (var i = 0; i < len; i++)
            {
                var item = srcitems[i];
                items.push({ type: item.type, value: item.value, line: 0, chars: 0 });
            }
        }
        return this;
    };

    _pCSSStyleAttribute.getPropertyName = function ()
    {
        var TYPES = nexacro.CSSTYPES;

        var name = "", items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            if (item.type == TYPES.PROPERTY)
            {
                name = item.value;
                break;
            }
        }
        return name;
    };
    _pCSSStyleAttribute.getPropertyValue = function ()
    {
        var TYPES = nexacro.CSSTYPES;

        var value, items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            if (item.type == TYPES.VALUE)
            {
                value = nexacro._stripQuote(item.value);
                break;
            }
        }
        return value;
    };

    _pCSSStyleAttribute.setProperty = function (name, value)
    {
        var TYPES = nexacro.CSSTYPES;

        var items = this.items;
        if (value && (typeof (value) == "string"))
            value = value.trim();

        var propItem, valItem, endDelim;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            if (item.type == TYPES.PROPERTY)
            {
                propItem = item;
                item.value = name;
            }
            else if (propItem && item.type == TYPES.VALUE)
            {
                valItem = item;
                item.value = (value ? nexacro._wrapQuote(value) : "");
            }
            else if (item.type == TYPES.DECLAREDELIM)
            {
                endDelim = item;
            }
        }

        if (!propItem && name)
        {
            items.push({ type: TYPES.PROPERTY, value: name, line: "", chars: "" });
            items.push({ type: TYPES.ATTRDELIM, value: ":", line: "", chars: "" });
        }
        
        if (!valItem && value)
        {
            items.push({ type: TYPES.VALUE, value: nexacro._wrapQuote(value), line: "", chars: "" });
        }

        if (!endDelim)
        {
            items.push({ type: TYPES.DECLAREDELIM, value: ";", line: "", chars: "" });
        }
    };

    _pCSSStyleAttribute.append = function (type, value, line, chars)
    {
        return this.items.push({ type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleAttribute.insert = function (index, type, value, line, chars)
    {
        if (index >= this.items.length)
            return this.append(type, value, line, chars);
        else
            return this.items.splice(index, 0, { type: type, value: value, line: line, chars: chars });
    };
    _pCSSStyleAttribute.remove = function (index, count)
    {
        return this.items.splice(index, count || 1);
    };

    _pCSSStyleAttribute.toJSON = function ()
    {
        return { type: this.type, value: this.items, line: this._start_line, chars: this._start_chars };
    };
    _pCSSStyleAttribute.toString = function (bValidAttrOnly)
    {
        var TYPES = nexacro.CSSTYPES;

        var cssText = "", items = this.items;
        var len = items.length, bHasValue = false;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.VALUE:
                    if (item.value.trim())
                        bHasValue = true;
                    cssText += nexacro._stripQuote(item.value);
                    break;

                // case TYPES.COMMENT:
                //case TYPES.WHITESPACE:
                //case TYPES.NEWLINE:
                //case TYPES.ATTRDELIM:
                //case TYPES.DECLAREDELIM:
                default:
                    cssText += item.value;
                    break;
            }
        }
        if (bValidAttrOnly && !bHasValue)
            return "";

        return cssText;
    };
    _pCSSStyleAttribute.toCommentString = function (msg)
    {
        var TYPES = nexacro.CSSTYPES;

        var commentText = "", items = this.items;
        var len = items.length;
        for (var i = 0; i < len; i++)
        {
            var item = items[i];
            switch (item.type)
            {
                case TYPES.VALUE:
                    commentText += nexacro._stripQuote(item.value);
                    break;

                case TYPES.COMMENT:
                    commentText += ("\\" + item.value.substring(0, item.value.length - 2) + "\\/");
                    break;

                    //case TYPES.WHITESPACE:
                    //case TYPES.NEWLINE:
                    //case TYPES.ATTRDELIM:
                    //case TYPES.DECLAREDELIM:
                default:
                    commentText += item.value;
                    break;
            }
        }
        if (msg)
        {
            commentText = "/* " + commentText + " " + msg + " */";
        }
        else
        {
            commentText = "/* " + commentText + " */";
        }

        return commentText;
    };

    delete _pCSSStyleAttribute;

    //==============================================================================
    // CSSParser
    nexacro.CSSParser = function (url)
    {
        this.url = url;
    };

    var _pCSSParser = nexacro._createPrototype(Object, nexacro.CSSParser);
    nexacro.CSSParser.prototype = _pCSSParser;

    _pCSSParser._type_name = "CSSParser";
    _pCSSParser.url = "";

    _pCSSParser.parse = function (cssText)
    {
        var TYPES = nexacro.CSSTYPES;
        var stylerule, stylesheet = new nexacro.CSSStyleSheet();
        stylesheet.url = this.url;

        var pos = 0, line = 1, chars = 0;
        var ch, cn, spos, sline, schars;
        var len = cssText.length;

        while (pos < len)
        {
            ch = cssText.charAt(pos);
            if (ch == '') break;

            spos = pos, sline = line, schars = chars;

            switch (ch)
            {
                // whitespace
                case ' ':
                case '\t':
                    while (iswhitespace(cssText.charAt(pos + 1)))
                        pos++;

                    stylesheet.append(TYPES.WHITESPACE, cssText.substring(spos, pos + 1), line, schars);
                    chars += pos - spos + 1;
                    break;

                // newline
                case '\r':
                    if (cssText.charAt(pos+1) === '\n') 
                        pos++;
                case '\f':
                case '\n':
                    stylesheet.append(TYPES.NEWLINE, cssText.substring(spos, pos + 1), sline, schars);
                    line++;
                    chars = 0;
                    break;

                // comment
                case '/':
                    cn = cssText.charAt(pos + 1);
                    if (cn === "*")
                    {
                        for (pos = pos + 2, chars+=2; pos < len; pos++)
                        {
                            ch = cssText.charAt(pos);
                            chars++;

                            if (ch === '\n')
                            {
                                chars = 0;
                                line++;
                            }
                            else if (ch === '*' && cssText.charAt(pos + 1) === '/')
                            {
                                pos++;
                                chars++;
                                break;
                            }
                        }

                        if (pos == len)
                        {
                            throw new CssParseError("Missing *" + "/", sline, schars, this.url);
                        }
                        stylesheet.append(TYPES.COMMENT, cssText.substring(spos, pos + 1), sline, schars);

                        break;
                    }

                default:
                    {
                        if (isreplacechar(ch) || isnotachar(ch))
                        {
                            chars++;
                        }
                        else
                        {
                            stylerule = stylesheet.createStyleRule();

                            var parseinfo = stylerule.parse(cssText, pos, line, chars);
                            stylesheet.append(TYPES.RULE, stylerule, line, chars);
                            pos = parseinfo.pos;
                            line = parseinfo.line;
                            chars = parseinfo.chars;
                        }
                    }
                    break;                
            }

            pos++;
        }

        return stylesheet;
    };
};

//# sourceURL=lib\obj.cssparser.js