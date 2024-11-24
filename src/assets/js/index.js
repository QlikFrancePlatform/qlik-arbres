import '../css/style.css';

import barchart from '@nebula.js/sn-bar-chart';
import line from '@nebula.js/sn-line-chart';
import scatterplot from '@nebula.js/sn-scatter-plot';
import kpi from '@nebula.js/sn-kpi';
import container from '@nebula.js/sn-layout-container';
import table from '@nebula.js/sn-table';
import EngineService from './cloud.engine';
import { embed } from '@nebula.js/stardust';

const charts = { barchart, linechart: line, scatterplot, table, kpi, container };

const tenantUrl = process.env.TENANT_URL;
const appId = process.env.APP_ID;
const webIntegrationId = process.env.WEB_INTEGRATION_ID;
const headers = {
  'accept-language': 'en',
  'Content-Type': 'application/json',
  'qlik-web-integration-id': webIntegrationId,
}; // headers to pass in requests

var fieldMeasuresRef = $('#fieldMeasures');
var masterMeasuresRef = $('#masterMeasures');
var fieldDimensionsRef = $('#fieldDimensions');
var masterDimensionsRef = $('#masterDimensions');
var analyses = $('#selectAnalysis');
var chart = $('#chart-advisor');

$('#formId').submit(function (e) {
  e.preventDefault();
});

$(document).ready(() => {
  fetchMedata();
  // fetchRenderIndicator('HqEwgB', 'KPI01');
  // fetchRenderIndicator('PUzPH', 'container');
  fetchRenderHyperCube();
  disableMetadataSelections();
});

$('#button').on('click', () => {
  chart.empty();
  $('.parallax-inner_5 .text').hide()
  const text = $('#inputText').val();
  const targetAnalysis = $('#selectAnalysis').val();
  const dimension = $('#selectDimension').val();
  const dimensionType = document.querySelector('#selectDimension option:checked').parentElement.label;
  const measure = $('#selectMeasure').val();
  const measureType = document.querySelector('#selectMeasure option:checked').parentElement.label;
  const requestPayload = { fields: [], libItems: []};
  
  if (dimensionType == 'Fields') {
    requestPayload.fields.push({ name: dimension });
  } else {
    requestPayload.libItems.push({ libId: dimension });
  }
  
  if (measureType == 'Fields') {
    requestPayload.fields.push({ name: measure });
  } else {
    requestPayload.libItems.push({ libId: measure });
  }

  if (text) {
    requestPayload.text = text;
  }
  
  if (targetAnalysis) {
    requestPayload.id = targetAnalysis || 'rank-rank';
  }
  fetchRecommendationAndRenderChart(requestPayload);
});

/**
 * Display selector search on the webpage
 */

async function fetchMedata() {
  // retrieve the analyses types for given application
  const analysesResponse = await getAnalyses();
  // retrieve the classification information such as fields and master items along with it's classifications
  const metadata = await getClassifications();

  // fill up the analyses dropdown
  analysesResponse.data.forEach((analysis) => {
    const name = analysis.compositions[0].description.short;
    const value = analysis.id;
    analyses.append(`<option value="${value}">${name}</option>`);
  });

  // filter out dimension from fields
  const fieldDimensions = metadata.data.fields.filter((field) => field.simplifiedClassifications.includes('dimension'));
  fieldDimensions.forEach((dimension) => {
    const name = dimension.name;
    fieldDimensionsRef.append(`<option value="${name}">${name}</option>`);
  });

  // filter out dimension from master items
  const masterDimensions = metadata.data.masterItems.filter((masterItem) =>
    masterItem?.classifications.includes('dimension')
  );
  masterDimensions.forEach((dimension) => {
    const name = dimension.caption;
    const value = dimension.libId;
    masterDimensionsRef.append(`<option value="${value}">${name}</option>`);
  });

  // filter out measures from fields
  const fieldMeasures = metadata.data.fields.filter((field) => field.simplifiedClassifications.includes('measure'));
  // fill up the measures dropdown
  fieldMeasures.forEach((measure) => {
    const name = measure.name;
    fieldMeasuresRef.append(`<option value="${name}">${name}</option>`);
  });
  // filter out measures from master items
  const masterMeasures = metadata.data.masterItems.filter((masterItem) =>
    masterItem?.classifications.includes('measure')
  );
  // fill up the measures dropdown
  masterMeasures.forEach((measure) => {
    const name = measure.caption;
    const value = measure.libId;
    masterMeasuresRef.append(`<option value="${value}">${name}</option>`);
  });
}

