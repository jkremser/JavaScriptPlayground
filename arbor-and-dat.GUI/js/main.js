      (function($){
        var Renderer = function(canvas){
          var canvas = $(canvas).get(0)
          canvas.height = window.screen.availHeight + 30;
          canvas.width = window.screen.availWidth;
          var ctx = canvas.getContext("2d");
          var particleSystem

          var that = {
            init:function(system){
              particleSystem = system
              particleSystem.screenSize(canvas.width, canvas.height) 
              particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
              
              that.initMouseHandling()
              docElement = document.documentElement;
              req = docElement.requestFullScreen || docElement.webkitRequestFullScreen || docElement.mozRequestFullScreen || docElement.msRequestFullScreen;
              if(typeof req != "undefined" && req){
                req.call(docElement);
              }
            },
            params: {
              "circle" : true,
              "color" : "#ffae23",
              "nodeSize" : 20,
              "lineWidth" : 6
            },
            
            redraw:function(){
              ctx.fillStyle = "white"
              ctx.fillRect(0,0, canvas.width, canvas.height)
              
              particleSystem.eachEdge(function(edge, pt1, pt2){
                ctx.strokeStyle = "rgba(0,0,0, 1)"
                ctx.lineWidth = that.params.lineWidth;
                ctx.beginPath()
                ctx.moveTo(pt1.x, pt1.y)
                ctx.lineTo(pt2.x, pt2.y)
                ctx.stroke()
              })

              particleSystem.eachNode(function(node, pt){
                // node: {mass:#, p:{x,y}, name:"", data:{}}
                // pt:   {x:#, y:#}  node position in screen coords
                ctx.fillStyle = (node.data.alone) ? "orange" : "black"
                ctx.beginPath();
                if (that.params.circle) {
                  ctx.arc(pt.x, pt.y, that.params.nodeSize, 0, Math.PI * 2, false);
                } else {
                  var w = that.params.nodeSize
                  ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w) 
                }
                ctx.fillStyle = that.params.color;
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#003300';
                ctx.stroke();

                ctx.fillStyle = 'blue';
                ctx.font = " 14px sans-serif";
                ctx.fillText("left click - adds a node to the two nearest neighbors", 10, 20);
                ctx.fillText("left click + ctrl - adds a node to the nearest neighbor", 10, 40);
                ctx.fillText("left click + alt - connect two nearest nodes", 10, 60);
                ctx.fillText("right click&drop - moves the node", 10, 80);
              })    			
            },
            
            initMouseHandling:function(){
              var dragged = null;
              var handler = {
                nearestNext : function(x, closest) {
                  x = particleSystem.fromScreen(x)
                  var w = {
                    node : null,
                    point : null,
                    distance : null
                  };
                  var v = particleSystem;

                  particleSystem.eachNode(function(y, B){
                    var z = y._p;
                    if (z.x === null || z.y === null) {
                      return
                    }
                    var A = z.subtract(x).magnitude();
                    if ((w.distance === null || A < w.distance) && (closest.node != y)) {
                      w = {
                        node : y,
                        point : z,
                        distance : A
                      };
                      w.screenPoint = particleSystem.toScreen(z)
                    }
                  });
                  if (w.node) {
                    w.distance = particleSystem.toScreen(w.node.p).subtract(
                      particleSystem.toScreen(x)).magnitude()
                    return w
                  } else {
                    return null
                  }
                }, 
                clicked:function(e){
                  var pos = $(canvas).offset();
                  _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
                  nearest = particleSystem.nearest(_mouseP);
                  switch (e.which) {
                    case 1:
                      if (e.ctrlKey) { // add a new node to the nearest neighbot
                        particleSystem.addEdge("c" + e.pageY + "y" + e.pageX, nearest.node);
                      } else if (e.altKey) { // connect the two nearest neighbors
                        nearest2 = handler.nearestNext(_mouseP, nearest);
                        particleSystem.addEdge(nearest.node, nearest2.node);
                      } else { // add a new node and connect it with the two nearest neighbors
                        nearest2 = handler.nearestNext(_mouseP, nearest);
                        particleSystem.addEdge("c" + e.pageY + "y" + e.pageX, nearest2.node);
                        particleSystem.addEdge("c" + e.pageY + "y" + e.pageX, nearest.node);
                      }
                      break;
                    default: // righ and middle click are only for dragging the nodes
                    if (nearest && nearest.node !== null){
                        // while we're dragging, don't let physics move the node
                        nearest.node.fixed = true
                      }
                      $(canvas).bind('mousemove', handler.dragged)
                      $(window).bind('mouseup', handler.dropped)
                      break;
                    }
                    return false
                  },
                  dragged:function(e){
                    var pos = $(canvas).offset();
                    var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

                    if (nearest && nearest.node !== null){
                      var p = particleSystem.fromScreen(s)
                      nearest.node.p = p
                    }

                    return false
                  },

                  dropped:function(e){
                    if (nearest===null || nearest.node===undefined) return
                      if (nearest.node !== null) nearest.node.fixed = false
                        nearest.node.tempMass = 1000
                      nearest = null
                      $(canvas).unbind('mousemove', handler.dragged)
                      $(window).unbind('mouseup', handler.dropped)
                      _mouseP = null
                      return false
                    }
                  }


              // start listening
              $(canvas).mousedown(handler.clicked);
              $(canvas).bind("contextmenu", function(){
                return false;
              }); 

            },
            
          }
          return that
        }    

        $(document).ready(function(){
          var sys = arbor.ParticleSystem(1000, 500, 0.5) // create the system with sensible repulsion/stiffness/friction
          sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
          sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

          // add some nodes to the graph and watch it go...
          sys.addEdge('a','b')
          sys.addEdge('a','c')
          sys.addEdge('a','d')
          sys.addEdge('a','e')
          sys.addEdge('b','c')
          sys.addEdge('c','d')
          sys.addEdge('a','d')

          var gui = new dat.GUI();
          var params = sys.renderer.params;
          gui.add(params, 'circle');
          gui.add(params, 'color');
          gui.add(params, 'nodeSize', 10, 100);
          gui.add(params, 'lineWidth', 1, 25);
        })

      })(this.jQuery)


      $("#fullscreen").bind('click', function() {
        var docElement, request;
        docElement = document.documentElement;
        request = docElement.requestFullScreen || docElement.webkitRequestFullScreen || docElement.mozRequestFullScreen || docElement.msRequestFullScreen;
        if(typeof request!="undefined" && request){
          request.call(docElement);
          $("#fullscreen").hide();
        }
      });