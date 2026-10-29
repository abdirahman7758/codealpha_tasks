const serverless = require('serverless-http');
const app = require('../../server');
const db = require('../../db');

const expressHandler = serverless(app);
let dbInitialization;

exports.handler = async (event, context) => {
  dbInitialization ||= db.initDb();
  await dbInitialization;

  const functionPath = '/.netlify/functions/api';
  const normalizePath = path => path.startsWith(functionPath)
    ? path.replace(functionPath, '/api')
    : path;
  const path = event.path || event.rawPath || '/';
  const requestEvent = {
    ...event,
    path: normalizePath(path),
    ...(event.rawPath ? { rawPath: normalizePath(event.rawPath) } : {})
  };

  return expressHandler(requestEvent, context);
};
