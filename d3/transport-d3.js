
// let data;
let data;
const scale = d3.scaleOrdinal(d3.schemePaired).domain([...Array(d3.schemePaired.length).keys()]);
const node_map = {}
const initial_depth = 3;
let gNodes, gLinks;
let children, children_links;
let sliderStep, gStep;
let max_possible_depth;
let slider_data;
let root_node, initial_root_node;
let transform, node, link, svg, layer1, layer2, width, height, simulation;

function load_data() {
    gNodes = data.nodes;
    gLinks = data.links;
    for (var i = 0; i < gNodes.length; i++) {
        gNodes[i].collapsed = false;
        node_map[gNodes[i].id] = gNodes[i];
        if (gNodes[i].depth == 0) {
            root_node = gNodes[i];
        }
    }
    initial_root_node = root_node;
    //   root_node.group=5
    /* console.log(node_id); */
    for (var i = 0; i < gLinks.length; i++) {
        gLinks[i].collapsed = false;
        gLinks[i].source = node_map[gLinks[i].source];

        gLinks[i].target = node_map[gLinks[i].target];
    }
    for (var i = 0; i < gNodes.length; i++) {

        var cc = get_children(gNodes[i]);
        children = cc[0];
        children_links = cc[1];
        if (children.length > 0) {
            gNodes[i].children = children;
            gNodes[i].children_links = children_links;
        }
    }
    /* console.log(gNodes); */

    //let i = 0;
    //const root = d3.hierarchy(data);
    transform = d3.zoomIdentity;
    node, link;

    svg = d3.select('div.chart').select('svg')
        .call(d3.zoom().scaleExtent([1 / 4, 2]).on('zoom', zoomed))
        .append('g')
        .attr('transform', 'translate(40,0)');


    layer1 = svg.append('g');
    layer2 = svg.append('g');

    width = d3.select('div.chart').select('svg').style('width').replace("px", "");

    height = d3.select('div.chart').select('svg').style('height').replace("px", "");
    console.log(width);
    simulation = d3.forceSimulation()
        .alphaDecay(1 - Math.pow(0.001, 1 / 600))
        .velocityDecay(0.3)
        .force('link', d3.forceLink().id(function (d) {
            return d.id;
        }))
        .force('charge', d3.forceManyBody().strength(-35).distanceMax(300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);

    svg.append("svg:defs").selectAll("marker")
        .data(["end"]) // Different link/path types can be defined here
        .enter().append("svg:marker") // This section adds in the arrows
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 14)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 3.5)
        .attr('preserveAspectRatio', 'none')
        .attr("orient", "auto")
        .attr("class", "arrow")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
};
function update() {
    const nodes = gNodes
        .filter(d => (!d.collapsed && isFinite(d.cur_depth)));
    const links = gLinks
        .filter(d => (
            !d.source.collapsed && !d.target.collapsed &&
            isFinite(d.source.cur_depth) && isFinite(d.target.cur_depth)));
    //const nodes = flatten(root)
    //const links = root.links()
    //console.log(gNodes);
    layer1.delet
    link = layer1
        .selectAll('.link')
        .data(links, function (d) {
            return d.target.id
        })
    node = layer2
        .selectAll('.node')
        .data(nodes, function (d) {
            return d.id
        })

    // node.append("title")
    //     .text(d => d.id);
    node.exit().remove()
    link.exit().remove()
    //console.log(links);

    const linkEnter = link
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('stroke', '#000')
        .style('opacity', '0.2')
        .style('stroke-width', 2)
        .attr("marker-end", "url(#end)");


    link = linkEnter.merge(link)


    const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .on('click', clicked)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))

    nodeEnter.append('circle')
        .attr("r", 5).style('fill', color)
        .style('opacity', 1)
        .attr('stroke', function (d) { return d.id == root_node.id ? '#000' : '#666' })
        .attr('stroke-width', function (d) { return d.id == root_node.id ? 3 : 1.5 })

    // node.transition()
    // .attr('stroke', function (d) { return d == root_node ? '#000' : '#666' })
    // .attr('stroke-width', function (d) { return d == root_node ? 3 : 1.5 })

    //function(d) {
    //      return Math.sqrt(d.data.size) / 10 || 4.5;
    //   })
    // .style('text-anchor', function(d) {
    //   return d.children ? 'end' : 'start';
    // })
    nodeEnter.append('title')
        .text(d => d.id+'\n'+d.depth);

    node = nodeEnter.merge(node)
    d3.selectAll('.node>circle')
        .attr(
            'stroke',
            function (d) {
                if (d.id == root_node.id) { return '#000' }
                else { return '#666' }
                //    console.log(d.id == root_node.id); return d.id == root_node.id ? '#000' : '#666' 
            }
        )
        .attr('stroke-width', function (d) { return d.id == root_node.id ? 3 : 1.5 })

    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(1);
    /* setTimeout(function() {
      simulation.alpha(1);
      simulation.alphaTarget(0)
    }, 2000)
     */
}

function sizeContain(num) {
    num = num > 1000 ? num / 1000 : num / 100
    if (num < 4) num = 4
    return num
}

