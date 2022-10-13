const opensub = require('./opensubtitlesAPI.js');
const config = require('./config');
require('dotenv').config();
const logger = require('./logger')
const languages = require('./languages.json');
const count = 10;
const NodeCache = require("node-cache");
const Cache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const MetaCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const OpenSubCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });


async function subtitles(type, id, lang) {
    var imdb_id, season, episode
    if (type == "series") {
        imdb_id = id.split(":")[0];
        season = id.split(":")[1];
        episode = id.split(":")[2]
    } else {
        imdb_id = id;
        season = "1";
        episode = "1";
    }
    const cachID = `${id}_${lang}`;
    let cached = Cache.get(cachID);
    if (cached) {
        logger.info('cached main', cachID, cached);
        return cached
    } else {
        var meta = MetaCache.get(id);
        if (!meta) {
            meta = await opensub.getOpenSubData(imdb_id);
            if (meta) {
                MetaCache.set(id, meta);
            } else {
                logger.info('no metadata')
                return
            }
        }
        var subtitleslist = OpenSubCache.get(id);
        if (!subtitleslist) {
            logger.info(meta)
            subtitleslist = await opensub.getsubs(imdb_id, meta.id, type, season, episode);
            if (subtitleslist) {
                OpenSubCache.set(id, subtitleslist);
            } else {
                logger.info('no subtitles')
                return
            }
        }





        if (subtitleslist && subtitleslist[lang]) {
            let subtitles = subtitleslist[lang];
            const subs = [];
            for (let i = 0; i < subtitles.length; i++) {
                let value = subtitles[i];
                if (value) {
                    let link = value.url.replace(config.BaseURL, '')
                    let options = `d=${encodeURIComponent(config.BaseURL)}&h=User-Agent:${encodeURIComponent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36')}`;
                    let url = `http://127.0.0.1:11470/proxy/${options}${link}`;

                    subs.push({
                        lang: languages[lang].iso || languages[lang].id,
                        id: `${cachID}_${i}`,
                        url: `http://127.0.0.1:11470/subtitles.vtt?from=${encodeURIComponent(url)}?.zip`
                    });
                }
            }
            logger.info('subs', subs);
            logger.info("Cache keys", Cache.keys());
            let cached = Cache.set(cachID, subs);
            logger.info("cached", cached)
            return subs;
        } else {
            return
        }
    }
}
module.exports = subtitles;