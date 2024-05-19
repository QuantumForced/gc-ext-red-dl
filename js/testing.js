
baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
const ffmpeg = new FFmpeg();

async function load() {
    const config = {
        coreURL: await this.toBlobURLV2(
            `${this.baseURL}/ffmpeg-core.js`,
            'text/javascript',
        ),
        wasmURL: await this.toBlobURLV2(
            `${this.baseURL}/ffmpeg-core.wasm`,
            'application/wasm',
        ),
        classWorkerURL: await this.toBlobURLV2(
            `${this.baseURL}/ffmpeg-core.worker.js`,
            'text/javascript',
        ),
    };
    console.log('worked');

    if (this.ffmpeg) {
        console.log('turning ffmpeg on');
        this.ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });
    }
    if (this.ffmpeg) {
        console.log('loading', config);
        await this.ffmpeg.load(config).catch((error) => {
            console.log(error);
        });
        console.log('cfg loaded');
    }
    this.loaded = true;
    console.log('ffmpeg.load success');
}

async function toBlobURLV2(url, mimeType) {
    console.log(url);
    var resp = await fetch(url);
    var body = await resp.blob();
    var blob = new Blob([body], { type: mimeType });

    return window.URL.createObjectURL(blob);
}