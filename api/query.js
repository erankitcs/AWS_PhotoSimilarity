const gremlin = require('gremlin');
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;

const __ = gremlin.process.statics;
const p = gremlin.process.P;


const clusterEndpoint = process.env.CLUSTER_ENDPOINT;

exports.query = (event, context, callback) => {

  const dcReader = new DriverRemoteConnection('wss://'+clusterEndpoint+':8182/gremlin', {});
  console.log('driver remote connection reader', dcReader);

  const graphReader = new Graph();
  console.log('graph reader', graphReader);

  const gR = graphReader.traversal().withRemote(dcReader);
  console.log('traversal reader', gR);
  const params = event.queryStringParameters;
  const threshold = parseFloat(params.threshold);
  const hops = parseInt(params.hops);
  console.log('params', params);
  //gR.V().limit(200).count().next()
  gR.V().has("imageId", params.imageId)
        .emit()
        .repeat(
            __.outE("similarity").has("weight", p.gte(threshold)).inV()
        )
        .times(hops)
        .dedup().by("imageId")
        .values("imageId")
        .toList()
    .then(data => {
      console.log(data);
      dcReader.close();
      callback(null, {
                statusCode: 200,
                body: JSON.stringify(data),
                headers: {
                  "Access-Control-Allow-Credentials": true,
                  "Access-Control-Allow-Origin": "*",
                  'Content-Type': 'application/json'
                }
      });
    })
    .catch(error => {
      console.log('ERROR getting vectors', error);
      dcReader.close();
      callback(null, {
                statusCode: 500,
                body: JSON.stringify(error),
                headers: {
                  "Access-Control-Allow-Credentials": true,
                  "Access-Control-Allow-Origin": "*",
                  'Content-Type': 'application/json'
                }
            });
    });

}
