**Installation**  ( not "published" yet )

aka plugins:install https://github.com/octanner/appkit-taas-plugin




The following commands are available
  
  
  **taas:tests**
  
  list tests
  
  
  **taas:tests:info ID**  
  
  describe test
  
  ID can be either the UUID of the test or the test name
  
  
  **taas:tests:register**
  
  register test
  
  Will prompt for all fields
  
  For environment variables provide space separated, k/v pairs ... all in double quotes. 
  
  
  **taas:tests:update ID**
  
  update test
  
  ID can be either the UUID of the test or the test name
  
  Takes two parameters -p for property and -v for value
 
  Valid values for property are :  'image', 'pipelinename', 'transitionfrom', 'transitionto','timeout','startdelay' 



  **taas:config:set ID**

  set an environment variable

  ID can be either the UUID of the test or the test name

  KVPAIR is a single key/value pair (e.g. MYVARNAME=VALUE)



  **taas:config:unset ID**

  unset and environment variable

  ID can be either the UUID of the test or the test name

  NAME is the environment variable name


  
  **taas:tests:destroy ID**
  
  delete test
  
  ID can be either the UUID of the test or the test name
  
  
  **taas:tests:runs ID**
  
  list test runs
  
  ID can be either the UUID of the test or the test name
  
  
  **taas:hooks:create**
  
  add testing hooks to an app
  
  Takes the usual -a for app name
  
  Creates two hooks.  One on release and one on build.
  
  
  **taas:runs:info ID**
  
  get info for a run
  
  ID is the UUID.  Get it from **taas:tests:runs ID**
  
  
  **taas:runs:output ID**
  
  get logs for a run. 
  
  If ID is a test name, gets latest
  
  
  **taas:runs:rerun ID**
  
  reruns a run
  
  ID is the UUID.  Get it from **taas:tests:runs ID**


  
