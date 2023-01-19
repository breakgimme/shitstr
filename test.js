const socket = new WebSocket('wss://nos.lol');
var eose = false;
var identities = new Object;
socket.addEventListener('open', (event) => {
    console.log('were open')
    socket.send(`["REQ", "identities", {"kinds": [0]}]`);
    //socket.send(`["REQ", "posts", {"kinds": [1]}]`);
    socket.send(`["REQ", "relays", {"kinds": [2], "limit": 10}]`);
});
socket.addEventListener('message', (event) => {
    let data = JSON.parse(event.data)
    //console.log(data)
    switch(data[0]) {
        case "EVENT": {
            let key = data[2].pubkey
            let id = data[2].id
            switch(data[2].kind) {
                case 0: {
                    let name = JSON.parse(data[2].content).name
                    if (name != undefined) {
                        identities[key] = name
                    }
                    break;
                }
                case 1: {
                    let display = (function () {if (key in identities) {return identities[key]} else {return key;};})();
                    let posts = document.getElementById("posts")
                    let element = document.createElement('li');
                    element.setAttribute('id', id);
                    element.innerHTML = `<a class="date">${new Date(data[2].created_at*1000).toLocaleString()}</a> <a class="name" title=${key}>${DOMPurify.sanitize(display)}</a> <a class="content">${DOMPurify.sanitize(marked.parse(data[2].content))}</a>`
                    switch(eose) {
                        case false: {
                            posts.appendChild(element);
                            break;
                        }
                        case true: {
                            posts.insertBefore(element, posts.firstChild)
                        }
                    }
                    break;
                }
                case 2: {
                    console.log(`new server found: ${data[2].content}`);
                    break;
                }
            }
            break;
        }
        case "EOSE": {
            switch(data[1]) {
                case "posts": {
                    eose = true
                    break;
                }
                case "identities": {
                    socket.send(`["REQ", "posts", {"kinds": [1]}]`);
                    break;
                }
            }
            //console.log(data)
            break;
        };
        default: {console.log(`unhandled ${data[0]}`)}
    }

})