/**
 * Search recommandation Advisor
 */

async function fetchRecommendationAndRenderChart(requestPayload) {
  console.log(requestPayload);
  // fetch recommendations for text or metadata
  const recommendations = await getRecommendation(requestPayload);
  console.log('recommendations received');

  const engineUrl = `${tenantUrl.replace('https', 'wss')}/app/${appId}`;
  // fetch rec options which has hypercubeDef
  const recommendation = recommendations.data.recAnalyses[0];
  // get csrf token
  const qcsHeaders = await getQCSHeaders();
  const engineService = new EngineService(engineUrl);
  // get openDoc handle
  const app = await engineService.getOpenDoc(appId, qcsHeaders);
  await renderHypercubeDef(app, recommendation);
}

/**
 * Display recommandation Advisor on the webpage
 */

async function renderHypercubeDef(app, recommendation) {
  const type = recommendation.chartType;

  const nebbie = embed(app, {
    types: [
      {
        name: type,
        load: async () => charts[type],
      },
    ],
  });

  document.querySelector('.curr-selections').innerHTML = '';
  (await nebbie.selections()).mount(document.querySelector('.curr-selections'));

  await nebbie.render({
    type: type,
    element: document.getElementById('chart-advisor'),
    properties: { ...recommendation.options },
    // fields: ["Month", "=sum(Sales)"],
  });
}

/**
 * Get Objects with enigmajs
 * param : 
 *      tagId : ID Html on the mashup 
 */

async function fetchRenderIndicators(tagId) {
  const engineUrl = `${tenantUrl.replace('https', 'wss')}/app/${appId}`;

  // get csrf token
  const qcsHeaders = await getQCSHeaders();
  const engineService = new EngineService(engineUrl);
  const obj = await engineService.getIndicators(appId, qcsHeaders);
  await RenderIndicators(obj, tagId);
}

/**
 * Get Object with enigmajs
 * param : 
 *      objId : Objet ID Qlik Sense 
 *      tagId : ID Html on the mashup
 */

async function fetchRenderIndicator(objId, tagId) {
  const engineUrl = `${tenantUrl.replace('https', 'wss')}/app/${appId}`;

  // get csrf token
  const qcsHeaders = await getQCSHeaders();
  const engineService = new EngineService(engineUrl);
  // const obj = await engineService.getIndicator(appId, qcsHeaders, objId);
  const app = await engineService.getOpenDoc(appId, qcsHeaders);
  const obj = await app.getObject(objId); 
  console.log("obj")
  console.log(obj)
  await RenderIndicators(obj, tagId);
  // await RenderIndicators(obj, tagId);
}

/**
 * Display Object on the webpage
 */

async function RenderIndicators(obj, tag) {
  console.log(obj);
  const type = obj.genericType;

  const nebbie = embed(app, {
    types: [
      {
        name: type,
        load: async () => charts[type],
      },
    ],
  });

  await nebbie.render({
    type: type,
    element: document.getElementById(tag),
  });
}

/**
 * Get Hypercube with enigmajs
 */

async function fetchRenderHyperCube() {

  const engineUrl = `${tenantUrl.replace('https', 'wss')}/app/${appId}`;

  // get csrf token
  const qcsHeaders = await getQCSHeaders();
  const engineService = new EngineService(engineUrl);
  const data = await engineService.getHyperCube(appId, qcsHeaders);
  await renderHyperCube(data)
}

/**
 * Display indicator on the webpage
 */

