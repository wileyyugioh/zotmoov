/*
This code is derived from Zotero
Zotero is Copyright © 2018 Corporation for Digital Scholarship,
Vienna, Virginia, USA http://digitalscholar.org

Copyright © 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017
Roy Rosenzweig Center for History and New Media, George Mason University,
Fairfax, Virginia, USA  http://zotero.org

Licensed under the GNU General Public License v3.0
https://www.gnu.org/licenses/gpl-3.0.html
*/


var Zotlib = {

    // We need to modify this function over the Zotero one cause we do not want to change the attachmentTitle!
    // We added arg item cause fug
    getRenamedFileBaseNameIfAllowedType: async function(parentItem, file, item) {
        var contentType = file.endsWith('.pdf')
            // Don't bother reading file if there's a .pdf extension
            ? 'application/pdf'
            : await Zotero.MIME.getMIMETypeFromFile(file);
        if (!this.isRenameAllowedForType(contentType, parentItem.libraryID)) {
            return false;
        }

        // This is modified
        return this.getFileBaseNameFromItem(parentItem, { attachmentTitle: item.getField('title') });
    }.bind(Zotero.Attachments),


    // Modified to swap '-' with ' ' when appending a number
    // Also added argument to return only the filename
    createShortened: function (file, type, mode, maxBytes, overwrite = false) {
        file = this.pathToFile(file);
        
        if (!maxBytes) {
            maxBytes = 255;
        }
        
        // Limit should be 255, but leave room for unique numbering if necessary
        var padding = 3;
        
        while (true) {
            var newLength = maxBytes - padding;
            
            try {
                file.create(type, mode);
            }
            catch (e) {
                let pathError = false;
                
                let pathByteLength = Zotero.Utilities.Internal.byteLength(file.path);
                let fileNameByteLength = Zotero.Utilities.Internal.byteLength(file.leafName);
                
                // Windows API only allows paths of 260 characters
                //
                // I think this should be >260 but we had a report of an error with exactly
                // 260 chars: https://forums.zotero.org/discussion/41410
                if (e.name == "NS_ERROR_FILE_NOT_FOUND" && pathByteLength >= 260) {
                    Zotero.debug("Path is " + file.path);
                    pathError = true;
                }
                // ext3/ext4/HFS+ have a filename length limit of ~254 bytes
                else if ((e.name == "NS_ERROR_FAILURE" || e.name == "NS_ERROR_FILE_NAME_TOO_LONG")
                        && (fileNameByteLength >= 254 || (Zotero.isLinux && fileNameByteLength > 143))) {
                    Zotero.debug("Filename is '" + file.leafName + "'");
                }
                // Modified
                else if (overwrite && e.name == "NS_ERROR_FILE_ALREADY_EXISTS") {
                    return file.leafName;
                }
                else {
                    Zotero.debug("Path is " + file.path);
                    throw e;
                }
                
                // Preserve extension
                var matches = file.leafName.match(/.+(\.[a-z0-9]{0,20})$/i);
                var ext = matches ? matches[1] : "";
                
                if (pathError) {
                    let pathLength = pathByteLength - fileNameByteLength;
                    newLength -= pathLength;
                    
                    // Make sure there's a least 1 character of the basename left over
                    if (newLength - ext.length < 1) {
                        throw new Error("Path is too long");
                    }
                }
                
                // Shorten the filename
                //
                // Shortened file could already exist if there was another file with a
                // similar name that was also longer than the limit, so we do this in a
                // loop, adding numbers if necessary
                var uniqueFile = file.clone();
                var step = 0;
                while (step < 100) {
                    let newBaseName = uniqueFile.leafName.substr(0, newLength - ext.length);
                    if (step == 0) {
                        var newName = newBaseName + ext;
                    }
                    else {
                        // Modified
                        var newName = newBaseName + " " + step + ext;
                    }
                    
                    // Check actual byte length, and shorten more if necessary
                    if (Zotero.Utilities.Internal.byteLength(newName) > maxBytes) {
                        step = 0;
                        newLength--;
                        continue;
                    }
                    
                    uniqueFile.leafName = newName;
                    if (!uniqueFile.exists()) {
                        break;
                    }

                    // Modified
                    if (overwrite) return newName;
                    
                    step++;
                }
                
                var msg = "Shortening filename to '" + newName + "'";
                Zotero.debug(msg, 2);
                Zotero.log(msg, 'warning');
                
                try {
                    uniqueFile.create(Components.interfaces.nsIFile.type, mode);
                }
                catch (e) {
                    // On Linux, try 143, which is the max filename length with eCryptfs
                    if (e.name == "NS_ERROR_FILE_NAME_TOO_LONG"
                            && Zotero.isLinux
                            && Zotero.Utilities.Internal.byteLength(uniqueFile.leafName) > 143) {
                        Zotero.debug("Trying shorter filename in case of filesystem encryption", 2);
                        maxBytes = 143;
                        continue;
                    }
                    // Modified
                    else if (overwrite && e.name == "NS_ERROR_FILE_ALREADY_EXISTS") {
                        return file.leafName;
                    }
                    else {
                        throw e;
                    }
                }
                
                file.leafName = uniqueFile.leafName;
            }
            break;
        }
        
        return file.leafName;
    }.bind(Zotero.File)
}
