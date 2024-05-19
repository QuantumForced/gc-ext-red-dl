// options.js

const { FFmpeg } = FFmpegWASM;
const { fetchFile } = FFmpegUtil;

// initialize ffmpeg
const ffmpeg = new FFmpeg();

const runreddit = document.getElementById('run-reddit-url');
runreddit.addEventListener('click', async () => {
    // convert wasm and core url to absolute path
    const coreUrl = chrome.runtime.getURL("lib/ffmpeg/ffmpeg-core.js");
    const wasmUrl = chrome.runtime.getURL("lib/ffmpeg/ffmpeg-core.wasm");

    async function dl_video(linkUrl) {
        try {
            if (linkUrl) {
                console.log("Submission URL ->", linkUrl);

                // Use a regex to remove everything before the first instance of 'reddit' and replace it with 'https://old.reddit'
                const cleanSubDomain = linkUrl.replace(/.*?reddit/, 'https://old.reddit');

                let linkUrlJson = cleanSubDomain + '.json';

                const response = await fetch(linkUrlJson, {
                    headers: {
                        'User-Agent': navigator.userAgent
                    }
                });
                const data = await response.json();

                // clean up the file title
                let save_title = data[0].data.children[0].data.title;
                console.log("Submission Title:", save_title);

                save_title = save_title.replace(/[^\w\sÀ-ÿ]/g, '');
                console.log("Removed non a-Z 0-9:", save_title);

                save_title = save_title.replace(/\s+/g, '_');
                console.log("Replaced whitespace:", save_title);

                save_title = save_title.replace(/^_+|_+$/g, '');
                console.log("Removed trailing _:", save_title);

                save_title = save_title.substring(0, 254);
                console.log("Shortened title:", save_title);

                let videoUrl = data[0].data.children[0].data.secure_media.reddit_video.fallback_url.split('?')[0];
                console.log("Video MP4 URL:", videoUrl);

                async function downloadWithAudioOptions(videoUrl, save_title) {
                    const audioOptions = ['128', '160_K']; // List of audio options to try
                    let audioUrl;
                    let audioResponse;

                    // Base URL without the last segment
                    const baseUrl = videoUrl.substring(0, videoUrl.lastIndexOf('/')) + '/';

                    // Iterate over the audio options and fetch each one to check if it exists
                    for (let option of audioOptions) {
                        audioUrl = `${baseUrl}HLS_AUDIO_${option}.aac`;
                        console.log("Trying Audio AAC URL:", audioUrl);
                        audioResponse = await fetch(audioUrl);
                        if (audioResponse.ok) {
                            // Found a valid audio file, break out of the loop
                            break;
                        } else {
                            // Reset audioUrl and audioResponse if not found
                            console.log("Did not find Audio AAC URL:", audioUrl);
                            audioUrl = null;
                            audioResponse = null;
                        }
                    }

                    if (audioResponse && audioResponse.ok) {
                        // If a valid audio file was found
                        console.log('Audio file exists:', audioUrl);
                        return await runFFmpeg(save_title, videoUrl, audioUrl);
                    } else {
                        // If no audio file was found
                        console.log('Audio file does not exist, will download video without sound');
                        return await runFFmpeg(save_title, videoUrl, audioUrl);
                    }
                }

                return await downloadWithAudioOptions(videoUrl, save_title);
            }
        } catch (error) {
            console.error('Error in dl_video_ffmpeg function:', error);
            return false;
        }
    }

    async function runFFmpeg(save_title, videoUrl, audioUrl) {
        try {
            console.log('In runFFmpeg');

            // exit ffmpeg if it is already loaded
            if (ffmpeg.loaded) {
                console.log('FFmpeg is already loaded, exiting first');
                await ffmpeg.terminate();
            }

            // load ffmpeg
            await ffmpeg.load({
                coreURL: coreUrl,
                wasmURL: wasmUrl,
                // workerLoadURL:
                // worker814URL: worker814URL,
                // classWorkerURL:
                // workerURL:
            });

            console.log('FFmpeg loaded successfully!');

            let commandList = '';

            if (audioUrl !== null) {
                commandList = ['-i', 'file_video.mp4', '-i', 'file_audio.aac', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', `${save_title}.mp4`];

            } else {
                const videoResponse = await fetch(videoUrl);
                const blob = await videoResponse.blob();
                return await downloadFile(blob, `${save_title}.mp4`);
            }

            console.log(commandList);

            await ffmpeg.writeFile('file_video.mp4', await fetchFile(videoUrl));
            await ffmpeg.writeFile('file_audio.aac', await fetchFile(audioUrl));

            await ffmpeg.exec(commandList);

            const full_save_title = commandList.at(-1);

            const videoData = await ffmpeg.readFile(full_save_title);
            const blob = new Blob([videoData.buffer]);

            return await downloadFile(blob, full_save_title)

        } catch (error) {
            console.error('Error in runFFmpeg function:', error);
            return false;
        }
    }

    async function downloadFile(blob, fileName) {
        try {
            const dl = document.createElement('a');
            dl.href = URL.createObjectURL(blob);
            dl.download = fileName;
            document.body.appendChild(dl); // Add the anchor to the document
            dl.click();
            URL.revokeObjectURL(dl.href); // Clean up the object URL
            document.body.removeChild(dl); // Remove the anchor from the document
            return true;
        } catch (error) {
            console.error('Error in downloadFile function:', error);
            return false;
        }
    }

    const urlInput = document.getElementById("url-input").value;

    console.log('urlInput:', urlInput)

    const result = dl_video(urlInput); // Call your download function

    if (result) {
        console.log('Video successfully downloaded')
    } else {
        console.log('Video failed to downloaded')
    }
})
