const express = require('express');
const fs = require('fs');

const globalUtils = require('./utils/global');
const Types = require('./types');
const crypto = require('crypto');

require('dotenv').config();

const app = express();

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static(`./public`));
app.use('/skins', express.static(`./skins`));

app.get('/', (req, res) => {
    res.redirect('/wiki');
});

app.get('/:name', (req, res) => {
    const config = JSON.parse(fs.readFileSync('./config.json').toString());

    let contentHtml;
    try {
        contentHtml = fs.readFileSync(`./samples/${req.params.name}.htm`);
    } catch(e) {
        return res.status(404).end('Not found');
    }
    const pageData = JSON.parse(fs.readFileSync(`./samples/${req.params.name}.json`).toString());

    const session = {
        "menus":Types.permissionMenus,
        "account":{"name":"sans","uuid":"67791f10-6eb5-4f69-bcec-60e234e05529","type":1},
        "gravatar_url":"https://secure.gravatar.com/avatar/sample?d=retro",
        "user_document_discuss":null,
        "quick_block":true
    }

    const browserGlobalVarScript = `
<script id="initScript">
window.CONFIG = ${JSON.stringify(config)}
window.page = ${JSON.stringify(pageData)}
window.session = ${JSON.stringify(session)}

document.getElementById('initScript')?.remove();
        `.trim().replaceAll('/', '\\/') + '\n</script>';

    res.render('main', {
        contentHtml,
        skin: process.env.SKIN,
        config,
        page: pageData,
        session,
        fs,
        cspNonce: 'dummy',
        ...Types,
        ...globalUtils,
        browserGlobalVarScript,
        env: process.env
    });
});

app.get('/js/global.js', (req, res) => {
    if(!global.globalUtilsCache) {
        global.globalUtilsCache = 'globalUtils = {\n'
            + Object.keys(globalUtils)
                .map(k => `${globalUtils[k].toString()}`)
                .join(',\n')
                .split('\n')
                .map(a => a.trim())
                .join('\n')
            + '\n}';
        global.globalUtilsEtag = crypto.createHash('sha256').update(global.globalUtilsCache).digest('hex');
    }

    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Etag', global.globalUtilsEtag);
    res.end(global.globalUtilsCache);
});

app.get('/thread/:url/:num', (req, res) => {
    res.send(fs.readFileSync('./samples/threadComments.json'));
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});