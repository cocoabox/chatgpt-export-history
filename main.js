(async function() {
    function sleep(msec) {
        return new Promise(resolve=>{
            setTimeout(()=>resolve(), msec);
        });
    }

    async function download_json_file(json_object, {filename='chatgpt.json'}={}) {
        const jsonString = JSON.stringify(json_object, null, 4);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
    function scroll_into_view(element, options = {}) {
        return new Promise((resolve) => {
            // Scroll the element into view
            element.scrollIntoView(options);

            // Create an intersection observer to check if the element is in view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // If the element is in view, resolve the promise
                        resolve();
                        // Disconnect the observer
                        observer.disconnect();
                    }
                });
            });
            observer.observe(element);
        });
    }

    async function wait_for_element(query_from, selector, {timeout=1000}={}) {
        console.log(`waiting for "${selector}" from"`, query_from);
        let selected;
        selected = query_from.querySelector(selector);
        if (selected) {
            return selected;
        }
        else {
            await sleep(timeout);
            selected = query_from.querySelector(selector);
            if (selected) return selected;
        }
        throw {timeout:true, query_from, selector};    
    }
    async function download_image(image_url) {
        const response = await fetch(image_url);
        if (!response.ok) throw new Error('Failed to fetch image');

        const blob = await response.blob();
        const mimeType = blob.type;
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => resolve({ mimeType, data: reader.result });
            reader.onerror = () => reject(new Error('Failed to read blob'));
            reader.readAsDataURL(blob);
        });
    }
    async function get_image_data(img_tag) {
        return new Promise((resolve, reject) => {
            // Ensure the img_tag is a valid HTMLImageElement
            if (!(img_tag instanceof HTMLImageElement)) {
                return reject(new Error('Invalid image tag'));
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set canvas dimensions to match the image
            canvas.width = img_tag.width;
            canvas.height = img_tag.height;

            // Draw the image onto the canvas
            context.drawImage(img_tag, 0, 0);

            // Get the data URL (base64) and MIME type
            const dataUrl = canvas.toDataURL();
            const mimeType = dataUrl.split(';')[0].split(':')[1];

            // Resolve with the base64 data and MIME type
            resolve({
                data: dataUrl.split(',')[1], // Base64 data
                mimeType: mimeType
            });
        });
    }
    async function reload_chat() {
        function find_button() {
            const match = window.location.href.match(/(\/c\/.*)$/);
            const href = match ? match[0] : null;
            if (! href) return ;
            return document.querySelector(`a[href="${href}"]`);
        }
        const button_to_return = find_button();
        if (! button_to_return) {
            console.warn('cannot reload because return-button not found');
            return;
        }
        console.log("going to main");
        const main_button = document.querySelector('a[href="/"]');
        if (! main_button) {
            console.warn('cannot reload because main-button not found');
            return;
        }
        main_button.click();
        await sleep(500);
        await wait_for_element(document.body, '.composer-parent #prompt-textarea');
        console.log("going back by clicking", button_to_return);
        button_to_return.click();
        await sleep(500);
        await wait_for_element(document.body, 'main .h-full article', {timeout:5000});
    }


    // main
    if (document.querySelector('.group\\/dalle-image')) {
        if(window.confirm(
        'Reload chat?\n\nFound some DALL-E images in your chat. DALL-E images are protected and might not download well without reloading.\n\nOK to reload now?'
        )) { 
            await reload_chat();
        }
    }
    const articles = document.querySelectorAll('main .h-full article');
    if (! articles) {
        alert('no chat history found');
        return false;
    }
    articles[0].parentElement.parentElement.scrollTo(0,0);
    const chat = [];
    const articles_arr = Array.from(articles);
    const tot = articles_arr.length - 1;
    let dalle_err = 0;
    for (const [idx, article] of Object.entries(articles_arr)) {
        console.log(`message : ${idx}/${tot}`, article);
        await scroll_into_view(article);
        try {
            const msg = {
                from:'',
                body: [],
            };
            const content = await wait_for_element(article, '.text-base');
            const h5 = article.querySelector('h5.sr-only');
            const h6 = article.querySelector('h6.sr-only');
            if (h5) {
                msg.user === true;
                msg.from = h5.textContent?.match(/^(.*?):$/)?.[1] ?? h5.textContent ?? '(unknown)';
            }
            else if (h6) {
                msg.chatgpt === true;
                msg.from = h6.textContent?.match(/^(.*?):$/)?.[1] ?? h6.textContent ?? '(unknown)';
            }
            const dalle_images = content.querySelectorAll('.group\\/dalle-image');
            for (const di of dalle_images) {
                const img = di.querySelector('img');
                if (img) {
                    let img_content;
                    try {
                        img_content = await download_image(img.src);
                    }
                    catch(err) {
                        dalle_err++;
                    }
                    finally {
                        msg.body.push(img_content);
                    }
                }
            }
            const children = content.querySelector('[data-message-id] .w-full').children;
            for (const child of children) {
                if (Array.from(child.classList).includes('markdown')) {
                    msg.body.push(child.innerHTML);
                }
                const paragraph = child.querySelector('.whitespace-pre-wrap');
                if (paragraph) {
                    msg.body.push(paragraph.innerHTML);
                }
                const img = child.querySelector('img');
                if (img) {
                    msg.body.push(await download_image(img.src));
                }
            }
            chat.push(msg);
        }
        catch (error){
            console.error(`message ${idx} failed because :`, error);
        }
    }
    if (! chat.length) {
        window.alert('no chat history found');
        return false;
    }
    else {
        console.log('json object is ready');
        await download_json_file(chat, {filename: `${document.title}.json`});
    }
})();
