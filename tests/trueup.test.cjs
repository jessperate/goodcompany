const assert=require('node:assert/strict');
const {parseTrueup}=require('../lib/trueup');
assert.deepEqual(parseTrueup('<h1>Lovable</h1><div>Open jobs</div><b>81</b><div>Employee growth</div><b>+161%</b><p>past 12 months</p>','Lovable'),{openJobs:81,remoteJobs:null,employeeGrowth:'+161%'});
assert.deepEqual(parseTrueup('<h1>Yahoo</h1><p>Media company with 84 job openings.</p><p>Remote openings 0% 0 jobs</p>','Yahoo'),{openJobs:84,remoteJobs:0,employeeGrowth:null});
assert.deepEqual(parseTrueup('<h1>AirOps</h1><p>Open jobs 7 TrueUp rank 100</p><p>🌎 Remote 5</p>Compare to other companies Employee growth +99% past 12 months','AirOps'),{openJobs:7,remoteJobs:5,employeeGrowth:null});
assert.throws(()=>parseTrueup('<h1>Another company</h1>Open jobs 800 ','Lovable'));
assert.throws(()=>parseTrueup('<h1>Lovable</h1>Not available Compare to other companies Open jobs 800 ','Lovable'));
assert.deepEqual(parseTrueup('<h1>Example</h1><p>Open jobs 1,200 TrueUp</p><script>Remote openings 20% 240 jobs</script>','Example'),{openJobs:1200,remoteJobs:null,employeeGrowth:null});
console.log('TrueUp company matching, missing vs zero, exact counts, and competitor isolation passed.');
