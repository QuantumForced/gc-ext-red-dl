const urlFrontRegex = /^https:\/\/(?:np|old|beta)\.reddit\.com(?:\/best|\/hot|\/new|\/rising|\/top.*|)\/?$/;
const urlSingleRegex = /^https:\/\/(?:np|old|beta)\.reddit\.com\/r\/[^\/]+\/comments\/[^\/]+\/[^\/]+\/$/;
const urlMultipleRegex = /^https:\/\/(?:np|old|beta)\.reddit\.com\/r\/[^\/]+\/(?!comments\/).*$/;
const urlUserProfRegex = /^https:\/\/(?:np|old|beta)\.reddit\.com\/user\/[^\/]+\/(?!m\/).*$/
const urlUserMultiFeed = /^https:\/\/(?:np|old|beta)\.reddit\.com\/user\/.+\/m\/.+$/;

// Function to handle button click events
async function handleDlButtonClick(event){
    const videoUrl = event.target.closest('[data-video-url]').getAttribute('data-video-url');
    console.log(`DL button clicked! Video URL: ${videoUrl}`);

    // Call download function in videodl.js
    const result = await dl_video_ffmpeg(videoUrl);

    if (result) {
        console.log('Video successfully downloaded')
    } else {
        console.log('Video failed to downloaded')
    }
}

// Function to generate download button
const genDlButton = (submUrl, parentElement) => {
    let listItem = document.createElement('li');
    listItem.target = 'download';
    listItem.classList.add('dl-button');
    listItem.setAttribute('data-video-url', submUrl); // Store the video URL
    listItem.onclick = handleDlButtonClick;

    // Create a new anchor element for the 'Download' link
    let downloadLink = document.createElement('a');
    downloadLink.textContent = 'download';

    // Append the 'a' element to the 'li' element
    listItem.appendChild(downloadLink);

    // Append the 'li' element to the 'ul' list
    parentElement.appendChild(listItem);
};

// Function to locate single post within the page
const locateSinglePost = (attempts = 0) => {
    const post = document.querySelector('ul.flat-list.buttons');

    if (!post) {
        if (attempts < 100) {
            console.log(`No post found, retrying... attempt number: ${attempts + 1}`);

            // Schedule the next check with increased attempts
            setTimeout(() => locateSinglePost(attempts + 1), 100);

        } else {
            console.log('No post found after maximum attempts, reddit loading slowly..?');
        }
    } else {
        console.log(`Found post`);

        const firstLi = post.querySelector('li.first');
        const hrefValue = firstLi.querySelector('a').getAttribute('href');

        // Check that the post has not already been injected with a dl button
        if (!post.querySelector('.dl-button')) {
            genDlButton(hrefValue, post)
        }
    }
}

// Function to locate multiple posts within the page
const locateMultiplePosts = () => {
    // Locate the element with id 'siteTable'
    let siteTable = document.querySelector('#siteTable');

    if (siteTable) {
        // Loop over each child element (post) of the siteTable
        Array.from(siteTable.children).forEach(function(child) {

            // Check if the child element (post) is a video
            if (child.getAttribute('data-domain') === 'v.redd.it') {

                let post = child.querySelector('ul.flat-list.buttons');
                let redditUrl = 'https://old.reddit.com' + child.getAttribute('data-permalink');

                // Check that the post has not already been injected with a dl button
                if (!child.querySelector('.dl-button')) {
                    genDlButton(redditUrl, post)
                }
            }
        });
    }
}

// Function to identify the type of URL
const identifyUrlType = () => {
    let redditUrl = window.location.href;

    if (urlSingleRegex.test(redditUrl)) {
        console.log('URL matched a regex pattern for a page with a single submission');
        locateSinglePost(1)

    } else if (urlMultipleRegex.test(redditUrl) || urlFrontRegex.test(redditUrl) || urlUserProfRegex.test(redditUrl) || urlUserMultiFeed.test(redditUrl)) {
        console.log('URL matched a regex pattern for a page with multiple posts');
        locateMultiplePosts()
    } else {
        console.log("URL did not match the urlSingleRegex nor the any of Multiple Regex's..");
    }
}

// Event listener on page load
window.addEventListener('load', identifyUrlType);

// Event listener on scroll (due to Reddit's infinite scroll)
document.addEventListener("scrollend", identifyUrlType);
