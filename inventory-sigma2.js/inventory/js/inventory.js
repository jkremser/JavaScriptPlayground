;(function(undefined) {
  'use strict';
var $ = function (id) {
  return document.getElementById(id);
};

// Initialize sigma with a dataset:
// sigma.parsers.json('data/simple.json', {
//sigma.parsers.json('data/arctic.json', {
// sigma.parsers.json('data/dump_pretty.json', {
sigma.parsers.json('data/inv-light.json', {
  container: 'graph-container',
  settings: {
    edgeColor: 'default',
    defaultEdgeColor: '#ccc',
    defaultNodeColor: '#555',
    animationsTime: 2000,
    labelThreshold: 8,
    zoomMin: 0.01,
    zoomMax: 10,
    minEdgeSize: 0.1,
    maxEdgeSize: 0.1,
    edgesPowRatio: 0.01
    // autoRescale: false
  }
}, function(s) {
  var conf = {
    animation: {
      node: {
        duration: 500
      },
      edge: {
        duration: 500
      },
      center: {
        duration: 300
      }
    },
    focusOut: true,
    zoomDef: 1
  };
  var nodelistElt = $('nodelist');
  var categories = {};

  var allEdges = s.graph.edges();

  s.graph.nodes().forEach(function (n) {
    n.label = n.type + ': ' + n.name;
    // if (n['type'] === 'metric') {
    //   n.size = 0.1;
    //   n.modularity_class=0;
    // } else if (n['type'] === 'resource') {
    //   n.modularity_class=1;
    //   n.size = 0.2;
    // } else if (n['type'] === 'resourceType') {
    //   n.modularity_class=2;
    //   n.size = 0.4;
    // } else if (n['type'] === 'metricType') {
    //   n.modularity_class=3;
    //   n.size = 0.4;
    // } else if (n['type'] === 'feed'){
    //   n.modularity_class=4;
    //   n.size = 1;
    //   n.label = n['type'] + ': ' + n.__eid;
    // } else if (n['type'] === 'environment'){
    //   n.modularity_class=5;
    //   n.size = 1;
    //   n.label = n['type'] + ': ' + n.__eid;
    // }

    n.x = Math.random();
    n.y = Math.random();

    var optionElt = document.createElement("option");
    optionElt.id = n.id;
    optionElt.text = n.label;
    nodelistElt.add(optionElt);

    categories[n.modularity_class] = true;
  });
  s.graph.edges().forEach(function (e){
    if (e.label !== "contains") {
      s.graph.dropEdge(e.id);
    }
  });

  s.refresh();
  var locate = sigma.plugins.locate(s, conf);

  locate.setPadding({
    right:250,
  });

  if (!s.settings('autoRescale')) {
    sigma.utils.zoomTo(s.camera, 0, 0, conf.zoomDef);
  }


  // node category
  var nodecategoryElt = $('node-category');
  Object.keys(categories).forEach(function(c) {
    var optionElt = document.createElement("option");
    optionElt.text = c;
    nodecategoryElt.add(optionElt);
  });

  // reset button
  $('reset-btn').addEventListener("click", function(e) {
    $('nodelist').selectedIndex = 0;
    $('edgelist').selectedIndex = 0;
    $('nodefilter').selectedIndex = 0;
    $('node-category').selectedIndex = 0;
    locate.center(conf.zoomDef);
  });

  function locateNode (e) {
    var nid = e.target[e.target.selectedIndex].id;
    if (nid == '') {
      locate.center(1);
    }
    else {
      locate.nodes(nid);
    }
  };

  function locateNodesByCategory(e) {
    var c = e.target[e.target.selectedIndex].id;
    if (c == '') {
      locate.center(1);
    }
    else {
      var nodes = s.graph.nodes().filter(function(n) {
        return n.modularity_class == c;
      }).map(function(n) {
        return n.id;
      });

      locate.nodes(nodes);
    }
  };

  function atlas(sleep) {
    s.startForceAtlas2({worker: true});

    setTimeout(function(){
      console.log('done layout');
      s.stopForceAtlas2(); 
    }, sleep);
  }

  function toggleEdge(e) {
    var label = e.target[e.target.selectedIndex].value;
    console.log("edgetype:" + label);
    var all = label === "all";
    allEdges.forEach(function (e){
      e.hidden = !all && e.label !== label
      if (!_.contains(s.graph.edges(), e)) s.graph.addEdge(e);
    });
    s.refresh();
  }


  function toggleNodeType(e) {
    var type = e.target[e.target.selectedIndex].value;
    console.log("nodetype:" + type);
    var all = type === "all";
    s.graph.nodes().forEach(function (n){
      n.hidden = !all && n.type !== type
    });
    s.refresh();
  }

  $('nodelist').addEventListener("change", locateNode);
  $('edgelist').addEventListener("change", toggleEdge);
  $('nodefilter').addEventListener("change", toggleNodeType);
  $('node-category').addEventListener("change", locateNodesByCategory);

  // just for easy introspection
  window.s = s;
  window.locate = locate;

  // Configure the ForceLink algorithm:
  // var fa = sigma.layouts.configForceLink(s, {
  //   worker: true,
  //   autoStop: true,
  //   background: true,
  //   scaleRatio: 10,
  //   gravity: 3,
  //   easing: 'cubicInOut'
  // });

  // // Bind the events:
  // fa.bind('start stop', function(e) {
  //   console.log(e.type);
  //   document.getElementById('layout-notification').style.visibility = '';
  //   if (e.type == 'start') {
  //     document.getElementById('layout-notification').style.visibility = 'visible';
  //   }
  // });

  // Start the ForceLink algorithm:
  // sigma.layouts.startForceLink();
  atlas(1500);


});
}).call(this);