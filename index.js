"use strict"
var DIAGNOSTICS_API_URL = process.env.DIAGNOSTICS_API_URL || "https://alamo-self-diagnostics.octanner.io"

function setvar(appkit, args){
   var configvar = {}
   configvar.varname  = args.KVPAIR.split("=")[0]
   configvar.varvalue = args.KVPAIR.split("=")[1]
   
   appkit.api.post(JSON.stringify(configvar), DIAGNOSTICS_API_URL+"/v1/diagnostic/"+args.ID+"/config", function(err, resp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    }
                                                appkit.terminal.vtable(resp);
   })
  
}

function unsetvar(appkit, args){
   appkit.http.delete(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + args.ID+'/config/'+args.VAR, {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
                                                appkit.terminal.vtable(resp);
    })
}

function addsecret(appkit, args){
  var plan  = args.p || args.plan
  var addonpart= plan.split(":")[0]
  var planpart = plan.split(":")[1]
  appkit.api.get("/addon-services/"+addonpart+"/plans/"+planpart,
         function(err, resp) {
            if (err) {
               return appkit.terminal.error(err);
           }
          appkit.api.post(null, DIAGNOSTICS_API_URL+"/v1/diagnostic/"+args.ID+"/bind/"+resp.spec, function(err, resp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    }
                                                appkit.terminal.vtable(resp);
          })
  })
}

function removesecret(appkit, args){
  var plan  = args.p || args.plan
  var addonpart= plan.split(":")[0]
  var planpart = plan.split(":")[1]
  appkit.api.get("/addon-services/"+addonpart+"/plans/"+planpart,
         function(err, resp) {
            if (err) {
               return appkit.terminal.error(err);
           }
          appkit.http.delete(DIAGNOSTICS_API_URL+"/v1/diagnostic/"+args.ID+"/bind/"+resp.spec, {
                           "Content-Type": "application/json"
                          }, function(err, resp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    }
                                                appkit.terminal.vtable(resp);
          })
  })
}



function trigger(appkit, args) {
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/'+args.ID , {
            "Content-Type": "text/plain"
        }, function(err, resp) {
            if (err) {
               return appkit.terminal.error(err);
           }
               appkit.api.get('/apps/'+resp.app+'-'+resp.space+'/releases',
                function(err, releasesresp) {
                    if (err) {
                      return appkit.terminal.error(err);
                    }
               appkit.api.get('/apps/'+resp.app+'-'+resp.space+'/builds',
                function(err, buildsresp) {
                    if (err) {
                      return appkit.terminal.error(err);
                    }
                        var hook = {}
                        hook.release={}
                        hook.build={}
                        hook.app={}
                        hook.action=resp.action
                        hook.release.result=resp.result
                        hook.app.id=resp.id
                        hook.app.name=resp.app
                        hook.space={}
                        hook.space.name=resp.space
                        hook.release.id=releasesresp.pop().id
                        if (buildsresp.length > 0){
                                 hook.build.id=buildsresp.pop().id
                         }else{
                                 hook.build.id = ""
                        }
                                                   appkit.api.post(JSON.stringify(hook), DIAGNOSTICS_API_URL + '/v1/releasehook', function(err, runresp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    } 
                           console.log(appkit.terminal.markdown("^^ run initiated ^^"))
                            })
                     })
                  })
       })
}





function rerun(appkit, args) {


    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostics/runs/info/'+args.ID , {
            "Content-Type": "text/plain"
        }, function(err, resp) {
            if (err) {
               return appkit.terminal.error(err);
           }
                     var querystring = "space="+resp._source.space+"&app="+resp._source.app+"&action=release&result=succeeded&buildid="+resp._source.buildid
                     appkit.http.get(DIAGNOSTICS_API_URL +"/v1/diagnostic/rerun?"+querystring, {}, function(err, resp) {
                                                     if (err) {
                                                         return appkit.terminal.error(err);
                                                     }
                           console.log(appkit.terminal.markdown("^^ rerun initiated ^^"))
                     })

    })

}

