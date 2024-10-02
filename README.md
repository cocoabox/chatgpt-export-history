# chatgpt-export-history

![](imgs/example.jpg)

Bookmarklet to download ChatGPT chat history into JSON or HTML file with images.

- Saves user-provided images as base64 chunks
- Retains ChatGPT markdown response
- Downloading of some images might need page-reloading to due their CDN issuing time-sensitive URL signature
  ![](imgs/bookmark.jpg)

To get started, copy the content of [bookmarklet.js](https://raw.githubusercontent.com/cocoabox/chatgpt-export-history/refs/heads/main/build/bookmarklet.js) and paste it to the URL box of a new bookmark.

## building

1. edit main.js

2. run 

    ```
    npm run build
    ```

