const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const addNodeBtn = document.getElementById('addNodeBtn');
const deleteNodeBtn = document.getElementById('deleteNodeBtn');
const createDependencyBtn = document.getElementById('createDependencyBtn');
const editNodeTextBtn = document.getElementById('editNodeTextBtn');
const calculateBtn = document.getElementById('calculateBtn');
const result = document.getElementById('result');

let nodes = [];
let edges = [];
let selectedNode = null;
let isDragging = false;
let dragNode = null;
let creatingDependency = false;

const NODE_RADIUS = 30;

// Add a node
addNodeBtn.addEventListener('click', () => {
    const id = nodes.length + 1;
    const x = Math.random() * (canvas.width - NODE_RADIUS * 2) + NODE_RADIUS;
    const y = Math.random() * (canvas.height - NODE_RADIUS * 2) + NODE_RADIUS;
    nodes.push({ id, x, y, text: `Task ${id}` });
    draw();
});

// Delete a node
deleteNodeBtn.addEventListener('click', () => {
    if (selectedNode) {
        nodes = nodes.filter(node => node !== selectedNode);
        edges = edges.filter(edge => edge.from !== selectedNode && edge.to !== selectedNode);
        selectedNode = null;
        draw();
    }
});

// Activate dependency mode
createDependencyBtn.addEventListener('click', () => {
    creatingDependency = !creatingDependency;
    createDependencyBtn.textContent = creatingDependency
        ? 'Abhängigkeiten erstellen (aktiv)'
        : 'Abhängigkeiten erstellen';
});

// Edit node text
editNodeTextBtn.addEventListener('click', () => {
    if (selectedNode) {
        const newText = prompt('Neuer Text für den Kreis:', selectedNode.text);
        if (newText !== null) {
            selectedNode.text = newText;
            draw();
        }
    } else {
        alert('Wähle zuerst einen Kreis aus, um den Text zu ändern.');
    }
});

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
        drawArrow(edge.from, edge.to);
    });

    // Draw nodes
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0)'; // Transparent fill
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px Arial';
        ctx.fillText(node.text, node.x, node.y);
    });
}

// Draw an arrow
function drawArrow(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const unitX = dx / length;
    const unitY = dy / length;

    // Line
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arrowhead
    const arrowSize = 10;
    const arrowX1 = to.x - unitX * arrowSize - unitY * arrowSize;
    const arrowY1 = to.y - unitY * arrowSize + unitX * arrowSize;
    const arrowX2 = to.x - unitX * arrowSize + unitY * arrowSize;
    const arrowY2 = to.y - unitY * arrowSize - unitX * arrowSize;

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(arrowX1, arrowY1);
    ctx.lineTo(arrowX2, arrowY2);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
}

// Drag-and-Drop implementation
canvas.addEventListener('mousedown', (e) => {
    const { offsetX: x, offsetY: y } = e;
    dragNode = findNode(x, y);
    if (dragNode) {
        isDragging = true;
    } else {
        selectedNode = findNode(x, y);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && dragNode) {
        const { offsetX: x, offsetY: y } = e;
        dragNode.x = x;
        dragNode.y = y;
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    dragNode = null;
});

// Find a node by position
function findNode(x, y) {
    return nodes.find(node => Math.hypot(node.x - x, node.y - y) < NODE_RADIUS);
}

// Create a dependency
canvas.addEventListener('click', (e) => {
    if (!creatingDependency) return;

    const { offsetX: x, offsetY: y } = e;
    const node = findNode(x, y);

    if (node) {
        if (selectedNode) {
            if (selectedNode !== node) {
                edges.push({ from: selectedNode, to: node });
                selectedNode = null;
            }
        } else {
            selectedNode = node;
        }
    }
    draw();
});

// Calculate PCS
calculateBtn.addEventListener('click', () => {
    const inDegrees = new Map(nodes.map(node => [node.id, 0]));
    const adjList = new Map(nodes.map(node => [node.id, []]));

    edges.forEach(edge => {
        adjList.get(edge.from.id).push(edge.to.id);
        inDegrees.set(edge.to.id, inDegrees.get(edge.to.id) + 1);
    });

    const queue = [];
    inDegrees.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
    });

    const sorted = [];
    while (queue.length) {
        const id = queue.shift();
        sorted.push(id);
        adjList.get(id).forEach(neighbor => {
            inDegrees.set(neighbor, inDegrees.get(neighbor) - 1);
            if (inDegrees.get(neighbor) === 0) queue.push(neighbor);
        });
    }

    const times = new Map();
    sorted.forEach(id => {
        const time = adjList.get(id).reduce(
            (max, neighbor) => Math.max(max, times.get(neighbor)