function runinfo(appkit, args){

    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostics/runs/info/'+args.ID , {
            "Content-Type": "text/plain"
        }, function(err, resp) {
            if (err) {
               return appkit.terminal.error(err);
           }
    delete resp._source.logs
    appkit.terminal.vtable(resp._source)
          
    })

}


function addhooks(appkit, args) {

    var app = args.a || args.app 
    appkit.api.get("/apps/"+app+"/hooks", function(err, resp){
    var needsrelease = true
    var needsbuild = true
    resp.forEach(function(hook) {
          if(hook.url.indexOf("/v1/releasehook") > -1 && hook.url.indexOf("alamo-self-diagnostics") > -1 ) {
              needsrelease = false
           }
          if(hook.url.indexOf("/v1/buildhook") > -1  && hook.url.indexOf("alamo-self-diagnostics") > -1  ) {
              needsbuild = false
           }
      });

    var hookspec = {}
   if (needsrelease) {
    hookspec.url=   process.env.DIAGNOSTICS_API_URL || "https://alamo-self-diagnostics.octanner.io"
    hookspec.url=   hookspec.url+ "/v1/releasehook"
    hookspec.active = true
    hookspec.secret = "merpderp"
    var events = []
    events.push("release")
    hookspec.events=events
    appkit.api.post(JSON.stringify(hookspec), "/apps/"+app+"/hooks", function(err, resp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    }
        console.log(appkit.terminal.markdown("^^ release hook added ^^"))
    })
   }
   if (needsbuild){
    hookspec.url=   process.env.DIAGNOSTICS_API_URL || "https://alamo-self-diagnostics.octanner.io"
    hookspec.url=   hookspec.url+ "/v1/buildhook"
    hookspec.active = true
    hookspec.secret = "merpderp"
    var events = []
    events.push("build")
    hookspec.events=events
    appkit.api.post(JSON.stringify(hookspec), "/apps/"+app+"/hooks", function(err, resp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    }
        console.log(appkit.terminal.markdown("^^ build hook added ^^"))
    })
   }
   console.log(appkit.terminal.markdown("^^ done ^^"))
  })
}



