const UCSDAPI = require('./utilities/ucsdAPI/ucsdAPI.js');

UCSDAPI.generateKey();
UCSDAPI.getAcademicHistory( "A15702734", "WI20", "UN", courses => console.log( courses ) );