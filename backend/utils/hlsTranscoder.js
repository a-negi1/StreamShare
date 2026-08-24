const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { uploadRaw, uploadImage } = require('./cloudinaryStorage');

const QUALITY_LADDER = [
  { name: '240p', width: 426, height: 240, videoBitrate: '400k', audioBitrate: '64k' },
  { name: '360p', width: 640, height: 360, videoBitrate: '800k', audioBitrate: '96k' },
  { name: '480p', width: 854, height: 480, videoBitrate: '1400k', audioBitrate: '128k' },
  { name: '720p', width: 1280, height: 720, videoBitrate: '2800k', audioBitrate: '128k' },
];

function probeMetadata(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function transcodeVariant(inputPath, outputDir, variant) {
  return new Promise((resolve, reject) => {
    const variantDir = path.join(outputDir, variant.name);
    if (!fs.existsSync(variantDir)) fs.mkdirSync(variantDir, { recursive: true });

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        `-b:v ${variant.videoBitrate}`,
        `-b:a ${variant.audioBitrate}`,
        `-vf scale=w=${variant.width}:h=${variant.height}:force_original_aspect_ratio=decrease,pad=${variant.width}:${variant.height}:(ow-iw)/2:(oh-ih)/2`,
        '-preset veryfast',
        '-profile:v main',
        '-crf 23',
        '-sc_threshold 0',
        '-g 48',
        '-keyint_min 48',
        '-hls_time 6',
        '-hls_list_size 0',
        '-hls_segment_filename',
        path.join(variantDir, 'segment_%03d.ts'),
        '-f hls',
      ])
      .output(path.join(variantDir, 'index.m3u8'))
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

function generateThumbnail(inputPath, outputDir, duration) {
  return new Promise((resolve, reject) => {
    const seekTime = Math.max(1, Math.floor(duration / 4));
    ffmpeg(inputPath)
      .on('end', () => resolve(path.join(outputDir, 'thumb.jpg')))
      .on('error', (err) => reject(err))
      .screenshots({
        timestamps: [seekTime],
        filename: 'thumb.jpg',
        folder: outputDir,
        size: '1280x720',
      });
  });
}

async function uploadHLSOutput(tmpDir, videoId, selectedLadder) {
  const variantUrls = {};

  for (const variant of selectedLadder) {
    const variantDir = path.join(tmpDir, variant.name);
    const segFiles = fs.readdirSync(variantDir).filter((f) => f.endsWith('.ts'));

    const segmentUrlMap = {};
    for (const segFile of segFiles) {
      const baseName = path.basename(segFile, '.ts');
      const publicId = `hls/${videoId}/${variant.name}/${baseName}`;
      const result = await uploadRaw(path.join(variantDir, segFile), publicId);
      segmentUrlMap[segFile] = result.secure_url;
    }

    let m3u8Content = fs.readFileSync(path.join(variantDir, 'index.m3u8'), 'utf-8');
    for (const [segFile, segUrl] of Object.entries(segmentUrlMap)) {
      m3u8Content = m3u8Content.replace(new RegExp(segFile.replace('.', '\\.'), 'g'), segUrl);
    }

    const rewrittenPath = path.join(variantDir, 'index_abs.m3u8');
    fs.writeFileSync(rewrittenPath, m3u8Content);

    const variantResult = await uploadRaw(
      rewrittenPath,
      `hls/${videoId}/${variant.name}/index`
    );
    variantUrls[variant.name] = variantResult.secure_url;
  }

  return variantUrls;
}

function generateMasterPlaylist(ladder, variantUrls) {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n';
  ladder.forEach((variant) => {
    const bandwidth =
      parseInt(variant.videoBitrate) * 1000 + parseInt(variant.audioBitrate) * 1000;
    const resolution = `${variant.width}x${variant.height}`;
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},CODECS="avc1.4d401f,mp4a.40.2"\n`;
    content += `${variantUrls[variant.name]}\n`;
  });
  return content;
}

async function transcodeToHLS(inputPath) {
  const videoId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `streamshare_${videoId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const metadata = await probeMetadata(inputPath);
    const duration = metadata.format.duration || 0;
    const selectedLadder = duration > 0 ? QUALITY_LADDER : QUALITY_LADDER.slice(0, 2);

    await Promise.all(
      selectedLadder.map((variant) => transcodeVariant(inputPath, tmpDir, variant))
    );

    const variantUrls = await uploadHLSOutput(tmpDir, videoId, selectedLadder);

    const masterContent = generateMasterPlaylist(selectedLadder, variantUrls);
    const masterPath = path.join(tmpDir, 'master.m3u8');
    fs.writeFileSync(masterPath, masterContent);
    const masterResult = await uploadRaw(masterPath, `hls/${videoId}/master`);

    let thumbnailUrl = null;
    try {
      const thumbLocalPath = await generateThumbnail(inputPath, tmpDir, duration);
      const thumbResult = await uploadImage(thumbLocalPath, 'streamshare/thumbnails');
      thumbnailUrl = thumbResult.secure_url;
    } catch (e) {
      console.error('Thumbnail generation failed:', e.message);
    }

    return {
      id: videoId,
      duration: Math.round(duration),
      masterPlaylist: masterResult.secure_url,
      thumbnail: thumbnailUrl,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

module.exports = { transcodeToHLS };
