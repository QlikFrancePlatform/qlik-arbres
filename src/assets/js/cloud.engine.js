import enigma from "enigma.js";
const schema = require("enigma.js/schemas/12.1306.0.json");

export default class EngineService {
  constructor(engineUri) {
    this.engineUri = engineUri;
    this.NUM_CELLS_PER_PAGE = 10000;
    this.MAX_PAGES = 1;
  }

  /**
   * @param {*} headers contains csrf-token and web-integration-id
   * Open engine session using qlik-csrf-token and qlik-web-integration-id
   * and https://qlik.dev/tutorials/managing-iframe-embedded-content-session-state-using-enigmajs-and-json-web-tokens
   */
  openEngineSession(headers) {
    const params = Object.keys(headers)
      .map((key) => `${key}=${headers[key]}`)
      .join("&");
    const session = enigma.create({
      schema,
      url: `${this.engineUri}?${params}`,
    });
    session.on("traffic:sent", (data) => console.log("sent:", data));
    session.on("traffic:received", (data) => console.log("received:", data));
    return session;
  }

  /**
   * @param {*} session session created in getHyperCubeData method
   * closes the session
   */
  async closeEngineSession(session) {
    if (session) {
      await session.close();
      console.log("session closed");
    }
  }

  async getOpenDoc(appId, headers) {
    let session = this.openEngineSession(headers);
    let global = await session.open();
    // get a doc for specific appId
    let doc = await global.openDoc(appId);
    return doc;
  }

  /**
   * rest api call for Capability
   */  
  async getObjectOnSheet(appId, headers) {
    let session = this.openEngineSession(headers);
    let global = await session.open();
    let doc = await global.openDoc(appId).then((object) => {
      object.getObject('pFJPTp', '#container');
    });
    return doc;
  }


  /**
   * call KPI Objects for Capability
   */  
  async getIndicators(appId, headers) {
    let session = this.openEngineSession(headers);
    let global = await session.open();
    let doc = await global.openDoc(appId);
    let objects = await doc.getObjects(
        {
            "qOptions": {
                "qTypes": ["kpi"],
                "qIncludeSessionObjects": false,
                "qData": {}
            }
        }
    )
    return objects;
  }

  /**
   * call KPI Objects for Capability
   */  
  async getIndicator(appId, headers, objectId) {
    let session = this.openEngineSession(headers);
    let global = await session.open();
    let doc = await global.openDoc(appId);
    let object = await doc.getObject(objectId)
    console.log(object)
    return object;
  }  

  /**
   * rest api call for Capability
   */  
  async getHyperCube(appId, headers) {

    const properties = {
      qInfo: {
        qType: 'my-straight-hypercube',
      },
      qHyperCubeDef: {
        qDimensions: [],
        qMeasures: [
          {
            qDef: { qDef: '=Sum(POPULATION)' },
            qLabel: "Nb. d'habitants",
            qLibraryId: null,
            qSortBy: {
                "qSortByState": 0,
                "qSortByFrequency": 0,
                "qSortByNumeric": 0,
                "qSortByAscii": 1,
                "qSortByLoadOrder": 0,
                "qSortByExpression": 0,
                "qExpression": {
                    "qv": " "
                }
              }
          },{
            qLabel: "Nb Arbres",
            qLibraryId: "WLZVe",
            qSortBy: {
                "qSortByState": 0,
                "qSortByFrequency": 0,
                "qSortByNumeric": 0,
                "qSortByAscii": 1,
                "qSortByLoadOrder": 0,
                "qSortByExpression": 0,
                "qExpression": {
                    "qv": " "
                }
              }
          },{
            qDef: { qDef: '=Count(ID_ARBRES)/Sum(POPULATION)' },
            qLabel: "Nb. d'arbres par habitants",
            qLibraryId: null,
            qSortBy: {
                "qSortByState": 0,
                "qSortByFrequency": 0,
                "qSortByNumeric": 0,
                "qSortByAscii": 1,
                "qSortByLoadOrder": 0,
                "qSortByExpression": 0,
                "qExpression": {
                    "qv": " "
                }
              }
          },{
            qDef: { qDef: '=Count(patronyme)' },
            qLabel: "Nb. d'écoles",
            qLibraryId: null,
            qSortBy: {
                "qSortByState": 0,
                "qSortByFrequency": 0,
                "qSortByNumeric": 0,
                "qSortByAscii": 1,
                "qSortByLoadOrder": 0,
                "qSortByExpression": 0,
                "qExpression": {
                    "qv": " "
                }
              }
          }
        ],
        qInitialDataFetch: [
          {
            qTop: 0,
            qLeft: 0,
            qHeight: 1,
            qWidth: 10
          },
        ],
      },
    };

    let session = this.openEngineSession(headers);
    let global = await session.open();
    let doc = await global.openDoc(appId);

    const data = await doc.createObject(properties)
      .then((object) => object.getLayout()
      .then((layout => layout.qHyperCube.qDataPages)
        // console.log('Hypercube data pages:', JSON.stringify(layout.qHyperCube.qDataPages, null, '  ')),
      ));
    return data;
  }
}
