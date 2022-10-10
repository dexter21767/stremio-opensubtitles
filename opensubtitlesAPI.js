var axios = require("axios").default
var { parse } = require("node-html-parser")
const config = require('./config.js');

const BaseURL = config.BaseURL;


async function getOpenSubData(imdb_id) {
    let url = `${BaseURL}/libs/suggest.php?format=json3&MovieName=${imdb_id}`
    res = await axios.get(url)
    return res.data[0];
}

async function getshow(id) {
    let url = `${BaseURL}/en/ssearch/sublanguageid-all/idmovie-${id}`;
    res = await axios.get(url)
    //console.log(res.data)
    let html = parse(res.data)
    let rows = html.querySelectorAll('#search_results tr:not(.head)')
    //let elm =
    var season = 0;
    episodes = {}
    //console.log(rows)
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i]
        //console.log(row)
        if (row.childNodes.length == 1) {
            season++;
            episodes[season] = { season: season }
        } else {
            if (season != 0) {
                let ep = row.childNodes[0].querySelector("span").rawText;
                let title = row.childNodes[0].querySelector("a").rawText;
                let url = row.childNodes[0].querySelector("a").rawAttributes['href'];
                episodes[season][ep] = { ep: ep, title: title, url: url, season: season }
            }
        }
    }
    //console.log (episodes)
    return episodes
}

async function getsubs(meta, type, imdb_id, season, episode) {
    let { name, year, total, id, pic, kind, rating } = meta;
    //console.log(name, year, total, id, pic, kind, rating)
    if (type == "movie") {
    let path = `/en/search/sublanguageid-all/idmovie-${id}`
        return getsub(path)
    } else {
        let episodes = await getshow(id);
        return getsub(episodes[season][episode].url)
    }
}

async function getsub(path) {
    //console.log(episodes)
    let url = BaseURL + path
    console.log(url)
    res = await axios.get(url)
    html = parse(res.data)
    let rows = html.querySelectorAll('#search_results > tbody > tr:not(.head)')
    /*const index = rows.indexOf(html.querySelector("#search_results tbody").querySelector('tr.head'));
    if (index > -1) { // only splice array when item is found
        rows.splice(index, 1); // 2nd parameter means remove one item only
    }*/

    //console.log(rows)
    var subs = [];
    for (let i = 0; i < rows.length; i++) {
        // console.log(rows[i].rawAttributes["style"])
        if (!rows[i].rawAttributes["style"]) {
            let elements = rows[i].querySelectorAll("td");
            //    console.log(elements[0].removeWhitespace().textContent.replace(' onlineDownload Subtitles Searcher',""))
            let fps = elements[3].querySelector('span.p')
            subs.push(
                {
                    name: elements[0].removeWhitespace().textContent.replace(' onlineDownload Subtitles Searcher', ""),
                    //url:elements[0].querySelector('strong a').rawAttributes["href"],
                    lang: elements[1].childNodes[0].rawAttributes['title'],
                    uploaded: elements[3].querySelector('time').rawAttributes['datetime'],
                    fps: fps ? fps.rawText : null,
                    downloaded: elements[4].querySelector('a').rawText.replace('x\n', ''),
                    url: BaseURL + elements[4].querySelector('a').rawAttributes["href"]
                }
            )
        }
    }
    subs = sortByLang(subs)
    return (subs)
}

function sortByLang(subs = Array) {
    try {
        let sorted = {}
        subs.map((e,
            i) => {
            if (sorted[e.lang.toLowerCase()]) {
                sorted[e.lang.toLowerCase()].push(e)
            } else {
                sorted[e.lang.toLowerCase()] = [e]
            }
        })
        return sorted
    } catch (err) {
        return null
    }
}

module.exports = { getOpenSubData, getsubs };