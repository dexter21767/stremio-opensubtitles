var axios = require("axios").default
var { parse } = require("node-html-parser")
const config = require('./config.js');

const BaseURL = config.BaseURL;

async function request(url, header) {

    return await axios
        .get(url, header, { timeout: 5000 })
        .then(res => {
            return res;
        })
        .catch(error => {
            if (error.response) {
                console.error('error on opensubtitlesAPI.js request:', error.response.status, error.response.statusText, error.config.url);
            } else {
                console.error(error);
            }
        });

}

async function getOpenSubData(imdb_id) {
    try {
    let url = `${BaseURL}/libs/suggest.php?format=json3&MovieName=${imdb_id}`
    res = await request(url)
    if(!res?.data) throw "getOpenSubData error getting data"
    return res.data[0];
} catch(e){ 
    console.error(e)
}
}

async function getshow(imdb_id, id) {
    try{
    let url = `${BaseURL}/en/ssearch/sublanguageid-all/imdbid-${imdb_id.replace('tt', '')}/idmovie-${id}`;
    console.log(url)
    res = await request(url)
    if(!res?.data) throw "getshow error getting data"

    let html = parse(res.data)
    let rows = html.querySelectorAll('#search_results tr:not(.head)')
    var season = 0;
    episodes = {}
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i]
        if (row.childNodes.length == 1) {
            season++;
            episodes[season] = { season: season }
        } else {
            if (season != 0) {
               
                let ep = row.childNodes[0].querySelector("span").rawText;
                if(row.childNodes[0].querySelector("a")){
                let title = row.childNodes[0].querySelector("a").rawText;
                let url = row.childNodes[0].querySelector("a").rawAttributes['href'];
                episodes[season][ep] = { ep: ep, title: title, url: url, season: season }
            }
                else{
                    episodes[season][ep] = { ep: ep, season: season }
                }
            
            }
        }
    }
    return episodes
} catch(e){ 
    console.error(e)
}
}

async function getsubs(imdb_id, id, type, season, episode) {
    try{
    if (type == "movie") {
        let path = `/en/search/sublanguageid-all/imdbid-${imdb_id.replace('tt', '')}/idmovie-${id}`
        return getsub(path).catch(error => console.error(error))
    } else {
        console.log(id)
        let episodes = await getshow(imdb_id, id).catch(error => console.error(error));
        if (episodes?.[season]?.[episode]?.url) {
            return getsub(episodes[season][episode].url).catch(error => console.error(error))
        } else {
            return
        }
    }
} catch(e){ 
    console.error(e)
}
}

async function getsub(path) {
    try{
    let url = BaseURL + path
    console.log(url)
    res = await request(url)
    if(!res?.data) throw "getsub error getting data"
    html = parse(res.data)
    let rows = html.querySelectorAll('#search_results > tbody > tr:not(.head)')
    var subs = [];
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].rawAttributes["style"]) {
            let elements = rows[i].querySelectorAll("td");
            let fps = elements[3].querySelector('span.p')
            subs.push(
                {
                    name: elements[0].removeWhitespace().textContent.replace(' onlineDownload Subtitles Searcher', ""),
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
} catch(e){ 
    console.error(e)
}
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