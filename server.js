const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const { spawn } = require('child_process');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '1kb' }));
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));

const logger = winston.createLogger({ level: 'info', transports: [new winston.transports.Console()] });

const limiter = rateLimit({ windowMs: 60*60*1000, max: 30, message: { error: 'Too many requests, try later.' } });
app.use('/api/', limiter);

const MAX_CONCURRENT = 2;
let current = 0;

function isYouTubeUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    return host.includes('youtube.com') || host.includes('youtu.be');
  } catch { return false; }
}

app.get('/api/health', (req,res)=>res.json({ ok:true, current }));

app.post('/api/download', async (req,res)=>{
  const { url } = req.body || {};
  if(!url || typeof url!=='string' || url.length>300) return res.status(400).json({ error: 'Invalid request' });
  if(!isYouTubeUrl(url)) return res.status(400).json({ error: 'Only YouTube links allowed' });
  if(current>=MAX_CONCURRENT) return res.status(429).json({ error: 'Server busy, try later' });

  current++;
  logger.info(`Starting download for ${url} (concurrent=${current})`);

  res.setHeader('Content-Type','audio/mpeg');
  res.setHeader('Content-Disposition','attachment; filename="audio.mp3"');

  const args = ['--no-playlist','-x','--audio-format','mp3','-o','-',url];
  const proc = spawn('yt-dlp', args, { stdio:['ignore','pipe','pipe'] });

  proc.stdout.on('data', chunk=>{ try { if(!res.writableEnded) res.write(chunk); } catch(e){ logger.warn(e.message); } });
  proc.stderr.on('data', d=>logger.warn('yt-dlp stderr: '+d.toString().slice(0,500)));
  proc.on('close', code=>{ current=Math.max(0,current-1); logger.info('yt-dlp exited code='+code+' (concurrent='+current+')'); try{ if(!res.writableEnded) res.end(); } catch(e){} });

  req.on('aborted', ()=>{ logger.info('Client aborted, killing yt-dlp'); try{ proc.kill('SIGKILL'); } catch(e){} current=Math.max(0,current-1); });
  const killTimeout=setTimeout(()=>{ try{ proc.kill('SIGKILL'); } catch(e){} }, 5*60*1000);
  proc.on('exit', ()=>clearTimeout(killTimeout));
});

app.get('/', (req,res)=>res.json({ ok:true, message:'DHEM Backend up' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>logger.info('Server listening on '+PORT));