function newregister(appkit, args){
     var answerappfull = "" 
     var answerjob = ""
     var answerjobspace = ""
     var answerimage = ""
     var answertfrom = ""
     var answertto = ""
     var answertimeout = 90
     var answerstartdelay = 15
     var answerenvlist = ""
     var answerpipelinename = ""
     var answerslackchannel = ""
     newask("App Name", function(appfull) {
         answerappfull=appfull

     newask("Job Name", function(job) {
         answerjob=job

     newask("Job Space", function(jobspace) {
         answerjobspace=jobspace

     newask("Image", function(image) {
         answerimage=image

     newask("Pipeline Name ('manual' for manual promotion)", function(pipelinename) {
         answerpipelinename=pipelinename

     newask("Transition From ('manual' for manual promotion)", function(tfrom) {
         answertfrom=tfrom

    newask("Transition To ('manual' for manual promotion)", function(tto) {
         answertto=tto

    newask("Timeout", function(timeout) {
         answertimeout=timeout

    newask("Start Delay", function(startdelay) {
         answerstartdelay=startdelay
 
    newask("Slack Channel (no leading #)", function(slackchannel){
         answerslackchannel=slackchannel

    newask("Environment Variables", function(envlist) {
         answerenvlist = envlist

          var appa = appfull.split("-")
          var app=appa[0]
          var cutspace=appa.shift()
          var space=appa.join("-")
                                                var diagnostic = {}
                                                diagnostic.app = app
                                                diagnostic.space = space
                                                diagnostic.action = "release"
                                                diagnostic.result = "succeeded"
                                                diagnostic.job = job
                                                diagnostic.jobspace = jobspace
                                                diagnostic.image = image
                                                diagnostic.pipelinename = answerpipelinename
                                                diagnostic.transitionfrom = answertfrom
                                                diagnostic.transitionto = answertto
                                                diagnostic.timeout = parseInt(answertimeout, 10)
                                                diagnostic.startdelay = parseInt(answerstartdelay, 10)
                                                diagnostic.slackchannel = slackchannel
                                                if (answerenvlist.length  > 0) {
                                                var env = []
                                                envlist = answerenvlist.replace('"','')
                                                var envlista = envlist.toString().split(" ")
                                                envlista.forEach(function(pair) {
                                                    var envitem = {}
                                                    var paira = pair.split("=")
                                                    envitem.name = paira[0]
                                                    envitem.value = paira[1]
                                                    env.push(envitem)
                                                });

                                                diagnostic.env = env
                                                }

                                                args.app=appfull


                                                appkit.api.post(JSON.stringify(diagnostic), DIAGNOSTICS_API_URL + '/v1/diagnostic', function(err, resp) {
                                                    if (err) {
                                                        return appkit.terminal.error(err);
                                                    }
                                                    args.app=appfull
                                                    //addhooks(appkit, args)
                                                    //var generator =  addhooksgen(appkit, args)
                                                    //setTimeout(function () {
                                                    //      generator.next()
                                                    //}, 5000)
                                                    appkit.terminal.vtable(resp);
                                                    addhooks(appkit, args)
                                                 })

})
})
})
})
})
})
})
})
})
})
})
}
function newask(question, cb) {

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(question+": ", (answer) => {

  rl.close();
  cb(answer)
});

}



function getlogs(appkit, args) {
    var uuidtoget = ""
    if (isUUID(args.ID)) {
        uuidtoget = args.ID
        appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/logs/' + uuidtoget + '/array', {
            "Content-Type": "text/plain"
        }, function(err3, resp3) {
            if (err3) {
                return appkit.terminal.error(err3);
            }
            resp3.forEach(function(line) {
                console.log(line)
            })
        })
    } else {
        appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + args.ID, {
            "Content-Type": "application/json"
        }, function(err, resp) {
            if (err) {
                return appkit.terminal.error(err);
            }
            appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/jobspace/' + resp.jobspace + '/job/' + resp.job + '/runs', {
                "Content-Type": "application/json"
            }, function(err2, resp2) {
                if (err2) {
                    return appkit.terminal.error(err2);
                }
                if (resp2.runs === null) {
                      return appkit.terminal.error("no runs")
                    }else{ 
                     uuidtoget = resp2.runs.pop().id
                     appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/logs/' + uuidtoget + '/array', {
                         "Content-Type": "text/plain"
                      }, function(err3, resp3) {
                           if (err3) {
                              return appkit.terminal.error(err3);
                            }
                         resp3.forEach(function(line) {
                         console.log(line)
                          })
                       })
                  }
            })
        })
    }



}


function listruns(appkit, args) {
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + args.ID, {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
        appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/jobspace/' + resp.jobspace + '/job/' + resp.job + '/runs', {
            "Content-Type": "application/json"
        }, function(err2, resp2) {
            if (err2) {
                return appkit.terminal.error(err2);
            }
            var runs = []
            if (! resp2.runs){ return appkit.terminal.error("no runs")}
            resp2.runs.forEach(function(runitem) {
                var run = {}
                run.runid = runitem.id
                run.app = runitem.app + "-" + runitem.space
                run.test = runitem.job + "-" + runitem.jobspace
                run.time = runitem.hrtimestamp
                
                if (runitem.overallstatus == "success") {
                     run.status=appkit.terminal.markdown("^^ success ^^")
                }else{
                    run.status = run.status=appkit.terminal.markdown("!! "+runitem.overallstatus+" !!")
                } 
                 
                runs.push(run)
            })
            appkit.terminal.table(runs)
        })
    })
}

