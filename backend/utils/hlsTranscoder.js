const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const HLS_DIR = path.join(__dirname, '..', 'hls');
if (!fs.existsSync(HLS_DIR)) fs.mkdirSync(HLS_DIR, { recursive: true });

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
    const thumbnailPath = path.join(outputDir, 'thumb.jpg');
    const seekTime = Math.max(1, Math.floor(duration / 4));
    ffmpeg(inputPath)
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => reject(err))
      .screenshots({
        timestamps: [seekTime],
        filename: 'thumb.jpg',
        folder: outputDir,
        size: '1280x720',
      });
  });
}

async function transcodeToHLS(inputPath) {
  const id = uuidv4();
  const outputDir = path.join(HLS_DIR, id);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const metadata = await probeMetadata(inputPath);
  const duration = metadata.format.duration || 0;

  let selectedLadder = QUALITY_LADDER.filter((v) => v.height <= 720);
  if (duration === 0) selectedLadder = QUALITY_LADDER.slice(0, 2);

  await Promise.all(
    selectedLadder.map((variant) =>
      transcodeVariant(inputPath, outputDir, variant)
    )
  );

  const masterContent = generateMasterPlaylist(selectedLadder);
  fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterContent);

  let thumbnailPath = null;
  try {
    thumbnailPath = await generateThumbnail(inputPath, outputDir, duration);
  } catch (e) {
    console.error('Thumbnail generation failed:', e.message);
  }

  return {
    id,
    duration: Math.round(duration),
    masterPlaylist: `/hls/${id}/master.m3u8`,
    thumbnail: thumbnailPath ? `/hls/${id}/thumb.jpg` : null,
  };
}

function generateMasterPlaylist(ladder) {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n';
  ladder.forEach((variant) => {
    const bandwidth =
      parseInt(variant.videoBitrate) * 1000 +
      parseInt(variant.audioBitrate) * 1000;
    const resolution = `${variant.width}x${variant.height}`;
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},CODECS="avc1.4d401f,mp4a.40.2"\n`;
    content += `${variant.name}/index.m3u8\n`;
  });
  return content;
}

module.exports = { transcodeToHLS, HLS_DIR };
