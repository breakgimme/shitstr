//const socket = new WebSocket('wss://nos.lol');
//var eose = false;
const defaultServers = ["wss://nos.lol", "wss://brb.io"]
var identities = new Object;
var EventArray = new Array;
var TimeStampPostArray = new Array;
const objectComparisonCallback = (arrayItemA, arrayItemB) => {
    if (arrayItemA.timestamp < arrayItemB.timestamp) {
        return -1
    }

    if (arrayItemA.timestamp > arrayItemB.timestamp) {
        return 1
    }

    return 0
}
var servers = new Object;
function connect(url) {
    let socket = new WebSocket(url);
    let eose = false;
    socket.addEventListener('open', (event) => {
        console.log(`${url} open`)
        socket.send(`["REQ", "identities", {"kinds": [0]}]`);
        //socket.send(`["REQ", "posts", {"kinds": [1]}]`);
        socket.send(`["REQ", "relays", {"kinds": [2], "limit": 10}]`);
    });
    let server = {socket: socket, eose: eose, url: url}
    socket.addEventListener('message', (event) => {handleMessage(event, server)});
    servers[btoa(url)] = server;
}

function handleMessage(event, server) {
    let data = JSON.parse(event.data)
    switch(data[0]) {
        case "EVENT": {
            let key = data[2].pubkey
            let id = data[2].id
            console.log(`new event from ${server.url}`)
            if (!EventArray.includes(id)) {
                EventArray.push(id);
                switch(data[2].kind) {
                    case 0: {
                        let name = JSON.parse(data[2].content).name
                        if (name != undefined) {
                            identities[key] = name
                        }
                        break;
                    }
                    case 1: {
                        TimeStampPostArray.push({id: id, timestamp: data[2].created_at*1000});
                        TimeStampPostArray.sort(objectComparisonCallback);
                        let display = (function () {if (key in identities) {return identities[key]} else {return key;};})();
                        let posts = document.getElementById("posts")
                        let element = document.createElement('li');
                        element.setAttribute('id', id);
                        element.innerHTML = `<p class="name" title=${key}>${DOMPurify.sanitize(display)}</p><a class="relay small">${server.url}</a> <a class="date small">${new Date(data[2].created_at*1000).toLocaleString()}</a> <a class="content">${DOMPurify.sanitize(marked.parse(data[2].content))}</a>`
                        /*switch(server.eose) {
                            case false: {
                                posts.appendChild(element);
                                break;
                            }
                            case true: {
                                posts.insertBefore(element, posts.firstChild)
                            }
                        }*/
                        let index = TimeStampPostArray.findIndex(x => x.id === id) - 1
                        if (TimeStampPostArray[index] != undefined) {
                            posts.insertBefore(element, document.getElementById(TimeStampPostArray[index].id))
                        } else {
                            posts.appendChild(element);
                        }

                        break;
                    }
                    case 2: {
                        console.log(`new server found: ${data[2].content}`);
                        //chujkurwa
                        /*if(servers[btoa(data[2].content)] == undefined) {
                            connect(data[2].content)
                        };*/
                        break;
                    }
                }
            }
            break;
        }
        case "EOSE": {
            switch(data[1]) {
                case "posts": {
                    server.eose = true
                    break;
                }
                case "identities": {
                    server.socket.send(`["REQ", "posts", {"kinds": [1], "limit": 50}]`);
                    break;
                }
            }
            //console.log(data)
            break;
        };
        default: {console.log(`unhandled ${data}`)}
    }
};

function ensureEvent(id) {
    if (!EventArray.includes(id)) {
        console.log(`ensuring ${id}`);
        for (const server of Object.entries(servers)) {
            server[1].socket.send(`["REQ", "${id.substring(0,8)}", {"ids": ["${id}"]}]`)
            server[1].socket.send(`["CLOSE", "${id.substring(0,8)}"]`)
        }
    }
}

function post(server, message, key) {
}

for (const relay of defaultServers) {
    connect(relay);
}