function color(d) {
    let grp_color = (d.group * 2) % 12
    // return scale(d.group);
    return d.children ? scale(grp_color + 1) : scale(grp_color);
    /*   return d._children ? "#51A1DC" // collapsed package
        :
        d.children ? "#51A1DC" // expanded package
        :
        "#F94B4C"; // leaf node */
}

function radius(d) {
    return 4;
    //return d._children ? 8 :
    // d.children ? 8 :
    // 4
}

function ticked() {
    link
        .attr('x1', function (d) {
            return d.source.x;
        })
        .attr('y1', function (d) {
            return d.source.y;
        })
        .attr('x2', function (d) {
            return d.target.x;
        })
        .attr('y2', function (d) {
            return d.target.y;
        })

    node
        .attr('transform', function (d) {
            return `translate(${d.x}, ${d.y})`
        })
}

function collapseNode(d) {
    if (d.children) {
        d.children.forEach(collapseNode);
        d.children.forEach(e => {
            e.collapsed = true
        });
        // d.children_links.forEach(e => {
        //  e.collapsed = collapsed
        //});
    }
}


function allCollapsed(d) {
    var collapsed = d.collapsed;
    if (d.children) {
        d &= d.children.every(e => {
            return e.collapsed
        });
    }
    return collapsed;
}

function expand(d, depth = 1) {
    //console.log(typeof d.children);
    if (depth != 0 && typeof d.children === 'object') {
        d.children.forEach(e => {
            expand(e, depth - 1)
        })
    }
    d.collapsed = false;
}

function setRoot(r) {
    root_node=r;
    console.log(r);
    // gNodes.forEach(d => { d.fixed = false; d.fx = null; d.fy = null })
    // r.fixed = true;
    // r.x = width / 2;
    // r.y = height / 2;
    // r.fx = width / 2;
    // r.fy = height / 2;

    resetDepths(r);
    collapseToDepth(sliderStep.value());
    update();
}
function clicked(event, d) {
    if (!event.defaultPrevented && d.children) {
        if (event.ctrlKey) {
            setRoot(d);

        } else {
            var all_children_collapsed = d.children.every(allCollapsed);
            // console.log(all_children_collapsed);
            if (!all_children_collapsed) {
                collapseNode(d);
            } else {
                if (event.shiftKey) {
                    expand(d, -1)
                } else {
                    expand(d, 1);
                }
                //d.children.every(e=>{e.collapsed=false})
            }
            update();
        }


    }
}


function dragstarted(event, d) {
    if (d.fixed) { return }
    if (!event.active) simulation.alphaTarget(0.6).restart()
    d.fx = d.x
    d.fy = d.y
}

function dragged(event, d) {
    if (d.fixed) { return }
    d.fx = event.x
    d.fy = event.y
}

function dragended(event, d) {
    if (d.fixed) { return }
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
}

function get_children(d) {
    const children = [];
    const children_links = [];
    /* console.log(gLinks) */

    gLinks.forEach(e => {
        ///* console */.log(e);
        if (e.source == d && e.target.depth > d.depth) {
            children.push(e.target);
            children_links.push(e);
            // get_child(e.target);
        }
    });

    return [children, children_links];

}

function setCurrentDepth(d, this_depth = 0) {
    if (d.children) {
        //console.log(d.children);
        d.children.forEach(e => {
            setCurrentDepth(e, this_depth + 1);
        })
    }
    d.cur_depth = Math.min(d.cur_depth, this_depth);
}

function resetDepths(root) {
    gNodes.forEach(d => {
        d.cur_depth = Infinity
    });
    setCurrentDepth(root);
    max_possible_depth = 0;
    gNodes.forEach(d => {
        if (isFinite(d.cur_depth)) {
            max_possible_depth = Math.max(max_possible_depth, d.cur_depth);
        }
    })
    slider_data = [...Array(max_possible_depth + 1).keys()]
}
function zoomed(event) {
    svg.attr('transform', event.transform)
};

function collapseToDepth(d) {
    gNodes.forEach(e => {
        if (e.cur_depth > d) {
            e.collapsed = true
        } else {
            e.collapsed = false
        }
        delete e.x;
        delete e.y;
        /* 
            e.x=width/2;
            e.y=height/2; */
    });
    console.log(gNodes);
}
function createSlider() {
    sliderStep = d3
        .sliderBottom()
        .min(d3.min(slider_data))
        .max(d3.max(slider_data))
        .width(300)
        .tickFormat(d3.format('.1'))
        .ticks(slider_data.length)
        .step(1)
        .default(initial_depth)
        .on('onchange', val => {
            d3.select('p#value-step').text(d3.format('.1')(val));
            collapseToDepth(val);
            update();
        });
    gStep = d3
        .select('div#slider-step')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderStep);
    d3.select('p#value-step').text(d3.format('.1')(sliderStep.value()));
}

function start(d) {
    data = d;
    load_data();
    resetDepths(initial_root_node);
    createSlider();
    collapseToDepth(sliderStep.value());
    d3.select("#reset_root").on("click", d => { setRoot(initial_root_node) })
    // collapseToDepth(initial_depth);

    setRoot(initial_root_node);
}

d3.json(
    'transport.json').then(start);


