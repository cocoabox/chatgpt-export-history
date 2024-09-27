(async function() {
    const RELOAD_WAIT_MSEC = 1000;

    if (typeof document === 'undefined' || typeof window === 'undefined') {
        throw new Error('<<< this is a bookmarklet; please run it in a browser >>>');
    }
    function sleep(msec) {
        return new Promise(resolve=>{
            setTimeout(()=>resolve(), msec);
        });
    }
    function msgbox(msg_text, {actions=[], done_caption='Done'}={}) {
        return new Promise(resolve=>{
            let existing_modal = document.getElementById('custom_modal');
            if (existing_modal) {
                existing_modal.querySelector('button.done').click(); // Dismiss the existing modal
            }

            let overlay = document.createElement('div');
            overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 9999; `;
            document.body.appendChild(overlay);

            let modal = document.createElement('div');
            modal.id = 'custom_modal';
            modal.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background-color: white; border-radius: 1em; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); z-index: 10000; width: 300px; text-align: center;  box-shadow: 0 22px 70px 4px rgba(0, 0, 0, 0.56); `;

            let message = document.createElement('div');
            message.style.cssText = ` margin-bottom: 20px; font-size: 16px; color: #333; `;
            message.innerText = msg_text;

            let button_container = document.createElement('ul');
            button_container.style.cssText = ` list-style: none; padding: 0; margin: 0; `;

            function dismiss() {
                modal.remove();
                overlay.remove();
                resolve(); 
            }
            const common_button_css = `padding: 10px 20px; border: none; border-radius: 2em; color: white; cursor: pointer; font-size: 16px; margin: 10px 0;`
            for (const action of actions) {
                let action_button = document.createElement('button');
                action_button.innerText = action.caption;
                action_button.style.cssText = `${common_button_css}; background-color: #007BFF;`
                action_button.onclick = () => {
                    action.callback();
                    if (action.dismiss) {
                        dismiss();
                    }
                };

                let action_item = document.createElement('li');
                action_item.appendChild(action_button);
                button_container.appendChild(action_item);
            }

            let done_button = document.createElement('button');
            done_button.className = 'done';
            done_button.innerText = done_caption ?? 'Done';
            done_button.style.cssText = `${common_button_css}; background-color: #4CAF50;`;

            done_button.onclick = () => {
                dismiss();
            };

            let done_item = document.createElement('li');
            done_item.appendChild(done_button);
            button_container.appendChild(done_item);


            modal.appendChild(message);
            modal.appendChild(button_container);
            document.body.appendChild(modal);

            return new Promise((resolve) => {
                // Store the resolve function in a variable
                modal.resolve = resolve;
            });
        });
    }

    function chat2html(chat, title) {
        const html = `<!DOCTYPE html><html><head><title>${title}</title></head><body><dl>` +
            chat.map(({from, from_user, from_bot, body}) => {
                let dt = '';
                let dd = '';
                if (from_user) {
                    dt = from;
                    if (body.length === 1) {
                        if (typeof body[0] === 'string') { dd = `<pre>${body[0]}</pre>`; }
                        else if (body[0]?.mimeType?.startsWith('image/')) { dd= `<img src="${body[0].data}" />`; }
                        else { dd = 'unknown'; }
                    }
                    else if (body.length > 1) {
                        const list = body.map(b => {
                            if (typeof b === 'string') { return `<li><pre>${b}</pre></li>`; }
                            else if (b?.mimeType.startsWith('image/')) { return `<li><img src="${b.data}" /></li>`; }
                            else { return '<li>unknown</li>'; }
                        });
                        dd = '<ul>' + list.join('') + '</ul>';
                    }
                }
                else if (from_bot) {
                    dt = from;
                    if (body.length === 1) {
                        if (typeof body[0] === 'string') { dd = body[0]; }
                        else if (body[0]?.mimeType?.startsWith('image/')) { dd= `<img src="${body[0].data}" />`; }
                        else { dd = 'unknown'; }
                    }
                    else if (body.length > 1) {
                        const list = body.map(b => {
                            if (typeof b === 'string') { return `<li>${b}></li>`; }
                            else if (b?.mimeType.startsWith('image/')) { return `<li><img src="${b.data}" /></li>`; }
                            else { return '<li>unknown</li>'; }
                        });
                        dd = '<ul>' + list.join('\n') + '</ul>';
                    }

                }
                return `<dt>${dt}</dt><dd>${dd}</dd>`;
            }).join('\n') + '</dl></body></html>';
        return html;
    }
    async function download_file(bodyStr, {type= 'application/json', filename='chat.json'}={}) {
        const blob = new Blob([bodyStr], { type });
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
            canvas.width = img_tag.width;
            canvas.height = img_tag.height;
            context.drawImage(img_tag, 0, 0);
            const dataUrl = canvas.toDataURL();
            const mimeType = dataUrl.split(';')[0].split(':')[1];
            // Resolve with the base64 data and MIME type
            resolve({
                data: dataUrl.split(',')[1], // Base64 data
                mimeType: mimeType
            });
        });
    }
    function find_current_chat_btn() {
        const match = window.location.href.match(/(\/c\/.*)$/);
        const href = match ? match[0] : null;
        if (! href) return ;
        return document.querySelector(`a[href="${href}"]`);
    }
    async function reload_chat() {

        const button_to_return = find_current_chat_btn();
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
        await sleep(RELOAD_WAIT_MSEC);
        await wait_for_element(document.body, '.composer-parent #prompt-textarea');
        console.log("going back by clicking", button_to_return);
        button_to_return.click();
        await sleep(RELOAD_WAIT_MSEC);
        await wait_for_element(document.body, 'main .h-full article', {timeout:5000});
    }

    async function save_chat() {
        const articles = document.querySelectorAll('main .h-full article');
        if (! articles) {
            console.warn('no chat history found');
            return;
        }
        articles[0].parentElement.parentElement.scrollTo(0,0);
        const chat = [];
        const articles_arr = Array.from(articles);
        const tot = articles_arr.length - 1;
        let img_errs = [];
        let uncaught_errs = 0;
        for (const [idx, article] of Object.entries(articles_arr)) {
            console.log(`message : ${idx}/${tot}`, article);
            await scroll_into_view(article);
            try {
                const msg = {
                    from:'',
                    from_user: false,
                    from_bot: false,
                    body: [],
                };
                const content = await wait_for_element(article, '.text-base');
                const h5 = article.querySelector('h5.sr-only');
                const h6 = article.querySelector('h6.sr-only');
                if (h5) {
                    msg.from_user =true;
                    msg.from = h5.textContent?.match(/^(.*?):$/)?.[1] ?? h5.textContent ?? '(unknown)';
                }
                else if (h6) {
                    msg.from_bot =true;
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
                            img_errs.push('dall-e');
                        }
                        finally {
                            msg.body.push(img_content);
                        }
                    }
                }
                const children = content.querySelector('[data-message-id] .w-full').children;
                for (const child of children) {
                    if (Array.from(child.classList).includes('markdown')) {
                        const cloned = child.cloneNode(true);
                        // remove buttons
                        const buttons = cloned.getElementsByTagName('button');
                        while (buttons.length > 0) {
                            buttons[0].parentNode.removeChild(buttons[0]);
                        }
                        // Find all tags inside the clonedDiv and remove all classes
                        for (const elem of Array.from(cloned.getElementsByTagName('*'))) {
                            if (elem.classList.contains('text-token-text-secondary')) {
                                if (elem.textContent?.trim())
                                    elem.textContent = `// ${elem.textContent}`;
                            }
                            elem.removeAttribute('class');
                        }

                        // Convert all <code> elements to their text content
                        const codes = cloned.getElementsByTagName('code');
                        for (let i = codes.length - 1; i >= 0; i--) {
                            const code = codes[i];
                            if (code.children.length === 0) continue;
                            // ^ e.g. <code>inlineFunc</code>

                            // complicated code block <code><span class="number">123</span></code>
                            // ↓
                            const {textContent} = code;
                            // const textNode = document.createTextNode(textContent);
                            // code.parentNode.replaceChild(textNode, code);
                            code.textContent = textContent;
                        }
                        msg.body.push(cloned.innerHTML.replaceAll(/<\/?div>/g, ''));
                    }
                    const paragraph = child.querySelector('.whitespace-pre-wrap');
                    if (paragraph) {
                        msg.body.push(paragraph.innerHTML);
                    }
                    try {
                        const img = child.querySelector('img');
                        if (img) {
                            msg.body.push(await download_image(img.src));
                        }
                    }
                    catch(err) {
                        console.warn('failed to download img from', child);
                        img_errs.push('general-img');
                    }
                }
                chat.push(msg);
            }
            catch (error){
                console.error(`message ${idx} failed because :`, error);
                uncaught_errs++;
            }
        }
        const out = {chat, img_errs, uncaught_errs};
        console.log("Done!", out);
        return out;
    }

    function save_chat_wrapper() {
        return new Promise(async resolve => {
            let {chat, img_errs, uncaught_errs} = await save_chat() ?? {};
            console.log("result:", {chat, img_errs, uncaught_errs});
            if (! chat?.length) {
                await msgbox('No chat message captured.', {done_caption:'Sorry'});
                return false;
            }
            else {
                const has_img_errs = img_errs?.length > 0;
                const title = find_current_chat_btn()?.textContent ?? `${document.title} (untitled)`;
                const html = chat2html(chat, title);
                const msg = has_img_errs ? (`Some images could not be downloaded from "${title}". `
                    +`They are protected, and usually have to be downloaded quickly after page load.`)
                    : `"${title}" is ready for download`;

                await msgbox(msg,{actions:[
                    has_img_errs ? {
                        dismiss:true,
                        caption: 'Reload and Try Again',
                        callback: () => { 
                            console.log("will retry");
                            return resolve('retry'); 
                        }}:null,
                    {caption:'Save as HTML', callback: async () => {
                        console.log(html);
                        await download_file(html, {type:'text/html', filename: `${document.title}.html`});
                        resolve(true);
                    }},
                    {caption:'Save as JSON', callback: async () => {
                        console.log(chat);
                        await download_file(JSON.stringify(chat,"",4), {filename: `${document.title}.json`});
                        resolve(true);
                    }},
                ].filter(n => !!n)
                });
            }
        });
    }

    // main
    while (true) {
        const res = await save_chat_wrapper();
        if (res === 'retry') {
            console.log("will retry");
            await reload_chat();
            continue;
        }
        break;
    }



})();