function updatejob(appkit, args) {
    var property = args.p || args.property
    var value = args.v || args.value
    var newdef = ""
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + args.ID, {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
        if (property == "timeout" || property == "startdelay") {
            resp[property] = parseInt(value, 10)
        } else if (property == "env") {
            var env = []
            var envlista = value.toString().split(" ")
            envlista.forEach(function(pair) {
                var envitem = {}
                var paira = pair.split("=")
                envitem.name = paira[0]
                envitem.value = paira[1]
                env.push(envitem)
            });

            resp[property] = env
        } else {
            resp[property] = value
        }
       
        newdef = JSON.stringify(resp)
        appkit.api.patch(newdef, DIAGNOSTICS_API_URL + '/v1/diagnostic', function(err2, resp2) {

            if (err2) {
                return appkit.terminal.error(err2);
            }
            appkit.terminal.vtable(resp2)

        })

    })

}

function job(appkit, args) {
    var jobname = args.ID
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + jobname, {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
        var jobitem = {}
        jobitem.id = resp.id
        jobitem.test = resp.job + "-" + resp.jobspace
        jobitem.app = resp.app + "-" + resp.space
        jobitem.action = resp.action
        jobitem.result = resp.result
        jobitem.image = resp.image
        jobitem.pipelinename = resp.pipelinename
        jobitem.transitionfrom = resp.transitionfrom
        jobitem.transitionto = resp.transitionto
        jobitem.timeout = resp.timeout
        jobitem.startdelay = resp.startdelay
        jobitem.slackchannel = resp.slackchannel
        console.log(appkit.terminal.markdown("^^ properties: ^^"))
        appkit.terminal.vtable(jobitem)
        console.log(appkit.terminal.markdown("^^ env: ^^"))
        appkit.terminal.table(resp.env)
    });

}

function listconfig(appkit, args) {
    var jobname = args.ID
    var simple = args.s || args.simple
    var exports = args.e || args.exports
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + jobname, {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
       if (!simple && !exports) {
        appkit.terminal.table(resp.env)
       }
       if (simple) {
        resp.env.forEach(function(envvar){
            console.log(envvar.name + "="+envvar.value)
         })
       }
       if (exports) {
        resp.env.forEach(function(envvar){
            console.log("export "+envvar.name + "="+envvar.value)
         })
       } 
    });

}

function deletetest(appkit, args) {
    appkit.http.delete(DIAGNOSTICS_API_URL + '/v1/diagnostic/' + args.ID, {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
        console.log(appkit.terminal.markdown("^^ deleted ^^"))
    });

}

function colorize(text, colorname){

     return text
}
function images(appkit, args) {
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostics?simple=true', {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
        var shorttests = [];
        var colorlist = ["","green","blue","yellow","orange","purple","red"]
        var currentcolor = 0
        var currentimage =""
        var colorimagemap={}

        resp.forEach(function(testitem) {
            var shorttest = {};
            var imagearray = []
            imagearray = testitem.image.split('/')
            var imagenameandtag=""
            imagenameandtag =(imagearray[(imagearray.length)-1])
            if (imagenameandtag != currentimage && ! colorimagemap[imagenameandtag] > 0){
                 currentcolor = currentcolor +1
                 colorimagemap[imagenameandtag]=currentcolor
            }
            currentimage=imagenameandtag
            shorttest.image = colorize(imagenameandtag,colorlist[colorimagemap[imagenameandtag]]||colorlist[currentcolor])
            shorttest.test = testitem.job + "-" + testitem.jobspace
            shorttest.app = testitem.app + "-" + testitem.space
            shorttest.id = testitem.id
            shorttests.push(shorttest)
       
        });
        appkit.terminal.table(shorttests)

    });
}


