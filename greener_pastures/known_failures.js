/*
	This web extension takes a known set of historical
    failures (as failures.json) which has platform, config,
    and testname- then marks jobs as green if current
    failures are found in the known failure list.
*/


/* we need to branch/repo because our query for bug suggestions needs
   the repo
*/
function splitRepo(href) {
	var urls = href;
	var myurls = urls.split("?repo=");
	var mylasturls = myurls[1];
	var mynexturls = mylasturls.split("&");
	var url = mynexturls[0];
	return url
};


var completed = false;
let oranges_toggled = [];
var classified_toggled = [];
var missed = [];

// Hack to take a job name and output a platform and config
// mild sanitization goes on here
//
function parseJobname(jobname) {
    if (jobname.indexOf('test-') == 0) {
        jobname = jobname.substring(5, (jobname.length))
    }

    let parts = jobname.split('/');
    let platform = parts[0];
    let config = parts[1];
    let ispgo = platform.indexOf('-pgo');
    if (ispgo != -1)
        platform = platform.substring(0,ispgo);

    config = config.split('-')[0]

    let isasan = platform.indexOf('asan');
    if (isasan != -1) {
        platform = platform.substring(0,isasan);
        config = 'asan';
    }
    if (platform == 'macosx64') {
        platform = 'osx-10-10';
    }

    return [platform, config];
}

// a testname (TEST-FAIL | <testname> | reason) is what we key off of
// do some mild sanitization here
//
function cleanTest(testname) {
    // TODO: split out remote and file paths, specifically in reftest
    if (testname.indexOf(' == ') != -1) {
        left, right = testname.split(' == ')
        if (left.indexOf('tests/layout/') != -1)
            left = 'layout' + left.split('tests/layout')[1]
        if (right.indexOf('tests/layout/') != -1)
            right = 'layout' + right.split('tests/layout')[1]
        return left + " == " + right;
    }

    // http://localhost:50462/1545303666006/4/41276-1.html
    if (testname.indexOf('http://localhost:') == 0) {
        parts = testname.split('/');
        return parts[parts.length-1];
    }
    return testname
}

window.onload = async function() {
	console.log('loaded');
};


function toggle_gp() {
    console.log("inside toggle_gp: " + oranges_toggled + " : " + classified_toggled + " : " + missed);
    oranges_toggled.forEach(function(jid, pct) {
        console.log(" .." + jid);
        var job = document.querySelector(jid);
        job.className = job.className.replace(/btn-green/, "btn-orange");
    })

    classified_toggled.forEach(function(jid, pct) {
        console.log(" .." + jid);
        var job = document.querySelector(jid);
        job.className = job.className.replace(/btn-green/, "btn-orange-classified");
    })
}

var checkExist = setInterval(function() {
    var navbarElement = document.getElementById("th-global-navbar-top");
	var revnodes = document.querySelectorAll('span .revision-list')
	var inserted_elements_gp = document.getElementById("toggle_gp");
	if (revnodes.length >= 1 && !inserted_elements_gp && !completed) {
		if (!inserted_elements_gp) {
			// Set up the elements
			spanElement = navbarElement.querySelector(".navbar-right");
			spanElement.insertAdjacentHTML("afterbegin",
				`
				<span class='dropdown' style='color:white'>
					<button id='toggle_gp' type='button' title='Toggle known intermittents'
					 class='btn btn-view-nav nav-menu-btn'>
					0 Known Intermittents (Analyzing)
					</button>
				</span>`
			);

			// Save original display settings
			inserted_elements_gp = document.getElementById("toggle_gp");

			// Add onclick functions for success rate initiating
			button_toggle = document.getElementById("toggle_gp");
			button_toggle.addEventListener('click', function() {
				toggle_gp();
			});
            analyzeFailedTests();
        }
	} else if (!completed) {
        analyzeFailedTests();
	} else {
        var status = document.getElementById('toggle_gp')
        status.textContent = status.textContent.replace(/\ \(Analyzing\)/, '');
		console.log("done...");
    }
}, 1000);

async function analyzeFailedTests() {
    await fetch(browser.runtime.getURL("failures.json"))
      .then(function(response) {
        return response.json();
      })
      .then(function(knownFailures) {
        var jobs = document.querySelectorAll('.btn-orange, .btn-orange-classified');
        let oranges_toggled = [];
        let classified_toggled = [];
        let missed = [];
        console.log("greener pastures has loaded the known failures and will analyze " + jobs.length + " failed jobs");
        jobs.forEach(function(job) {
          if (job == jobs[jobs.length -1])
              completed = true;

          let attrs = job.attributes;
          let jobid = 0;
          let title = '';
          for(var i = attrs.length - 1; i >= 0; i--) {
            if (attrs[i].name == 'data-job-id')
              jobid = attrs[i].value;
            if (attrs[i].name == 'title')
              title = attrs[i].value.split(' ')[2]
          }
          if (jobid == 0 || title == '')
            return;

          // Get repo
          var currentURL = new URL(window.location.href)
          var repo = currentURL.searchParams.get('repo')
          repo = splitRepo(window.location.href)

          url = 'https://treeherder.mozilla.org/api/project/' + repo;
          url += '/jobs/' + jobid + '/bug_suggestions/';
          fetch(url)
            .then(function(response) {
                response.json().then(function(failJson) {
                  failJson.forEach(function(failure) {
                    // TODO: find failures that have test names
                    let parts = failure.search.split('|');
                    if (parts.length == 3) {
                      testname = cleanTest(parts[1].trim());
                      if (testname == 'leakcheck')
                        return
                      if (testname == 'Main app process exited normally')
                        return
                    } else {
                      // ignore these, usually chain reaction messages or unrelated
                      return
                    }

                    // parse title (plaform,config) and testname and match with knownFailures
                    let platconf = parseJobname(title);
                    let platform = platconf[0];
                    let config = platconf[1];
                    let pct = 0;
                    if (typeof knownFailures[testname] !== 'undefined') {
                        pct = 50;
                        if (typeof knownFailures[testname][platform] !== 'undefined') {
                            pct = 75;
                            if (typeof knownFailures[testname][platform][config] !== 'undefined') {
                                pct = 100;
                            }
                        }
                    }
                    if (job.className.indexOf('btn-orange-classified') >= 0) {
                        job.className = job.className.replace(/btn-orange-classified/, "btn-green");
                        classified_toggled.push([jobid, pct]);
                    } else if (job.className.indexOf('btn-orange') >= 0) {
                        job.className = job.className.replace(/btn-orange/, "btn-green");
                        oranges_toggled.push([jobid, pct]);
                    } else {
                        console.log("BAD: '" + testname + "'");
                        missed.push(jobid);
                    }
                    // TODO: if there is >1 test failure across platforms/config, increase pct
                    // TODO: if there are a collection of failures in the same dir or platform, increase pct
                    var status = document.getElementById('toggle_gp')
                    status.textContent = oranges_toggled.length + classified_toggled.length + " Known Intermittents (Analyzing)";                    
                  });
                })
            });
        })
    });
}
