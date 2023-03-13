const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');
const Subtitles = require('./opensubtitles.js');
const manifest = require("./manifest.json");
const languages = require('./languages.json');
var serveIndex = require('serve-index');
const sub2vtt = require('sub2vtt');


app.set('trust proxy', true)

app.use('/configure', express.static(path.join(__dirname, 'vue', 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'vue', 'dist', 'assets')));

app.use('/logs',
	(req, res, next) => {
		res.set('Cache-Control', 'no-store');
		next();
	},
	express.static(path.join(__dirname, 'logs'), {etag: false }),
	serveIndex('logs', { 'icons': true, 'view': 'details' })
)

app.use(cors())


app.get('/', (_, res) => {
	res.redirect('/configure')
	res.end();
});

app.get('/:configuration?/configure', (req, res) => {
	res.setHeader('Cache-Control', 'max-age=86400,staleRevalidate=stale-while-revalidate, staleError=stale-if-error, public');
	res.setHeader('content-type', 'text/html');
	res.sendFile(path.join(__dirname, 'vue', 'dist', 'index.html'));
});

app.get('/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	manifest.behaviorHints.configurationRequired = true;
	res.send(manifest);
	res.end();
});

app.get('/:configuration?/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	manifest.behaviorHints.configurationRequired = false;
	res.send(manifest);
	res.end();
});

app.get('/:configuration?/:resource/:type/:id/:extra?.json', async (req, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	var subtitles = [];
	console.log(req.params);
	const { configuration, resource, type, id } = req.params;
	if (configuration !== "subtitles" && configuration) {
		let lang = configuration;
		if (languages[lang]) {
			subtitles = await Subtitles(type, id, lang).then(subtitles => {
				return subtitles
				console.log(subtitles)
			}).catch(error => { console.error(error); res.end(); })
		}
	}
	console.log(subtitles)
	subtitles = subtitles ? JSON.stringify({ subtitles: subtitles }) : JSON.stringify({ subtitles: {} })
	res.send(subtitles);
	res.end();
})

app.get('/sub.vtt', async (req, res) => {
	try {

		res.setHeader('Cache-Control', 'max-age=86400,staleRevalidate=stale-while-revalidate, staleError=stale-if-error, public');
		let url,proxy;
		if (req?.query?.proxy) proxy = JSON.parse(Buffer.from(req.query.proxy, 'base64').toString());
		if (req?.query?.from) url = req.query.from
		else throw 'error: no url';
		console.log("url", url,"proxy",proxy)
		generated = sub2vtt.gerenateUrl(url,{referer:"someurl"});
		console.log(generated);
		let sub = new sub2vtt(url ,proxy);
		//console.log(await sub.CheckUrl()) 
		let file = await sub.getSubtitle();
		//console.log(file)
		/*//console.log("file",file)*/
		if (!file?.subtitle) throw file.status
		res.setHeader('Content-Type', 'text/vtt;charset=UTF-8');
		res.end(file.subtitle)
		res.end()

	} catch (err) {
		res.setHeader('Content-Type', 'application/json');
		res.end()

		console.error(err);
	}
})


module.exports = app
