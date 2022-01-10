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

if (!nexacro.Init_theme_api)
{
    nexacro.Init_theme_api = true;

	nexacro._getDefaultThemePath = function (product_name, product_ver)
	{
	    var appFolder = nexacro.__getAppFolderPath();
	    return nexacro._normalizePath(appFolder, product_name + "\\" + product_ver + "\\Cache\\Theme\\");
	};

    //==============================================================================
    // XTheme APIs
	nexacro._isXThemeFile = function (path)
	{
	    return nexacro.__isXThemeFile(path);
	};
	nexacro._loadXTheme = function (path)
	{
	    return nexacro.__loadXTheme(path);
	};
	nexacro._saveXTheme = function (obj, path)
	{
	    return nexacro.__saveXTheme(obj, path);
	};
	nexacro._getXThemeVersion = function (obj)
	{
	    return nexacro.__getXThemeVersion(obj);
	};
	nexacro._setXThemeVersion = function (obj, ver)
	{
	    return nexacro.__setXThemeVersion(obj, ver);
	};
	nexacro._getXThemeItemCount = function (obj)
	{
	    return nexacro.__getXThemeItemCount(obj);
	};
	nexacro._getXThemeItem = function (obj, itemName)
	{
	    return nexacro.__getXThemeItem(obj, itemName);
	};
	nexacro._setXThemeItem = function (obj, itemName, data)
	{
	    return nexacro.__setXThemeItem(obj, itemName, data);
	};
	nexacro._updateXThemeItemName = function (obj, curItemName, newItemName)
	{
	    return nexacro.__updateXThemeItemName(obj, curItemName, newItemName);
	};
	nexacro._extractXTheme = function (filepath, destpath)
	{
	    return nexacro.__extractXTheme(filepath, destpath);
	};
	nexacro._archiveXTheme = function (srcpath, filepath)
	{
	    return nexacro.__archiveXTheme(srcpath, filepath);
	};
}
//# sourceURL=lib\api.theme.js
	
	