function list(appkit, args) {
    appkit.http.get(DIAGNOSTICS_API_URL + '/v1/diagnostics?simple=true', {
        "Content-Type": "application/json"
    }, function(err, resp) {
        if (err) {
            return appkit.terminal.error(err);
        }
        var shorttests = [];
        resp.forEach(function(testitem) {
            var shorttest = {};
            shorttest.id = testitem.id
            shorttest.test = testitem.job + "-" + testitem.jobspace
            shorttest.app = testitem.app + "-" + testitem.space
            shorttest.action = testitem.action
            shorttest.result = testitem.result
            shorttests.push(shorttest)
        });
        appkit.terminal.table(shorttests)

    });
}


function update() {}


function isEmpty(str) {
    return (!str || 0 === str.length);
}

function isUUID(str) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str)

}

function init(appkit) {
    const hooks_opts = {
        app: {
            alias: 'a',
            string: true,
            description: 'app name.',
            demand: true
        }
    }
    const job_opts = {
        job: {
            alias: 'j',
            string: true,
            description: 'job name.',
            demand: true
        }
    }

    const update_opts = {
        property: {
            alias: 'p',
            string: true,
            description: 'property name (timeout, transitionfrom, env, etc).',
            choices: ['image', 'pipelinename', 'transitionfrom', 'transitionto','timeout','startdelay','slackchannel'] ,
            demand: true
        },
        value: {
            alias: 'v',
            string: true,
            description: 'new value of the property. If updating slackchannel, do not include leading #',
            demand: true
        }

    }
    const secret_opts = {
        plan: {
            alias: 'p',
            string: true,
            description: 'plan name (example: xisoap-ws:dev)',
            demand: true
        }

    }

    const listconfig_opts = {
        simple: {
            alias: 's',
            boolean: true,
            description: 'show as simple list',
            demand: false
        },
        exports: {
            alias: 'e',
            boolean: true,
            description: 'show as exports',
            demand: false
        },
       

    }

    appkit.args
        .command('taas:tests', 'list tests', {}, list.bind(null, appkit))
        .command('taas:images', 'list images', {}, images.bind(null, appkit))
        .command('taas:tests:info ID', 'describe test', {}, job.bind(null, appkit))
        .command('taas:tests:register', 'register test', {}, newregister.bind(null, appkit))
        .command('taas:tests:update ID', 'update test', update_opts, updatejob.bind(null, appkit))
        .command('taas:tests:destroy ID' , 'delete test', {}, deletetest.bind(null,appkit))
        .command('taas:tests:trigger ID', 'trigger a test', {}, trigger.bind(null,appkit))
        .command('taas:tests:runs ID', 'list test runs', {}, listruns.bind(null, appkit))
        .command('taas:config ID', 'list environment variables', listconfig_opts, listconfig.bind(null, appkit))
        .command('taas:config:set ID KVPAIR', 'set an environment variable', {}, setvar.bind(null, appkit))
        .command('taas:config:unset ID VAR', 'unset and environment variable', {}, unsetvar.bind(null, appkit))
        .command('taas:secret:create ID', 'adds a secret to a test', secret_opts, addsecret.bind(null, appkit))
        .command('taas:secret:remove ID', 'removed a secret from a test', secret_opts, removesecret.bind(null, appkit))
        .command('taas:hooks:create', 'add testing hooks to an app', hooks_opts, addhooks.bind(null, appkit))
        .command('taas:runs:info ID' , 'get info for a run', {}, runinfo.bind(null, appkit))
        .command('taas:runs:output ID', 'get logs for a run. If ID is a test name, gets latest', {}, getlogs.bind(null, appkit))
        .command('taas:logs ID', 'get logs for a run. If ID is a test name, gets latest', {}, getlogs.bind(null, appkit))
        .command('taas:runs:rerun ID', 'reruns a run', {}, rerun.bind(null, appkit))


}
module.exports = {
    init: init,
    update: update,
    group: 'taas',
    help: 'manage testing as a service (create, list, register, update)',
    primary: true
};