async function renderHyperCube(data) {
  let habitant = await format(data[0].qMatrix[0][0].qText);
  let ecole = data[0].qMatrix[0][3].qText;
  $('#habitant').html(habitant);
  $('#ecole').html(ecole);
}

/**
 * Format number
 */

async function format(num) {
  var n = num.toString(), p = n.indexOf('.');
  return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
      return p < 0 || i < p ? ($0 + '&nbsp;') : $0;
  });
}  

/**
 * rest api call for recommendations
 */
async function getRecommendation(requestPayload) {
  await qlikLogin(); // make sure you are logged in to your tenant
  // build url to execute recommendation call
  const endpointUrl = `${tenantUrl}/api/v1/apps/${appId}/insight-analyses/actions/recommend`;
  let data = {};
  // generate request payload
  if (requestPayload.text) {
    data = JSON.stringify({
      text: requestPayload.text,
    });
  } else if (requestPayload.fields || requestPayload.libItems) {
    data = JSON.stringify({
      fields: requestPayload.fields,
      libItems: requestPayload.libItems,
      targetAnalysis: { id: requestPayload.id },
    });
  }
  const response = await fetch(endpointUrl, {
    credentials: "include",
    mode: "cors",
    method: 'POST',
    headers,
    body: data,
  });

  const recommendationResponse = await response.json();
  return recommendationResponse;
}

/**
 * rest api call for analyses
 */
async function getAnalyses() {
  await qlikLogin(); // make sure you are logged in to your tenant
  // build url to execute analyses call
  const endpointUrl = `${tenantUrl}/api/v1/apps/${appId}/insight-analyses`;
  const response = await fetch(endpointUrl, {
    credentials: "include",
    mode: "cors",
    method: 'GET',
    headers,
  });
  const analysesResponse = await response.json();
  return analysesResponse;
}

/**
 * rest api call to fetch metadata & classifications
 */
async function getClassifications() {
  await qlikLogin(); // make sure you are logged in to your tenant
  const qcsHeaders = await getQCSHeaders();
  headers["qlik-csrf-token"] = qcsHeaders["qlik-csrf-token"];
  // build url to execute classification call
  const endpointUrl = `${tenantUrl}/api/v1/apps/${appId}/insight-analyses/model`;
  const response = await fetch(endpointUrl, {
    credentials: "include",
    mode: "cors",
    method: 'GET',
    headers,
  });
  const classificationResponse = await response.json();
  return classificationResponse;
}

/**
 * rest api call to fetch the csrf token - refer: https://qlik.dev/tutorials/build-a-simple-web-app#ensure-your-user-is-signed-in-to-your-tenant
 * and https://qlik.dev/tutorials/managing-iframe-embedded-content-session-state-using-enigmajs-and-json-web-tokens
 */
async function getQCSHeaders() {
  await qlikLogin(); // enforce tenant login
  const response = await fetch(`${tenantUrl}/api/v1/csrf-token`, {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'qlik-web-integration-id': webIntegrationId,
    },
  });

  const csrfToken = new Map(response.headers).get('qlik-csrf-token');
  return {
    'qlik-web-integration-id': webIntegrationId,
    'qlik-csrf-token': csrfToken,
  };
}

/**
 * Authentification at Qlik Sense Cloud
 */

async function qlikLogin() {
  const loggedIn = await fetch(`${tenantUrl}/api/v1/users/me`, {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'qlik-web-integration-id': webIntegrationId,
    },
  });
  if (loggedIn.status !== 200) {
    if (sessionStorage.getItem('tryQlikAuth') === null) {
      sessionStorage.setItem('tryQlikAuth', 1);
      window.location = `${tenantUrl}/login?qlik-web-integration-id=${webIntegrationId}&returnto=${location.href}`;
      return await new Promise((resolve) => setTimeout(resolve, 10000)); // prevents further code execution
    } else {
      sessionStorage.removeItem('tryQlikAuth');
      const message = 'Third-party cookies are not enabled in your browser settings and/or browser mode.';
      alert(message);
      throw new Error(message);
    }
  }
  sessionStorage.removeItem('tryQlikAuth');
  console.log('Logged in!');
  return true;
}
