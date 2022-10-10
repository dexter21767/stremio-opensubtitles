const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');
const Subtitles = require('./opensubtitles.js');
const manifest = require("./manifest.json");
const languages = require('./languages.json');


app.set('trust proxy', true)

app.use('/configure', express.static(path.join(__dirname, 'vue', 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'vue', 'dist', 'assets')));

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


module.exports = app
