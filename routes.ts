import express, { Request, Response } from 'express'
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'

const router = express.Router()

router.get('/content/:id', async (req: Request, res: Response) => {
    try {

        if(!('id' in req.params)){
            throw new Error('Inscription id needed');
        }

        if(existsSync(`./screenshots/${req.params.id}.jpg`)){
            const ss = readFileSync(`./screenshots/${req.params.id}.jpg`);
            res.set('content-type', 'image/jpeg');
            return res.status(200).send(ss);
        }

        const { width, height } = { width: 450, height: 450 };

        const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"]});

        const page = await browser.newPage();
        await page.setViewport({ width, height });
        const navigation = await page.goto(`${process.env.ORDINALS_ENDPOINT}/content/${req.params.id}`, {
            waitUntil : "networkidle0"
        });

        if(!navigation?.ok()){
            const m = navigation ? navigation.statusText() : 'Request cannot be handled at this time';
            throw new Error(m);
        }

        if(process.env.NODE_ENV !== 'dev'){
            const xKey = req?.headers['x-key'];

            if(!xKey || xKey !== process.env.ORDINALS_XKEY){
                throw new Error('Unauthorized request')
            }
        }

        const screenshot = await page.screenshot({ 
            encoding: 'binary', 
            type: 'jpeg',
            optimizeForSpeed: true,
            quality: 100,
            captureBeyondViewport: false,
            clip: { x: 0, y: 0, width, height }
        });

        await page.close();
        await browser.close();

        mkdirSync('./screenshots', { recursive: true });
        writeFileSync(`./screenshots/${req.params.id}.jpg`, screenshot);

        res.set('content-type', 'image/jpeg');
        return res.status(200).send(screenshot);
    }catch(err: any){
        return res.status(404).json({ error: true, message: err.message || err })
    }
})

router.get('/', async (req: Request, res: Response) => {
    return res.status(404).json({ error: true, message: 'Not found' });
})

export default router;