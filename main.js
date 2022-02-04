import './a.scss'
import init, {open_image, putImageData, offset_red} from "photon-web";

let ctx1, ctx0
let area = [0, 0, 0, 0]

/**
 * query or create Nodes
 * @param {Node|String}s
 * @param  {Node|String|Function|Object|Number} a
 * @returns {Node|Node[]}
 */
function $(s, ...a) {
    const nodes = [];
    const l = a.length
    let root, pre
    if (s) {
        // html to element
        if (typeof s === 'string') {
            if (s[0] === '<') {
                root = parseNodes(s)[0];
            } else {
                // selector
                root = document.querySelector(s);
            }
        } else {
            if (s instanceof Node) root = s;
        }
        pre = root
    }
    if (root) for (let i = 0; i < l; i++) {
        const c = a[i]
        switch (Object.prototype.toString.call(c)[8]) {
            // string
            case 'S':
                const cs = parseNodes(c)
                cs.forEach(e => root.appendChild(e));
                if (cs.length === 1) pre = cs[0];
                else pre = cs;
                break;
            // number
            case 'N':
                pre = root.appendChild(document.createTextNode(c))
                break;
            // node
            case 'H':
                pre = root.appendChild(c)
                break;
            // function
            case 'F':
                c(pre)
                continue;
            // object
            case 'O':
                Object.assign(pre, c)
                continue;
        }
        nodes.push(pre)
    }
    if (!nodes.length) return root;
    return [root].concat(nodes)
}

// process Img via photon
function processImg(img) {
    const w = ori.width = result.width = ori.offsetWidth
    const h = ori.height = result.height = ori.offsetHeight
    ctx0 = ori.getContext('2d')
    ctx1 = result.getContext('2d')
    ctx1.dr = function (a) {
        if (ctx1 && ctx1.img) {
            ctx1.x = a;
            ctx1.putImageData(ctx1.img, area[0], area[1])
            ctx1.clearRect(0, 0, a, h)
            line.style.transform = `translate3d(${a}px,0,0)`
        }
    }
    img = img || ctx0.img
    if (!img) return;
    ctx0.img = img;
    const {width, height} = img
    ctx0.drawImage(img, ...adjustSize(width, height, w, h))
    const img2 = open_image(ori, ctx0);
    offset_red(img2, 20)
    putImageData(result, ctx1, img2);
    ctx1.img = ctx1.getImageData(...area)
    ctx1.clearRect(0, 0, w, h)
    ctx1.putImageData(ctx1.img, area[0], area[1])
    ctx1.dr(0, ctx1.x)
}

// get image from files
function processFile(files) {
    const f = [].find.call(files, ({type}) => /image/.test(type))
    if (!f) return;
    const img = new Image();
    img.onload = function () {
        processImg(img)
    }
    img.src = URL.createObjectURL(f)
}

// calculate the size of the image on the canvas
function adjustSize(sw, sh, tw, th) {
    let r = 1
    const r0 = sw / tw
    const r1 = sh / th
    if (r0 > 1 || r1 > 1) {
        r = Math.max(r0, r1)
    } else if (r0 < 1 && r1 < 1) {
        r = Math.min(r0, r1)
    }
    const [w, h] = [sw / r, sh / r]
    area = [(tw - w) / 2, (th - h) / 2, w, h]
    return [0, 0, sw, sh, ...area]
}

function parseNodes(c) {
    const tmp = document.createElement('div')
    tmp.innerHTML = c;
    return Array.from(tmp.childNodes)
}

const [imgArea, ori, result, , line] = $(
    '<div class="img">',
    '<canvas class="original">',
    '<canvas class="result">',
    '<input type="file"/>', {
        onchange() {
            processFile(this.files)
        },
        onmousemove(e) {
            if (ctx1) ctx1.dr(e.offsetX)
        }
    },
    '<div class="line">'
);

init().then(() => {
    const root = $('#app', {
        ondragover(e) {
            e.preventDefault()
        },
        async ondrop(e) {
            e.preventDefault()
            const {dataTransfer: {files}} = e;
            processFile(files)
        }
    });
    $(root, imgArea)
    window.onreset = function () {
        processImg()
    }
})

