# FileAccessors
An abstract mechanism to load and save files from different sources.

Every file accessor has to provide a component to allow input of a file (and optionally a master file for xmb)
and a service to load and save.

TODO configuration component

## Available file accessors
### DownloadUpload
The simplest file accessor.

It can load files via the browser file upload mechanism and store them via browsers file download.

### Github
It can get translation files from a branch in a github repo and commit changes to it.